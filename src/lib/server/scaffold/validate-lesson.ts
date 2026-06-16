import {
	LESSON_SCAFFOLD_COUNT,
	type Scaffold,
	type StructuredScaffoldOutput,
} from '$lib/types/scaffold.js';
import { validateCumulativeChain } from '$lib/scaffold/validate-cumulative.js';
import {
	validateStructuredOutput,
	type StructuredOutputValidation,
} from '$lib/server/scaffold/output-schema.js';

export type LessonValidation =
	| { ok: true; value: StructuredScaffoldOutput; trimmedCount?: boolean }
	| { ok: false; message: string };

export function normalizeScaffoldCount(
	scaffolds: Scaffold[],
): { ok: true; scaffolds: Scaffold[]; trimmed: boolean } | { ok: false; message: string } {
	if (scaffolds.length < LESSON_SCAFFOLD_COUNT) {
		return {
			ok: false,
			message: `Lesson must contain exactly ${LESSON_SCAFFOLD_COUNT} scaffolds (got ${scaffolds.length}).`,
		};
	}
	if (scaffolds.length > LESSON_SCAFFOLD_COUNT) {
		return {
			ok: true,
			scaffolds: scaffolds.slice(0, LESSON_SCAFFOLD_COUNT),
			trimmed: true,
		};
	}
	return { ok: true, scaffolds, trimmed: false };
}

export function validateLessonOutput(parsed: unknown): LessonValidation {
	const shape: StructuredOutputValidation = validateStructuredOutput(parsed);
	if (!shape.ok) return shape;

	const normalized = normalizeScaffoldCount(shape.value.scaffolds);
	if (!normalized.ok) return normalized;

	const chain = validateCumulativeChain(normalized.scaffolds);
	if (!chain.ok) {
		return { ok: false, message: chain.message };
	}

	return {
		ok: true,
		value: { scaffolds: normalized.scaffolds },
		trimmedCount: normalized.trimmed,
	};
}
