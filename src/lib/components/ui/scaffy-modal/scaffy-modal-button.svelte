<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		variant = 'primary',
		type = 'button',
		onclick,
		children,
	}: {
		variant?: 'secondary' | 'primary' | 'danger';
		type?: 'button' | 'submit';
		onclick?: (event: MouseEvent) => void;
		children: Snippet;
	} = $props();
</script>

<button
	{type}
	class="scaffy-modal-btn"
	class:scaffy-modal-btn--secondary={variant === 'secondary'}
	class:scaffy-modal-btn--primary={variant === 'primary'}
	class:scaffy-modal-btn--danger={variant === 'danger'}
	{onclick}
>
	{@render children()}
</button>
