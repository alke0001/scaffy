/**
 * POST /api/scaffold — single-shot Learn scaffold proxy (3 scaffolds per lesson).
 * System: system-prompt.md. Validation: validate-lesson.ts (count + cumulative chain).
 */

import { json, error, isHttpError } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { APIError } from '@anthropic-ai/sdk';
import { client, resolveModel } from '$lib/server/anthropic-client.js';
import { OUTPUT_JSON_SCHEMA } from '$lib/server/scaffold/output-schema.js';
import { shuffleScaffoldOptions } from '$lib/server/scaffold/post-process.js';
import { validateLessonOutput } from '$lib/server/scaffold/validate-lesson.js';
import systemPrompt from '$lib/server/scaffold/system-prompt.md?raw';

const CONFIG = {
	maxOutputTokens: 6144,
	temperature: 0.3,
	systemPromptCacheTtl: '5m',
} as const satisfies {
	maxOutputTokens: number;
	temperature: number;
	systemPromptCacheTtl: '5m' | '1h';
};

type ScaffoldRequestBody = {
	prompt?: unknown;
	model?: unknown;
};

function buildRetryUserContent(prompt: string, validationMessage: string): string {
	return [
		`[Retry] Previous response failed validation: ${validationMessage}`,
		`Return exactly 3 scaffolds in "scaffolds". Each codeSnippet must cumulatively extend the previous (full-file snapshots).`,
		'',
		`Original user request:\n${prompt}`,
	].join('\n');
}

async function callAnthropicScaffold(opts: {
	apiModelId: string;
	userContent: string;
}): Promise<{ text: string }> {
	const message = await client.messages.create({
		model: opts.apiModelId,
		max_tokens: CONFIG.maxOutputTokens,
		temperature: CONFIG.temperature,
		system: [
			{
				type: 'text',
				text: systemPrompt.trim(),
				cache_control: { type: 'ephemeral', ttl: CONFIG.systemPromptCacheTtl },
			},
		],
		messages: [{ role: 'user', content: opts.userContent }],
		output_config: {
			format: {
				type: 'json_schema',
				schema: OUTPUT_JSON_SCHEMA,
			},
		},
	});

	if (message.stop_reason === 'refusal') {
		throw error(502, 'Claude refused the request; structured output may be invalid.');
	}
	if (message.stop_reason === 'max_tokens') {
		throw error(
			502,
			'Claude hit max_tokens before finishing structured output. Retry with a smaller request or higher max_tokens.',
		);
	}

	const textBlock = message.content.find((b) => b.type === 'text');
	if (!textBlock || textBlock.type !== 'text') {
		throw error(502, 'Anthropic returned no text block.');
	}

	return { text: textBlock.text };
}

function parseAndValidate(text: string) {
	let parsed: unknown;
	try {
		parsed = JSON.parse(text);
	} catch {
		throw error(502, 'Anthropic response was not valid JSON.');
	}

	const validated = validateLessonOutput(parsed);
	if (!validated.ok) {
		return { ok: false as const, message: validated.message };
	}
	return { ok: true as const, value: validated.value };
}

export const POST: RequestHandler = async ({ request }) => {
	let body: unknown;
	try {
		body = await request.json();
	} catch {
		throw error(400, 'Invalid JSON body.');
	}

	const { prompt, model } = (body ?? {}) as ScaffoldRequestBody;

	if (typeof prompt !== 'string' || prompt.trim().length < 10) {
		throw error(400, 'Prompt must be at least 10 characters long.');
	}

	const trimmedPrompt = prompt.trim();

	const modelStr = typeof model === 'string' ? model : undefined;
	const { apiModelId } = resolveModel(modelStr);

	try {
		let result = parseAndValidate(
			(await callAnthropicScaffold({ apiModelId, userContent: trimmedPrompt })).text,
		);

		if (!result.ok) {
			const retryText = (
				await callAnthropicScaffold({
					apiModelId,
					userContent: buildRetryUserContent(trimmedPrompt, result.message),
				})
			).text;
			result = parseAndValidate(retryText);
			if (!result.ok) {
				throw error(502, `Output validation failed: ${result.message}`);
			}
		}

		const shuffledScaffolds = shuffleScaffoldOptions(result.value.scaffolds);
		return json({ scaffolds: shuffledScaffolds });
	} catch (e) {
		if (isHttpError(e)) throw e;

		if (e instanceof APIError) {
			const status = e.status;
			const detail = e.message || 'Claude API error.';
			console.error('[api/scaffold] Claude APIError', {
				status,
				type: e.type,
				requestID: e.requestID,
				error: e.error,
			});
			if (status === 401) throw error(401, detail);
			if (status === 403) throw error(403, detail);
			if (status === 429) throw error(429, detail);
			if (typeof status === 'number' && status >= 500) {
				throw error(502, 'Claude API is temporarily unavailable.');
			}
			if (typeof status === 'number' && status >= 400 && status < 500) {
				throw error(status, detail);
			}
			throw error(502, 'Claude API: no usable response.');
		}

		console.error('[api/scaffold]', e);
		throw error(500, 'Unexpected server error.');
	}
};
