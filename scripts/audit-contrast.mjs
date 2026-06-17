/**
 * WCAG contrast audit for Scaffy design tokens and common UI pairings.
 * Run: node scripts/audit-contrast.mjs
 */

const tokens = {
	background: '#0b0d0e',
	card: '#121517',
	popover: '#121517',
	muted: '#1a1e21',
	foreground: '#e6e8e6',
	mutedForeground: '#8a918e',
	primary: '#4ade80',
	primaryForeground: '#0b0d0e',
	destructive: '#ef4444',
	destructiveForeground: '#0b0d0e',
	border: '#6b7378',
	ring: '#6fc3df',
	scaffyMagenta: '#e879c5',
	scaffyCyan: '#6fc3df',
	scaffyBlue: '#5b9bf5',
	scaffyAmber: '#f4b860',
	scaffyGreen: '#4ade80',
};

function hexToRgb(hex) {
	const n = parseInt(hex.slice(1), 16);
	return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function lin(c) {
	c /= 255;
	return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

function lum(hex) {
	const [r, g, b] = hexToRgb(hex);
	return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

function contrast(fg, bg) {
	const L1 = lum(fg);
	const L2 = lum(bg);
	const [hi, lo] = L1 > L2 ? [L1, L2] : [L2, L1];
	return (hi + 0.05) / (lo + 0.05);
}

/** sRGB lerp — approximation for color-mix(in oklab, …) audits */
function mix(fg, bg, fgPercent) {
	const a = hexToRgb(fg);
	const b = hexToRgb(bg);
	const p = fgPercent / 100;
	const m = a.map((v, i) => Math.round(v * p + b[i] * (1 - p)));
	return `#${m.map((x) => x.toString(16).padStart(2, '0')).join('')}`;
}

function mixTrans(base, fg, fgPercent) {
	return mix(fg, base, fgPercent);
}

function alpha(fg, bg, opacity) {
	return mix(fg, bg, opacity * 100);
}

function audit(name, fg, bg, { large = false, ui = false } = {}) {
	const ratio = contrast(fg, bg);
	const min = ui ? 3 : large ? 3 : 4.5;
	const ok = ratio >= min;
	return { name, fg, bg, ratio, min, ok };
}

const results = [];

// --- Core token pairings (shadcn semantic) ---
const corePairs = [
	['foreground on background', tokens.foreground, tokens.background],
	['foreground on card', tokens.foreground, tokens.card],
	['foreground on muted', tokens.foreground, tokens.muted],
	['muted-foreground on background', tokens.mutedForeground, tokens.background],
	['muted-foreground on card', tokens.mutedForeground, tokens.card],
	['muted-foreground on muted', tokens.mutedForeground, tokens.muted],
	['muted-foreground on popover', tokens.mutedForeground, tokens.popover],
	['primary on background', tokens.primary, tokens.background],
	['primary on card', tokens.primary, tokens.card],
	['primary on muted', tokens.primary, tokens.muted],
	['primary-foreground on primary', tokens.primaryForeground, tokens.primary],
	['destructive on background', tokens.destructive, tokens.background],
	['destructive on card', tokens.destructive, tokens.card],
	['destructive-foreground on destructive', tokens.destructiveForeground, tokens.destructive],
	['ring on background', tokens.ring, tokens.background],
	['ring on card', tokens.ring, tokens.card],
	['ring on muted', tokens.ring, tokens.muted],
	['border on background (UI)', tokens.border, tokens.background, { ui: true }],
	['border on card (UI)', tokens.border, tokens.card, { ui: true }],
	['secondary-foreground on secondary', tokens.foreground, tokens.muted],
];

for (const [name, fg, bg, opts] of corePairs) {
	results.push(audit(name, fg, bg, opts));
}

// --- Scaffy accent tokens on common surfaces ---
for (const [label, color] of [
	['scaffy-magenta', tokens.scaffyMagenta],
	['scaffy-cyan', tokens.scaffyCyan],
	['scaffy-blue', tokens.scaffyBlue],
	['scaffy-amber', tokens.scaffyAmber],
	['scaffy-green', tokens.scaffyGreen],
]) {
	for (const [surfLabel, surf] of [
		['background', tokens.background],
		['card', tokens.card],
		['muted', tokens.muted],
	]) {
		results.push(audit(`${label} on ${surfLabel}`, color, surf));
	}
}

// --- Tailwind opacity / alpha utilities ---
const opacityPairs = [
	['text-scaffy-amber on card (session tab)', tokens.scaffyAmber, tokens.card],
	['border-scaffy-amber/80 on card (UI)', tokens.scaffyAmber, tokens.card, 0.8],
	['disabled muted-fg on muted', tokens.mutedForeground, tokens.muted],
	['hover primary/50 border on card (UI)', tokens.primary, tokens.card, 0.5],
];

for (const item of opacityPairs) {
	if (item.length === 4) {
		const [name, fg, bg, opacity] = item;
		const borderColor = alpha(fg, bg, opacity);
		const isUi = name.includes('(UI)');
		results.push(audit(name, borderColor, bg, { ui: isUi }));
	} else {
		const [name, fg, bg] = item;
		results.push(audit(name, fg, bg));
	}
}

// --- Component-specific color-mix pairings ---
const mixes = [
	['tooltip: muted-foreground on popover', tokens.mutedForeground, tokens.popover],
	[
		'modal icon fg on icon bg',
		mix(tokens.mutedForeground, tokens.foreground, 88),
		mix(tokens.mutedForeground, tokens.card, 10),
	],
	[
		'modal error icon fg on icon bg',
		mix(tokens.destructive, tokens.foreground, 82),
		mix(tokens.destructive, tokens.card, 12),
	],
	[
		'modal error border on card (UI)',
		mix(tokens.destructive, tokens.border, 55),
		tokens.card,
		{ ui: true },
	],
	['modal secondary: ring on muted', tokens.ring, tokens.muted],
	['modal danger: dfg on destructive', tokens.destructiveForeground, tokens.destructive],
	[
		'destructive-subtle: foreground on subtle',
		tokens.foreground,
		mix(tokens.destructive, tokens.card, 18),
	],
	['scaffy-error-surface', tokens.foreground, mix(tokens.destructive, tokens.card, 18)],
	[
		'destructive btn: foreground on subtle',
		tokens.foreground,
		mix(tokens.destructive, tokens.card, 18),
	],
	['learning-card pill: ring on muted', tokens.ring, tokens.muted],
	[
		'learning-card option default: muted-fg on background',
		tokens.mutedForeground,
		tokens.background,
	],
	[
		'learning-card option border (UI)',
		mix(tokens.border, tokens.background, 85),
		tokens.background,
		{ ui: true },
	],
	['learning-card feedback answer-id: primary on card', tokens.primary, tokens.card],
	['ask-chat label: magenta on card', tokens.scaffyMagenta, tokens.card],
	['ask-chat label: magenta on background', tokens.scaffyMagenta, tokens.background],
	['chat user bubble: foreground on card', tokens.foreground, tokens.card],
	[
		'chat error bubble: scaffy-error-surface',
		tokens.foreground,
		mix(tokens.destructive, tokens.card, 18),
	],
	['chat user primary bubble: pfg on primary', tokens.primaryForeground, tokens.primary],
	['monaco syntax: primary on background', tokens.primary, tokens.background],
	['monaco syntax: cyan on background', tokens.scaffyCyan, tokens.background],
	['monaco syntax: destructive on background', tokens.destructive, tokens.background],
	['monaco syntax: muted-fg on background', tokens.mutedForeground, tokens.background],
	[
		'resize handle idle line (UI)',
		mix(tokens.border, tokens.background, 85),
		tokens.background,
		{ ui: true },
	],
	['scaffy-divider on card (UI)', mix(tokens.border, tokens.card, 85), tokens.card, { ui: true }],
	['ghost nav: muted-fg on background', tokens.mutedForeground, tokens.background],
];

for (const item of mixes) {
	const [name, fg, bg, opts = {}] = item;
	results.push(audit(name, fg, bg, opts));
}

// xs text (3:1 for large/bold — 12px uppercase tracking might still need 4.5 for xs)
for (const [name, fg, bg] of [
	['xs muted-fg on background (12px labels)', tokens.mutedForeground, tokens.background],
	['xs muted-fg on card (12px labels)', tokens.mutedForeground, tokens.card],
]) {
	results.push(audit(name, fg, bg, { large: false }));
}

const failed = results.filter((r) => !r.ok).sort((a, b) => a.ratio - b.ratio);
const passed = results.filter((r) => r.ok);

console.log(`\n=== Scaffy contrast audit (${results.length} pairings) ===\n`);
console.log(`PASS: ${passed.length}  FAIL: ${failed.length}\n`);

if (failed.length) {
	console.log('--- FAILURES ---');
	for (const r of failed) {
		console.log(`${r.ratio.toFixed(2)}:1 (need ${r.min}:1)  ${r.name}\n    fg ${r.fg}  bg ${r.bg}`);
	}
}

console.log('\n--- BORDERLINE (pass but < 5:1 text) ---');
for (const r of passed
	.filter((x) => !x.name.includes('(UI)') && x.ratio < 5)
	.sort((a, b) => a.ratio - b.ratio)) {
	console.log(`${r.ratio.toFixed(2)}:1  ${r.name}`);
}
