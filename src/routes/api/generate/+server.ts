import { json, error, isHttpError } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { APIError } from '@anthropic-ai/sdk';
import { client, resolveModel } from '$lib/server/claude';
import systemPrompt from '$lib/server/scaffy-system-prompt.md?raw';

/**
 * SvelteKit route endpoint: this file maps to POST /api/generate (no +page.svelte here—only API).
 * Runs exclusively on the server (dev: Node; prod: e.g. Vercel serverless).
 *
 * Why not call Anthropic from the browser? Secret keys and validation must stay server-side so
 * credentials never ship to clients and rules (prompt shape, allowed models) cannot be bypassed.
 * The UI uses fetch('/api/generate', …) to the same origin—SvelteKit dispatches to this handler.
 */

type GenerateRequestBody = {
	prompt?: unknown;
	model?: unknown;
};

function hasChunks(value: unknown): value is { chunks: unknown[] } {
	return (
		typeof value === 'object' &&
		value !== null &&
		'chunks' in value &&
		Array.isArray((value as { chunks: unknown }).chunks)
	);
}

export const POST: RequestHandler = async ({ request }) => {
	let body: unknown;
	try {
		body = await request.json();
	} catch {
		throw error(400, 'Invalid JSON body.');
	}

	const { prompt, model } = (body ?? {}) as GenerateRequestBody;

	if (typeof prompt !== 'string' || prompt.trim().length < 10) {
		throw error(400, 'Prompt must be at least 10 characters long.');
	}

	const trimmedPrompt = prompt.trim();
	if (/[<{;]/.test(trimmedPrompt)) {
		throw error(400, 'Prompt must not contain code snippets (heuristic: <, {, ;).');
	}

	const modelStr = typeof model === 'string' ? model : undefined;
	const { apiModelId } = resolveModel(modelStr);

	const system = systemPrompt.trim();

	try {
		const message = await client.messages.create({
			model: apiModelId,
			max_tokens: 4096,
			temperature: 0.2,
			system,
			messages: [{ role: 'user', content: trimmedPrompt }]
		});

		const textBlock = message.content.find((b) => b.type === 'text');
		if (!textBlock || textBlock.type !== 'text') {
			throw error(502, 'Anthropic returned no text block.');
		}

		let parsed: unknown;
		try {
			parsed = JSON.parse(textBlock.text);
		} catch {
			throw error(502, 'Anthropic response was not valid JSON.');
		}

		if (!hasChunks(parsed)) {
			throw error(502, 'JSON does not contain a "chunks" array.');
		}

		return json({ chunks: parsed.chunks });
	} catch (e) {
		if (isHttpError(e)) throw e;

		if (e instanceof APIError) {
			const status = e.status;
			if (status === 401) throw error(401, 'Claude API: authentication failed.');
			if (status === 403) throw error(403, 'Claude API: access denied.');
			if (status === 429) throw error(429, 'Claude API: rate limited — try again later.');
			if (typeof status === 'number' && status >= 500) {
				throw error(502, 'Claude API is temporarily unavailable.');
			}
			if (status === 400) throw error(400, 'Claude API: invalid request.');
			if (typeof status === 'number' && status >= 400 && status < 500) {
				throw error(status, 'Claude API error.');
			}
			throw error(502, 'Claude API: no usable response.');
		}

		console.error('[api/generate]', e);
		throw error(500, 'Unexpected server error.');
	}
};
