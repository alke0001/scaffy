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
	import * as Tooltip from '$lib/components/ui/tooltip/index.js';

	const MIN_PROMPT_LENGTH = 10;
	const ASK_PLACEHOLDER = 'Ask scaffy a question about the code (min. 10 characters)';
	const ASK_MIN_LENGTH_TOOLTIP =
		'Enter at least 10 characters to ask Scaffy a question. We skip very short prompts to avoid unnecessary AI calls and reduce environmental impact.';

	interface Props {
		mode: ChatMode;
		sessionId?: string;
		/** Prompt textarea only — no message list or submit button (home screen). */
		promptOnly?: boolean;
	}

	let { mode, sessionId, promptOnly = false }: Props = $props();

	const promptTextareaClass =
		'w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-inset focus-visible:outline-none';

	let messages = $state<ChatMessage[]>([]);
	let prompt = $state('');

	let askAbort = $state<AbortController | null>(null);

	const threadBusy = $derived(isThreadBusy(messages));
	const canSubmit = $derived(prompt.trim().length >= MIN_PROMPT_LENGTH && !threadBusy);
	const showAskMinLengthTooltip = $derived(
		mode === 'ask' && !canSubmit && !threadBusy && prompt.trim().length < MIN_PROMPT_LENGTH,
	);

	let sendTooltipAnchor = $state<HTMLElement | null>(null);
	let sendTooltipWidth = $state<number | undefined>(undefined);

	$effect(() => {
		const el = sendTooltipAnchor;
		if (!el) return;

		const sync = () => {
			sendTooltipWidth = el.offsetWidth;
		};

		sync();
		const observer = new ResizeObserver(sync);
		observer.observe(el);
		return () => observer.disconnect();
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

	async function onSubmit(event: SubmitEvent) {
		event.preventDefault();
		const text = prompt.trim();
		if (text.length < MIN_PROMPT_LENGTH || threadBusy) return;

		prompt = '';

		if (mode === 'learn') {
			await submitLearn(text);
		} else {
			await submitAsk(text);
		}
	}
</script>

<section
	class="flex h-full min-h-0 flex-col gap-3"
	class:gap-0={promptOnly}
	aria-label="Chat panel"
>
	{#if !promptOnly}
		<ChatMessageList {messages} {mode} />
	{/if}

	<form
		class="flex shrink-0 flex-col gap-2 border-t border-scaffy-divider pt-3"
		class:border-t-0={promptOnly}
		class:pt-0={promptOnly}
		onsubmit={onSubmit}
	>
		<label class="sr-only" for="chat-prompt">Message</label>
		<textarea
			id="chat-prompt"
			class={promptTextareaClass}
			class:min-h-24={!promptOnly}
			class:min-h-[140px]={promptOnly}
			bind:value={prompt}
			disabled={threadBusy}
			placeholder={mode === 'learn'
				? 'Describe what to build (min. 10 characters; avoid &lt;, {, ; in prompts).'
				: ASK_PLACEHOLDER}
		></textarea>
		{#if !promptOnly}
			{#if mode === 'ask'}
				<Tooltip.Provider>
					<Tooltip.Root disabled={!showAskMinLengthTooltip}>
						<Tooltip.Trigger>
							{#snippet child({ props })}
								<span bind:this={sendTooltipAnchor} {...props} class="block w-full">
									<Button type="submit" disabled={!canSubmit} class="w-full sm:w-auto">
										{threadBusy ? 'Please wait…' : 'Send'}
									</Button>
								</span>
							{/snippet}
						</Tooltip.Trigger>
						<Tooltip.Content
							side="top"
							sideOffset={6}
							style={sendTooltipWidth ? `width: ${sendTooltipWidth}px` : undefined}
							class="max-w-none text-left whitespace-normal"
						>
							{ASK_MIN_LENGTH_TOOLTIP}
						</Tooltip.Content>
					</Tooltip.Root>
				</Tooltip.Provider>
			{:else}
				<Button type="submit" disabled={!canSubmit} class="w-full sm:w-auto">
					{threadBusy ? 'Please wait…' : 'Generate lesson'}
				</Button>
			{/if}
		{/if}
	</form>
</section>
