import { describe, it, expect } from 'vitest';
import { buildMessages, encodeSse } from './utils';

describe('chat utils', () => {
	/**
	 * -----------------------------
	 * encodeSse
	 * -----------------------------
	 */
	describe('encodeSse', () => {
		it('encodes payload into SSE format', () => {
			const result = encodeSse({ type: 'test', text: 'hello' });

			const decoded = new TextDecoder().decode(result);

			expect(decoded).toBe('data: {"type":"test","text":"hello"}\n\n');
		});

		it('encodes empty object correctly', () => {
			const result = encodeSse({});

			const decoded = new TextDecoder().decode(result);

			expect(decoded).toBe('data: {}\n\n');
		});

		it('serializes nested objects correctly', () => {
			const result = encodeSse({
				type: 'complex',
				data: { a: 1, b: { c: 2 } },
			});

			const decoded = new TextDecoder().decode(result);

			expect(decoded).toBe('data: {"type":"complex","data":{"a":1,"b":{"c":2}}}\n\n');
		});
	});

	/**
	 * -----------------------------
	 * buildMessages
	 * -----------------------------
	 */
	describe('buildMessages', () => {
		it('adds trimmed prompt as last message', () => {
			const result = buildMessages('hello world', undefined);

			expect(result).toEqual([
				{
					role: 'user',
					content: 'hello world',
				},
			]);
		});

		it('filters invalid history entries', () => {
			const result = buildMessages('final prompt', [
				{ role: 'user', content: '  hi  ' },
				{ role: 'assistant', content: 'hello' },
				{ role: 'system', content: 'ignore me' },
				{ role: 'user', content: '' },
			]);

			expect(result).toEqual([
				{ role: 'user', content: 'hi' },
				{ role: 'assistant', content: 'hello' },
				{ role: 'user', content: 'final prompt' },
			]);
		});

		it('removes empty string content', () => {
			const result = buildMessages('test', [
				{ role: 'user', content: '   ' },
				{ role: 'assistant', content: '' },
			]);

			expect(result).toEqual([{ role: 'user', content: 'test' }]);
		});

		it('limits history to last 30 messages', () => {
			const history = [];

			for (let i = 0; i < 50; i++) {
				history.push({
					role: 'user',
					content: `msg-${i}`,
				});
			}

			const result = buildMessages('final', history);

			// 30 history + 1 prompt
			expect(result).toHaveLength(31);

			// first retained message should be msg-20
			expect(result[0].content).toBe('msg-20');

			// last message is prompt
			expect(result[result.length - 1]).toEqual({
				role: 'user',
				content: 'final',
			});
		});

		it('ignores non user/assistant roles', () => {
			const result = buildMessages('end', [
				{ role: 'system', content: 'sys' },
				{ role: 'tool', content: 'tool data' },
				{ role: 'user', content: 'ok' },
			]);

			expect(result).toEqual([
				{ role: 'user', content: 'ok' },
				{ role: 'user', content: 'end' },
			]);
		});
	});
});
