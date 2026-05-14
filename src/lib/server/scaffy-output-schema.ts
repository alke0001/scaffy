/**
 * Anthropic structured-output schema loaded from `scaffy-output.schema.json`.
 * `OUTPUT_JSON_SCHEMA` is the **request** payload fragment `output_config.format.schema`; the
 * assistant still returns JSON in `content[].text`—same format family, different role.
 */
import outputRootSchema from './scaffy-output.schema.json';

/** Immutable: pass as `output_config.format.schema` on `client.messages.create`. */
export const OUTPUT_JSON_SCHEMA = outputRootSchema as {
	type: string;
	additionalProperties: boolean;
	properties: Record<string, unknown>;
	required: string[];
	$defs?: Record<string, unknown>;
};

/** One multiple-choice answer line inside a knowledge check. */
export type ScaffoldOption = {
	id: string;
	text: string;
};

/** Gate before or alongside scaffold code; wrong picks show `explanation`. */
export type KnowledgeCheck = {
	question: string;
	options: ScaffoldOption[];
	correctOptionId: string;
	explanation: string;
};

/** One teaching step: optional Monaco hints, code snippet, and its knowledge check. */
export type Scaffold = {
	targetPath?: string;
	language?: string;
	codeSnippet: string;
	knowledgeCheck: KnowledgeCheck;
};

/** Parsed assistant JSON: ordered scaffolds only (no other top-level keys). */
export type StructuredGenerateOutput = {
	scaffolds: Scaffold[];
};

export type StructuredOutputValidation =
	| { ok: true; value: StructuredGenerateOutput }
	| { ok: false; message: string };

const MIN_OPTIONS = 2;
const MAX_OPTIONS = 6;

/**
 * Extra rules beyond the Anthropic wire schema (subset limits). See `scaffy-output.schema.md`.
 */
export function validateStructuredOutput(parsed: unknown): StructuredOutputValidation {
	if (typeof parsed !== 'object' || parsed === null) {
		return { ok: false, message: 'Response root must be an object.' };
	}
	if (!('scaffolds' in parsed)) {
		return { ok: false, message: 'Missing required property "scaffolds".' };
	}
	const { scaffolds } = parsed as { scaffolds: unknown };
	if (!Array.isArray(scaffolds)) {
		return { ok: false, message: '"scaffolds" must be an array.' };
	}
	if (scaffolds.length < 1) {
		return { ok: false, message: '"scaffolds" must contain at least one step.' };
	}
	const MAX_SCAFFOLDS = 5;
	if (scaffolds.length > MAX_SCAFFOLDS) {
		return {
			ok: false,
			message: `"scaffolds" must contain at most ${MAX_SCAFFOLDS} steps (merge remaining code into the last scaffold).`
		};
	}

	for (let i = 0; i < scaffolds.length; i++) {
		const step = scaffolds[i];
		const prefix = `scaffolds[${i}]`;
		if (typeof step !== 'object' || step === null) {
			return { ok: false, message: `${prefix} must be an object.` };
		}
		const c = step as Record<string, unknown>;

		if ('targetPath' in c && typeof c.targetPath !== 'string') {
			return { ok: false, message: `${prefix}.targetPath must be a string when present.` };
		}
		if ('language' in c && typeof c.language !== 'string') {
			return { ok: false, message: `${prefix}.language must be a string when present.` };
		}
		if (typeof c.codeSnippet !== 'string') {
			return {
				ok: false,
				message: `${prefix}.codeSnippet must be a string (empty string allowed).`
			};
		}
		if (typeof c.knowledgeCheck !== 'object' || c.knowledgeCheck === null) {
			return { ok: false, message: `${prefix}.knowledgeCheck must be an object.` };
		}
		const k = c.knowledgeCheck as Record<string, unknown>;
		if (typeof k.question !== 'string' || k.question.trim().length === 0) {
			return {
				ok: false,
				message: `${prefix}.knowledgeCheck.question must be a non-empty string.`
			};
		}
		if (!Array.isArray(k.options)) {
			return { ok: false, message: `${prefix}.knowledgeCheck.options must be an array.` };
		}
		if (k.options.length < MIN_OPTIONS || k.options.length > MAX_OPTIONS) {
			return {
				ok: false,
				message: `${prefix}.knowledgeCheck.options must have between ${MIN_OPTIONS} and ${MAX_OPTIONS} entries.`
			};
		}
		if (typeof k.correctOptionId !== 'string' || k.correctOptionId.trim().length === 0) {
			return {
				ok: false,
				message: `${prefix}.knowledgeCheck.correctOptionId must be a non-empty string.`
			};
		}
		if (typeof k.explanation !== 'string' || k.explanation.trim().length === 0) {
			return {
				ok: false,
				message: `${prefix}.knowledgeCheck.explanation must be a non-empty string.`
			};
		}

		const ids = new Set<string>();
		for (let j = 0; j < k.options.length; j++) {
			const opt = k.options[j];
			const kp = `${prefix}.knowledgeCheck.options[${j}]`;
			if (typeof opt !== 'object' || opt === null) {
				return { ok: false, message: `${kp} must be an object.` };
			}
			const option = opt as Record<string, unknown>;
			if (typeof option.id !== 'string' || option.id.trim().length === 0) {
				return { ok: false, message: `${kp}.id must be a non-empty string.` };
			}
			if (typeof option.text !== 'string' || option.text.trim().length === 0) {
				return { ok: false, message: `${kp}.text must be a non-empty string.` };
			}
			const idTrim = option.id.trim();
			if (ids.has(idTrim)) {
				return {
					ok: false,
					message: `${prefix}.knowledgeCheck.options uses duplicate id "${idTrim}".`
				};
			}
			ids.add(idTrim);
		}

		const correct = k.correctOptionId.trim();
		if (!ids.has(correct)) {
			return {
				ok: false,
				message: `${prefix}.knowledgeCheck.correctOptionId "${correct}" must match one of the option ids.`
			};
		}
	}

	return { ok: true, value: parsed as StructuredGenerateOutput };
}
