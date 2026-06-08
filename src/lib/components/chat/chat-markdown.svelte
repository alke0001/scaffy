<script lang="ts">
	import { onDestroy } from 'svelte';
	import { renderMarkdown } from '$lib/components/chat/render-markdown.js';

	let {
		content,
		streaming = false,
		showCursor = false,
	}: {
		content: string;
		streaming?: boolean;
		showCursor?: boolean;
	} = $props();

	let html = $state('');
	let rafId = 0;

	function applyMarkdown() {
		html = renderMarkdown(content);
	}

	function scheduleMarkdown() {
		cancelAnimationFrame(rafId);
		rafId = requestAnimationFrame(applyMarkdown);
	}

	$effect(() => {
		const isStreaming = streaming;

		if (!content) {
			html = '';
			return;
		}

		if (isStreaming) {
			scheduleMarkdown();
		} else {
			cancelAnimationFrame(rafId);
			applyMarkdown();
		}
	});

	onDestroy(() => {
		cancelAnimationFrame(rafId);
	});
</script>

<div class="chat-markdown prose prose-sm max-w-none text-sm dark:prose-invert">
	<!-- eslint-disable-next-line svelte/no-at-html-tags -- sanitized in renderMarkdown() -->
	{@html html}{#if showCursor}<span
			class="not-prose ml-0.5 inline-block animate-pulse"
			aria-hidden="true">▌</span
		>{/if}
</div>

<style>
	/* Tighten prose inside narrow chat bubbles */
	.chat-markdown :global(p:first-child) {
		margin-top: 0;
	}
	.chat-markdown :global(p:last-child) {
		margin-bottom: 0;
	}
	.chat-markdown :global(pre) {
		overflow-x: auto;
	}
</style>
