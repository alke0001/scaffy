export type ChatMessageRole = 'user' | 'assistant';

export type ChatMessageStatus = 'pending' | 'loading' | 'streaming' | 'complete' | 'error';

export type ChatMessage = {
	id: string;
	role: ChatMessageRole;
	content: string;
	status: ChatMessageStatus;
	createdAt: number;
	errorMessage?: string;
};

const BUSY_STATUSES: ReadonlySet<ChatMessageStatus> = new Set(['pending', 'loading', 'streaming']);

export function isMessageBusy(message: ChatMessage): boolean {
	return BUSY_STATUSES.has(message.status);
}

export function isThreadBusy(messages: ChatMessage[]): boolean {
	return messages.some(isMessageBusy);
}

export function createMessageId(): string {
	return crypto.randomUUID();
}
