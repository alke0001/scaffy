<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Tooltip from '$lib/components/ui/tooltip/index.js';
	import { cn } from '$lib/utils.js';
	import type { ChipItem } from './types.js';

	let {
		items,
		onSelect,
		class: className,
	}: {
		items: readonly ChipItem[];
		onSelect: (prompt: string) => void;
		class?: string;
	} = $props();
</script>

<Tooltip.Provider>
	<div class={cn('grid grid-cols-1 gap-2 sm:grid-cols-2', className)}>
		{#each items as item (item.prompt)}
			<Tooltip.Root>
				<Tooltip.Trigger>
					{#snippet child({ props })}
						<Button
							type="button"
							variant="ghost"
							{...props}
							class="h-auto w-full justify-start rounded-lg border border-dashed border-border bg-card px-4 py-3 text-left text-sm font-normal whitespace-normal text-foreground shadow-none transition-colors hover:border-primary/50! hover:bg-card! hover:text-primary! active:translate-y-0 dark:hover:bg-card!"
							onclick={() => onSelect(item.prompt)}
						>
							{item.label}
						</Button>
					{/snippet}
				</Tooltip.Trigger>
				<Tooltip.Content side="top" class="max-w-sm text-left leading-relaxed whitespace-normal">
					{item.prompt}
				</Tooltip.Content>
			</Tooltip.Root>
		{/each}
	</div>
</Tooltip.Provider>
