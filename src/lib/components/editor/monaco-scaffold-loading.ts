import type * as Monaco from 'monaco-editor';
import {
	buildLoadingContent,
	LOADING_CYCLE_MS,
	LOADING_SPINNER_LINE,
	SCAFFOLD_LOADING_VERBS,
	SPINNER_FRAME_MS,
	SPINNER_FRAMES,
	verbIndexForElapsed,
} from '$lib/components/editor/scaffold-loading-content.js';
import { devLog } from '$lib/dev/log.js';

/** Animates scaffold loading text inside the Monaco editor buffer. */
export class ScaffoldLoadingAnimator {
	private editor: Monaco.editor.IStandaloneCodeEditor | null = null;
	private monaco: typeof Monaco | null = null;
	private decorationIds: string[] = [];
	private spinnerTimer: ReturnType<typeof setInterval> | undefined;
	private verbTimer: ReturnType<typeof setInterval> | undefined;
	private frameIndex = 0;
	private startedAt = 0;
	private running = false;
	private previousLanguageId: string | null = null;
	private onVerbChange: ((verb: string) => void) | undefined;
	private onFrameChange: ((frame: string) => void) | undefined;

	attach(editor: Monaco.editor.IStandaloneCodeEditor, monaco: typeof Monaco): void {
		this.editor = editor;
		this.monaco = monaco;
		devLog('loading', 'animator attached');
	}

	setOnVerbChange(callback: (verb: string) => void): void {
		this.onVerbChange = callback;
	}

	setOnFrameChange(callback: (frame: string) => void): void {
		this.onFrameChange = callback;
	}

	start(): void {
		if (!this.editor) {
			devLog('loading', 'start skipped — no editor');
			return;
		}
		if (this.running) {
			devLog('loading', 'start skipped — already running');
			return;
		}
		this.running = true;
		devLog('loading', 'start', { verb: SCAFFOLD_LOADING_VERBS[0] });
		this.frameIndex = 0;
		this.startedAt = Date.now();

		const model = this.editor.getModel();
		if (model && this.monaco) {
			this.previousLanguageId = model.getLanguageId();
			this.monaco.editor.setModelLanguage(model, 'plaintext');
		}

		this.editor.updateOptions({
			cursorStyle: 'line-thin',
			renderLineHighlight: 'none',
		});

		this.render();
		this.notifyVerb();
		this.notifyFrame();

		this.spinnerTimer = setInterval(() => {
			this.frameIndex = (this.frameIndex + 1) % SPINNER_FRAMES.length;
			this.render();
			this.notifyFrame();
		}, SPINNER_FRAME_MS);

		this.verbTimer = setInterval(() => {
			this.render();
			this.notifyVerb();
		}, 500);
	}

	stop(): void {
		if (this.running) {
			devLog('loading', 'stop');
		}
		this.running = false;
		if (this.spinnerTimer) {
			clearInterval(this.spinnerTimer);
			this.spinnerTimer = undefined;
		}
		if (this.verbTimer) {
			clearInterval(this.verbTimer);
			this.verbTimer = undefined;
		}
		this.clearDecorations();
		this.restoreLanguage();
	}

	isRunning(): boolean {
		return this.running;
	}

	dispose(): void {
		this.stop();
		this.editor = null;
		this.monaco = null;
	}

	private restoreLanguage(): void {
		const model = this.editor?.getModel();
		if (model && this.monaco && this.previousLanguageId) {
			this.monaco.editor.setModelLanguage(model, this.previousLanguageId);
		}
		this.previousLanguageId = null;
	}

	private notifyVerb(): void {
		if (!this.onVerbChange) return;
		const verbIndex = verbIndexForElapsed(Date.now() - this.startedAt);
		this.onVerbChange(SCAFFOLD_LOADING_VERBS[verbIndex]);
	}

	private notifyFrame(): void {
		if (!this.onFrameChange) return;
		this.onFrameChange(SPINNER_FRAMES[this.frameIndex]);
	}

	private clearDecorations(): void {
		if (!this.editor || this.decorationIds.length === 0) return;
		this.editor.deltaDecorations(this.decorationIds, []);
		this.decorationIds = [];
	}

	private render(): void {
		const editor = this.editor;
		if (!editor) return;

		const elapsed = Date.now() - this.startedAt;
		const verbIndex = verbIndexForElapsed(elapsed);
		const frame = SPINNER_FRAMES[this.frameIndex];
		const verb = SCAFFOLD_LOADING_VERBS[verbIndex];
		const content = buildLoadingContent(frame, verb);

		const model = editor.getModel();
		if (!model) {
			editor.setValue(content);
		} else {
			const fullRange = model.getFullModelRange();
			editor.executeEdits('scaffy-loading', [{ range: fullRange, text: content }]);
		}

		this.applyDecorations(frame, verb);
	}

	private applyDecorations(frame: string, verb: string): void {
		const editor = this.editor;
		if (!editor) return;

		const line = LOADING_SPINNER_LINE;
		const spinnerStart = 1;
		const spinnerEnd = spinnerStart + frame.length;
		const verbStart = spinnerEnd + 2;
		const verbEnd = verbStart + verb.length;

		this.decorationIds = editor.deltaDecorations(this.decorationIds, [
			{
				range: {
					startLineNumber: 1,
					startColumn: 1,
					endLineNumber: 1,
					endColumn: 200,
				},
				options: { inlineClassName: 'scaffy-loading-label' },
			},
			{
				range: {
					startLineNumber: line,
					startColumn: spinnerStart,
					endLineNumber: line,
					endColumn: spinnerEnd + 1,
				},
				options: { inlineClassName: 'scaffy-loading-spinner' },
			},
			{
				range: {
					startLineNumber: line,
					startColumn: verbStart,
					endLineNumber: line,
					endColumn: verbEnd + 1,
				},
				options: { inlineClassName: 'scaffy-loading-verb' },
			},
		]);
	}
}

export function applyErrorDecorations(
	editor: Monaco.editor.IStandaloneCodeEditor,
	content: string,
	monaco: typeof Monaco,
): string[] {
	const model = editor.getModel();
	if (model) {
		monaco.editor.setModelLanguage(model, 'plaintext');
	}
	editor.setValue(content);
	return editor.deltaDecorations(
		[],
		[
			{
				range: { startLineNumber: 1, startColumn: 1, endLineNumber: 1, endColumn: 200 },
				options: { inlineClassName: 'scaffy-loading-label' },
			},
			{
				range: { startLineNumber: 3, startColumn: 1, endLineNumber: 3, endColumn: 2 },
				options: { inlineClassName: 'scaffy-error-mark' },
			},
			{
				range: { startLineNumber: 3, startColumn: 4, endLineNumber: 3, endColumn: 300 },
				options: { inlineClassName: 'scaffy-error-message' },
			},
		],
	);
}

export { LOADING_CYCLE_MS };
