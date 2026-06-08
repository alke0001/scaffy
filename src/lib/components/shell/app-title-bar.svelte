<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		title,
		actions,
	}: {
		title?: Snippet;
		actions?: Snippet;
	} = $props();
</script>

<header
	class="flex h-8 shrink-0 items-center justify-between border-b border-border bg-muted/30 px-2"
>
	<div>
		{@render title?.()}
	</div>

	<div>
		{@render actions?.()}
	</div>
</header>
