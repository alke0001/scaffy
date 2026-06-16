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

<div
	use:portal
	class="scaffy-modal-overlay"
	role="dialog"
	aria-modal="true"
	aria-labelledby={ariaLabelledby}
	onclick={handleOverlayClick}
>
	<div
		class="scaffy-modal-card"
		class:scaffy-modal-card--error={variant === 'error'}
		class:scaffy-modal-card--lg={size === 'lg'}
		role="document"
	>
		{@render children()}
	</div>
</div>
