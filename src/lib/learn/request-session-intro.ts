import { streamSessionIntro } from '$lib/api/chat-stream.js';
import {
	INTRO_ASSISTANT_MESSAGE_ID,
	INTRO_USER_MESSAGE_ID,
	appendToMessage,
	createIntroMessagePair,
	isIntroMessageId,
	updateMessage,
} from '$lib/chat/message-actions.js';
import { devLog } from '$lib/dev/log.js';
import {
	getAskMessages,
	getSessionById,
	setAskMessages,
	setIntroStatus,
} from '$lib/session.svelte.js';
import type { ChatMessage } from '$lib/types/chat-message.js';

const inFlight = new Map<string, Promise<void>>();
const abortControllers = new Map<string, AbortController>();

/** Batch intro stream writes — throttle so chat markdown does not block the UI thread. */
function createIntroMessageBatcher(sessionId: string) {
	const FLUSH_MS = 250;
	/** Intro slot only — follow-up Ask turns are merged from the store on each flush. */
	let introMessages: ChatMessage[] = [];
	let flushTimer: ReturnType<typeof setTimeout> | undefined;

	function mergeIntroWithFollowUps(): ChatMessage[] {
		const followUps = followUpMessages(getAskMessages(sessionId));
		return [...introMessages, ...followUps];
	}

	function flushNow() {
		if (flushTimer) {
			clearTimeout(flushTimer);
			flushTimer = undefined;
		}
		setAskMessages(sessionId, mergeIntroWithFollowUps());
	}

	function scheduleFlush() {
		if (flushTimer) return;
		flushTimer = setTimeout(() => {
			flushTimer = undefined;
			setAskMessages(sessionId, mergeIntroWithFollowUps());
		}, FLUSH_MS);
	}

	function setMessages(next: ChatMessage[]) {
		introMessages = next.filter((message) => isIntroMessageId(message.id));
		scheduleFlush();
	}

	function cancel() {
		if (flushTimer) {
			clearTimeout(flushTimer);
			flushTimer = undefined;
		}
	}

	return { setMessages, flushNow, cancel };
}

function followUpMessages(messages: ChatMessage[]): ChatMessage[] {
	return messages.filter(
		(m) => m.id !== INTRO_USER_MESSAGE_ID && m.id !== INTRO_ASSISTANT_MESSAGE_ID,
	);
}

function upsertIntroSlot(messages: ChatMessage[], prompt: string): ChatMessage[] {
	const followUps = followUpMessages(messages);
	return [...createIntroMessagePair(prompt), ...followUps];
}

function resetIntroAssistant(messages: ChatMessage[]): ChatMessage[] {
	return messages.map((message) =>
		message.id === INTRO_ASSISTANT_MESSAGE_ID
			? {
					...message,
					content: '',
					status: 'loading',
					errorMessage: undefined,
				}
			: message,
	);
}

function scheduleIntroWork(sessionId: string, work: Promise<void>): Promise<void> {
	const tracked = work.finally(() => {
		inFlight.delete(sessionId);
	});
	inFlight.set(sessionId, tracked);
	return tracked;
}

function abortIntroStream(sessionId: string): void {
	abortControllers.get(sessionId)?.abort();
	abortControllers.delete(sessionId);
}

async function runIntroStream(sessionId: string, regenerate: boolean): Promise<void> {
	const session = getSessionById(sessionId);
	if (!session) return;

	abortIntroStream(sessionId);
	const controller = new AbortController();
	abortControllers.set(sessionId, controller);
	const signal = controller.signal;

	const existing = getAskMessages(sessionId);
	let messages = regenerate
		? existing.some((m) => m.id === INTRO_ASSISTANT_MESSAGE_ID)
			? resetIntroAssistant(existing)
			: upsertIntroSlot(existing, session.prompt)
		: upsertIntroSlot(existing, session.prompt);
	messages = messages.filter((message) => isIntroMessageId(message.id));

	const batcher = createIntroMessageBatcher(sessionId);

	setIntroStatus(sessionId, 'streaming');
	batcher.setMessages(messages);
	batcher.flushNow();

	let gotFirstToken = false;

	try {
		await streamSessionIntro(
			{ prompt: session.prompt },
			{
				onDelta: (delta) => {
					if (signal.aborted) return;
					if (!gotFirstToken) {
						gotFirstToken = true;
						messages = updateMessage(messages, INTRO_ASSISTANT_MESSAGE_ID, {
							status: 'streaming',
							content: '',
						});
						batcher.setMessages(messages);
					}
					messages = appendToMessage(messages, INTRO_ASSISTANT_MESSAGE_ID, delta);
					batcher.setMessages(messages);
				},
				onDone: () => {
					if (signal.aborted) return;
					messages = updateMessage(messages, INTRO_ASSISTANT_MESSAGE_ID, { status: 'complete' });
					batcher.setMessages(messages);
					batcher.flushNow();
					setIntroStatus(sessionId, 'complete');
					abortControllers.delete(sessionId);
					devLog('session-intro', 'stream complete', { sessionId });
				},
				onError: (message) => {
					if (signal.aborted && message === 'Cancelled.') return;
					messages = updateMessage(messages, INTRO_ASSISTANT_MESSAGE_ID, {
						status: 'error',
						errorMessage: message,
					});
					batcher.setMessages(messages);
					batcher.flushNow();
					setIntroStatus(sessionId, 'error');
					abortControllers.delete(sessionId);
					devLog('session-intro', 'stream error', { sessionId, message });
				},
			},
			signal,
		);
	} finally {
		batcher.cancel();
	}
}

/** Starts session intro when idle (single-flight per session). */
export function ensureSessionIntro(sessionId: string): Promise<void> {
	const existing = inFlight.get(sessionId);
	if (existing) return existing;

	const session = getSessionById(sessionId);
	if (!session) return Promise.resolve();
	if (session.introStatus !== 'idle') {
		devLog('session-intro', 'ensureSessionIntro — skip', {
			sessionId,
			introStatus: session.introStatus,
		});
		return Promise.resolve();
	}

	devLog('session-intro', 'ensureSessionIntro — scheduling', { sessionId });
	return scheduleIntroWork(
		sessionId,
		runIntroStream(sessionId, false).catch((e) => {
			devLog('session-intro', 'ensure failed', {
				sessionId,
				error: e instanceof Error ? e.message : String(e),
			});
			throw e;
		}),
	);
}

/** Overwrites the intro assistant message and streams again (fallback / re-prompt). */
export function regenerateSessionIntro(sessionId: string): Promise<void> {
	abortIntroStream(sessionId);
	inFlight.delete(sessionId);

	const session = getSessionById(sessionId);
	if (!session) return Promise.resolve();

	devLog('session-intro', 'regenerateSessionIntro', { sessionId });
	return scheduleIntroWork(
		sessionId,
		runIntroStream(sessionId, true).catch((e) => {
			devLog('session-intro', 'regenerate failed', {
				sessionId,
				error: e instanceof Error ? e.message : String(e),
			});
			throw e;
		}),
	);
}

export function cancelSessionIntro(sessionId: string): void {
	abortIntroStream(sessionId);
	inFlight.delete(sessionId);
}
