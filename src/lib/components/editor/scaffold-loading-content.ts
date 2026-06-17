export const SCAFFOLD_LOADING_VERBS = [
	'Booping Scaffy...',
	'Rubber-ducking the architecture...',
	'Turning tutorials into real skills...',
	'Caramelizing Onions...',
	'Translating coffee into code...',
	'Teaching variables their purpose...',
	'Preparing TypeScript emotional support...',
] as const;

export const SPINNER_FRAMES = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'] as const;

export const LOADING_CYCLE_MS = 45_000;
export const SPINNER_FRAME_MS = 100;

/** Plaintext lines — visible in Monaco without comment-token quirks. */
const LOADING_HEADER = 'scaffy · generating lesson';
export const LOADING_SPINNER_LINE = 3;

export function buildLoadingContent(spinnerFrame: string, verb: string): string {
	return `${LOADING_HEADER}\n\n${spinnerFrame}  ${verb}\n`;
}

export function verbIndexForElapsed(elapsedMs: number): number {
	const interval = LOADING_CYCLE_MS / SCAFFOLD_LOADING_VERBS.length;
	return Math.floor(elapsedMs / interval) % SCAFFOLD_LOADING_VERBS.length;
}

export function buildErrorContent(message: string): string {
	const safe = message.replace(/\r?\n/g, ' ').trim().slice(0, 240);
	return [
		'scaffy · lesson failed',
		'',
		`✖  ${safe}`,
		'',
		'Retry or load the dev fallback below.',
	].join('\n');
}

export { LOADING_HEADER };
