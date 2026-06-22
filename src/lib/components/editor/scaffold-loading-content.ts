import { t } from '$lib/i18n/index.js';
export function getLoadingVerbs(): string[] {
	return [
		t('editor.loadingVerb1'),
		t('editor.loadingVerb2'),
		t('editor.loadingVerb3'),
		t('editor.loadingVerb4'),
		t('editor.loadingVerb5'),
		t('editor.loadingVerb6'),
		t('editor.loadingVerb7'),
	];
}

export const SPINNER_FRAMES = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'] as const;

export const LOADING_CYCLE_MS = 45_000;
export const SPINNER_FRAME_MS = 100;
export const TYPEWRITER_CHAR_MS = 32;
export const VERB_HOLD_MS = 3_200;
export const LOADING_CURSOR = '▋';

export function getLessonReadyLines(): string[] {
	return [
		t('editor.lessonReadyTitle'),
		t('editor.lessonReadyHint1'),
		t('editor.lessonReadyHint2'),
	];
}

export function getLoadingCommentLines(): string[] {
	return [
		t('editor.loadingTitle'),
		t('editor.loadingHint1'),
		t('editor.loadingHint2'),
	];
}

/** viewZone anchor — after comment block + blank spacer line (same slot as Learning Card uses `afterLineNumber`). */
export const LOADING_SPINNER_AFTER_LINE = 4;

/** Single-line spinner band height (Monaco default line height at 14px). */
export const LOADING_SPINNER_ZONE_HEIGHT_PX = 19;

function toHtmlComment(text: string): string {
	return `<!-- ${text} -->`;
}

export function buildLoadingCommentBlock(): string {
	return getLoadingCommentLines().map(toHtmlComment).join('\n') + '\n\n';
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
	return getLoadingVerbs()[this.verbIndex].slice(0, this.typedCharCount);
	}

	advance(now: number, charMs = TYPEWRITER_CHAR_MS, holdMs = VERB_HOLD_MS): void {
		if (!this.lastNow) {
			this.lastNow = now;
			return;
		}

		const dt = now - this.lastNow;
		this.lastNow = now;
		const verb = getLoadingVerbs()[this.verbIndex];

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
			this.verbIndex = (this.verbIndex + 1) % getLoadingVerbs().length;			this.typedCharCount = 0;
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
	const interval = LOADING_CYCLE_MS / getLoadingVerbs().length;
	return Math.floor(elapsedMs / interval) % getLoadingVerbs().length;
}

export function buildErrorContent(message: string): string {
	const safe = message.replace(/\r?\n/g, ' ').trim().slice(0, 240);
	return [
		'<!-- scaffy · lesson failed -->',
		'',
		`✖  ${safe}`,
		'',
		`<!-- ${t('editor.errorRetryHint')} -->`,
	].join('\n');
}

export function buildLessonReadyWaitContent(): string {
	return getLessonReadyLines().map(toHtmlComment).join('\n') + '\n';
}
