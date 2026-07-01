<script lang="ts">
	import ChatMessageList from '$lib/components/chat/chat-message-list.svelte';
	import { streamChatReply } from '$lib/api/chat-stream.js';
	import { requestScaffold } from '$lib/scaffold/request-scaffold.js';
	import {
		appendToMessage,
		createAssistantPlaceholder,
		createUserMessage,
		isAskComposerBusy,
		removeMessage,
		toChatHistory,
		updateMessage,
		type ChatMode,
	} from '$lib/chat/message-actions.js';
	import type { ChatMessage } from '$lib/types/chat-message.js';
	import {
		acknowledgeIntroAndStartLesson,
		canStartLesson,
		getAskMessages,
		getSessionById,
		hasLessonStarted,
		setAskMessages,
		updateAskMessages,
	} from '$lib/global-state/session.svelte.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { ScrollArea } from '$lib/components/ui/scroll-area/index.js';
	import * as Tooltip from '$lib/components/ui/tooltip/index.js';
	import LoaderCircle from '@lucide/svelte/icons/loader-circle';
	import Send from '@lucide/svelte/icons/send';
	import AskChatHeader from '$lib/components/chat/ask-chat-header.svelte';
	import { messages as i18nMessages } from '$lib/i18n/index.js';
	import { language } from '$lib/i18n';
	import { get } from 'svelte/store';

	const MIN_PROMPT_LENGTH = 10;
	const ASK_PLACEHOLDER = $derived($i18nMessages['chat.askPlaceholder']);
	const ASK_MIN_LENGTH_TOOLTIP = $derived($i18nMessages['chat.askMinLengthTooltip']);
	const LEARN_PLACEHOLDER = $derived($i18nMessages['chat.learnPlaceholder']);
	const SESSION_HINT = $derived($i18nMessages['chat.sessionHint']);
	const INTRO_CTA_READY = $derived($i18nMessages['chat.introCtaReady']);
	const INTRO_CTA_WAIT_SCAFFOLD = $derived($i18nMessages['chat.introCtaWaitScaffold']);
	const INTRO_CTA_WAIT_INTRO = $derived($i18nMessages['chat.introCtaWaitIntro']);
	const INTRO_CTA_SCAFFOLD_TOOLTIP = $derived($i18nMessages['chat.introCtaScaffoldTooltip']);
	const INTRO_CTA_INTRO_TOOLTIP = $derived($i18nMessages['chat.introCtaIntroTooltip']);

	interface Props {
		mode: ChatMode;
		sessionId?: string;
		/** Prompt textarea only — no message list or submit button (home screen). */
		promptOnly?: boolean;
		/** Bound prompt text (home screen shares state with start button). */
		prompt?: string;
		/** Session route — pinned composer, intro CTA, footer hint. */
		sessionIntro?: boolean;
		/** Hide intro CTA while first-use onboarding spotlight is active. */
		suppressIntroCta?: boolean;
	}

	let {
		mode,
		sessionId,
		promptOnly = false,
		prompt = $bindable(''),
		sessionIntro = false,
		suppressIntroCta = false,
	}: Props = $props();

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

	const isAskSession = $derived(mode === 'ask' && !promptOnly);
	const boundSession = $derived(sessionId ? getSessionById(sessionId) : null);
	const usesSessionAskStore = $derived(isAskSession && Boolean(sessionId));
	const displayMessages = $derived(
		usesSessionAskStore && boundSession ? boundSession.askMessages : messages,
	);
	const askComposerBusy = $derived(isAskComposerBusy(displayMessages));
	const canSubmit = $derived(prompt.trim().length >= MIN_PROMPT_LENGTH && !askComposerBusy);
	const hasMessages = $derived(displayMessages.length > 0);
	const showAskMinLengthTooltip = $derived(
		isAskSession && !canSubmit && !askComposerBusy && prompt.trim().length < MIN_PROMPT_LENGTH,
	);
	const lessonStarted = $derived(sessionId && sessionIntro ? hasLessonStarted(sessionId) : true);
	const showIntroCta = $derived(
		Boolean(
			sessionIntro &&
			sessionId &&
			!lessonStarted &&
			!suppressIntroCta &&
			boundSession?.introStatus !== 'idle',
		),
	);
	const introCtaEnabled = $derived(Boolean(sessionId && canStartLesson(sessionId)));
	const introCtaDisabledTooltip = $derived.by(() => {
		if (!boundSession || boundSession.status !== 'ready') return INTRO_CTA_SCAFFOLD_TOOLTIP;
		if (boundSession.introStatus === 'streaming') return INTRO_CTA_INTRO_TOOLTIP;
		return INTRO_CTA_SCAFFOLD_TOOLTIP;
	});
	const introCtaLabel = $derived.by(() => {
		if (!boundSession) return INTRO_CTA_WAIT_SCAFFOLD;
		if (boundSession.status !== 'ready') return INTRO_CTA_WAIT_SCAFFOLD;
		if (boundSession.introStatus === 'streaming') return INTRO_CTA_WAIT_INTRO;
		return INTRO_CTA_READY;
	});

	function scrollToBottom() {
		if (!scrollViewport) return;
		scrollViewport.scrollTop = scrollViewport.scrollHeight;
	}

	function scheduleScroll() {
		cancelAnimationFrame(scrollRaf);
		scrollRaf = requestAnimationFrame(scrollToBottom);
	}

	/** Abort in-flight Ask stream when switching sessions or unmounting. */
	$effect(() => {
		void sessionId;
		return () => {
			askAbort?.abort();
			askAbort = null;
		};
	});

	$effect(() => {
		if (!isAskSession || !hasMessages) return;
		void displayMessages.length;
		void displayMessages
			.map((message) => `${message.id}:${message.content}:${message.status}`)
			.join('|');
		scheduleScroll();
	});

	function commitMessages(next: ChatMessage[]) {
		const id = sessionId;
		if (mode === 'ask' && id && !promptOnly) {
			setAskMessages(id, next);
			return;
		}
		messages = next;
	}

	function currentAskMessages(): ChatMessage[] {
		const id = sessionId;
		if (mode === 'ask' && id && !promptOnly) {
			return getAskMessages(id);
		}
		return messages;
	}

	function mutateAskMessages(updater: (current: ChatMessage[]) => ChatMessage[]) {
		const id = sessionId;
		if (mode === 'ask' && id && !promptOnly) {
			updateAskMessages(id, updater);
			return;
		}
		messages = updater(messages);
	}

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

	function handleStartLesson() {
		if (!sessionId || !introCtaEnabled) return;
		acknowledgeIntroAndStartLesson(sessionId);
	}

	async function submitLearn(text: string) {
		const assistant = createAssistantPlaceholder();
		commitMessages([...messages, createUserMessage(text), assistant]);

		const resolvedSessionId = sessionId ?? crypto.randomUUID();

		try {
			await requestScaffold(text, resolvedSessionId);
			commitMessages(removeMessage(messages, assistant.id));
		} catch (e) {
			const message = e instanceof Error ? e.message : 'Request failed.';
			commitMessages(failAssistant(messages, assistant.id, message));
		}
	}

	async function submitAsk(text: string) {
		const activeSessionId = sessionId;
		if (!activeSessionId) return;

		if (askAbort) {
			askAbort.abort();
		}
		askAbort = new AbortController();
		const signal = askAbort.signal;

		const history = toChatHistory(currentAskMessages());
		const assistant = createAssistantPlaceholder();
		const assistantId = assistant.id;
		mutateAskMessages((current) => [...current, createUserMessage(text), assistant]);

		let gotFirstToken = false;

		const isActive = () => sessionId === activeSessionId && !signal.aborted;

		try {
			await streamChatReply(
				{
					prompt: text,
					history,
					language: get(language),
				},
				{
					onReady: () => {
						if (!isActive()) return;
					},
					onDelta: (delta) => {
						if (!isActive()) return;
						if (!gotFirstToken) {
							gotFirstToken = true;
							mutateAskMessages((current) =>
								updateMessage(current, assistantId, {
									status: 'streaming',
									content: '',
								}),
							);
						}
						mutateAskMessages((current) => appendToMessage(current, assistantId, delta));
					},
					onDone: () => {
						if (!isActive()) return;
						mutateAskMessages((current) =>
							updateMessage(current, assistantId, { status: 'complete' }),
						);
						askAbort = null;
					},
					onError: (message) => {
						if (!isActive()) return;
						if (message === 'Cancelled.') {
							mutateAskMessages((current) => removeMessage(current, assistantId));
							askAbort = null;
							return;
						}
						mutateAskMessages((current) => failAssistant(current, assistantId, message));
						askAbort = null;
					},
				},
				signal,
			);
		} catch (e) {
			if (!isActive()) return;
			const message = e instanceof Error ? e.message : 'Request failed.';
			mutateAskMessages((current) => failAssistant(current, assistantId, message));
			askAbort = null;
		}
	}

	async function submitFromPrompt() {
		const text = prompt.trim();
		if (text.length < MIN_PROMPT_LENGTH || askComposerBusy) return;

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
				class="{promptTextareaClass} block min-h-22 w-full border-0 bg-transparent pr-11 pb-10 sm:min-h-24"
				bind:value={prompt}
				disabled={askComposerBusy}
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
										aria-label={askComposerBusy ? 'Please wait' : 'Send message'}
									>
										{#if askComposerBusy}
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
				disabled={askComposerBusy}
				placeholder={LEARN_PLACEHOLDER}
			></textarea>
		</div>
		<Button type="submit" disabled={!canSubmit} class="w-full sm:w-auto">
			{askComposerBusy ? 'Please wait…' : 'Generate lesson'}
		</Button>
	</form>
{/snippet}

{#snippet homePromptComposer()}
	<form class="flex shrink-0 flex-col gap-2" onsubmit={onSubmit}>
		<label class="sr-only" for="chat-prompt">Message</label>
		<div class={learnPromptFieldShellClass}>
			<textarea
				id="chat-prompt"
				class="{promptTextareaClass} min-h-35 w-full border-0 bg-transparent"
				bind:value={prompt}
				disabled={askComposerBusy}
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
				<ChatMessageList messages={displayMessages} mode="ask" showEmptyState={false} />
			</ScrollArea>
		{:else}
			<div class="min-h-0 flex-1" aria-hidden="true"></div>
		{/if}
		{#if sessionIntro}
			{#if showIntroCta}
				<div class="shrink-0 pb-2">
					<Tooltip.Provider>
						<Tooltip.Root disabled={introCtaEnabled}>
							<Tooltip.Trigger>
								{#snippet child({ props })}
									<span {...props} class="inline-flex w-full sm:w-auto">
										<Button
											type="button"
											disabled={!introCtaEnabled}
											class="w-full sm:w-auto"
											onclick={handleStartLesson}
										>
											{introCtaLabel}
										</Button>
									</span>
								{/snippet}
							</Tooltip.Trigger>
							<Tooltip.Content
								side="top"
								sideOffset={6}
								class="max-w-xs text-left whitespace-normal"
							>
								{introCtaDisabledTooltip}
							</Tooltip.Content>
						</Tooltip.Root>
					</Tooltip.Provider>
				</div>
			{/if}
			<p class="shrink-0 pb-2 text-xs text-muted-foreground">{SESSION_HINT}</p>
		{/if}
		{@render askComposer(true)}
	{:else if promptOnly}
		{@render homePromptComposer()}
	{:else}
		<ScrollArea orientation="vertical" class="min-h-0 flex-1">
			<ChatMessageList {messages} {mode} />
		</ScrollArea>
		{@render learnComposer()}
	{/if}
</section>
