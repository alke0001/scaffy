<script lang="ts">
	import ChatMessageList from '$lib/components/chat/chat-message-list.svelte';
	import ChatModeToggle from '$lib/components/chat/chat-mode-toggle.svelte';
	import { fetchJson } from '$lib/api/kit-error.js';
	import { streamChatReply } from '$lib/api/chat-stream.js';
	import {
		appendToMessage,
		createAssistantPlaceholder,
		createUserMessage,
		removeMessage,
		toChatHistory,
		updateMessage,
		type ChatMode,
	} from '$lib/chat/message-actions.js';
	import {
		setScaffoldError,
		setScaffolds,
		startScaffoldRequest,
	} from '$lib/session.svelte.js';
	import type { StructuredScaffoldOutput } from '$lib/types/scaffold.js';
	import { isThreadBusy, type ChatMessage } from '$lib/types/chat-message.js';
	import { Button } from '$lib/components/ui/button/index.js';

	let mode = $state<ChatMode>('learn');
	let learnMessages = $state<ChatMessage[]>([]);
	let askMessages = $state<ChatMessage[]>([]);
	let prompt = $state('');

	let askAbort = $state<AbortController | null>(null);

	const activeMessages = $derived(mode === 'learn' ? learnMessages : askMessages);
	const threadBusy = $derived(isThreadBusy(activeMessages));
	const canSubmit = $derived(prompt.trim().length >= 10 && !threadBusy);

	function failAssistant(
		messages: ChatMessage[],
		assistantId: string,
		errorMessage: string,
	): ChatMessage[] {
		return updateMessage(messages, assistantId, {
			status: 'error',
			errorMessage,
		});
	}

	async function submitLearn(text: string) {
		const assistant = createAssistantPlaceholder();
		learnMessages = [...learnMessages, createUserMessage(text), assistant];

		const sessionId = startScaffoldRequest(text);

		try {
			const data = await fetchJson<StructuredScaffoldOutput>('/api/scaffold', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ prompt: text }),
			});
			setScaffolds(data.scaffolds, sessionId);
			learnMessages = removeMessage(learnMessages, assistant.id);
			if (import.meta.env.DEV) {
				console.log('[chat-panel] scaffold ready', data.scaffolds.length, 'steps');
			}
		} catch (e) {
			const message = e instanceof Error ? e.message : 'Request failed.';
			setScaffoldError(message, sessionId);
			learnMessages = failAssistant(learnMessages, assistant.id, message);
		}
	}

	async function submitAsk(text: string) {
		if (askAbort) {
			askAbort.abort();
		}
		askAbort = new AbortController();
		const signal = askAbort.signal;

		const history = toChatHistory(askMessages);
		const assistant = createAssistantPlaceholder();
		askMessages = [...askMessages, createUserMessage(text), assistant];

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
						askMessages = updateMessage(askMessages, assistant.id, {
							status: 'streaming',
							content: '',
						});
					}
					askMessages = appendToMessage(askMessages, assistant.id, delta);
				},
				onDone: () => {
					if (signal.aborted) return;
					askMessages = updateMessage(askMessages, assistant.id, { status: 'complete' });
					askAbort = null;
				},
				onError: (message) => {
					if (signal.aborted && message === 'Cancelled.') {
						askMessages = removeMessage(askMessages, assistant.id);
						askAbort = null;
						return;
					}
					askMessages = failAssistant(askMessages, assistant.id, message);
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

<section class="flex h-full min-h-0 flex-col gap-3" aria-label="Chat panel">
	<ChatModeToggle bind:mode />

	<ChatMessageList messages={activeMessages} {mode} />

	<form class="flex shrink-0 flex-col gap-2 border-t border-border pt-3" onsubmit={onSubmit}>
		<label class="sr-only" for="chat-prompt">Message</label>
		<textarea
			id="chat-prompt"
			class="min-h-24 w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
			bind:value={prompt}
			disabled={threadBusy}
			placeholder={mode === 'learn'
				? 'Describe what to build (min. 10 characters; avoid &lt;, {, ; in prompts).'
				: 'Ask a question (min. 10 characters).'}
		></textarea>
		<Button type="submit" disabled={!canSubmit} class="w-full sm:w-auto">
			{threadBusy ? 'Please wait…' : mode === 'learn' ? 'Generate lesson' : 'Send'}
		</Button>
	</form>
</section>
