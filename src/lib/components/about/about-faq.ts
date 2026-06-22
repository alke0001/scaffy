/**
 * Ordered FAQ entry ids. The question/answer copy lives in the language file
 * (`$lib/i18n/translations.ts`) under `about.faq.<id>.question` / `.answer`.
 */
export const ABOUT_FAQ_IDS = [
	'chatgpt',
	'prompt',
	'locked',
	'wrong',
	'scaffolds',
	'storage',
	'apikey',
	'frameworks',
] as const;

export type AboutFaqId = (typeof ABOUT_FAQ_IDS)[number];
