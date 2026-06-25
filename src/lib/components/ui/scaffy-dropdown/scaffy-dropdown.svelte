<script lang="ts" module>
	/** Matches title-bar ghost actions (About button, dropdown trigger). */
	export const toolbarActionButtonClass = 'text-muted-foreground hover:text-foreground';
</script>

<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { cn } from '$lib/utils.js';
	import ChevronDown from '@lucide/svelte/icons/chevron-down';
	import type { Snippet } from 'svelte';

	interface Props {
		label: string;
		open?: boolean;
		menuAriaLabel?: string;
		triggerAriaLabel?: string;
		align?: 'start' | 'end';
		class?: string;
		menu: Snippet<[{ close: () => void }]>;
	}

	let {
		label,
		open = $bindable(false),
		menuAriaLabel,
		triggerAriaLabel,
		align = 'end',
		class: className,
		menu,
	}: Props = $props();

	let containerRef = $state<HTMLDivElement | null>(null);

	const triggerLabel = $derived(triggerAriaLabel ?? menuAriaLabel ?? label);

	function close() {
		open = false;
	}

	function toggle(event: MouseEvent) {
		event.stopPropagation();
		open = !open;
	}

	function handleWindowKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') close();
	}

	function handleDocumentClick(event: MouseEvent) {
		if (!open || !containerRef) return;
		if (!containerRef.contains(event.target as Node)) close();
	}

	$effect(() => {
		if (!open) return;
		document.addEventListener('click', handleDocumentClick, true);
		return () => document.removeEventListener('click', handleDocumentClick, true);
	});
</script>

<svelte:window onkeydown={handleWindowKeydown} />

<div class={cn('relative', className)} bind:this={containerRef}>
	<Button
		type="button"
		variant="ghost"
		size="toolbar-menu"
		class={toolbarActionButtonClass}
		aria-haspopup="listbox"
		aria-expanded={open}
		aria-label={triggerLabel}
		onclick={toggle}
	>
		{label}
		<ChevronDown
			class={cn('size-3.5 transition-transform duration-200', open && 'rotate-180')}
			aria-hidden="true"
		/>
	</Button>

	{#if open}
		<ul
			role="listbox"
			aria-label={menuAriaLabel}
			class={cn(
				'absolute top-full z-50 mt-1 min-w-full overflow-hidden rounded-md border border-border bg-popover py-1 text-popover-foreground shadow-md ring-1 ring-foreground/10',
				align === 'end' ? 'right-0' : 'left-0',
			)}
		>
			{@render menu({ close })}
		</ul>
	{/if}
</div>
