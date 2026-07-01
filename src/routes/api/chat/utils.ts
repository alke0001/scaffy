/** Max prior user+assistant messages sent as history (≈15 turns). */
const MAX_HISTORY_MESSAGES = 30;

export type ChatHistoryEntry = {
	role?: unknown;
	content?: unknown;
};

export function encodeSse(payload: Record<string, unknown>): Uint8Array {
	return new TextEncoder().encode(`data: ${JSON.stringify(payload)}\n\n`);
}

export function buildMessages(
	trimmedPrompt: string,
	history: ChatHistoryEntry[] | undefined,
): { role: 'user' | 'assistant'; content: string }[] {
	const messages: { role: 'user' | 'assistant'; content: string }[] = [];

	if (Array.isArray(history)) {
		const prior: { role: 'user' | 'assistant'; content: string }[] = [];

		for (const entry of history) {
			if (entry.role !== 'user' && entry.role !== 'assistant') continue;
			if (typeof entry.content !== 'string') continue;

			const content = entry.content.trim();

			if (content.length === 0) continue;

			prior.push({
				role: entry.role,
				content,
			});
		}

		messages.push(...prior.slice(-MAX_HISTORY_MESSAGES));
	}

	messages.push({
		role: 'user',
		content: trimmedPrompt,
	});

	return messages;
}
