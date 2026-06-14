<script lang="ts">
	import { onDestroy, onMount, tick } from 'svelte';
	import loader from '@monaco-editor/loader';
	import type * as Monaco from 'monaco-editor';
	import {
		getActiveSession,
		getScaffolds,
		getSessionStatus,
		markSessionCompleted,
	} from '$lib/session.svelte.js';
	import type { KnowledgeCheck } from '$lib/types/scaffold.js';
	import { KnowledgeViewZoneController } from '$lib/components/editor/monaco-knowledge-view-zone.js';
	import { KnowledgeZoneBridge } from '$lib/components/editor/knowledge-zone-bridge.svelte.js';
	import ReadOnlyHint from '$lib/components/editor/read-only-hint.svelte';
	import { cn } from '$lib/utils.js';
	import './monaco-editor.css';

	let {
		class: className,
	}: {
		class?: string;
	} = $props();

	let editorContainer = $state<HTMLDivElement | null>(null);
	let editor = $state<Monaco.editor.IStandaloneCodeEditor | null>(null);
	let editorReady = $state(false);
	let readOnlyHint = $state<{ x: number; y: number; placement: 'above' | 'below' } | null>(null);

	let readOnlyHintTimer: ReturnType<typeof setTimeout> | undefined;
	let dismissReadOnlyHintListener: ((event: PointerEvent) => void) | undefined;

	const zoneBridge = new KnowledgeZoneBridge();
	const viewZoneController = new KnowledgeViewZoneController(zoneBridge);

	const activeSession = $derived(getActiveSession());
	const activeStatus = $derived(getSessionStatus());
	const scaffolds = $derived(getScaffolds());
	const isEditorEditable = $derived(
		Boolean(activeSession?.completed && activeStatus !== 'loading' && activeStatus !== 'idle'),
	);
	let currentSessionId = $state<string | null>(null);
	let currentIndex = $state(0);
	let currentQuestion = $state<KnowledgeCheck | null>(null);
	let selectedOption = $state<string | null>(null);
	let showLearningCard = $state(false);

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
				language: 'html',
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

			createdEditor.getContribution('editor.contrib.readOnlyMessageController')?.dispose?.();

			readOnlyEditDisposable = createdEditor.onDidAttemptReadOnlyEdit(() => {
				showReadOnlyHint(createdEditor);
			});

			viewZoneController.attach(createdEditor);
			editorReady = true;
		})();

		return () => {
			readOnlyEditDisposable?.dispose();
		};
	});

	onDestroy(() => {
		hideReadOnlyHint();
		viewZoneController.dispose();
		editor?.dispose();
	});

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

		if (!activeSession || activeStatus === 'idle') {
			editor.setValue('');
			resetEditorState();
			currentSessionId = null;
			return;
		}

		if (activeStatus === 'loading') {
			editor.setValue('// Erzeuge Session…');
			resetEditorState();
			currentSessionId = activeSession.id;
			return;
		}

		if (activeSession.completed) {
			const lastCode = scaffolds.at(-1)?.codeSnippet ?? '';
			editor.setValue(lastCode);
			currentIndex = scaffolds.length;
			currentQuestion = null;
			selectedOption = null;
			showLearningCard = false;
			zoneBridge.reset();
			viewZoneController.refresh();
			currentSessionId = activeSession.id;
			return;
		}

		const sessionSwitched = activeSession.id !== currentSessionId;
		if (sessionSwitched) {
			currentSessionId = activeSession.id;
			resetEditorState();
		}

		if (sessionSwitched || currentQuestion === null) {
			if (scaffolds.length > 0) {
				loadNextScaffold();
			}
		}
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
				markSessionCompleted();
				return;
			}

			loadNextScaffold();
			if (currentIndex >= scaffolds.length && !currentQuestion) {
				markSessionCompleted();
			}
			return;
		}

		showLearningCard = true;
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
