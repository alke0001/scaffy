import { fetchJson } from '$lib/api/kit-error.js';
import { devLog } from '$lib/dev/log.js';
import fallbackData from '$lib/learn/scaffold-fallback.json';
import {
	retryScaffoldRequest,
	setScaffoldError,
	setScaffolds,
	startScaffoldRequest,
	getSessionById,
} from '$lib/session.svelte.js';
import { validateCumulativeChain } from '$lib/scaffold/validate-cumulative.js';
import { LESSON_SCAFFOLD_COUNT, type StructuredScaffoldOutput } from '$lib/types/scaffold.js';

const inFlight = new Map<string, Promise<void>>();

function isValidFallback(data: unknown): data is StructuredScaffoldOutput {
	if (typeof data !== 'object' || data === null || !('scaffolds' in data)) return false;
	const { scaffolds } = data as { scaffolds: unknown };
	if (!Array.isArray(scaffolds) || scaffolds.length !== LESSON_SCAFFOLD_COUNT) return false;
	for (const step of scaffolds) {
		if (typeof step !== 'object' || step === null) return false;
		const s = step as Record<string, unknown>;
		if (typeof s.codeSnippet !== 'string') return false;
		if (typeof s.knowledgeCheck !== 'object' || s.knowledgeCheck === null) return false;
	}
	return validateCumulativeChain(scaffolds as { codeSnippet: string }[]).ok;
}

export function isFallbackScaffoldAvailable(): boolean {
	return isValidFallback(fallbackData);
}

async function fetchScaffoldOnce(prompt: string, sessionId: string): Promise<void> {
	devLog('scaffold', 'fetch start', { sessionId, promptLength: prompt.length });
	const data = await fetchJson<StructuredScaffoldOutput>('/api/scaffold', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ prompt }),
	});
	setScaffolds(data.scaffolds, sessionId);
	devLog('scaffold', 'fetch ready', { sessionId, steps: data.scaffolds.length });
}

async function fetchScaffoldWithRetry(prompt: string, sessionId: string): Promise<void> {
	try {
		await fetchScaffoldOnce(prompt, sessionId);
	} catch (firstError) {
		devLog('scaffold', 'fetch retry after failure', {
			sessionId,
			error: firstError instanceof Error ? firstError.message : String(firstError),
		});
		await fetchScaffoldOnce(prompt, sessionId);
	}
}

function scheduleScaffoldWork(sessionId: string, work: Promise<void>): Promise<void> {
	const tracked = work.finally(() => {
		inFlight.delete(sessionId);
	});
	inFlight.set(sessionId, tracked);
	return tracked;
}

/** Resumes or starts scaffold fetch for a session in `loading` (single-flight per session). */
export function ensureScaffold(sessionId: string): Promise<void> {
	const existing = inFlight.get(sessionId);
	if (existing) {
		devLog('scaffold', 'ensureScaffold — already in flight', { sessionId });
		return existing;
	}

	const session = getSessionById(sessionId);
	if (!session) {
		devLog('scaffold', 'ensureScaffold — skip (no session)', { sessionId });
		return Promise.resolve();
	}
	if (session.status !== 'loading') {
		devLog('scaffold', 'ensureScaffold — skip (not loading)', {
			sessionId,
			status: session.status,
		});
		return Promise.resolve();
	}
	if (session.scaffolds.length > 0) {
		devLog('scaffold', 'ensureScaffold — skip (scaffolds present)', {
			sessionId,
			count: session.scaffolds.length,
		});
		return Promise.resolve();
	}

	devLog('scaffold', 'ensureScaffold — scheduling fetch', { sessionId });
	return scheduleScaffoldWork(
		sessionId,
		fetchScaffoldWithRetry(session.prompt, sessionId).catch((e) => {
			const message = e instanceof Error ? e.message : 'Request failed.';
			devLog('scaffold', 'fetch failed', { sessionId, message });
			setScaffoldError(message, sessionId);
			throw e;
		}),
	);
}

/** Creates a loading session in the store; fetch runs via ensureScaffold on the session route. */
export function startLearnSession(prompt: string, sessionId: string): string {
	devLog('session', 'startLearnSession', { sessionId, promptLength: prompt.length });
	return startScaffoldRequest(prompt, sessionId);
}

/** Starts session and waits for scaffolds (Home / ChatPanel). */
export async function requestScaffold(prompt: string, sessionId: string): Promise<void> {
	startScaffoldRequest(prompt, sessionId);
	await ensureScaffold(sessionId);
}

/** Resets a failed session to loading and refetches scaffolds. */
export async function retryScaffold(sessionId: string): Promise<void> {
	retryScaffoldRequest(sessionId);
	await ensureScaffold(sessionId);
}

/** Loads static fallback JSON into the session (dev / emergency). */
export function loadFallbackScaffolds(sessionId: string): void {
	if (!isValidFallback(fallbackData)) {
		setScaffoldError(
			'Fallback JSON is empty or invalid. Paste 3 scaffolds into src/lib/learn/scaffold-fallback.json.',
			sessionId,
		);
		return;
	}
	setScaffolds(fallbackData.scaffolds, sessionId);
}
