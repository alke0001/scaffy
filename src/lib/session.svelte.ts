import { browser } from '$app/environment';
import type { ChatMessage } from '$lib/types/chat-message.js';
import type { Scaffold } from '$lib/types/scaffold';
import { LESSON_SCAFFOLD_COUNT } from '$lib/types/scaffold';
import { devLog } from '$lib/dev/log.js';

/**
 * Global Learn session store (singleton).
 *
 * ## Three state layers in Scaffy
 * 1. **URL** — `/session/:id` selects which session the workspace shows.
 * 2. **This module** — session list, scaffold payloads, API status (persisted).
 * 3. **Component-local** — Monaco step index, Learning Card UI, Ask chat (ephemeral).
 *
 * See `docs/architecture.md` §6 for the full map.
 *
 * ## In-memory ($state)
 * - `sessions` — all SessionRecord entries (source of truth).
 * - `activeSessionId` — tab focus; which session drives the workspace.
 * - `status`, `errorMessage` — mirrors the **active** session row only (convenience for UI).
 *
 * ## Persisted (localStorage, browser-only)
 * - `scaffy.sessions` — SessionRecord[] including scaffold JSON from Claude.
 * - `scaffy.activeSessionId` — last active tab.
 * Written on every mutating export; restored once at module load via `restoreSessions()`.
 *
 * ## SessionStatus lifecycle
 * `idle` → `loading` (`startScaffoldRequest`) → `ready` (`setScaffolds`) | `error` (`setScaffoldError`).
 * `retryScaffoldRequest` resets to `loading`. `completed` flips via `markSessionCompleted()`.
 *
 * ## Not stored in localStorage
 * - In-lesson step index / answered cards → `monaco-editor.svelte` (lost on reload).
 * - Ask chat (`askMessages`) → in-memory on `SessionRecord` only (survives SPA navigation; lost on reload).
 *
 * @see docs/decisions.md ADR-009, ADR-014
 */

export type SessionStatus = 'idle' | 'loading' | 'ready' | 'error';

/** One learning session — core fields persisted in localStorage as part of `sessions[]`. */
export type SessionRecord = {
	id: string;
	prompt: string;
	createdAt: string;
	scaffolds: Scaffold[];
	status: SessionStatus;
	errorMessage: string | null;
	completed: boolean;
	/** Ask-mode thread — in-memory only (stripped before localStorage). */
	askMessages: ChatMessage[];
};

type PersistedSessionRecord = Omit<SessionRecord, 'askMessages'>;

const STORAGE_KEY = 'scaffy.sessions';
const ACTIVE_SESSION_KEY = 'scaffy.activeSessionId';

/** Mirror of the active session's status (see `syncActiveState`). */
let status = $state<SessionStatus>('idle');
/** All sessions — source of truth; persisted to localStorage. */
let sessions = $state<SessionRecord[]>([]);
/** Tab focus; persisted to localStorage. */
let activeSessionId = $state<string | null>(null);
/** Mirror of the active session's error (see `syncActiveState`). */
let errorMessage = $state<string | null>(null);

function createSessionId() {
	if (browser && 'crypto' in window && typeof window.crypto.randomUUID === 'function') {
		return window.crypto.randomUUID();
	}
	return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

// --- Persistence (localStorage) ---

function toPersistedSession({ askMessages, ...rest }: SessionRecord): PersistedSessionRecord {
	void askMessages;
	return rest;
}

function persistSessions() {
	if (!browser) return;
	const persisted = sessions.map(toPersistedSession);
	localStorage.setItem(STORAGE_KEY, JSON.stringify(persisted));
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
						askMessages: [],
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

/** Copy active session row into top-level `status` / `errorMessage` mirrors. */
function syncActiveState() {
	const active = getActiveSession();
	status = active?.status ?? (sessions.length > 0 ? 'ready' : 'idle');
	errorMessage = active?.errorMessage ?? null;
}

restoreSessions();

// --- Read accessors ---

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

const IN_FLIGHT_ASK_STATUSES = new Set<ChatMessage['status']>(['pending', 'loading', 'streaming']);

/** Ask messages storable in the session singleton (drops in-flight assistant placeholders). */
function storableAskMessages(messages: ChatMessage[]): ChatMessage[] {
	return messages.filter((message) => !IN_FLIGHT_ASK_STATUSES.has(message.status));
}

function askMessagesSnapshot(messages: ChatMessage[]): string {
	return messages
		.map(
			(message) =>
				`${message.id}:${message.status}:${message.content}:${message.errorMessage ?? ''}`,
		)
		.join('|');
}

export function getAskMessages(sessionId: string): ChatMessage[] {
	return getSessionById(sessionId)?.askMessages ?? [];
}

/** In-memory only — not written to localStorage. */
export function setAskMessages(sessionId: string, messages: ChatMessage[]): void {
	const session = getSessionById(sessionId);
	if (!session) return;

	const next = storableAskMessages(messages);
	if (askMessagesSnapshot(session.askMessages) === askMessagesSnapshot(next)) return;

	sessions = sessions.map((entry) =>
		entry.id === sessionId ? { ...entry, askMessages: next } : entry,
	);
}

// --- Session mutations (persist after each change) ---

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
						askMessages: [],
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
			askMessages: [],
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
					askMessages: [],
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
