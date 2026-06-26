import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { HttpError, RequestEvent } from '@sveltejs/kit';
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

const validateLessonOutputMock = vi.hoisted(() => vi.fn());

const shuffleMock = vi.hoisted(() => vi.fn((x) => x));

const createMock = vi.hoisted(() => vi.fn());

/**
 * -----------------------------
 * MODULE MOCKS
 * -----------------------------
 */

vi.mock('@sveltejs/kit', async () => {
	const actual = await vi.importActual('@sveltejs/kit');
	return {
		...actual,
		json: (data: unknown) => new Response(JSON.stringify(data)),
		error: (status: number, message: string) => {
			const err = new Error(message) as Error & { status: number };
			err.status = status;
			throw err;
		},
		isHttpError: (e: unknown): e is HttpError => {
			return typeof e === 'object' && e !== null && 'status' in e;
		},
	};
});

vi.mock('$lib/server/anthropic-client.js', () => ({
	resolveModel: resolveModelMock,
	client: {
		messages: {
			create: createMock,
		},
	},
}));

vi.mock('$lib/server/scaffold/validate-lesson.js', () => ({
	validateLessonOutput: validateLessonOutputMock,
}));

vi.mock('$lib/server/scaffold/post-process.js', () => ({
	shuffleScaffoldOptions: shuffleMock,
}));

vi.mock('$lib/server/scaffold/system-prompt.md?raw', () => ({
	default: 'system {{COURSE_LANGUAGE}}',
}));

vi.mock('$lib/server/scaffold/output-schema.js', () => ({
	OUTPUT_JSON_SCHEMA: {},
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

describe('POST /api/scaffold', () => {
	beforeEach(() => {
		vi.clearAllMocks();

		validateLessonOutputMock.mockReturnValue({
			ok: true,
			value: { scaffolds: ['a', 'b', 'c'] },
		});

		createMock.mockResolvedValue({
			stop_reason: 'end_turn',
			content: [{ type: 'text', text: '{"scaffolds":["a","b","c"]}' }],
		});
	});

	it('rejects invalid JSON', async () => {
		const event = {
			request: {
				json: vi.fn().mockRejectedValue(new Error()),
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

	it('calls anthropic create', async () => {
		const event = createEvent({
			prompt: 'valid long prompt',
		});

		await POST(event as unknown as Parameters<typeof POST>[0]);

		expect(createMock).toHaveBeenCalled();
	});

	it('returns json response', async () => {
		const event = createEvent({
			prompt: 'valid long prompt',
		});

		const res = await POST(event as unknown as Parameters<typeof POST>[0]);

		expect(res).toBeInstanceOf(Response);

		const json = await res.json();
		expect(json).toHaveProperty('scaffolds');
	});
});
