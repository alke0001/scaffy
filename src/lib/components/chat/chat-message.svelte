<script lang="ts">
	import ChatMarkdown from '$lib/components/chat/chat-markdown.svelte';
	import { loadingLabel, roleLabel, type ChatMode } from '$lib/chat/message-actions.js';
	import type { ChatMessage } from '$lib/types/chat-message.js';
	import LoaderCircle from '@lucide/svelte/icons/loader-circle';
	import './ask-chat.css';
	import { messages } from '$lib/i18n/index.js';

	let {
		message,
		mode = 'ask',
	}: {
		message: ChatMessage;
		mode?: ChatMode;
	} = $props();

	const isUser = $derived(message.role === 'user');
	const isAsk = $derived(mode === 'ask');
	const showSpinner = $derived(message.status === 'loading' || message.status === 'pending');
	const showCursor = $derived(message.status === 'streaming');
	const isError = $derived(message.status === 'error');
	const useAskMarkdown = $derived(
		isAsk &&
			!isUser &&
			!isError &&
			!showSpinner &&
			Boolean(message.content) &&
			message.status === 'complete',
	);
</script>

<div
	class="flex w-full {isUser ? 'justify-end' : 'justify-start'}"
	role="listitem"
	aria-label="{roleLabel(message.role, mode)} message"
>
	{#if isAsk}
		<div
			class="max-w-[92%] px-3.5 py-2.5 text-sm {isUser
				? 'ask-chat-message--user'
				: isError
					? 'scaffy-error-surface rounded-xl'
					: 'ask-chat-message--assistant'}"
		>
			{#if !isUser && !isError}
				<span class="ask-chat-message__label">{$messages['tutor.title']}</span>
			{/if}

			{#if !isUser && showSpinner}
				<div class="ask-chat-message__skeleton" aria-label={loadingLabel(mode)}>
					<span></span>
					<span></span>
					<span></span>
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
	{:else}
		<div
			class="max-w-[92%] rounded-lg px-3 py-2 text-sm {isUser
				? 'bg-primary text-primary-foreground'
				: isError
					? 'scaffy-error-surface rounded-lg'
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
	{/if}
</div>
