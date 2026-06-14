<script lang="ts">
	import ChatMessageView from '$lib/components/chat/chat-message.svelte';
	import type { ChatMode } from '$lib/chat/message-actions.js';
	import type { ChatMessage } from '$lib/types/chat-message.js';

	let {
		messages,
		mode = 'ask',
		showEmptyState = true,
	}: {
		messages: ChatMessage[];
		mode?: ChatMode;
		showEmptyState?: boolean;
	} = $props();
</script>

<div
	class="flex flex-col gap-4 px-1 py-2"
	role="log"
	aria-live="polite"
	aria-relevant="additions text"
>
	<div class="flex flex-col gap-4" role="list">
		{#each messages as message (message.id)}
			<ChatMessageView {message} {mode} />
		{:else}
			{#if showEmptyState}
				<p class="px-2 py-8 text-center text-sm text-muted-foreground">
					{mode === 'learn'
						? 'Describe what you want to build. Scaffy will generate a step-by-step lesson.'
						: 'Ask a question about code or concepts.'}
				</p>
			{/if}
		{/each}
	</div>
</div>
