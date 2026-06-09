import { fetchJson } from '$lib/api/kit-error.js';
import { setScaffoldError, setScaffolds, startScaffoldRequest } from '$lib/session.svelte.js';
import type { StructuredScaffoldOutput } from '$lib/types/scaffold.js';

/** Starts a learn session in the store and fetches scaffolds from `/api/scaffold`. */
export async function requestScaffold(prompt: string, sessionId: string): Promise<void> {
	startScaffoldRequest(prompt, sessionId);

	try {
		const data = await fetchJson<StructuredScaffoldOutput>('/api/scaffold', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ prompt }),
		});
		setScaffolds(data.scaffolds, sessionId);
		if (import.meta.env.DEV) {
			console.log('[request-scaffold] ready', data.scaffolds.length, 'steps');
		}
	} catch (e) {
		const message = e instanceof Error ? e.message : 'Request failed.';
		setScaffoldError(message, sessionId);
		throw e;
	}
}
