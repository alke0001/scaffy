<script lang="ts">
	import { cn } from '$lib/utils.js';

	let {
		items,
		onSelect,
		class: className,
	}: {
		items: readonly string[];
		onSelect: (text: string) => void;
		class?: string;
	} = $props();
</script>

<div class={cn('grid grid-cols-1 gap-2 sm:grid-cols-2', className)}>
	{#each items as item (item)}
		<button
			type="button"
			class="rounded-lg border border-dashed border-home-border bg-home-card px-4 py-3 text-left text-sm text-foreground transition-colors hover:border-home-accent/50 hover:text-home-accent"
			onclick={() => onSelect(item)}
		>
			{item}
		</button>
	{/each}
</div>
