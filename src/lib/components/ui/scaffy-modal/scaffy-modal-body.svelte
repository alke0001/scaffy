<script lang="ts">
	import type { Snippet } from 'svelte';
	import { ScrollArea } from '$lib/components/ui/scroll-area/index.js';

	let {
		scroll = false,
		scrollType = 'always',
		scrollHideDelay = 0,
		children,
	}: {
		scroll?: boolean;
		/** Scrollbar visibility — `always` for tall modal bodies (About). */
		scrollType?: 'hover' | 'always' | 'scroll' | 'auto';
		scrollHideDelay?: number;
		children: Snippet;
	} = $props();
</script>

<div class="scaffy-modal-card__body" class:scaffy-modal-card__body--scroll={scroll}>
	{#if scroll}
		<ScrollArea
			orientation="vertical"
			type={scrollType}
			{scrollHideDelay}
			class="scaffy-modal-scroll-area"
		>
			{@render children()}
		</ScrollArea>
	{:else}
		{@render children()}
	{/if}
</div>
