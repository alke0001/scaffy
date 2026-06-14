<script lang="ts">
	import { portal } from '$lib/actions/portal.js';
	import { getExplanationBody } from '$lib/components/editor/knowledge-check-feedback.js';
	import type { KnowledgeCheck } from '$lib/types/scaffold.js';

	let {
		question,
		chunkIndex,
		chunkTotal,
		selectedOption = $bindable<string | null>(null),
		showFeedback = false,
		onAnswer,
		onUnderstand,
	}: {
		question: KnowledgeCheck;
		chunkIndex: number;
		chunkTotal: number;
		selectedOption?: string | null;
		showFeedback?: boolean;
		onAnswer: (optionId: string) => void;
		onUnderstand: () => void;
	} = $props();

	const correctOption = $derived(
		question.options.find((option) => option.id === question.correctOptionId),
	);
	const explanationBody = $derived(getExplanationBody(question.explanation));
</script>

<div
	class="knowledge-check"
	aria-labelledby="learning-card-question"
	oncopy={(event) => event.preventDefault()}
>
	<div class="knowledge-check-header">
		<span class="knowledge-check-pill">◆ Learning Card</span>
		<span class="knowledge-check-meta">
			chunk {chunkIndex} of {chunkTotal} — locked
		</span>
	</div>

	<p id="learning-card-question" class="knowledge-check-question">{question.question}</p>

	<div class="knowledge-check-options" role="radiogroup" aria-labelledby="learning-card-question">
		{#each question.options as option (option.id)}
			<label
				class="knowledge-check-option"
				class:knowledge-check-option-selected={selectedOption === option.id}
				class:knowledge-check-option-disabled={showFeedback}
			>
				<input
					type="radio"
					name="knowledge-check"
					value={option.id}
					checked={selectedOption === option.id}
					onchange={() => onAnswer(option.id)}
					disabled={showFeedback}
					class="knowledge-check-input"
				/>
				<span class="knowledge-check-radio" aria-hidden="true"></span>
				<span class="knowledge-check-option-text">({option.id}) {option.text}</span>
			</label>
		{/each}
	</div>
</div>

{#if showFeedback && correctOption}
	<div
		use:portal
		class="scaffy-knowledge-feedback-overlay"
		role="dialog"
		aria-modal="true"
		aria-labelledby="feedback-title"
	>
		<div class="scaffy-knowledge-feedback-card" role="status" aria-live="polite">
			<div class="scaffy-knowledge-feedback-card__header">
				<div class="scaffy-knowledge-feedback-card__icon" aria-hidden="true">!</div>
				<h2 id="feedback-title" class="scaffy-knowledge-feedback-card__title">
					Diese Antwort ist falsch
				</h2>
			</div>

			<div class="scaffy-knowledge-feedback-card__body">
				<p class="scaffy-knowledge-feedback-card__answer-label">Die richtige Antwort ist:</p>
				<p class="scaffy-knowledge-feedback-card__answer-id">
					Korrekt ist ({correctOption.id}).
				</p>
				<div
					class="knowledge-check-option knowledge-check-option-correct"
					role="group"
					aria-label="Korrekte Antwort ({correctOption.id})"
				>
					<span class="knowledge-check-radio" aria-hidden="true"></span>
					<span class="knowledge-check-option-text">
						({correctOption.id}) {correctOption.text}
					</span>
				</div>

				{#if explanationBody}
					<div class="scaffy-knowledge-feedback-card__explanation">
						<p class="scaffy-knowledge-feedback-card__explanation-label">Erklärung</p>
						<p class="scaffy-knowledge-feedback-card__message">{explanationBody}</p>
					</div>
				{/if}
			</div>

			<div class="scaffy-knowledge-feedback-card__actions">
				<button type="button" class="scaffy-knowledge-feedback-card__btn" onclick={onUnderstand}>
					Verstanden
				</button>
			</div>
		</div>
	</div>
{/if}
