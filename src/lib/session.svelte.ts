import type { Scaffold } from '$lib/types/scaffold';

export type SessionStatus = 'idle' | 'loading' | 'ready' | 'error';

let status = $state<SessionStatus>('idle');
let scaffolds = $state<Scaffold[]>([]);
let errorMessage = $state<string | null>(null);

export function getSessionStatus(): SessionStatus {
	return status;
}

export function getScaffolds(): Scaffold[] {
	return scaffolds;
}

export function getSessionError(): string | null {
	return errorMessage;
}

export function startScaffoldRequest(): void {
	scaffolds = [];
	status = 'loading';
	errorMessage = null;
}

export function setScaffolds(next: Scaffold[]): void {
	scaffolds = next;
	status = 'ready';
	errorMessage = null;
}

export function setScaffoldError(message: string): void {
	errorMessage = message;
	status = 'error';
}

export function resetScaffolds(): void {
	scaffolds = [];
	status = 'idle';
	errorMessage = null;
}
