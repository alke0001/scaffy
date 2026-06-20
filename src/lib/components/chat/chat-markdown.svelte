<script lang="ts">
	import { onDestroy } from 'svelte';
	import { renderMarkdown } from '$lib/components/ui/markdown/render-markdown.js';

	const STREAM_RENDER_MIN_MS = 250;

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
	let streamTimer: ReturnType<typeof setTimeout> | undefined;
	let idleCallbackId: number | undefined;
	let lastStreamRenderAt = 0;

	function applyMarkdown() {
		html = renderMarkdown(content);
	}

	function cancelScheduledRender() {
		if (streamTimer) {
			clearTimeout(streamTimer);
			streamTimer = undefined;
		}
		if (idleCallbackId !== undefined && typeof cancelIdleCallback !== 'undefined') {
			cancelIdleCallback(idleCallbackId);
			idleCallbackId = undefined;
		}
	}

	function scheduleStreamingMarkdown() {
		const now = Date.now();
		const elapsed = now - lastStreamRenderAt;

		if (elapsed >= STREAM_RENDER_MIN_MS) {
			lastStreamRenderAt = now;
			runDeferredRender();
			return;
		}

		if (streamTimer || idleCallbackId !== undefined) return;

		streamTimer = setTimeout(() => {
			streamTimer = undefined;
			lastStreamRenderAt = Date.now();
			runDeferredRender();
		}, STREAM_RENDER_MIN_MS - elapsed);
	}

	function runDeferredRender() {
		cancelScheduledRender();
		if (typeof requestIdleCallback !== 'undefined') {
			idleCallbackId = requestIdleCallback(
				() => {
					idleCallbackId = undefined;
					applyMarkdown();
				},
				{ timeout: STREAM_RENDER_MIN_MS },
			);
		} else {
			requestAnimationFrame(applyMarkdown);
		}
	}

	$effect(() => {
		const isStreaming = streaming;

		if (!content) {
			html = '';
			return;
		}

		if (isStreaming) {
			scheduleStreamingMarkdown();
		} else {
			cancelScheduledRender();
			applyMarkdown();
		}
	});

	onDestroy(() => {
		cancelScheduledRender();
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
</style>
