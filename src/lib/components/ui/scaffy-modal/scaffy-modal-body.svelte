<script lang="ts">
	import type { Snippet } from 'svelte';
	import { ScrollArea } from '$lib/components/ui/scroll-area/index.js';

	let {
		scroll = false,
		children,
	}: {
		scroll?: boolean;
		children: Snippet;
	} = $props();
</script>

<div class="scaffy-modal-card__body" class:scaffy-modal-card__body--scroll={scroll}>
	{#if scroll}
		<ScrollArea orientation="vertical" class="scaffy-modal-scroll-area">
			{@render children()}
		</ScrollArea>
	{:else}
		{@render children()}
	{/if}
</div>
