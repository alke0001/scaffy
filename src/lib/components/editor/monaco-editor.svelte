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
	import LearningCard from '$lib/components/editor/learning-card.svelte';

	let editorContainer = $state<HTMLDivElement | null>(null);
	let editor = $state<Monaco.editor.IStandaloneCodeEditor | null>(null);
	let monacoApi = $state<typeof import('monaco-editor') | null>(null);
	let questionOverlay = $state<HTMLDivElement | null>(null);
	let editorReady = $state(false);
	let overlayTop = $state(0);
	let scrollSubscription = $state<Monaco.IDisposable | null>(null);
	let layoutSubscription = $state<Monaco.IDisposable | null>(null);
	let contentSubscription = $state<Monaco.IDisposable | null>(null);

	const activeSession = $derived(getActiveSession());
	const activeStatus = $derived(getSessionStatus());
	const scaffolds = $derived(getScaffolds());
	let currentSessionId = $state<string | null>(null);
	let currentIndex = $state(0);
	let currentQuestion = $state<KnowledgeCheck | null>(null);
	let selectedOption = $state<string | null>(null);
	let showLearningCard = $state(false);

	onMount(async () => {
		if (!editorContainer) return;

		const monaco = await loader.init();
		monacoApi = monaco;
		const createdEditor = monaco.editor.create(editorContainer, {
			value: '',
			language: 'html',
			theme: 'vs-dark',
			automaticLayout: true,
		});
		editor = createdEditor;

		scrollSubscription = createdEditor.onDidScrollChange(() => updateQuestionPosition());
		layoutSubscription = createdEditor.onDidLayoutChange(() => updateQuestionPosition());
		contentSubscription = createdEditor.onDidChangeModelContent(() => updateQuestionPosition());

		editorReady = true;
	});

	onDestroy(() => {
		scrollSubscription?.dispose();
		layoutSubscription?.dispose();
		contentSubscription?.dispose();
	});

	function resetEditorState() {
		currentIndex = 0;
		currentQuestion = null;
		selectedOption = null;
		showLearningCard = false;
		overlayTop = 0;
	}

	function updateQuestionPosition() {
		if (!editor || !editorContainer || !currentQuestion || !monacoApi) return;
		const model = editor.getModel();
		if (!model) return;

		const lastLine = model.getLineCount();
		const lineHeight = editor.getOption(monacoApi.editor.EditorOption.lineHeight);
		const contentTop = editor.getTopForLineNumber(lastLine) + lineHeight - editor.getScrollTop();
		const editorHeight = editor.getLayoutInfo().height;
		const overlayHeight = questionOverlay?.offsetHeight ?? 0;
		const margin = 12;

		let top = Math.max(margin, contentTop);
		if (top + overlayHeight + margin > editorHeight) {
			top = Math.max(margin, editorHeight - overlayHeight - margin);
		}

		overlayTop = top;
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
		updateQuestionPosition();
	}

	function handleOptionChange() {
		if (!currentQuestion || showLearningCard) return;

		if (selectedOption === currentQuestion.correctOptionId) {
			currentQuestion = null;
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
	}

	function acknowledgeError() {
		showLearningCard = false;
		selectedOption = null;
	}
</script>

<div class="editor-wrapper">
	<div bind:this={editorContainer} class="editor"></div>

	{#if currentQuestion}
		<div bind:this={questionOverlay} class="question-overlay" style="top: {overlayTop}px;">
			<LearningCard
				question={currentQuestion}
				chunkIndex={currentIndex}
				chunkTotal={scaffolds.length}
				bind:selectedOption
				showFeedback={showLearningCard}
				onAnswer={handleOptionChange}
				onUnderstand={acknowledgeError}
			/>
		</div>
	{/if}
</div>

{#if !currentQuestion && scaffolds.length > 0 && currentIndex < scaffolds.length}
	<button type="button" onclick={loadNextScaffold}>Weiter</button>
{/if}

<style>
	.editor-wrapper {
		position: relative;
	}

	.editor {
		height: 70vh;
		width: 100%;
		border-radius: 12px;
		overflow: hidden;
	}

	.question-overlay {
		position: absolute;
		left: 1.625rem;
		right: 1.75rem;
		z-index: 10;
		pointer-events: auto;
	}

	button {
		padding: 0.75rem 1rem;
		border: none;
		border-radius: 8px;
		background: var(--primary);
		color: var(--primary-foreground);
		cursor: pointer;
		font-weight: 600;
	}

	button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
</style>
