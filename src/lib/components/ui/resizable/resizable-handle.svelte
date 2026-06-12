<script lang="ts">
	import * as ResizablePrimitive from 'paneforge';
	import { cn, type WithoutChildrenOrChild } from '$lib/utils.js';

	let {
		ref = $bindable(null),
		class: className,
		withHandle = false,
		...restProps
	}: WithoutChildrenOrChild<ResizablePrimitive.PaneResizerProps> & {
		withHandle?: boolean;
	} = $props();
</script>

<ResizablePrimitive.PaneResizer
	bind:ref
	data-slot="resizable-handle"
	class={cn(
		'cn-resizable-handle relative flex shrink-0 items-center justify-center bg-transparent focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:outline-hidden data-[direction=vertical]:h-auto data-[direction=vertical]:w-full [&[data-direction=vertical]>div]:rotate-90',
		className,
	)}
	{...restProps}
>
	{#if withHandle}
		<div class="z-10 flex h-6 w-1 shrink-0 rounded-lg bg-border"></div>
	{/if}
</ResizablePrimitive.PaneResizer>
