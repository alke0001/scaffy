/**
 * UI language store (`src/lib/i18n`).
 *
 * **localStorage:** `language.subscribe()` persists `scaffy.language` on every change.
 * Copy lives in `translations.ts` (not persisted).
 */

import { browser } from '$app/environment';
import { derived, get, writable } from 'svelte/store';
import {
	AVAILABLE_LANGUAGES,
	DEFAULT_LANGUAGE,
	TRANSLATIONS,
	type LanguageCode,
	type MessageKey,
} from './translations.js';

const STORAGE_KEY = 'scaffy.language';

const initialLanguage = (() => {
	if (!browser) return DEFAULT_LANGUAGE;
	const stored = localStorage.getItem(STORAGE_KEY);
	if (stored && Object.keys(TRANSLATIONS).includes(stored)) {
		return stored as LanguageCode;
	}
	return DEFAULT_LANGUAGE;
})();

export const language = writable<LanguageCode>(initialLanguage);
export const messages = derived(
	language,
	($language): Record<MessageKey, string> =>
		TRANSLATIONS[$language] ?? TRANSLATIONS[DEFAULT_LANGUAGE],
);

language.subscribe((value) => {
	if (!browser) return;
	localStorage.setItem(STORAGE_KEY, value);
});

export function t(key: MessageKey, params?: Record<string, string | number>): string {
	const dictionary = get(messages);
	const value = dictionary[key] ?? key;
	if (!params) return value;
	return value.replace(/\{(\w+)\}/g, (_, name) => String(params[name] ?? `{${name}}`));
}

export { AVAILABLE_LANGUAGES, type LanguageCode, type MessageKey };
