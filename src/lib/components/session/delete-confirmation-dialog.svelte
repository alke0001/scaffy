<script lang="ts">
	import { portal } from '$lib/actions/portal.js';

	let {
		onConfirm,
		onCancel,
	}: {
		onConfirm: () => void;
		onCancel: () => void;
	} = $props();
</script>

<div
	use:portal
	class="delete-confirmation-overlay"
	role="dialog"
	aria-modal="true"
	aria-labelledby="delete-title"
>
	<div class="delete-confirmation-card" role="status" aria-live="polite">
		<div class="delete-confirmation-card__header">
			<div class="delete-confirmation-card__icon" aria-hidden="true">⚠</div>
			<h2 id="delete-title" class="delete-confirmation-card__title">Session wirklich löschen?</h2>
		</div>

		<div class="delete-confirmation-card__body">
			<p class="delete-confirmation-card__message">
				Diese Aktion kann nicht rückgängig gemacht werden. Alle gespeicherten Scaffolds dieser
				Session gehen verloren.
			</p>
		</div>

		<div class="delete-confirmation-card__actions">
			<button
				type="button"
				class="delete-confirmation-card__btn delete-confirmation-card__btn--secondary"
				onclick={onCancel}
			>
				Abbrechen
			</button>
			<button
				type="button"
				class="delete-confirmation-card__btn delete-confirmation-card__btn--danger"
				onclick={onConfirm}
			>
				Löschen
			</button>
		</div>
	</div>
</div>

<style>
	.delete-confirmation-overlay {
		position: fixed;
		inset: 0;
		z-index: var(--scaffy-z-delete-confirm, 110);
		display: grid;
		place-items: center;
		padding: 1rem;
		background: color-mix(in oklab, var(--background) 62%, transparent);
		backdrop-filter: blur(2px);
		pointer-events: auto;
	}

	.delete-confirmation-card {
		width: min(100%, 28rem);
		padding: 1.375rem;
		border-radius: 0.875rem;
		background: var(--card);
		color: var(--card-foreground);
		border: 1.5px solid color-mix(in oklab, var(--destructive) 55%, var(--border));
		box-shadow: 0 24px 70px rgba(0, 0, 0, 0.65);
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.delete-confirmation-card__header {
		display: flex;
		align-items: flex-start;
		gap: 0.75rem;
	}

	.delete-confirmation-card__icon {
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
		font-size: 1.375rem;
		font-weight: 700;
		line-height: 1;
	}

	.delete-confirmation-card__title {
		margin: 0;
		font-size: 1.375rem;
		font-weight: 600;
		line-height: 1.15;
		color: var(--foreground);
		letter-spacing: -0.01em;
	}

	.delete-confirmation-card__body {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.delete-confirmation-card__message {
		margin: 0;
		font-size: 0.8125rem;
		line-height: 1.55;
		color: var(--foreground);
	}

	.delete-confirmation-card__actions {
		display: flex;
		justify-content: flex-end;
		gap: 0.5rem;
	}

	.delete-confirmation-card__btn {
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
		border: 1.5px solid;
		box-shadow:
			0 1.5px 0 rgba(0, 0, 0, 0.5),
			inset 0 1px 0 rgba(255, 255, 255, 0.06);
		transition:
			transform 0.06s ease,
			filter 0.12s ease;
	}

	.delete-confirmation-card__btn--secondary {
		color: var(--ring);
		background: color-mix(in oklab, var(--ring) 14%, var(--muted));
		border-color: color-mix(in oklab, var(--ring) 60%, var(--border));
	}

	.delete-confirmation-card__btn--secondary:hover {
		filter: brightness(1.18);
	}

	.delete-confirmation-card__btn--secondary:active {
		transform: translateY(1.5px);
		box-shadow:
			0 0 0 rgba(0, 0, 0, 0.5),
			inset 0 1px 0 rgba(255, 255, 255, 0.06);
	}

	.delete-confirmation-card__btn--danger {
		color: var(--destructive-foreground);
		background: color-mix(in oklab, var(--destructive) 45%, var(--muted));
		border-color: color-mix(in oklab, var(--destructive) 65%, var(--border));
	}

	.delete-confirmation-card__btn--danger:hover {
		filter: brightness(1.18);
	}

	.delete-confirmation-card__btn--danger:active {
		transform: translateY(1.5px);
		box-shadow:
			0 0 0 rgba(0, 0, 0, 0.5),
			inset 0 1px 0 rgba(255, 255, 255, 0.06);
	}

	.delete-confirmation-card__btn:focus-visible {
		outline: 2px solid var(--ring);
		outline-offset: 2px;
	}
</style>
