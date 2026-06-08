<script lang="ts">
	import { onMount } from 'svelte';
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
let editorReady = $state(false);

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
	editor = monaco.editor.create(editorContainer, {
		value: '',
		language: 'html',
		theme: 'vs-dark',
		automaticLayout: true,
	});
	editorReady = true;
});

function resetEditorState() {
	currentIndex = 0;
	currentQuestion = null;
	selectedOption = null;
	showLearningCard = false;
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

	function loadNextScaffold() {
		if (!editor) return;

		const scaffold = scaffolds[currentIndex];
		if (!scaffold) return;

		const code = scaffold.codeSnippet.trim().length === 0 ? '// Bitte Frage beantworten' : scaffold.codeSnippet;

		editor.setValue(code);
		selectedOption = null;
		showLearningCard = false;
		currentQuestion = scaffold.knowledgeCheck;
		currentIndex++;
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

<div bind:this={editorContainer} class="editor"></div>
{#if currentQuestion}
	<div class="question-box">
		<h2>{currentQuestion.question}</h2>

		{#each currentQuestion.options as option (option.id)}
			<label class="option">
				<input
					type="radio"
					name="quiz"
					value={option.id}
					bind:group={selectedOption}
					onchange={handleOptionChange}
					disabled={showLearningCard}
				/>
				({option.id}) {option.text}
			</label>
		{/each}

		{#if showLearningCard}
			<LearningCard message={currentQuestion.explanation} onUnderstand={acknowledgeError} />
		{/if}
	</div>
{:else if scaffolds.length > 0 && currentIndex < scaffolds.length}
	<button type="button" onclick={loadNextScaffold}>Weiter</button>
{/if}

<style>
	.editor {
		height: 70vh;
		width: 100%;
		border-radius: 12px;
		overflow: hidden;
	}

	button {
		padding: 0.75rem 1rem;
		border: none;
		border-radius: 8px;
		background: #4f46e5;
		color: white;
		cursor: pointer;
	}

	.question-box {
		margin-top: 1rem;
		padding: 1rem;
		border-radius: 12px;
		background: #1e1e1e;
		color: white;
	}

	.option {
		display: flex;
		gap: 0.5rem;
		margin-top: 0.75rem;
		cursor: pointer;
	}

	button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
</style>
