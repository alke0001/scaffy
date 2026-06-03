<script lang="ts">
	import { onMount } from 'svelte';
	import loader from '@monaco-editor/loader';
	import type * as Monaco from 'monaco-editor';
	import { getScaffolds } from '$lib/session.svelte';
	import type { Scaffold } from '$lib/types/scaffold';
	import LearningCard from '$lib/components/editor/learning-card.svelte';

	type Question = {
		question: string;
		options: {
			id: string;
			text: string;
		}[];
		correctOptionId: string;
		explanation: string;
	};

	let editorContainer: HTMLDivElement;
	let editor: Monaco.editor.IStandaloneCodeEditor;

	let scaffolds: Scaffold[] = $derived(getScaffolds());

	let currentIndex = $state(0);

	let currentQuestion: Question | null = $state(null);
	let selectedOption: string | null = $state(null);
	let showLearningCard = $state(false);

	onMount(async () => {
		const monaco = await loader.init();

		editor = monaco.editor.create(editorContainer, {
			value: '',
			language: 'html',
			theme: 'vs-dark',
			automaticLayout: true
		});
	});

	$effect(() => {
		if (scaffolds.length > 0 && currentIndex === 0 && currentQuestion === null) {
			loadNextScaffold();
		}
	});

	$effect(() => {
		if (scaffolds.length === 0 && editor) {
			editor.setValue('');
			currentQuestion = null;
		}
	});

	function loadNextScaffold() {
		const scaffold = scaffolds[currentIndex];

		if (!scaffold) return;
		if (scaffold.codeSnippet.trim().length == 0) {
			scaffold.codeSnippet = '//Bitte Frage beantworten';
		}
		editor.setValue(scaffold.codeSnippet);

		selectedOption = null;
		showLearningCard = false;
		currentQuestion = scaffold.knowledgeCheck;

		currentIndex++;
	}

	function handleOptionChange() {
		if (!currentQuestion || showLearningCard) return;

		if (selectedOption === currentQuestion.correctOptionId) {
			currentQuestion = null;
			loadNextScaffold();
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
			<LearningCard message="Diese Antwort ist falsch" onUnderstand={acknowledgeError} />
		{/if}
	</div>
{:else if scaffolds.length > 0 && currentIndex < scaffolds.length}
	<button onclick={loadNextScaffold}>Weiter</button>
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