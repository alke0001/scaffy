<script lang="ts">
	import { getExplanationBody } from '$lib/components/editor/knowledge-check-feedback.js';
	import {
		ScaffyModal,
		ScaffyModalHeader,
		ScaffyModalBody,
		ScaffyModalActions,
		ScaffyModalButton,
	} from '$lib/components/ui/scaffy-modal/index.js';
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
	<ScaffyModal variant="error" ariaLabelledby="feedback-title" onDismiss={onUnderstand}>
		<ScaffyModalHeader icon="!" title="Diese Antwort ist falsch" titleId="feedback-title" />

		<ScaffyModalBody>
			<p class="learning-card-feedback__answer-label">Die richtige Antwort ist:</p>
			<p class="learning-card-feedback__answer-id">Korrekt ist ({correctOption.id}).</p>
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
				<div class="learning-card-feedback__explanation">
					<p class="learning-card-feedback__explanation-label">Erklärung</p>
					<p class="scaffy-modal-card__message">{explanationBody}</p>
				</div>
			{/if}
		</ScaffyModalBody>

		<ScaffyModalActions>
			<ScaffyModalButton variant="primary" onclick={onUnderstand}>Verstanden</ScaffyModalButton>
		</ScaffyModalActions>
	</ScaffyModal>
{/if}
