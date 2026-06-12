<script lang="ts">
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
		onAnswer: () => void;
		onUnderstand: () => void;
	} = $props();
</script>

<div class="knowledge-check" aria-labelledby="knowledge-check-question">
	<div class="knowledge-check-header">
		<span class="knowledge-check-pill">◆ knowledge check</span>
		<span class="knowledge-check-meta">
			chunk {chunkIndex} of {chunkTotal} — locked
		</span>
	</div>

	<p id="knowledge-check-question" class="knowledge-check-question">{question.question}</p>

	<div class="knowledge-check-options" role="radiogroup" aria-labelledby="knowledge-check-question">
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
					bind:group={selectedOption}
					onchange={onAnswer}
					disabled={showFeedback}
					class="knowledge-check-input"
				/>
				<span class="knowledge-check-radio" aria-hidden="true"></span>
				<span class="knowledge-check-option-text">({option.id}) {option.text}</span>
			</label>
		{/each}
	</div>
</div>

{#if showFeedback}
	<div class="feedback-overlay" role="dialog" aria-modal="true" aria-labelledby="feedback-title">
		<div class="feedback-card" role="status" aria-live="polite">
			<div class="feedback-card-header">
				<div class="feedback-card-icon" aria-hidden="true">!</div>
				<div class="feedback-card-copy">
					<h2 id="feedback-title" class="feedback-card-title">Diese Antwort ist falsch</h2>
					{#if question.explanation}
						<p class="feedback-card-message">{question.explanation}</p>
					{/if}
				</div>
			</div>
			<div class="feedback-card-actions">
				<button type="button" class="feedback-card-btn" onclick={onUnderstand}>Verstanden</button>
			</div>
		</div>
	</div>
{/if}

<style>
	.knowledge-check {
		padding: 0.75rem;
		border: 2px dashed var(--ring);
		border-radius: 0.5rem;
		background: color-mix(in oklab, var(--ring) 8%, var(--background));
		box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.02);
	}

	.knowledge-check-header {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: 0.375rem;
	}

	.knowledge-check-pill {
		display: inline-flex;
		align-items: center;
		padding: 0.1875rem 0.5625rem;
		border: 1.5px solid color-mix(in oklab, var(--ring) 60%, var(--border));
		border-radius: 999px;
		background: transparent;
		color: var(--ring);
		font-family: ui-monospace, monospace;
		font-size: 0.6875rem;
		line-height: 1.2;
	}

	.knowledge-check-meta {
		font-family: ui-monospace, monospace;
		font-size: 0.6875rem;
		color: var(--muted-foreground);
	}

	.knowledge-check-question {
		margin: 0 0 0.5rem;
		font-size: 0.8125rem;
		line-height: 1.45;
		color: var(--foreground);
	}

	.knowledge-check-options {
		display: grid;
		gap: 0.3125rem;
	}

	.knowledge-check-option {
		display: flex;
		align-items: flex-start;
		gap: 0.5rem;
		padding: 0.3125rem 0.5625rem;
		border: 1px solid color-mix(in oklab, var(--muted-foreground) 45%, var(--background));
		border-radius: 0.375rem;
		font-size: 0.75rem;
		line-height: 1.4;
		color: var(--muted-foreground);
		cursor: pointer;
		transition:
			border-color 0.12s ease,
			background 0.12s ease,
			color 0.12s ease;
	}

	.knowledge-check-option:hover:not(.knowledge-check-option-disabled) {
		border-color: color-mix(in oklab, var(--ring) 45%, var(--border));
		background: color-mix(in oklab, var(--ring) 6%, transparent);
		color: var(--foreground);
	}

	.knowledge-check-option-selected {
		border-color: color-mix(in oklab, var(--ring) 55%, var(--border));
		background: color-mix(in oklab, var(--ring) 10%, transparent);
		color: var(--foreground);
	}

	.knowledge-check-option-disabled {
		cursor: not-allowed;
		opacity: 0.72;
	}

	.knowledge-check-input {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border: 0;
	}

	.knowledge-check-radio {
		width: 0.875rem;
		height: 0.875rem;
		margin-top: 0.125rem;
		flex: none;
		border: 1.5px solid color-mix(in oklab, var(--muted-foreground) 55%, var(--background));
		border-radius: 999px;
		background: transparent;
		transition:
			border-color 0.12s ease,
			background 0.12s ease,
			box-shadow 0.12s ease;
	}

	.knowledge-check-option-selected .knowledge-check-radio {
		border-color: var(--ring);
		background: color-mix(in oklab, var(--ring) 35%, transparent);
		box-shadow: inset 0 0 0 3px var(--background);
	}

	.knowledge-check-option-text {
		flex: 1;
		min-width: 0;
	}

	.feedback-overlay {
		position: fixed;
		inset: 0;
		z-index: 50;
		display: grid;
		place-items: center;
		padding: 1rem;
		background: color-mix(in oklab, var(--background) 62%, transparent);
		backdrop-filter: blur(2px);
	}

	.feedback-card {
		width: min(100%, 26.25rem);
		padding: 1.375rem;
		border-radius: 0.875rem;
		background: var(--card);
		color: var(--card-foreground);
		border: 1.5px solid color-mix(in oklab, var(--destructive) 55%, var(--border));
		box-shadow: 0 24px 70px rgba(0, 0, 0, 0.65);
		display: flex;
		flex-direction: column;
		gap: 0.875rem;
	}

	.feedback-card-header {
		display: flex;
		align-items: flex-start;
		gap: 0.75rem;
	}

	.feedback-card-icon {
		width: 2.375rem;
		height: 2.375rem;
		border-radius: 0.625rem;
		flex: none;
		display: grid;
		place-items: center;
		background: color-mix(in oklab, var(--destructive) 16%, var(--muted));
		border: 1.5px solid color-mix(in oklab, var(--destructive) 55%, var(--border));
		color: var(--destructive);
		font-family: ui-monospace, monospace;
		font-size: 1.1875rem;
		font-weight: 700;
		line-height: 1;
	}

	.feedback-card-copy {
		flex: 1;
		min-width: 0;
	}

	.feedback-card-title {
		margin: 0;
		font-size: 1.375rem;
		font-weight: 600;
		line-height: 1.15;
		color: var(--foreground);
		letter-spacing: -0.01em;
	}

	.feedback-card-message {
		margin: 0.375rem 0 0;
		font-size: 0.8125rem;
		line-height: 1.45;
		color: var(--muted-foreground);
	}

	.feedback-card-actions {
		display: flex;
		justify-content: flex-end;
	}

	.feedback-card-btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: 0.3125rem 0.875rem;
		border-radius: 0.4375rem;
		cursor: pointer;
		font-family: ui-monospace, monospace;
		font-size: 0.6875rem;
		font-weight: 700;
		letter-spacing: 0.02em;
		color: var(--ring);
		background: color-mix(in oklab, var(--ring) 14%, var(--muted));
		border: 1.5px solid color-mix(in oklab, var(--ring) 60%, var(--border));
		box-shadow:
			0 1.5px 0 rgba(0, 0, 0, 0.5),
			inset 0 1px 0 rgba(255, 255, 255, 0.06);
		transition:
			transform 0.06s ease,
			filter 0.12s ease;
	}

	.feedback-card-btn:hover {
		filter: brightness(1.18);
	}

	.feedback-card-btn:active {
		transform: translateY(1.5px);
		box-shadow:
			0 0 0 rgba(0, 0, 0, 0.5),
			inset 0 1px 0 rgba(255, 255, 255, 0.06);
	}

	.feedback-card-btn:focus-visible {
		outline: 2px solid var(--ring);
		outline-offset: 2px;
	}
</style>
