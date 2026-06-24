import {
	LESSON_SCAFFOLD_COUNT,
	type Scaffold,
	type StructuredScaffoldOutput,
} from '$lib/types/scaffold.js';
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
	if (scaffolds.length === 0) {
		return {
			ok: false,
			message: `Lesson must contain at least one scaffold (got ${scaffolds.length}).`,
		};
	}
	if (scaffolds.length <= LESSON_SCAFFOLD_COUNT) {
		return { ok: true, scaffolds, trimmed: false };
	}
	return {
		ok: true,
		scaffolds: [scaffolds[0], scaffolds[1], scaffolds[scaffolds.length - 1]],
		trimmed: true,
	};
}

export function validateLessonOutput(parsed: unknown): LessonValidation {
	const shape: StructuredOutputValidation = validateStructuredOutput(parsed);
	if (!shape.ok) return shape;

	const normalized = normalizeScaffoldCount(shape.value.scaffolds);
	if (!normalized.ok) return normalized;

	return {
		ok: true,
		value: { scaffolds: normalized.scaffolds },
		trimmedCount: normalized.trimmed,
	};
}
