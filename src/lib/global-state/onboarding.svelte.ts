/**
 * First-use onboarding spotlight (`src/lib/global-state/onboarding.svelte.ts`).
 *
 * **localStorage:** `completeOnboarding()` writes `scaffy.onboarding.v1`. Restored once at module load.
 *
 * ## In-memory ($state)
 * - `completed` — whether the user dismissed the one-step chat-pane spotlight.
 *
 * ## Persisted (localStorage, browser-only)
 * - `scaffy.onboarding.v1` — `'true'` after dismiss; absent/false shows spotlight on first session.
 *
 * ## Not in this module
 * - Spotlight UI → `onboarding-coordinator.svelte` + `OnboardingSpotlight`.
 * - Session start gate → `session.svelte.ts` (`lessonStarted`, ADR-021).
 *
 * @see docs/decisions.md ADR-021
 */

import { browser } from '$app/environment';

const STORAGE_KEY = 'scaffy.onboarding.v1';

let completed = $state(load());

function load(): boolean {
	if (!browser) return true;
	return localStorage.getItem(STORAGE_KEY) === 'true';
}

function persist(): void {
	if (!browser) return;
	localStorage.setItem(STORAGE_KEY, String(completed));
}

export function hasCompletedOnboarding(): boolean {
	return completed;
}

export function completeOnboarding(): void {
	if (completed) return;
	completed = true;
	persist();
}
