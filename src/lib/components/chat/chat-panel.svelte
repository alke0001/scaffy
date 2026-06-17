<script lang="ts">
	import ChatMessageList from '$lib/components/chat/chat-message-list.svelte';
	import { streamChatReply } from '$lib/api/chat-stream.js';
	import { requestScaffold } from '$lib/learn/request-scaffold.js';
	import {
		appendToMessage,
		createAssistantPlaceholder,
		createUserMessage,
		removeMessage,
		toChatHistory,
		updateMessage,
		type ChatMode,
	} from '$lib/chat/message-actions.js';
	import { isThreadBusy, type ChatMessage } from '$lib/types/chat-message.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { ScrollArea } from '$lib/components/ui/scroll-area/index.js';
	import * as Tooltip from '$lib/components/ui/tooltip/index.js';
	import LoaderCircle from '@lucide/svelte/icons/loader-circle';
	import Send from '@lucide/svelte/icons/send';
	import AskChatHeader from '$lib/components/chat/ask-chat-header.svelte';

	const MIN_PROMPT_LENGTH = 10;
	const ASK_PLACEHOLDER = 'Ask scaffy a question about the code (min. 10 characters)';
	const ASK_MIN_LENGTH_TOOLTIP =
		'Enter at least 10 characters to ask Scaffy a question. We skip very short prompts to avoid unnecessary AI calls and reduce environmental impact.';
	const LEARN_PLACEHOLDER =
		'Describe what to build (min. 10 characters; avoid <, {, ; in prompts).';

	interface Props {
		mode: ChatMode;
		sessionId?: string;
		/** Prompt textarea only — no message list or submit button (home screen). */
		promptOnly?: boolean;
		/** Bound prompt text (home screen shares state with start button). */
		prompt?: string;
	}

	let { mode, sessionId, promptOnly = false, prompt = $bindable('') }: Props = $props();

	const learnPromptFieldShellClass =
		'rounded-md border border-border bg-background text-sm focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/50 focus-within:ring-inset';
	const askPromptFieldShellClass =
		'rounded-md border border-border bg-card text-sm focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/50 focus-within:ring-inset';
	const promptTextareaClass =
		'w-full resize-none px-3 py-2 placeholder:text-muted-foreground focus-visible:outline-none';

	let messages = $state<ChatMessage[]>([]);
	let scrollViewport = $state<HTMLElement | null>(null);

	let askAbort = $state<AbortController | null>(null);
	let scrollRaf = 0;

	const threadBusy = $derived(isThreadBusy(messages));
	const canSubmit = $derived(prompt.trim().length >= MIN_PROMPT_LENGTH && !threadBusy);
	const hasMessages = $derived(messages.length > 0);
	const isAskSession = $derived(mode === 'ask' && !promptOnly);
	const showAskMinLengthTooltip = $derived(
		isAskSession && !canSubmit && !threadBusy && prompt.trim().length < MIN_PROMPT_LENGTH,
	);

	function scrollToBottom() {
		if (!scrollViewport) return;
		scrollViewport.scrollTop = scrollViewport.scrollHeight;
	}

	function scheduleScroll() {
		cancelAnimationFrame(scrollRaf);
		scrollRaf = requestAnimationFrame(scrollToBottom);
	}

	$effect(() => {
		if (!isAskSession || !hasMessages) return;
		void messages.length;
		void messages.map((message) => `${message.id}:${message.content}:${message.status}`).join('|');
		scheduleScroll();
	});

	function failAssistant(
		current: ChatMessage[],
		assistantId: string,
		errorMessage: string,
	): ChatMessage[] {
		return updateMessage(current, assistantId, {
			status: 'error',
			errorMessage,
		});
	}

	async function submitLearn(text: string) {
		const assistant = createAssistantPlaceholder();
		messages = [...messages, createUserMessage(text), assistant];

		const resolvedSessionId = sessionId ?? crypto.randomUUID();

		try {
			await requestScaffold(text, resolvedSessionId);
			messages = removeMessage(messages, assistant.id);
		} catch (e) {
			const message = e instanceof Error ? e.message : 'Request failed.';
			messages = failAssistant(messages, assistant.id, message);
		}
	}

	async function submitAsk(text: string) {
		if (askAbort) {
			askAbort.abort();
		}
		askAbort = new AbortController();
		const signal = askAbort.signal;

		const history = toChatHistory(messages);
		const assistant = createAssistantPlaceholder();
		messages = [...messages, createUserMessage(text), assistant];

		let gotFirstToken = false;

		await streamChatReply(
			{ prompt: text, history },
			{
				onReady: () => {
					if (signal.aborted) return;
				},
				onDelta: (delta) => {
					if (signal.aborted) return;
					if (!gotFirstToken) {
						gotFirstToken = true;
						messages = updateMessage(messages, assistant.id, {
							status: 'streaming',
							content: '',
						});
					}
					messages = appendToMessage(messages, assistant.id, delta);
				},
				onDone: () => {
					if (signal.aborted) return;
					messages = updateMessage(messages, assistant.id, { status: 'complete' });
					askAbort = null;
				},
				onError: (message) => {
					if (signal.aborted && message === 'Cancelled.') {
						messages = removeMessage(messages, assistant.id);
						askAbort = null;
						return;
					}
					messages = failAssistant(messages, assistant.id, message);
					askAbort = null;
				},
			},
			signal,
		);
	}

	async function submitFromPrompt() {
		const text = prompt.trim();
		if (text.length < MIN_PROMPT_LENGTH || threadBusy) return;

		prompt = '';

		if (mode === 'learn') {
			await submitLearn(text);
		} else {
			await submitAsk(text);
		}
	}

	async function onSubmit(event: SubmitEvent) {
		event.preventDefault();
		if (promptOnly) return;
		await submitFromPrompt();
	}

	function handleAskPromptKeydown(event: KeyboardEvent) {
		if (event.key !== 'Enter' || event.shiftKey || event.isComposing) return;
		event.preventDefault();
		void submitFromPrompt();
	}
</script>

{#snippet askComposer(pinned: boolean)}
	<form
		class="flex shrink-0 flex-col gap-2"
		class:border-t={pinned}
		class:border-scaffy-divider={pinned}
		class:pt-3={pinned}
		onsubmit={onSubmit}
	>
		<label class="sr-only" for="chat-prompt">Message</label>
		<div class="relative {askPromptFieldShellClass}">
			<textarea
				id="chat-prompt"
				class="{promptTextareaClass} block min-h-[5.5rem] w-full border-0 bg-transparent pr-11 pb-10 sm:min-h-24"
				bind:value={prompt}
				disabled={threadBusy}
				placeholder={ASK_PLACEHOLDER}
				onkeydown={handleAskPromptKeydown}
			></textarea>
			<div class="absolute right-1.5 bottom-1.5">
				<Tooltip.Provider>
					<Tooltip.Root disabled={!showAskMinLengthTooltip}>
						<Tooltip.Trigger>
							{#snippet child({ props })}
								<span {...props} class="inline-flex">
									<Button
										type="submit"
										size="icon-sm"
										disabled={!canSubmit}
										class="hover:enabled:bg-primary/80 disabled:border disabled:border-border/50 disabled:bg-muted disabled:text-muted-foreground disabled:opacity-100"
										aria-label={threadBusy ? 'Please wait' : 'Send message'}
									>
										{#if threadBusy}
											<LoaderCircle class="size-4 animate-spin" aria-hidden="true" />
										{:else}
											<Send class="size-4" aria-hidden="true" />
										{/if}
									</Button>
								</span>
							{/snippet}
						</Tooltip.Trigger>
						<Tooltip.Content side="top" sideOffset={6} class="max-w-xs text-left whitespace-normal">
							{ASK_MIN_LENGTH_TOOLTIP}
						</Tooltip.Content>
					</Tooltip.Root>
				</Tooltip.Provider>
			</div>
		</div>
	</form>
{/snippet}

{#snippet learnComposer()}
	<form
		class="flex shrink-0 flex-col gap-2 border-t border-scaffy-divider pt-3"
		onsubmit={onSubmit}
	>
		<label class="sr-only" for="chat-prompt">Message</label>
		<div class={learnPromptFieldShellClass}>
			<textarea
				id="chat-prompt"
				class="{promptTextareaClass} min-h-24 w-full border-0 bg-transparent"
				bind:value={prompt}
				disabled={threadBusy}
				placeholder={LEARN_PLACEHOLDER}
			></textarea>
		</div>
		<Button type="submit" disabled={!canSubmit} class="w-full sm:w-auto">
			{threadBusy ? 'Please wait…' : 'Generate lesson'}
		</Button>
	</form>
{/snippet}

{#snippet homePromptComposer()}
	<form class="flex shrink-0 flex-col gap-2" onsubmit={onSubmit}>
		<label class="sr-only" for="chat-prompt">Message</label>
		<div class={learnPromptFieldShellClass}>
			<textarea
				id="chat-prompt"
				class="{promptTextareaClass} min-h-[140px] w-full border-0 bg-transparent"
				bind:value={prompt}
				disabled={threadBusy}
				placeholder={LEARN_PLACEHOLDER}
			></textarea>
		</div>
	</form>
{/snippet}

<section
	class="flex h-full min-h-0 flex-col"
	class:gap-3={!isAskSession && !promptOnly}
	aria-label="Chat panel"
>
	{#if isAskSession}
		{#if hasMessages}
			<AskChatHeader />
			<ScrollArea bind:viewportRef={scrollViewport} orientation="vertical" class="min-h-0 flex-1">
				<ChatMessageList {messages} mode="ask" showEmptyState={false} />
			</ScrollArea>
			{@render askComposer(true)}
		{:else}
			{@render askComposer(false)}
		{/if}
	{:else if promptOnly}
		{@render homePromptComposer()}
	{:else}
		<ScrollArea orientation="vertical" class="min-h-0 flex-1">
			<ChatMessageList {messages} {mode} />
		</ScrollArea>
		{@render learnComposer()}
	{/if}
</section>
