<script lang="ts">
	import type { Snippet } from 'svelte';

	let { actions }: { actions?: Snippet } = $props();
</script>

<header
	class="flex h-8 shrink-0 items-center justify-end border-b border-border bg-muted/30 px-1"
	aria-label="Application toolbar"
>
	{@render actions?.()}
</header>
