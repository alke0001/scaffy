<script lang="ts">
	import ChatMarkdown from '$lib/components/chat/chat-markdown.svelte';
	import { loadingLabel, roleLabel, type ChatMode } from '$lib/chat/message-actions.js';
	import type { ChatMessage } from '$lib/types/chat-message.js';
	import LoaderCircle from '@lucide/svelte/icons/loader-circle';

	let {
		message,
		mode = 'ask'
	}: {
		message: ChatMessage;
		mode?: ChatMode;
	} = $props();

	const isUser = $derived(message.role === 'user');
	const showSpinner = $derived(message.status === 'loading' || message.status === 'pending');
	const showCursor = $derived(message.status === 'streaming');
	const isError = $derived(message.status === 'error');
	const useAskMarkdown = $derived(
		mode === 'ask' && !isUser && !isError && !showSpinner && Boolean(message.content)
	);
</script>

<div
	class="flex w-full {isUser ? 'justify-end' : 'justify-start'}"
	role="listitem"
	aria-label="{roleLabel(message.role)} message"
>
	<div
		class="max-w-[92%] rounded-lg px-3 py-2 text-sm {isUser
			? 'bg-primary text-primary-foreground'
			: isError
				? 'border border-destructive/40 bg-destructive/10 text-destructive'
				: 'border border-border bg-muted/40 text-foreground'}"
	>
		{#if !isUser && showSpinner}
			<div class="flex items-center gap-2 text-muted-foreground">
				<LoaderCircle class="size-4 shrink-0 animate-spin" aria-hidden="true" />
				<span>{loadingLabel(mode)}</span>
			</div>
		{:else if isError}
			<p class="font-medium">Something went wrong</p>
			{#if message.errorMessage}
				<p class="mt-1 whitespace-pre-wrap">{message.errorMessage}</p>
			{/if}
			{#if message.content}
				<p class="mt-2 whitespace-pre-wrap opacity-80">{message.content}</p>
			{/if}
		{:else if useAskMarkdown}
			<ChatMarkdown content={message.content} streaming={showCursor} {showCursor} />
		{:else if message.content}
			<p class="whitespace-pre-wrap">
				{message.content}{#if showCursor}<span
						class="ml-0.5 inline-block animate-pulse"
						aria-hidden="true">▌</span
					>{/if}
			</p>
		{:else if message.status === 'pending'}
			<p class="text-muted-foreground italic">Sending…</p>
		{/if}
	</div>
</div>
