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

	interface Props {
		mode: ChatMode;
		sessionId?: string;
		/** Prompt textarea only — no message list or submit button (home screen). */
		promptOnly?: boolean;
	}

	let { mode, sessionId, promptOnly = false }: Props = $props();

	let messages = $state<ChatMessage[]>([]);
	let prompt = $state('');

	let askAbort = $state<AbortController | null>(null);

	const threadBusy = $derived(isThreadBusy(messages));
	const canSubmit = $derived(prompt.trim().length >= 10 && !threadBusy);

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
		if (text.length < 10 || threadBusy) return;

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
			class="min-h-24 w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
			class:min-h-[140px]={promptOnly}
			bind:value={prompt}
			disabled={threadBusy}
			placeholder={mode === 'learn'
				? 'Describe what to build (min. 10 characters; avoid &lt;, {, ; in prompts).'
				: 'Ask a question (min. 10 characters).'}
		></textarea>
		{#if !promptOnly}
			<Button type="submit" disabled={!canSubmit} class="w-full sm:w-auto">
				{threadBusy ? 'Please wait…' : mode === 'learn' ? 'Generate lesson' : 'Send'}
			</Button>
		{/if}
	</form>
</section>
