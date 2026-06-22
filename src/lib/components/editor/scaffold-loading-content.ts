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
export const TYPEWRITER_CHAR_MS = 32;
export const VERB_HOLD_MS = 3_200;
export const LOADING_CURSOR = '▋';

export const LESSON_READY_LABEL = 'scaffy · lesson ready';
export const LESSON_READY_HINT_LINES = [
	'Read the concept preview in the scaffy tutor panel on the right. 👉',
	'Click "Got it — start lesson" there when you are ready.',
] as const;

export const LOADING_COMMENT_LINES = [
	'scaffy · generating lesson',
	'Read the concept preview in the scaffy tutor panel on the right. 👉',
	'When the preview is ready, click "Got it — start lesson" in the tutor panel.',
] as const;

export const LESSON_READY_COMMENT_LINES = [LESSON_READY_LABEL, ...LESSON_READY_HINT_LINES] as const;

/** viewZone anchor — after comment block + blank spacer line (same slot as Learning Card uses `afterLineNumber`). */
export const LOADING_SPINNER_AFTER_LINE = LOADING_COMMENT_LINES.length + 1;

/** Single-line spinner band height (Monaco default line height at 14px). */
export const LOADING_SPINNER_ZONE_HEIGHT_PX = 19;

function toHtmlComment(text: string): string {
	return `<!-- ${text} -->`;
}

export function buildLoadingCommentBlock(): string {
	return LOADING_COMMENT_LINES.map(toHtmlComment).join('\n') + '\n\n';
}

/** Time-based typewriter — catches up after main-thread stalls instead of freezing. */
export class LoadingTypewriter {
	private verbIndex = 0;
	private typedCharCount = 0;
	private holdUntil = 0;
	private charAccumulator = 0;
	private lastNow = 0;

	reset(): void {
		this.verbIndex = 0;
		this.typedCharCount = 0;
		this.holdUntil = 0;
		this.charAccumulator = 0;
		this.lastNow = 0;
	}

	getTypedText(): string {
		return SCAFFOLD_LOADING_VERBS[this.verbIndex].slice(0, this.typedCharCount);
	}

	advance(now: number, charMs = TYPEWRITER_CHAR_MS, holdMs = VERB_HOLD_MS): void {
		if (!this.lastNow) {
			this.lastNow = now;
			return;
		}

		const dt = now - this.lastNow;
		this.lastNow = now;
		const verb = SCAFFOLD_LOADING_VERBS[this.verbIndex];

		if (this.typedCharCount < verb.length) {
			this.charAccumulator += dt;
			while (this.charAccumulator >= charMs && this.typedCharCount < verb.length) {
				this.charAccumulator -= charMs;
				this.typedCharCount++;
			}
			return;
		}

		if (this.holdUntil === 0) {
			this.holdUntil = now + holdMs;
			return;
		}

		if (now >= this.holdUntil) {
			this.verbIndex = (this.verbIndex + 1) % SCAFFOLD_LOADING_VERBS.length;
			this.typedCharCount = 0;
			this.holdUntil = 0;
			this.charAccumulator = 0;
		}
	}

	/** @deprecated Use advance() from a rAF loop */
	tick(now = Date.now()): void {
		this.advance(now);
	}
}

export function verbIndexForElapsed(elapsedMs: number): number {
	const interval = LOADING_CYCLE_MS / SCAFFOLD_LOADING_VERBS.length;
	return Math.floor(elapsedMs / interval) % SCAFFOLD_LOADING_VERBS.length;
}

export function buildErrorContent(message: string): string {
	const safe = message.replace(/\r?\n/g, ' ').trim().slice(0, 240);
	return [
		'<!-- scaffy · lesson failed -->',
		'',
		`✖  ${safe}`,
		'',
		'<!-- Retry or load the dev fallback below. -->',
	].join('\n');
}

export function buildLessonReadyWaitContent(): string {
	return LESSON_READY_COMMENT_LINES.map(toHtmlComment).join('\n') + '\n';
}
