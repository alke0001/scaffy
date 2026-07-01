import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { RequestEvent } from '@sveltejs/kit';
import { POST } from './+server';

/**
 * -----------------------------
 * HOISTED MOCKS
 * -----------------------------
 */

const resolveModelMock = vi.hoisted(() =>
	vi.fn(() => ({
		apiModelId: 'claude-test',
	})),
);

const streamMock = vi.hoisted(() => ({
	on: vi.fn(),
	finalMessage: vi.fn(),
}));

const streamFactoryMock = vi.hoisted(() => vi.fn(() => streamMock));

/**
 * -----------------------------
 * MODULE MOCKS
 * -----------------------------
 */

vi.mock('@sveltejs/kit', () => ({
	error: (status: number, message: string) => {
		const err = new Error(message) as Error & { status: number };
		err.status = status;
		throw err;
	},
}));

vi.mock('$lib/server/anthropic-client.js', () => ({
	resolveModel: resolveModelMock,
	client: {
		messages: {
			stream: streamFactoryMock,
		},
	},
}));

vi.mock('$lib/server/session-intro/system-prompt.md?raw', () => ({
	default: 'system prompt',
}));

vi.mock('@anthropic-ai/sdk', () => ({
	APIError: class APIError extends Error {},
}));

/**
 * -----------------------------
 * HELPERS
 * -----------------------------
 */

function createEvent(body: unknown): RequestEvent {
	return {
		request: {
			json: async () => body,
			signal: new AbortController().signal,
		} as Request,
		url: new URL('http://localhost'),
		params: {},
		cookies: {
			get: () => undefined,
			set: () => {},
			delete: () => {},
			getAll: () => [],
			serialize: () => '',
		},
		getClientAddress: () => '127.0.0.1',
	} as unknown as RequestEvent;
}

/**
 * -----------------------------
 * TESTS
 * -----------------------------
 */

describe('POST /api/session-intro', () => {
	beforeEach(() => {
		vi.clearAllMocks();

		streamMock.on.mockImplementation(() => {});
		streamMock.finalMessage.mockResolvedValue({});
	});

	it('rejects invalid JSON', async () => {
		const event = {
			request: {
				json: vi.fn().mockRejectedValue(new Error('fail')),
			},
		};

		await expect(POST(event as unknown as Parameters<typeof POST>[0])).rejects.toMatchObject({
			status: 400,
		});
	});

	it('rejects short prompt', async () => {
		const event = createEvent({ prompt: 'hi' });

		await expect(POST(event as unknown as Parameters<typeof POST>[0])).rejects.toMatchObject({
			status: 400,
		});
	});

	it('calls resolveModel', async () => {
		const event = createEvent({
			prompt: 'valid long prompt',
		});

		await POST(event as unknown as Parameters<typeof POST>[0]);

		expect(resolveModelMock).toHaveBeenCalled();
	});

	it('calls anthropic stream', async () => {
		const event = createEvent({
			prompt: 'valid long prompt',
		});

		await POST(event as unknown as Parameters<typeof POST>[0]);

		expect(streamFactoryMock).toHaveBeenCalled();
	});

	it('returns SSE response', async () => {
		const event = createEvent({
			prompt: 'valid long prompt',
		});

		const res = await POST(event as unknown as Parameters<typeof POST>[0]);

		expect(res).toBeInstanceOf(Response);
		expect(res.headers.get('Content-Type')).toBe('text/event-stream');
	});
});
