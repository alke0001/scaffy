import {
	createMessageId,
	type ChatMessage,
	type ChatMessageRole,
	type ChatMessageStatus,
} from '$lib/types/chat-message';

/** Fixed IDs for the session intro slot (user prompt + streamed preview). */
export const INTRO_USER_MESSAGE_ID = 'intro-user';
export const INTRO_ASSISTANT_MESSAGE_ID = 'intro-assistant';

export function isIntroMessageId(id: string): boolean {
	return id === INTRO_USER_MESSAGE_ID || id === INTRO_ASSISTANT_MESSAGE_ID;
}

export function createIntroUserMessage(content: string): ChatMessage {
	return {
		id: INTRO_USER_MESSAGE_ID,
		role: 'user',
		content,
		status: 'complete',
		createdAt: Date.now(),
	};
}

export function createIntroAssistantPlaceholder(): ChatMessage {
	return {
		id: INTRO_ASSISTANT_MESSAGE_ID,
		role: 'assistant',
		content: '',
		status: 'loading',
		createdAt: Date.now(),
	};
}

export function createIntroMessagePair(prompt: string): ChatMessage[] {
	return [createIntroUserMessage(prompt), createIntroAssistantPlaceholder()];
}

export function createUserMessage(
	content: string,
	status: ChatMessageStatus = 'complete',
): ChatMessage {
	return {
		id: createMessageId(),
		role: 'user',
		content,
		status,
		createdAt: Date.now(),
	};
}

export function createAssistantPlaceholder(): ChatMessage {
	return {
		id: createMessageId(),
		role: 'assistant',
		content: '',
		status: 'loading',
		createdAt: Date.now(),
	};
}

export function updateMessage(
	messages: ChatMessage[],
	id: string,
	patch: Partial<Pick<ChatMessage, 'content' | 'status' | 'errorMessage'>>,
): ChatMessage[] {
	return messages.map((m) => (m.id === id ? { ...m, ...patch } : m));
}

export function removeMessage(messages: ChatMessage[], id: string): ChatMessage[] {
	return messages.filter((m) => m.id !== id);
}

export function appendToMessage(messages: ChatMessage[], id: string, delta: string): ChatMessage[] {
	return messages.map((m) => (m.id === id ? { ...m, content: m.content + delta } : m));
}

/** History for /api/chat: completed user/assistant turns only (includes intro slot). */
export function toChatHistory(
	messages: ChatMessage[],
): { role: 'user' | 'assistant'; content: string }[] {
	return messages
		.filter(
			(m) =>
				m.status === 'complete' &&
				m.content.trim().length > 0 &&
				(m.role === 'user' || m.role === 'assistant'),
		)
		.map((m) => ({ role: m.role, content: m.content }));
}

/** Ask composer busy — excludes in-flight session intro assistant. */
export function isAskComposerBusy(messages: ChatMessage[]): boolean {
	return messages.some(
		(m) =>
			(m.status === 'pending' || m.status === 'loading' || m.status === 'streaming') &&
			!isIntroMessageId(m.id),
	);
}

export type ChatMode = 'learn' | 'ask';

export function loadingLabel(mode: ChatMode): string {
	return mode === 'learn' ? 'Generating lesson…' : 'Thinking…';
}

export function roleLabel(role: ChatMessageRole, mode: ChatMode = 'learn'): string {
	if (role === 'user') return 'You';
	return mode === 'ask' ? 'scaffy tutor' : 'Scaffy';
}
