import type * as Monaco from 'monaco-editor';
import {
	buildLoadingCommentBlock,
	LOADING_CURSOR,
	LOADING_SPINNER_AFTER_LINE,
	LOADING_SPINNER_ZONE_HEIGHT_PX,
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

/**
 * Spinner row as Monaco viewZone — same integration as Learning Card (`KnowledgeViewZoneController`).
 * Static HTML comments live in the model; animation updates DOM only (no model edits).
 */
class LoadingSpinnerViewZone {
	private zoneId: string | null = null;
	private domNode: HTMLDivElement | null = null;
	private spinnerSpan: HTMLSpanElement | null = null;
	private verbSpan: HTMLSpanElement | null = null;

	private ensureDomNode(): HTMLDivElement {
		if (this.domNode) return this.domNode;

		const root = document.createElement('div');
		root.className = 'scaffy-loading-spinner-view-zone';

		const spinnerSpan = document.createElement('span');
		spinnerSpan.className = 'scaffy-loading-spinner';

		const verbSpan = document.createElement('span');
		verbSpan.className = 'scaffy-loading-verb';

		const cursorSpan = document.createElement('span');
		cursorSpan.className = 'scaffy-loading-cursor';
		cursorSpan.textContent = LOADING_CURSOR;
		cursorSpan.setAttribute('aria-hidden', 'true');

		root.append(spinnerSpan, verbSpan, cursorSpan);
		this.domNode = root;
		this.spinnerSpan = spinnerSpan;
		this.verbSpan = verbSpan;
		return root;
	}

	mount(editor: Monaco.editor.IStandaloneCodeEditor): void {
		if (this.zoneId) return;

		const domNode = this.ensureDomNode();

		editor.changeViewZones((accessor) => {
			this.zoneId = accessor.addZone({
				afterLineNumber: LOADING_SPINNER_AFTER_LINE,
				heightInPx: LOADING_SPINNER_ZONE_HEIGHT_PX,
				domNode,
				suppressMouseDown: true,
			});
		});
	}

	unmount(editor: Monaco.editor.IStandaloneCodeEditor): void {
		if (!this.zoneId) return;

		const zoneId = this.zoneId;
		editor.changeViewZones((accessor) => {
			accessor.removeZone(zoneId);
		});
		this.zoneId = null;
	}

	dispose(): void {
		this.domNode = null;
		this.spinnerSpan = null;
		this.verbSpan = null;
	}

	update(spinnerFrame: string, typedVerb: string): void {
		if (!this.spinnerSpan || !this.verbSpan) return;

		if (this.spinnerSpan.textContent !== spinnerFrame) {
			this.spinnerSpan.textContent = spinnerFrame;
		}

		const verbText = typedVerb ? `  ${typedVerb}` : '';
		if (this.verbSpan.textContent !== verbText) {
			this.verbSpan.textContent = verbText;
		}
	}
}

/** Static comment block in Monaco; spinner animates via viewZone only. */
export class ScaffoldLoadingAnimator {
	private editor: Monaco.editor.IStandaloneCodeEditor | null = null;
	private monaco: typeof Monaco | null = null;
	private spinnerZone: LoadingSpinnerViewZone | null = null;
	private loadingMode = false;

	attach(editor: Monaco.editor.IStandaloneCodeEditor, monaco: typeof Monaco): void {
		this.editor = editor;
		this.monaco = monaco;
		devLog('loading', 'animator attached');
	}

	enterLoadingMode(): void {
		if (!this.editor || !this.monaco || this.loadingMode) return;
		this.loadingMode = true;
		devLog('loading', 'enter loading mode');

		const editor = this.editor;
		const monaco = this.monaco;

		setCodeLanguage(editor, monaco);

		editor.updateOptions({
			cursorStyle: 'line-thin',
			renderLineHighlight: 'none',
		});

		editor.setValue(buildLoadingCommentBlock());

		this.spinnerZone = new LoadingSpinnerViewZone();
		this.spinnerZone.mount(editor);
		this.spinnerZone.update('⠋', '');
	}

	exitLoadingMode(): void {
		if (!this.loadingMode) return;
		devLog('loading', 'exit loading mode');
		this.loadingMode = false;

		if (this.editor && this.spinnerZone) {
			this.spinnerZone.unmount(this.editor);
			this.spinnerZone.dispose();
		}
		this.spinnerZone = null;

		if (this.editor && this.monaco) {
			setCodeLanguage(this.editor, this.monaco);
		}
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
		this.spinnerZone?.update(spinnerFrame, typedVerb);
	}
}

export function applyErrorDecorations(
	editor: Monaco.editor.IStandaloneCodeEditor,
	content: string,
	monaco: typeof Monaco,
): string[] {
	const model = editor.getModel();
	if (model) {
		setCodeLanguage(editor, monaco);
	}
	editor.setValue(content);
	return editor.deltaDecorations(
		[],
		[
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
