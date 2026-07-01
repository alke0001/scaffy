/**
 * i18n public API (`src/lib/i18n`).
 *
 * - **Copy:** `translations.ts` — static EN/DE strings, `MessageKey` types, `check:i18n` parity (ADR-020).
 * - **Runtime locale state:** `global-state/translation.svelte.ts` — `$state` + `scaffy.language` localStorage.
 * - **This file:** Svelte store adapters (`language`, `messages`) for `$language` / `$messages`, plus `t()`.
 */

import { derived, get, writable } from 'svelte/store';
import { getLanguage, setLanguage } from '$lib/global-state/translation.svelte.js';
import {
	AVAILABLE_LANGUAGES,
	DEFAULT_LANGUAGE,
	TRANSLATIONS,
	type LanguageCode,
	type MessageKey,
} from './translations.js';

function createLanguageStore() {
	const { subscribe, set: setStore } = writable<LanguageCode>(getLanguage());

	return {
		subscribe,
		set(code: LanguageCode) {
			setLanguage(code);
			setStore(getLanguage());
		},
	};
}

/** UI locale — mutations call `setLanguage()` → `scaffy.language` in localStorage. */
export const language = createLanguageStore();

export const messages = derived(
	language,
	($language): Record<MessageKey, string> =>
		TRANSLATIONS[$language] ?? TRANSLATIONS[DEFAULT_LANGUAGE],
);

export function t(key: MessageKey, params?: Record<string, string | number>): string {
	const dictionary = get(messages);
	const value = dictionary[key] ?? key;
	if (!params) return value;
	return value.replace(/\{(\w+)\}/g, (_, name) => String(params[name] ?? `{${name}}`));
}

export { AVAILABLE_LANGUAGES, type LanguageCode, type MessageKey };
