<script lang="ts">
	import { cn } from '$lib/utils.js';
	import { renderMarkdown } from './render-markdown.js';

	let {
		content,
		class: className,
	}: {
		content: string;
		class?: string;
	} = $props();

	const html = $derived(renderMarkdown(content));
</script>

<div
	class={cn(
		'markdown-content prose prose-sm max-w-none dark:prose-invert',
		'[&_h3]:mt-8 [&_h3]:mb-3 [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:text-muted-foreground',
		'[&_h3:first-child]:mt-0',
		className,
	)}
>
	<!-- eslint-disable-next-line svelte/no-at-html-tags -- sanitized in renderMarkdown() -->
	{@html html}
</div>
