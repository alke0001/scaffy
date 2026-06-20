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
export const TYPEWRITER_CHAR_MS = 42;
export const VERB_HOLD_MS = 4_000;
export const LOADING_CURSOR = '▋';

/** Plaintext lines — visible in Monaco without comment-token quirks. */
const LOADING_HEADER = 'scaffy · generating lesson';
export const LOADING_SPINNER_LINE = 3;

export function buildLoadingContent(
	spinnerFrame: string,
	typedVerb: string,
	showCursor = true,
): string {
	const cursor = showCursor ? LOADING_CURSOR : '';
	return `${LOADING_HEADER}\n\n${spinnerFrame}  ${typedVerb}${cursor}\n`;
}

/** Types loading verbs character-by-character with a hold between phrases. */
export class LoadingTypewriter {
	private verbIndex = 0;
	private typedCharCount = 0;
	private holdUntil = 0;

	reset(): void {
		this.verbIndex = 0;
		this.typedCharCount = 0;
		this.holdUntil = 0;
	}

	getTypedText(): string {
		return SCAFFOLD_LOADING_VERBS[this.verbIndex].slice(0, this.typedCharCount);
	}

	tick(now = Date.now()): void {
		const verb = SCAFFOLD_LOADING_VERBS[this.verbIndex];

		if (this.typedCharCount < verb.length) {
			this.typedCharCount++;
			this.holdUntil = 0;
			return;
		}

		if (this.holdUntil === 0) {
			this.holdUntil = now + VERB_HOLD_MS;
			return;
		}

		if (now >= this.holdUntil) {
			this.verbIndex = (this.verbIndex + 1) % SCAFFOLD_LOADING_VERBS.length;
			this.typedCharCount = 0;
			this.holdUntil = 0;
		}
	}

	isComplete(): boolean {
		const verb = SCAFFOLD_LOADING_VERBS[this.verbIndex];
		return this.typedCharCount >= verb.length;
	}
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
