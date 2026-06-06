<script lang="ts">
	let {
		message = 'Diese Antwort ist falsch',
		onUnderstand,
	}: {
		message?: string;
		onUnderstand: () => void;
	} = $props();
</script>

<div class="learning-overlay" role="dialog" aria-modal="true" aria-label="Lernkarte">
	<div class="learning-card" role="status" aria-live="polite">
		<p class="learning-card-message">{message}</p>
		<button type="button" onclick={onUnderstand}>Verstanden</button>
	</div>
</div>

<style>
	.learning-overlay {
		position: fixed;
		inset: 0;
		z-index: 50;
		display: grid;
		place-items: center;
		background: rgba(15, 23, 42, 0.75);
		backdrop-filter: blur(8px);
	}

	.learning-card {
		width: min(90vw, 420px);
		padding: 1.5rem;
		border-radius: 1rem;
		background: var(--popover);
		color: var(--popover-foreground);
		display: flex;
		flex-direction: column;
		gap: 1rem;
		box-shadow: 0 24px 60px rgba(0, 0, 0, 0.35);
		border: 1px solid rgba(255, 255, 255, 0.08);
	}

	.learning-card-message {
		font-weight: 700;
		font-size: 1rem;
		line-height: 1.5;
	}

	.learning-card button {
		padding: 0.85rem 1.1rem;
		border: none;
		border-radius: 0.75rem;
		background: white;
		color: #111827;
		font-weight: 600;
		cursor: pointer;
	}
</style>
