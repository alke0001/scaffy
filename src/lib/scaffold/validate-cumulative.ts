/** Normalize line endings for prefix checks (LLM output may mix CRLF/LF). */
function normalizeCodeForPrefix(code: string): string {
	return code.replace(/\r\n/g, '\n');
}

/**
 * True when `next` continues `prior` cumulatively (full-file snapshots).
 * Empty prior (question-first step) always passes.
 */
export function isCumulativeCodePrefix(prior: string, next: string): boolean {
	if (prior.length === 0) return true;
	if (next.startsWith(prior)) return true;

	const normalizedPrior = normalizeCodeForPrefix(prior);
	const normalizedNext = normalizeCodeForPrefix(next);
	return normalizedNext.startsWith(normalizedPrior);
}

export type CumulativeChainResult =
	| { ok: true }
	| { ok: false; failedIndex: number; message: string };

/** Validates every consecutive codeSnippet pair in order. */
export function validateCumulativeChain(
	scaffolds: { codeSnippet: string }[],
): CumulativeChainResult {
	for (let i = 1; i < scaffolds.length; i++) {
		const prior = scaffolds[i - 1].codeSnippet;
		const current = scaffolds[i].codeSnippet;
		if (!isCumulativeCodePrefix(prior, current)) {
			return {
				ok: false,
				failedIndex: i,
				message: `scaffolds[${i}].codeSnippet must extend scaffolds[${i - 1}] (cumulative prefix).`,
			};
		}
	}
	return { ok: true };
}
