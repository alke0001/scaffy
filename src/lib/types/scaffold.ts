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
export type StructuredScaffoldOutput = {
	scaffolds: Scaffold[];
};
