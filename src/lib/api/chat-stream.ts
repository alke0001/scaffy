import { parseKitErrorMessage } from '$lib/api/kit-error.js';

export type ChatStreamEvent =
	| { type: 'ready' }
	| { type: 'text'; text: string }
	| { type: 'done' }
	| { type: 'error'; message: string };

export type ChatStreamCallbacks = {
	onReady?: () => void;
	onDelta: (text: string) => void;
	onDone: () => void;
	onError: (message: string) => void;
};

type ChatRequestBody = {
	prompt: string;
	model?: string;
	history?: { role: 'user' | 'assistant'; content: string }[];
};

function parseSseLine(line: string): ChatStreamEvent | null {
	if (!line.startsWith('data: ')) return null;
	const payload = line.slice(6).trim();
	if (!payload) return null;
	try {
		return JSON.parse(payload) as ChatStreamEvent;
	} catch {
		return null;
	}
}

export async function streamChatReply(
	body: ChatRequestBody,
	callbacks: ChatStreamCallbacks,
	signal?: AbortSignal
): Promise<void> {
	const res = await fetch('/api/chat', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(body),
		signal
	});

	if (!res.ok) {
		callbacks.onError(await parseKitErrorMessage(res));
		return;
	}

	const reader = res.body?.getReader();
	if (!reader) {
		callbacks.onError('No response body.');
		return;
	}

	const decoder = new TextDecoder();
	let buffer = '';

	try {
		while (true) {
			const { done, value } = await reader.read();
			if (done) break;

			buffer += decoder.decode(value, { stream: true });
			const lines = buffer.split('\n');
			buffer = lines.pop() ?? '';

			for (const line of lines) {
				const event = parseSseLine(line);
				if (!event) continue;

				switch (event.type) {
					case 'ready':
						callbacks.onReady?.();
						break;
					case 'text':
						callbacks.onDelta(event.text);
						break;
					case 'done':
						callbacks.onDone();
						return;
					case 'error':
						callbacks.onError(event.message);
						return;
				}
			}
		}

		callbacks.onDone();
	} catch (e) {
		if (signal?.aborted) {
			callbacks.onError('Cancelled.');
			return;
		}
		callbacks.onError(e instanceof Error ? e.message : 'Stream failed.');
	} finally {
		reader.releaseLock();
	}
}
