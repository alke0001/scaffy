/**
 * Verifies EN/DE translation key parity in `src/lib/i18n/translations.ts`.
 * Run via `pnpm run check:i18n` (CI + lint-staged when translations.ts changes).
 */

import { TRANSLATIONS } from '../src/lib/i18n/translations.ts';

const enKeys = Object.keys(TRANSLATIONS.en).sort();
const deKeys = Object.keys(TRANSLATIONS.de).sort();
const deKeySet = new Set(deKeys);
const enKeySet = new Set(enKeys);

const onlyEn = enKeys.filter((key) => !deKeySet.has(key));
const onlyDe = deKeys.filter((key) => !enKeySet.has(key));

if (onlyEn.length === 0 && onlyDe.length === 0) {
	console.log(`i18n: ${enKeys.length} keys — en/de parity OK`);
	process.exit(0);
}

console.error('i18n: en/de key mismatch in src/lib/i18n/translations.ts\n');

if (onlyEn.length > 0) {
	console.error(`Keys only in en (${onlyEn.length}):`);
	for (const key of onlyEn) console.error(`  - ${key}`);
}

if (onlyDe.length > 0) {
	console.error(`Keys only in de (${onlyDe.length}):`);
	for (const key of onlyDe) console.error(`  - ${key}`);
}

process.exit(1);
