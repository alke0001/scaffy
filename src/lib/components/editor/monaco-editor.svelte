<script lang="ts">
	import { onDestroy, onMount, tick } from 'svelte';
	import loader from '@monaco-editor/loader';
	import type * as Monaco from 'monaco-editor';
	import { getActiveSession, getSessionById, markSessionCompleted } from '$lib/session.svelte.js';
	import {
		isFallbackScaffoldAvailable,
		loadFallbackScaffolds,
		retryScaffold,
	} from '$lib/learn/request-scaffold.js';
	import { LESSON_SCAFFOLD_COUNT, type KnowledgeCheck } from '$lib/types/scaffold.js';
	import {
		ScaffoldLoadingAnimator,
		applyErrorDecorations,
		setCodeLanguage,
		MONACO_CODE_LANGUAGE,
	} from '$lib/components/editor/monaco-scaffold-loading.js';
	import {
		LoadingTypewriter,
		SPINNER_FRAMES,
		SPINNER_FRAME_MS,
		TYPEWRITER_CHAR_MS,
	} from '$lib/components/editor/scaffold-loading-content.js';
	import { buildErrorContent } from '$lib/components/editor/scaffold-loading-content.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { KnowledgeViewZoneController } from '$lib/components/editor/monaco-knowledge-view-zone.js';
	import { KnowledgeZoneBridge } from '$lib/components/editor/knowledge-zone-bridge.svelte.js';
	import ReadOnlyHint from '$lib/components/editor/read-only-hint.svelte';
	import { cn } from '$lib/utils.js';
	import { devLog } from '$lib/dev/log.js';
	import './monaco-editor.css';

	let {
		class: className,
		sessionId,
	}: {
		class?: string;
		sessionId?: string;
	} = $props();

	let editorContainer = $state<HTMLDivElement | null>(null);
	let editor = $state<Monaco.editor.IStandaloneCodeEditor | null>(null);
	let editorReady = $state(false);
	let readOnlyHint = $state<{ x: number; y: number; placement: 'above' | 'below' } | null>(null);

	let readOnlyHintTimer: ReturnType<typeof setTimeout> | undefined;
	let dismissReadOnlyHintListener: ((event: PointerEvent) => void) | undefined;

	const zoneBridge = new KnowledgeZoneBridge();
	const viewZoneController = new KnowledgeViewZoneController(zoneBridge);

	const boundSession = $derived(sessionId ? getSessionById(sessionId) : getActiveSession());
	const activeStatus = $derived(boundSession?.status ?? 'idle');
	const sessionError = $derived(boundSession?.errorMessage ?? null);
	const scaffolds = $derived(boundSession?.scaffolds ?? []);
	const fallbackAvailable = $derived(isFallbackScaffoldAvailable());
	const isEditorEditable = $derived(
		Boolean(boundSession?.completed && activeStatus !== 'loading' && activeStatus !== 'idle'),
	);
	let currentSessionId = $state<string | null>(null);
	let currentIndex = $state(0);
	let currentQuestion = $state<KnowledgeCheck | null>(null);
	let selectedOption = $state<string | null>(null);
	let showLearningCard = $state(false);
	let loadingTypedVerb = $state('');
	let loadingSpinnerFrame = $state('⠋');
	let errorDecorationIds = $state<string[]>([]);
	let lastErrorMessage = $state<string | null>(null);
	let monacoApi = $state<typeof Monaco | null>(null);

	const loadingAnimator = new ScaffoldLoadingAnimator();

	zoneBridge.onAnswer = handleOptionChange;
	zoneBridge.onUnderstand = acknowledgeError;

	onMount(() => {
		if (!editorContainer) return;

		let readOnlyEditDisposable: Monaco.IDisposable | undefined;

		void (async () => {
			const monaco = await loader.init();
			if (!editorContainer) return;

			const createdEditor = monaco.editor.create(editorContainer, {
				value: '',
				language: MONACO_CODE_LANGUAGE,
				theme: 'vs-dark',
				automaticLayout: true,
				readOnly: true,
				scrollBeyondLastLine: false,
				scrollbar: {
					verticalScrollbarSize: 10,
					horizontalScrollbarSize: 10,
					useShadows: false,
					verticalHasArrows: false,
					horizontalHasArrows: false,
				},
			});
			editor = createdEditor;
			monacoApi = monaco;

			createdEditor.getContribution('editor.contrib.readOnlyMessageController')?.dispose?.();

			readOnlyEditDisposable = createdEditor.onDidAttemptReadOnlyEdit(() => {
				showReadOnlyHint(createdEditor);
			});

			viewZoneController.attach(createdEditor);
			loadingAnimator.attach(createdEditor, monaco);
			editorReady = true;
			devLog('monaco', 'editor ready', { sessionId, status: boundSession?.status });
		})();

		return () => {
			readOnlyEditDisposable?.dispose();
		};
	});

	onDestroy(() => {
		hideReadOnlyHint();
		loadingAnimator.dispose();
		if (editor && errorDecorationIds.length > 0) {
			editor.deltaDecorations(errorDecorationIds, []);
		}
		viewZoneController.dispose();
		editor?.dispose();
	});

	function clearErrorDecorations() {
		if (!editor || errorDecorationIds.length === 0) return;
		editor.deltaDecorations(errorDecorationIds, []);
		errorDecorationIds = [];
	}

	function showErrorInEditor(message: string) {
		if (!editor || !monacoApi) return;
		loadingAnimator.exitLoadingMode();
		clearErrorDecorations();
		errorDecorationIds = applyErrorDecorations(editor, buildErrorContent(message), monacoApi);
		resetEditorState();
	}

	async function handleRetryScaffold() {
		if (!boundSession) return;
		clearErrorDecorations();
		try {
			await retryScaffold(boundSession.id);
		} catch {
			// error state restored by request-scaffold
		}
	}

	function handleLoadFallback() {
		if (!boundSession) return;
		clearErrorDecorations();
		loadFallbackScaffolds(boundSession.id);
	}

	function hideReadOnlyHint() {
		readOnlyHint = null;
		if (readOnlyHintTimer) {
			clearTimeout(readOnlyHintTimer);
			readOnlyHintTimer = undefined;
		}
		if (dismissReadOnlyHintListener) {
			document.removeEventListener('pointerdown', dismissReadOnlyHintListener, true);
			dismissReadOnlyHintListener = undefined;
		}
	}

	function showReadOnlyHint(activeEditor: Monaco.editor.IStandaloneCodeEditor) {
		if (isEditorEditable) return;

		const position = activeEditor.getPosition();
		const domNode = activeEditor.getDomNode();
		if (!position || !domNode) return;

		const coords = activeEditor.getScrolledVisiblePosition(position);
		if (!coords) return;

		const rect = domNode.getBoundingClientRect();
		const anchorX = rect.left + coords.left + 8;
		const anchorY = rect.top + coords.top;
		const margin = 12;
		const hintHeight = 72;
		const hintMaxWidth = Math.min(352, window.innerWidth - margin * 2);
		const halfHintWidth = hintMaxWidth / 2;
		const placement = anchorY - hintHeight - margin < margin ? 'below' : 'above';
		const x = Math.min(
			Math.max(anchorX, margin + halfHintWidth),
			window.innerWidth - margin - halfHintWidth,
		);
		const y = placement === 'above' ? anchorY - margin : anchorY + coords.height + margin;

		readOnlyHint = { x, y, placement };

		if (readOnlyHintTimer) clearTimeout(readOnlyHintTimer);
		readOnlyHintTimer = setTimeout(hideReadOnlyHint, 5000);

		if (!dismissReadOnlyHintListener) {
			dismissReadOnlyHintListener = (event: PointerEvent) => {
				const target = event.target;
				if (target instanceof Node && domNode.contains(target)) return;
				hideReadOnlyHint();
			};
			document.addEventListener('pointerdown', dismissReadOnlyHintListener, true);
		}
	}

	function ensureCodeLanguage() {
		if (!editor || !monacoApi) return;
		setCodeLanguage(editor, monacoApi);
	}

	function resetEditorState() {
		currentIndex = 0;
		currentQuestion = null;
		selectedOption = null;
		showLearningCard = false;
		zoneBridge.reset();
		viewZoneController.refresh();
	}

	function syncEditorReadOnly() {
		if (!editor) return;

		const readOnly = !isEditorEditable;
		editor.updateOptions({
			readOnly,
			readOnlyMessage: { value: '' },
		});
	}

	function pushZoneBridgeState() {
		if (!editorReady || !editor) return;

		if (!currentQuestion) {
			zoneBridge.reset();
			viewZoneController.refresh();
			return;
		}

		zoneBridge.question = currentQuestion;
		zoneBridge.chunkIndex = currentIndex;
		zoneBridge.chunkTotal = scaffolds.length;
		zoneBridge.selectedOption = selectedOption;
		zoneBridge.showFeedback = showLearningCard;
		viewZoneController.refresh();
	}

	$effect(() => {
		if (!editorReady || !editor) return;

		const sessionIdForLog = boundSession?.id ?? sessionId ?? null;

		if (!boundSession || activeStatus === 'idle') {
			devLog('monaco', 'effect → idle (clear editor)', {
				sessionId: sessionIdForLog,
				activeStatus,
			});
			loadingAnimator.exitLoadingMode();
			clearErrorDecorations();
			editor.setValue('');
			resetEditorState();
			currentSessionId = null;
			return;
		}

		if (activeStatus === 'loading') {
			devLog('monaco', 'effect → loading', {
				sessionId: sessionIdForLog,
				sessionChanged: currentSessionId !== boundSession.id,
				loadingMode: loadingAnimator.isInLoadingMode(),
			});
			const sessionChanged = currentSessionId !== boundSession.id;
			if (sessionChanged || !loadingAnimator.isInLoadingMode()) {
				loadingAnimator.enterLoadingMode();
			}
			clearErrorDecorations();
			lastErrorMessage = null;
			resetEditorState();
			currentSessionId = boundSession.id;
			return;
		}

		if (activeStatus === 'error') {
			devLog('monaco', 'effect → error', { sessionId: sessionIdForLog, sessionError });
			loadingAnimator.exitLoadingMode();
			const message = sessionError ?? 'Request failed.';
			if (lastErrorMessage !== message || currentSessionId !== boundSession.id) {
				showErrorInEditor(message);
				lastErrorMessage = message;
			}
			currentSessionId = boundSession.id;
			return;
		}

		devLog('monaco', 'effect → ready', {
			sessionId: sessionIdForLog,
			scaffoldCount: scaffolds.length,
			completed: boundSession.completed,
		});

		lastErrorMessage = null;

		loadingAnimator.exitLoadingMode();
		clearErrorDecorations();

		if (boundSession.completed) {
			const lastCode = scaffolds.at(-1)?.codeSnippet ?? '';
			ensureCodeLanguage();
			editor.setValue(lastCode);
			currentIndex = scaffolds.length;
			currentQuestion = null;
			selectedOption = null;
			showLearningCard = false;
			zoneBridge.reset();
			viewZoneController.refresh();
			currentSessionId = boundSession.id;
			return;
		}

		const sessionSwitched = boundSession.id !== currentSessionId;
		if (sessionSwitched) {
			currentSessionId = boundSession.id;
			resetEditorState();
		}

		if (sessionSwitched || currentQuestion === null) {
			if (scaffolds.length > 0) {
				loadNextScaffold();
			}
		}
	});

	$effect(() => {
		if (!editorReady || activeStatus !== 'loading') {
			loadingTypedVerb = '';
			loadingSpinnerFrame = SPINNER_FRAMES[0];
			return;
		}

		const typewriter = new LoadingTypewriter();
		let frameIndex = 0;

		const paint = () => {
			const frame = SPINNER_FRAMES[frameIndex] ?? SPINNER_FRAMES[0];
			const typed = typewriter.getTypedText();
			loadingSpinnerFrame = frame;
			loadingTypedVerb = typed;
			loadingAnimator.renderLoadingDisplay(frame, typed);
		};

		paint();

		const spinnerTimer = setInterval(() => {
			frameIndex = (frameIndex + 1) % SPINNER_FRAMES.length;
			paint();
		}, SPINNER_FRAME_MS);

		const typewriterTimer = setInterval(() => {
			typewriter.tick();
			paint();
		}, TYPEWRITER_CHAR_MS);

		return () => {
			clearInterval(spinnerTimer);
			clearInterval(typewriterTimer);
		};
	});

	$effect(() => {
		if (!editorReady || !editor) return;
		void isEditorEditable;
		syncEditorReadOnly();
		if (isEditorEditable) hideReadOnlyHint();
	});

	$effect(() => {
		if (!editorReady || !editor) return;
		void currentQuestion;
		void currentIndex;
		void scaffolds.length;
		void selectedOption;
		void showLearningCard;
		pushZoneBridgeState();
	});

	async function loadNextScaffold() {
		if (!editor) return;

		const scaffold = scaffolds[currentIndex];
		if (!scaffold) return;

		const code =
			scaffold.codeSnippet.trim().length === 0
				? '// Bitte Frage beantworten'
				: scaffold.codeSnippet;

		ensureCodeLanguage();
		editor.setValue(code);
		selectedOption = null;
		showLearningCard = false;
		currentQuestion = scaffold.knowledgeCheck;
		currentIndex++;

		await tick();
		pushZoneBridgeState();
	}

	function handleOptionChange(optionId: string) {
		if (!currentQuestion || showLearningCard) return;

		selectedOption = optionId;

		if (optionId === currentQuestion.correctOptionId) {
			currentQuestion = null;
			zoneBridge.reset();
			viewZoneController.refresh();

			if (currentIndex >= scaffolds.length && scaffolds.length >= LESSON_SCAFFOLD_COUNT) {
				markSessionCompleted(boundSession?.id);
				return;
			}

			loadNextScaffold();
			if (
				currentIndex >= scaffolds.length &&
				!currentQuestion &&
				scaffolds.length >= LESSON_SCAFFOLD_COUNT
			) {
				markSessionCompleted(boundSession?.id);
			}
			return;
		}

		showLearningCard = true;
		hideReadOnlyHint();
		zoneBridge.selectedOption = optionId;
		zoneBridge.showFeedback = true;
		viewZoneController.refresh();
	}

	function acknowledgeError() {
		showLearningCard = false;
		selectedOption = null;
		zoneBridge.selectedOption = null;
		zoneBridge.showFeedback = false;
		viewZoneController.refresh();
	}
</script>

<div class={cn('scaffy-monaco-editor flex min-h-0 flex-1 flex-col', className)}>
	<div class="editor-wrapper relative min-h-0 flex-1">
		<div bind:this={editorContainer} class="editor h-full min-h-0 w-full"></div>
		{#if activeStatus === 'loading'}
			<div class="scaffy-editor-loading" aria-live="polite">
				<p class="scaffy-editor-loading__label">scaffy · generating lesson</p>
				<p class="scaffy-editor-loading__status">
					<span class="scaffy-editor-loading__spinner">{loadingSpinnerFrame}</span>
					<span class="scaffy-editor-loading__verb">
						{loadingTypedVerb}<span class="scaffy-editor-loading__cursor" aria-hidden="true">▋</span
						>
					</span>
				</p>
			</div>
		{/if}
	</div>

	{#if activeStatus === 'error'}
		<div class="scaffy-editor-actions flex shrink-0 flex-wrap gap-2 px-1 py-2">
			<Button type="button" size="sm" onclick={handleRetryScaffold}>Erneut versuchen</Button>
			<Button
				type="button"
				size="sm"
				variant="outline"
				disabled={!fallbackAvailable}
				onclick={handleLoadFallback}
			>
				Fallback laden
			</Button>
		</div>
	{/if}

	{#if !currentQuestion && scaffolds.length > 0 && currentIndex < scaffolds.length}
		<button type="button" class="dev-continue shrink-0" onclick={loadNextScaffold}>Weiter</button>
	{/if}
</div>

{#if readOnlyHint}
	<ReadOnlyHint x={readOnlyHint.x} y={readOnlyHint.y} placement={readOnlyHint.placement} />
{/if}

<style>
	.editor-wrapper {
		position: relative;
	}

	.editor {
		overflow: hidden;
	}

	.scaffy-editor-loading {
		position: absolute;
		inset: 0;
		z-index: 3;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.75rem;
		padding: 1.5rem;
		border-radius: 0.75rem;
		background: color-mix(in oklch, var(--background) 88%, transparent);
		pointer-events: none;
		text-align: center;
	}

	.scaffy-editor-loading__label {
		margin: 0;
		font-size: 0.8125rem;
		font-style: italic;
		color: var(--muted-foreground);
	}

	.scaffy-editor-loading__status {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: center;
		gap: 0.5rem 0.75rem;
		margin: 0;
		max-width: 28rem;
		font-family: var(--font-mono, ui-monospace, monospace);
		font-size: 0.9375rem;
		line-height: 1.4;
	}

	.scaffy-editor-loading__spinner {
		color: var(--primary);
		font-weight: 600;
	}

	.scaffy-editor-loading__verb {
		color: var(--scaffy-cyan);
	}

	.scaffy-editor-loading__cursor {
		color: var(--scaffy-cyan);
		animation: scaffy-loading-cursor-blink 1s step-end infinite;
	}

	@keyframes scaffy-loading-cursor-blink {
		50% {
			opacity: 0;
		}
	}

	.dev-continue {
		padding: 0.75rem 1rem;
		border: none;
		border-radius: 8px;
		background: var(--primary);
		color: var(--primary-foreground);
		cursor: pointer;
		font-weight: 600;
	}

	.dev-continue:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
</style>
