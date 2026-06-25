<script lang="ts">
	import { cn, type WithElementRef } from '$lib/utils.js';
	import type { HTMLButtonAttributes } from 'svelte/elements';

	type Props = WithElementRef<HTMLButtonAttributes> & {
		selected?: boolean;
	};

	let {
		class: className,
		selected = false,
		children,
		ref = $bindable(null),
		...restProps
	}: Props = $props();
</script>

<li role="presentation">
	<button
		bind:this={ref}
		type="button"
		role="option"
		aria-selected={selected}
		class={cn(
			'w-full px-2.5 py-1.5 text-left text-xs transition-colors hover:bg-muted hover:text-foreground',
			selected && 'bg-muted/50 text-foreground',
			className,
		)}
		{...restProps}
	>
		{@render children?.()}
	</button>
</li>
