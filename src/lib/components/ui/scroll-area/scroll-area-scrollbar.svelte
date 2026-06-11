<script lang="ts">
	import { ScrollArea as ScrollAreaPrimitive } from 'bits-ui';
	import { cn, type WithoutChild } from '$lib/utils.js';

	let {
		ref = $bindable(null),
		class: className,
		orientation = 'vertical',
		children,
		...restProps
	}: WithoutChild<ScrollAreaPrimitive.ScrollbarProps> = $props();
</script>

<ScrollAreaPrimitive.Scrollbar
	bind:ref
	data-slot="scroll-area-scrollbar"
	data-orientation={orientation}
	{orientation}
	class={cn(
		'flex touch-none transition-colors select-none data-horizontal:h-full data-horizontal:w-full data-horizontal:flex-col data-vertical:h-full data-vertical:w-full',
		className,
	)}
	{...restProps}
>
	{@render children?.()}
	<ScrollAreaPrimitive.Thumb
		data-slot="scroll-area-thumb"
		class="relative w-full min-w-0 rounded-full bg-muted-foreground/70"
	/>
</ScrollAreaPrimitive.Scrollbar>
