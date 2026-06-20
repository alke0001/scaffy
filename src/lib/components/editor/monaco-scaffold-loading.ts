import type * as Monaco from 'monaco-editor';
import {
	buildLoadingContent,
	LOADING_SPINNER_LINE,
} from '$lib/components/editor/scaffold-loading-content.js';
import { devLog } from '$lib/dev/log.js';

export const MONACO_CODE_LANGUAGE = 'html';

export function setCodeLanguage(
	editor: Monaco.editor.IStandaloneCodeEditor,
	monaco: typeof Monaco,
): void {
	const model = editor.getModel();
	if (model && model.getLanguageId() !== MONACO_CODE_LANGUAGE) {
		monaco.editor.setModelLanguage(model, MONACO_CODE_LANGUAGE);
	}
}

/** Renders scaffold loading text inside the Monaco editor buffer (no timers — driven by the view). */
export class ScaffoldLoadingAnimator {
	private editor: Monaco.editor.IStandaloneCodeEditor | null = null;
	private monaco: typeof Monaco | null = null;
	private decorationIds: string[] = [];
	private loadingMode = false;

	attach(editor: Monaco.editor.IStandaloneCodeEditor, monaco: typeof Monaco): void {
		this.editor = editor;
		this.monaco = monaco;
		devLog('loading', 'animator attached');
	}

	enterLoadingMode(): void {
		if (!this.editor || this.loadingMode) return;
		this.loadingMode = true;
		devLog('loading', 'enter loading mode');

		const model = this.editor.getModel();
		if (model && this.monaco) {
			this.monaco.editor.setModelLanguage(model, 'plaintext');
		}

		this.editor.updateOptions({
			cursorStyle: 'line-thin',
			renderLineHighlight: 'none',
		});

		this.renderLoadingDisplay('⠋', '');
	}

	exitLoadingMode(): void {
		if (!this.loadingMode) return;
		devLog('loading', 'exit loading mode');
		this.loadingMode = false;
		this.clearDecorations();
		this.restoreLanguage();
	}

	isInLoadingMode(): boolean {
		return this.loadingMode;
	}

	dispose(): void {
		this.exitLoadingMode();
		this.editor = null;
		this.monaco = null;
	}

	renderLoadingDisplay(spinnerFrame: string, typedVerb: string): void {
		this.paint(spinnerFrame, typedVerb);
	}

	private restoreLanguage(): void {
		const editor = this.editor;
		if (editor && this.monaco) {
			setCodeLanguage(editor, this.monaco);
		}
	}

	private clearDecorations(): void {
		if (!this.editor || this.decorationIds.length === 0) return;
		this.editor.deltaDecorations(this.decorationIds, []);
		this.decorationIds = [];
	}

	private paint(spinnerFrame: string, typedVerb: string): void {
		const editor = this.editor;
		if (!editor) return;

		const content = buildLoadingContent(spinnerFrame, typedVerb);

		const model = editor.getModel();
		if (!model) {
			editor.setValue(content);
		} else {
			const fullRange = model.getFullModelRange();
			editor.executeEdits('scaffy-loading', [{ range: fullRange, text: content }]);
		}

		this.applyDecorations(spinnerFrame, typedVerb);
	}

	private applyDecorations(frame: string, typedVerb: string): void {
		const editor = this.editor;
		if (!editor) return;

		const line = LOADING_SPINNER_LINE;
		const spinnerStart = 1;
		const spinnerEnd = spinnerStart + frame.length;
		const verbStart = spinnerEnd + 2;
		const verbEnd = verbStart + typedVerb.length;
		const cursorColumn = verbEnd;

		const decorations: Monaco.editor.IModelDeltaDecoration[] = [
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
		];

		if (typedVerb.length > 0) {
			decorations.push({
				range: {
					startLineNumber: line,
					startColumn: verbStart,
					endLineNumber: line,
					endColumn: verbEnd + 1,
				},
				options: { inlineClassName: 'scaffy-loading-verb' },
			});
		}

		decorations.push({
			range: {
				startLineNumber: line,
				startColumn: cursorColumn,
				endLineNumber: line,
				endColumn: cursorColumn + 1,
			},
			options: { inlineClassName: 'scaffy-loading-cursor' },
		});

		this.decorationIds = editor.deltaDecorations(this.decorationIds, decorations);
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

export { LOADING_CYCLE_MS } from '$lib/components/editor/scaffold-loading-content.js';
