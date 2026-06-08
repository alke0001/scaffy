<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
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
		<Button
			type="button"
			variant="ghost"
			class="h-auto w-full justify-start whitespace-normal rounded-lg border border-dashed border-home-border bg-home-card px-4 py-3 text-left text-sm font-normal text-foreground shadow-none transition-colors hover:!border-home-accent/50 hover:!bg-home-card hover:!text-home-accent dark:hover:!bg-home-card active:translate-y-0"
			onclick={() => onSelect(item)}
		>
			{item}
		</Button>
	{/each}
</div>
