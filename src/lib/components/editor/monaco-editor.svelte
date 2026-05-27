<script lang="ts">
	import { onMount } from 'svelte';
	import loader from '@monaco-editor/loader';
	import scaffoldsData from '$lib/mocks/scaffolds-profile-card.json';

	import type * as Monaco from 'monaco-editor';

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

	const scaffolds = scaffoldsData.scaffolds;

	let currentIndex = $state(0);

	let currentQuestion: Question | null = $state(null);

	let answered = $state(true);

	onMount(async () => {
		const monaco = await loader.init();

		editor = monaco.editor.create(editorContainer, {
			value: '',
			language: 'html',
			theme: 'vs-dark',
			automaticLayout: true
		});
	});

	function loadNextScaffold() {
		const scaffold = scaffolds[currentIndex];

		if ( !scaffold ) return;//Todo was tun wenn scaffolds abgearbeitet
		if ( scaffold.codeSnippet.trim().length == 0 )
		{
			scaffold.codeSnippet = '//Bitte Frage beantworten';
		}
		editor.setValue(scaffold.codeSnippet);

		currentQuestion = scaffold.knowledgeCheck;

		answered = false;

		currentIndex++;
	}

	function answerQuestion() {
		currentQuestion = null;

		answered = true;
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
					on:change={answerQuestion}
				/>

				<span>
					{option.id}) {option.text}
				</span>
			</label>
		{/each}
	</div>
{/if}
<br>
<button
	on:click={loadNextScaffold}
	disabled={!answered}
>
	Nächstes Scaffold laden
</button>
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