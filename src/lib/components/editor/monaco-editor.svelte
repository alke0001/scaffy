<script lang="ts">
	import { onDestroy, onMount, tick } from 'svelte';
	import loader from '@monaco-editor/loader';
	import type * as Monaco from 'monaco-editor';
	import {
		getActiveSession,
		getSessionById,
		markSessionCompleted,
	} from '$lib/global-state/session.svelte.js';
	import {
		isFallbackScaffoldAvailable,
		loadFallbackScaffolds,
		retryScaffold,
	} from '$lib/scaffold/request-scaffold.js';
	import { type KnowledgeCheck } from '$lib/types/scaffold.js';
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
	} from '$lib/components/editor/scaffold-loading-content.js';
	import {
		buildErrorContent,
		buildLessonReadyWaitContent,
	} from '$lib/components/editor/scaffold-loading-content.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { KnowledgeViewZoneController } from '$lib/components/editor/monaco-knowledge-view-zone.js';
	import { KnowledgeZoneBridge } from '$lib/components/editor/knowledge-zone-bridge.svelte.js';
	import ReadOnlyHint from '$lib/components/editor/read-only-hint.svelte';
	import { cn } from '$lib/utils.js';
	import { devLog } from '$lib/dev/logging.js';
	import { messages } from '$lib/i18n/index.js';
	import './monaco-editor.css';
	import { t } from '$lib/i18n';

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
	const storeSessionId = $derived(boundSession?.id ?? null);
	const activeStatus = $derived(boundSession?.status ?? 'idle');
	const sessionError = $derived(boundSession?.errorMessage ?? null);
	const scaffolds = $derived(boundSession?.scaffolds ?? []);
	const sessionCompleted = $derived(boundSession?.completed ?? false);
	const lessonStarted = $derived(boundSession?.lessonStarted ?? false);
	const fallbackAvailable = $derived(isFallbackScaffoldAvailable());
	const isEditorEditable = $derived(
		Boolean(boundSession?.completed && activeStatus !== 'loading' && activeStatus !== 'idle'),
	);
	let currentSessionId = $state<string | null>(null);
	let currentIndex = $state(0);
	let currentQuestion = $state<KnowledgeCheck | null>(null);
	let selectedOption = $state<string | null>(null);
	let showLearningCard = $state(false);
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

	function showLessonReadyWait() {
		if (!editor || !monacoApi) return;
		loadingAnimator.exitLoadingMode();
		clearErrorDecorations();
		resetEditorState();
		ensureCodeLanguage();
		editor.setValue(buildLessonReadyWaitContent());
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

		const sessionIdForLog = storeSessionId ?? sessionId ?? null;

		if (!storeSessionId || activeStatus === 'idle') {
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
			const sessionChanged = currentSessionId !== storeSessionId;
			if (sessionChanged || !loadingAnimator.isInLoadingMode()) {
				devLog('monaco', 'effect → loading', {
					sessionId: sessionIdForLog,
					sessionChanged,
				});
				loadingAnimator.enterLoadingMode();
			}
			if (sessionChanged) {
				clearErrorDecorations();
				lastErrorMessage = null;
				resetEditorState();
				currentSessionId = storeSessionId;
			}
			return;
		}

		if (activeStatus === 'error') {
			devLog('monaco', 'effect → error', { sessionId: sessionIdForLog, sessionError });
			loadingAnimator.exitLoadingMode();
			const message = sessionError ?? 'Request failed.';
			if (lastErrorMessage !== message || currentSessionId !== storeSessionId) {
				showErrorInEditor(message);
				lastErrorMessage = message;
			}
			currentSessionId = storeSessionId;
			return;
		}

		devLog('monaco', 'effect → ready', {
			sessionId: sessionIdForLog,
			scaffoldCount: scaffolds.length,
			completed: sessionCompleted,
		});

		lastErrorMessage = null;

		loadingAnimator.exitLoadingMode();
		clearErrorDecorations();

		if (sessionCompleted) {
			const lastCode = scaffolds.at(-1)?.codeSnippet ?? '';
			ensureCodeLanguage();
			editor.setValue(lastCode);
			currentIndex = scaffolds.length;
			currentQuestion = null;
			selectedOption = null;
			showLearningCard = false;
			zoneBridge.reset();
			viewZoneController.refresh();
			currentSessionId = storeSessionId;
			return;
		}

		if (!lessonStarted && scaffolds.length > 0) {
			const sessionSwitched = storeSessionId !== currentSessionId;
			if (sessionSwitched) {
				currentSessionId = storeSessionId;
			}
			showLessonReadyWait();
			currentSessionId = storeSessionId;
			return;
		}

		const sessionSwitched = storeSessionId !== currentSessionId;
		if (sessionSwitched) {
			currentSessionId = storeSessionId;
			resetEditorState();
		}

		if (sessionSwitched || currentQuestion === null) {
			if (scaffolds.length > 0) {
				loadNextScaffold();
			}
		}
	});

	$effect(() => {
		if (!editorReady || activeStatus !== 'loading') return;

		const typewriter = new LoadingTypewriter();
		let frameIndex = 0;
		let lastFrameAt = 0;
		let rafId = 0;

		const tick = (now: number) => {
			typewriter.advance(now);

			if (!lastFrameAt || now - lastFrameAt >= SPINNER_FRAME_MS) {
				frameIndex = (frameIndex + 1) % SPINNER_FRAMES.length;
				lastFrameAt = now;
			}

			loadingAnimator.renderLoadingDisplay(
				SPINNER_FRAMES[frameIndex] ?? SPINNER_FRAMES[0],
				typewriter.getTypedText(),
			);
			rafId = requestAnimationFrame(tick);
		};

		rafId = requestAnimationFrame(tick);

		return () => {
			cancelAnimationFrame(rafId);
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
				? t('scaffold.emptyCodeSnippet')
				: scaffold.codeSnippet;
		console.log('[code] loading scaffold', { index: currentIndex, code });
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

			if (currentIndex >= scaffolds.length) {
				markSessionCompleted(boundSession?.id);
				return;
			}

			loadNextScaffold();
			if (currentIndex >= scaffolds.length && !currentQuestion) {
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
	</div>

	{#if activeStatus === 'error'}
		<div class="scaffy-editor-actions flex shrink-0 flex-wrap gap-2 px-1 py-2">
			<Button type="button" size="sm" onclick={handleRetryScaffold}
				>{$messages['editor.retry']}</Button
			>
			<Button
				type="button"
				size="sm"
				variant="outline"
				disabled={!fallbackAvailable}
				onclick={handleLoadFallback}
			>
				{$messages['editor.loadFallback']}
			</Button>
		</div>
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
</style>
