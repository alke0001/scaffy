import {
	createMessageId,
	type ChatMessage,
	type ChatMessageRole,
	type ChatMessageStatus,
} from '$lib/types/chat-message';

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

/** History for /api/chat: completed user/assistant turns only. */
export function toChatHistory(
	messages: ChatMessage[],
): { role: 'user' | 'assistant'; content: string }[] {
	return messages
		.filter((m) => m.status === 'complete' && (m.role === 'user' || m.role === 'assistant'))
		.map((m) => ({ role: m.role, content: m.content }));
}

export type ChatMode = 'learn' | 'ask';

export function loadingLabel(mode: ChatMode): string {
	return mode === 'learn' ? 'Generating lesson…' : 'Thinking…';
}

export function roleLabel(role: ChatMessageRole, mode: ChatMode = 'learn'): string {
	if (role === 'user') return 'You';
	return mode === 'ask' ? 'scaffy tutor' : 'Scaffy';
}
