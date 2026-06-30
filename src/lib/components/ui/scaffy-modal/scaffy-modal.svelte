<script lang="ts">
	import type { Snippet } from 'svelte';
	import { onMount } from 'svelte';
	import { portal } from '$lib/actions/portal.js';

	let {
		variant = 'default',
		size = 'md',
		ariaLabelledby,
		dismissOnEscape = true,
		dismissOnBackdrop = true,
		onDismiss,
		children,
	}: {
		variant?: 'default' | 'error';
		size?: 'md' | 'lg';
		ariaLabelledby: string;
		dismissOnEscape?: boolean;
		dismissOnBackdrop?: boolean;
		onDismiss?: () => void;
		children: Snippet;
	} = $props();

	function handleOverlayClick(event: MouseEvent) {
		if (!dismissOnBackdrop || !onDismiss) return;
		if (event.target === event.currentTarget) onDismiss();
	}

	onMount(() => {
		function handleEscape(event: KeyboardEvent) {
			if (!dismissOnEscape || !onDismiss) return;
			if (event.key === 'Escape') {
				event.preventDefault();
				onDismiss();
			}
		}

		window.addEventListener('keydown', handleEscape);
		return () => window.removeEventListener('keydown', handleEscape);
	});
</script>

<!-- Backdrop dismiss is mouse-only; Escape and dialog action buttons handle keyboard. -->
<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
<div use:portal class="scaffy-modal-overlay" onclick={handleOverlayClick}>
	<div
		class="scaffy-modal-card"
		class:scaffy-modal-card--error={variant === 'error'}
		class:scaffy-modal-card--lg={size === 'lg'}
		role="dialog"
		aria-modal="true"
		aria-labelledby={ariaLabelledby}
		tabindex="-1"
	>
		{@render children()}
	</div>
</div>
