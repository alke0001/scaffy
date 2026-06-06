import { json, error, isHttpError } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { APIError } from '@anthropic-ai/sdk';
import { client, resolveModel } from '$lib/server/anthropic-client.js';
import {
	OUTPUT_JSON_SCHEMA,
	validateStructuredOutput,
} from '$lib/server/scaffold/output-schema.js';
import systemPrompt from '$lib/server/scaffold/system-prompt.md?raw';

/**
 * Singleton config for POST /api/scaffold — all model hyperparameters and caching in one place.
 *
 * `maxOutputTokens`      — hard cap on completion tokens; raise if responses hit stop_reason === 'max_tokens'.
 * `temperature`          — lower → more deterministic. Note: structured output schema constrains shape;
 *                          temperature only biases wording within that shape. Try 1 if you get a 400.
 * `systemPromptCacheTtl` — '5m' during active prompt development (changes take effect within 5 min);
 *                          '1h' once the prompt is stable (2× write cost, break-even at 3+ req/h).
 */
const CONFIG = {
	maxOutputTokens: 8192,
	temperature: 0.3,
	systemPromptCacheTtl: '5m',
} as const satisfies {
	maxOutputTokens: number;
	temperature: number;
	systemPromptCacheTtl: '5m' | '1h';
};

/**
 * SvelteKit route endpoint: maps to POST /api/scaffold (server-only).
 *
 * Proxies to Claude with structured output for Scaffy `scaffolds`. The UI uses
 * `fetch('/api/scaffold', …)`; the API key never leaves the server.
 */

type ScaffoldRequestBody = {
	prompt?: unknown;
	model?: unknown;
};

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
	if (/[<{;]/.test(trimmedPrompt)) {
		throw error(400, 'Prompt must not contain code snippets (heuristic: <, {, ;).');
	}

	const modelStr = typeof model === 'string' ? model : undefined;
	const { apiModelId } = resolveModel(modelStr);

	try {
		const message = await client.messages.create({
			model: apiModelId,
			max_tokens: CONFIG.maxOutputTokens,
			temperature: CONFIG.temperature,
			// cache_control caches the system prompt — avoids re-processing ~2500 tokens on every request
			system: [
				{
					type: 'text',
					text: systemPrompt.trim(),
					cache_control: { type: 'ephemeral', ttl: CONFIG.systemPromptCacheTtl },
				},
			],
			messages: [{ role: 'user', content: trimmedPrompt }],
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

		let parsed: unknown;
		try {
			parsed = JSON.parse(textBlock.text);
		} catch {
			throw error(502, 'Anthropic response was not valid JSON.');
		}

		const validated = validateStructuredOutput(parsed);
		if (!validated.ok) {
			throw error(502, `Output validation failed: ${validated.message}`);
		}

		return json({ scaffolds: validated.value.scaffolds });
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
