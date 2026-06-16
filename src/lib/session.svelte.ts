import { browser } from '$app/environment';
import type { Scaffold } from '$lib/types/scaffold';
import { LESSON_SCAFFOLD_COUNT } from '$lib/types/scaffold';
import { devLog } from '$lib/dev/log.js';

export type SessionStatus = 'idle' | 'loading' | 'ready' | 'error';

export type SessionRecord = {
	id: string;
	prompt: string;
	createdAt: string;
	scaffolds: Scaffold[];
	status: SessionStatus;
	errorMessage: string | null;
	completed: boolean;
};

const STORAGE_KEY = 'scaffy.sessions';
const ACTIVE_SESSION_KEY = 'scaffy.activeSessionId';

let status = $state<SessionStatus>('idle');
let sessions = $state<SessionRecord[]>([]);
let activeSessionId = $state<string | null>(null);
let errorMessage = $state<string | null>(null);

function createSessionId() {
	if (browser && 'crypto' in window && typeof window.crypto.randomUUID === 'function') {
		return window.crypto.randomUUID();
	}
	return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function persistSessions() {
	if (!browser) return;
	localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
	localStorage.setItem(ACTIVE_SESSION_KEY, activeSessionId ?? '');
}

function restoreSessions() {
	if (!browser) return;
	const rawSessions = localStorage.getItem(STORAGE_KEY);
	if (!rawSessions) return;

	try {
		const parsed = JSON.parse(rawSessions) as unknown;
		if (Array.isArray(parsed)) {
			sessions = parsed
				.filter((item): item is SessionRecord =>
					Boolean(
						item &&
						typeof (item as SessionRecord).id === 'string' &&
						typeof (item as SessionRecord).prompt === 'string' &&
						Array.isArray((item as SessionRecord).scaffolds),
					),
				)
				.map((item) => {
					const scaffolds = item.scaffolds ?? [];
					const status =
						item.status ?? (scaffolds.length > 0 ? ('ready' as const) : ('idle' as const));
					return {
						...item,
						scaffolds,
						status,
						errorMessage: item.errorMessage ?? null,
						completed: item.completed ?? false,
					};
				});
		}
	} catch {
		// ignore invalid storage data
	}

	const savedActive = localStorage.getItem(ACTIVE_SESSION_KEY);
	if (savedActive && sessions.some((session) => session.id === savedActive)) {
		activeSessionId = savedActive;
	} else if (sessions.length > 0) {
		activeSessionId = sessions[0].id;
	}

	syncActiveState();
}

function syncActiveState() {
	const active = getActiveSession();
	status = active?.status ?? (sessions.length > 0 ? 'ready' : 'idle');
	errorMessage = active?.errorMessage ?? null;
}

restoreSessions();

export function getSessionStatus(): SessionStatus {
	return status;
}

export function getSessions(): SessionRecord[] {
	return sessions;
}

export function getActiveSessionId(): string | null {
	return activeSessionId;
}

export function getActiveSession(): SessionRecord | null {
	return sessions.find((session) => session.id === activeSessionId) ?? null;
}

export function getSessionById(id: string): SessionRecord | null {
	return sessions.find((session) => session.id === id) ?? null;
}

export function getScaffolds(): Scaffold[] {
	return getActiveSession()?.scaffolds ?? [];
}

export function getSessionError(): string | null {
	return errorMessage;
}

export function startScaffoldRequest(prompt: string, preferredId?: string): string {
	const id = preferredId ?? createSessionId();

	const existing = sessions.find((session) => session.id === id);
	if (existing) {
		sessions = sessions.map((session) =>
			session.id === id
				? {
						...session,
						prompt,
						scaffolds: [],
						status: 'loading',
						errorMessage: null,
						completed: false,
					}
				: session,
		);
	} else {
		const session: SessionRecord = {
			id,
			prompt,
			// eslint-disable-next-line svelte/prefer-svelte-reactivity
			createdAt: new Date().toISOString(),
			scaffolds: [],
			status: 'loading',
			errorMessage: null,
			completed: false,
		};
		sessions = [session, ...sessions];
	}

	activeSessionId = id;
	status = 'loading';
	errorMessage = null;
	persistSessions();
	devLog('session', 'startScaffoldRequest', { id, promptLength: prompt.length });
	return id;
}

export function setScaffolds(next: Scaffold[], sessionId?: string): void {
	const id = sessionId ?? activeSessionId;
	if (!id) return;

	sessions = sessions.map((session) =>
		session.id === id
			? {
					...session,
					scaffolds: next,
					status: 'ready',
					errorMessage: null,
					completed: false,
				}
			: session,
	);

	if (activeSessionId === id) {
		status = 'ready';
		errorMessage = null;
	}
	persistSessions();
	devLog('session', 'setScaffolds', { sessionId: id, count: next.length });
}

export function setScaffoldError(message: string, sessionId?: string): void {
	const id = sessionId ?? activeSessionId;
	if (!id) return;

	sessions = sessions.map((session) =>
		session.id === id
			? {
					...session,
					status: 'error',
					errorMessage: message,
				}
			: session,
	);

	if (activeSessionId === id) {
		status = 'error';
		errorMessage = message;
	}
	persistSessions();
	devLog('session', 'setScaffoldError', { sessionId: id, message });
}

export function retryScaffoldRequest(sessionId: string): void {
	sessions = sessions.map((session) =>
		session.id === sessionId
			? {
					...session,
					scaffolds: [],
					status: 'loading',
					errorMessage: null,
					completed: false,
				}
			: session,
	);

	if (activeSessionId === sessionId) {
		status = 'loading';
		errorMessage = null;
	}
	persistSessions();
}

export function markSessionCompleted(sessionId?: string): void {
	const id = sessionId ?? activeSessionId;
	if (!id) return;

	const session = sessions.find((entry) => entry.id === id);
	if (!session) return;
	if (session.status !== 'ready' || session.scaffolds.length < LESSON_SCAFFOLD_COUNT) return;

	sessions = sessions.map((session) =>
		session.id === id
			? {
					...session,
					completed: true,
				}
			: session,
	);

	persistSessions();
}

export function setActiveSessionId(id: string): void {
	if (activeSessionId === id) return;
	if (!sessions.some((session) => session.id === id)) return;

	activeSessionId = id;
	persistSessions();
	syncActiveState();
	devLog('session', 'setActiveSessionId', { id, status: getActiveSession()?.status });
}

export function deleteSession(id: string): void {
	sessions = sessions.filter((session) => session.id !== id);

	if (activeSessionId === id) {
		activeSessionId = sessions.length > 0 ? sessions[0].id : null;
	}

	syncActiveState();
	persistSessions();
}

export function resetScaffolds(): void {
	sessions = [];
	activeSessionId = null;
	status = 'idle';
	errorMessage = null;
	persistSessions();
}
