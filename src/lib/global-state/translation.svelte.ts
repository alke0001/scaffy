/**
 * UI language preference (`src/lib/global-state/translation.svelte.ts`).
 *
 * **localStorage:** `setLanguage()` writes `scaffy.language`. Restored once at module load via `load()`.
 *
 * ## Not in this module
 * - Static copy (EN/DE strings, types) → `src/lib/i18n/translations.ts` — never persisted.
 * - Store adapters (`language`, `messages`) and `t()` → `src/lib/i18n/index.ts` for `$language` / `$messages`.
 *
 * **Why keep the store layer in `index.ts`?** Locale *state* lives here (`$state` + localStorage); we deliberately
 * avoid migrating every consumer to `getLanguage()` / `getMessages()` in `$derived` — that would touch many
 * components and non-Svelte call sites for little product gain right now. The thin `writable` / `derived` adapters
 * preserve the existing template API (`$language`, `$messages`) and `get(language)` in `.ts` files while this
 * module remains the single source of truth. Svelte 5 still documents stores for simple global values with many
 * subscribers (ADR-023); the adapter is ~15 lines and syncs mutations through `setLanguage()` only.
 *
 * @see docs/decisions.md ADR-020, ADR-023
 */

import { browser } from '$app/environment';
import {
	DEFAULT_LANGUAGE,
	TRANSLATIONS,
	type LanguageCode,
	type MessageKey,
} from '$lib/i18n/translations.js';

const STORAGE_KEY = 'scaffy.language';

/** Active UI locale — source of truth; synced to localStorage on change. */
let language = $state<LanguageCode>(load());

function load(): LanguageCode {
	if (!browser) return DEFAULT_LANGUAGE;
	const stored = localStorage.getItem(STORAGE_KEY);
	if (stored && stored in TRANSLATIONS) return stored as LanguageCode;
	return DEFAULT_LANGUAGE;
}

function persist(): void {
	if (!browser) return;
	localStorage.setItem(STORAGE_KEY, language);
}

/** Current locale code (reactive when read inside Svelte `$derived` / `$effect`). */
export function getLanguage(): LanguageCode {
	return language;
}

/** Switch locale and persist to `scaffy.language`. No-op for unknown codes or same value. */
export function setLanguage(code: LanguageCode): void {
	if (!(code in TRANSLATIONS) || language === code) return;
	language = code;
	persist();
}

/** Message map for the active locale (derived from in-memory `language` + static `TRANSLATIONS`). */
export function getMessages(): Record<MessageKey, string> {
	return TRANSLATIONS[language] ?? TRANSLATIONS[DEFAULT_LANGUAGE];
}
