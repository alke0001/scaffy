import Anthropic from '@anthropic-ai/sdk';
import { error } from '@sveltejs/kit';
import { ANTHROPIC_API_KEY, ANTHROPIC_DEFAULT_MODEL } from '$env/static/private';

/** Logical IDs (client dropdown / API body). Only these values are allowed. */
export const ALLOWED_MODELS = ['claude-sonnet-4-5', 'claude-sonnet-4-6'] as const;
export type LogicalModelId = (typeof ALLOWED_MODELS)[number];

/** Anthropic API model strings (official IDs). */
const MODEL_TO_API_ID: Record<LogicalModelId, string> = {
	'claude-sonnet-4-5': 'claude-sonnet-4-5-20250929',
	'claude-sonnet-4-6': 'claude-sonnet-4-6'
};

function isLogicalModelId(value: string): value is LogicalModelId {
	return (ALLOWED_MODELS as readonly string[]).includes(value);
}

function defaultLogicalFromEnv(fallback: LogicalModelId): LogicalModelId {
	if (typeof ANTHROPIC_DEFAULT_MODEL !== 'string' || !ANTHROPIC_DEFAULT_MODEL.trim()) {
		return fallback;
	}
	const trimmed = ANTHROPIC_DEFAULT_MODEL.trim();
	if (!isLogicalModelId(trimmed)) {
		throw new Error(
			`ANTHROPIC_DEFAULT_MODEL must be one of ${ALLOWED_MODELS.join(', ')}; got: ${trimmed}`
		);
	}
	return trimmed;
}

const defaultLogical = defaultLogicalFromEnv('claude-sonnet-4-5');

if (!ANTHROPIC_API_KEY) {
	throw new Error('ANTHROPIC_API_KEY is not set. Create .env.local (see .env.example).');
}

export const client = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

export function resolveModel(requested: string | undefined): {
	logical: LogicalModelId;
	apiModelId: string;
} {
	const trimmed =
		typeof requested === 'string' && requested.trim().length > 0
			? requested.trim()
			: defaultLogical;

	if (!isLogicalModelId(trimmed)) {
		throw error(400, `Invalid model. Allowed: ${ALLOWED_MODELS.join(', ')}.`);
	}

	return { logical: trimmed, apiModelId: MODEL_TO_API_ID[trimmed] };
}
