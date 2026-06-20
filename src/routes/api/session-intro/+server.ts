import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { APIError } from '@anthropic-ai/sdk';
import { client, resolveModel } from '$lib/server/anthropic-client.js';
import systemPrompt from '$lib/server/session-intro/system-prompt.md?raw';

const CONFIG = {
	maxOutputTokens: 1024,
	temperature: 0.5,
	systemPromptCacheTtl: '5m',
} as const satisfies {
	maxOutputTokens: number;
	temperature: number;
	systemPromptCacheTtl: '5m' | '1h';
};

type SessionIntroRequestBody = {
	prompt?: unknown;
	model?: unknown;
};

function encodeSse(payload: Record<string, unknown>): Uint8Array {
	return new TextEncoder().encode(`data: ${JSON.stringify(payload)}\n\n`);
}

/**
 * POST /api/session-intro — one-shot concept preview while the lesson loads; streams plain text as SSE.
 */
export const POST: RequestHandler = async ({ request }) => {
	let body: unknown;
	try {
		body = await request.json();
	} catch {
		throw error(400, 'Invalid JSON body.');
	}

	const { prompt, model } = (body ?? {}) as SessionIntroRequestBody;

	if (typeof prompt !== 'string' || prompt.trim().length < 10) {
		throw error(400, 'Prompt must be at least 10 characters long.');
	}

	const trimmedPrompt = prompt.trim();
	const modelStr = typeof model === 'string' ? model : undefined;
	const { apiModelId } = resolveModel(modelStr);

	const stream = new ReadableStream({
		async start(controller) {
			const anthropicStream = client.messages.stream(
				{
					model: apiModelId,
					max_tokens: CONFIG.maxOutputTokens,
					temperature: CONFIG.temperature,
					system: [
						{
							type: 'text',
							text: systemPrompt.trim(),
							cache_control: { type: 'ephemeral', ttl: CONFIG.systemPromptCacheTtl },
						},
					],
					messages: [{ role: 'user', content: trimmedPrompt }],
				},
				{ signal: request.signal },
			);

			controller.enqueue(encodeSse({ type: 'ready' }));

			anthropicStream.on('text', (delta) => {
				if (delta.length > 0) {
					controller.enqueue(encodeSse({ type: 'text', text: delta }));
				}
			});

			try {
				await anthropicStream.finalMessage();
				controller.enqueue(encodeSse({ type: 'done' }));
				controller.close();
			} catch (e) {
				if (request.signal.aborted) {
					controller.close();
					return;
				}
				const message =
					e instanceof APIError
						? e.message || 'Claude API error.'
						: e instanceof Error
							? e.message
							: 'Stream failed.';
				controller.enqueue(encodeSse({ type: 'error', message }));
				controller.close();
			}
		},
	});

	return new Response(stream, {
		headers: {
			'Content-Type': 'text/event-stream',
			'Cache-Control': 'no-cache',
			Connection: 'keep-alive',
		},
	});
};
