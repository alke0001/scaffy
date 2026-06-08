<script lang="ts">
	import ChatMessageView from '$lib/components/chat/chat-message.svelte';
	import type { ChatMode } from '$lib/chat/message-actions.js';
	import type { ChatMessage } from '$lib/types/chat-message.js';

	let {
		messages,
		mode = 'ask',
	}: {
		messages: ChatMessage[];
		mode?: ChatMode;
	} = $props();

	let listEl = $state<HTMLDivElement | null>(null);
	let scrollRaf = 0;

	function scrollToBottom() {
		if (!listEl) return;
		listEl.scrollTop = listEl.scrollHeight;
	}

	function scheduleScroll() {
		cancelAnimationFrame(scrollRaf);
		scrollRaf = requestAnimationFrame(scrollToBottom);
	}

	$effect(() => {
		void messages.length;
		scheduleScroll();
	});
</script>

<div
	bind:this={listEl}
	class="min-h-0 flex-1 overflow-y-auto px-1 py-2"
	role="log"
	aria-live="polite"
	aria-relevant="additions text"
>
	<div class="flex flex-col gap-3" role="list">
		{#each messages as message (message.id)}
			<ChatMessageView {message} {mode} />
		{:else}
			<p class="px-2 py-8 text-center text-sm text-muted-foreground">
				{mode === 'learn'
					? 'Describe what you want to build. Scaffy will generate a step-by-step lesson.'
					: 'Ask a question about code or concepts.'}
			</p>
		{/each}
	</div>
</div>
