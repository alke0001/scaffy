import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { RequestEvent } from '@sveltejs/kit';
import { POST } from './+server';

/**
 * ✅ HOISTED mocks (fixes initialization error)
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

const anthropicStreamMock = vi.hoisted(() => vi.fn(() => streamMock));

/**
 * -----------------------------
 * Mocks
 * -----------------------------
 */

vi.mock('@sveltejs/kit', () => ({
	error: (status: number, message: string) => {
		const err = new Error(message) as Error & { status: number };
		err.status = status;
		throw err;
	},
}));

vi.mock('$lib/server/chat/system-prompt.md?raw', () => ({
	default: 'Language: {{COURSE_LANGUAGE}}',
}));

vi.mock('$lib/server/anthropic-client.js', () => ({
	resolveModel: resolveModelMock,
	client: {
		messages: {
			stream: anthropicStreamMock,
		},
	},
}));

/**
 * -----------------------------
 * Helper
 * -----------------------------
 */
function createEvent(body: unknown): RequestEvent {
	return {
		request: {
			json: async () => body,
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
 * Tests
 * -----------------------------
 */
describe('POST /api/chat', () => {
	beforeEach(() => {
		vi.clearAllMocks();

		streamMock.on.mockImplementation(() => {});
		streamMock.finalMessage.mockResolvedValue({});
	});

	it('throws 400 on invalid JSON', async () => {
		const event = {
			request: {
				json: vi.fn().mockRejectedValue(new Error('fail')),
			},
		};
		await expect(POST(event as unknown as Parameters<typeof POST>[0])).rejects.toMatchObject({
			status: 400,
		});
	});

	it('throws 400 if prompt too short', async () => {
		const event = createEvent({
			prompt: 'hi',
		});

		await expect(POST(event as unknown as Parameters<typeof POST>[0])).rejects.toMatchObject({
			status: 400,
		});
	});

	it('calls resolveModel', async () => {
		const event = createEvent({
			prompt: 'Dies ist ein ausreichend langer Prompt.',
		});

		await POST(event as unknown as Parameters<typeof POST>[0]);

		expect(resolveModelMock).toHaveBeenCalled();
	});

	it('calls anthropic stream', async () => {
		const event = createEvent({
			prompt: 'Dies ist ein ausreichend langer Prompt.',
		});

		await POST(event as unknown as Parameters<typeof POST>[0]);

		expect(anthropicStreamMock).toHaveBeenCalled();
	});

	it('returns SSE response', async () => {
		const event = createEvent({
			prompt: 'Dies ist ein ausreichend langer Prompt.',
		});

		const res = await POST(event as unknown as Parameters<typeof POST>[0]);

		expect(res).toBeInstanceOf(Response);
		expect(res.headers.get('Content-Type')).toBe('text/event-stream');
	});
});
