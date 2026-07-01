/**
 * Production dependency license audit and CycloneDX SBOM generation (ADR-024).
 * Flow: full license-checker scan → sbom.json → validate against allowed-licenses.json.
 *
 * Usage:
 *   node scripts/license-audit.mjs sbom   — write sbom.json (no allowlist gate)
 *   node scripts/license-audit.mjs check  — validate existing sbom.json
 *   node scripts/license-audit.mjs ci     — sbom + check (CI)
 */

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const ALLOWLIST_PATH = join(__dirname, 'allowed-licenses.json');
const SBOM_PATH = join(ROOT, 'sbom.json');
const LICENSE_CHECKER = join(
	dirname(require.resolve('license-checker/package.json')),
	'bin',
	'license-checker',
);

const { allowed } = JSON.parse(readFileSync(ALLOWLIST_PATH, 'utf8'));
if (!Array.isArray(allowed) || allowed.length === 0) {
	console.error('allowed-licenses.json: "allowed" must be a non-empty array');
	process.exit(1);
}

const allowedSet = new Set(allowed);

/** @returns {Record<string, { licenses: string }>} */
function scanProductionPackages() {
	const stdout = execFileSync(
		process.execPath,
		[LICENSE_CHECKER, '--production', '--excludePrivatePackages', '--json'],
		{ cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] },
	);
	return JSON.parse(stdout);
}

/** @param {string} key e.g. "@scope/pkg@1.2.3" */
function parsePackageKey(key) {
	const at = key.lastIndexOf('@');
	if (at <= 0) throw new Error(`Invalid package key: ${key}`);
	return { name: key.slice(0, at), version: key.slice(at + 1) };
}

/** @param {string} name */
function npmPurl(name, version) {
	const encoded = name.replace(/^@/, '%40').replace('/', '%2F');
	return `pkg:npm/${encoded}@${version}`;
}

/** @param {Record<string, { licenses: string }>} packages */
function toCycloneDx(packages) {
	const components = Object.entries(packages).map(([key, info]) => {
		const { name, version } = parsePackageKey(key);
		return {
			type: 'library',
			'bom-ref': `${name}@${version}`,
			name,
			version,
			purl: npmPurl(name, version),
			licenses: [{ license: { id: info.licenses } }],
		};
	});

	return {
		$schema: 'http://cyclonedx.org/schema/bom-1.6.schema.json',
		bomFormat: 'CycloneDX',
		specVersion: '1.6',
		version: 1,
		metadata: {
			timestamp: new Date().toISOString(),
			component: {
				type: 'application',
				name: 'scaffy',
				version: '0.0.1',
			},
		},
		components,
	};
}

/** @param {Record<string, { licenses: string }>} packages */
function writeSbom(packages) {
	const bom = toCycloneDx(packages);
	writeFileSync(SBOM_PATH, `${JSON.stringify(bom, null, 2)}\n`, 'utf8');
	return Object.keys(packages).length;
}

/** @typedef {{ package: string, license: string }} Violation */

/** @param {Array<{ name: string, version: string, licenses?: Array<{ license?: { id?: string } }> }>} components */
function violationsFromComponents(components) {
	/** @type {Violation[]} */
	const violations = [];
	for (const component of components) {
		const license = component.licenses?.[0]?.license?.id ?? 'UNKNOWN';
		if (!allowedSet.has(license)) {
			violations.push({
				package: `${component.name}@${component.version}`,
				license,
			});
		}
	}
	return violations;
}

/** @returns {Violation[]} */
function validateSbomFile() {
	if (!existsSync(SBOM_PATH)) {
		console.error('licenses:check — sbom.json missing. Run: pnpm run sbom');
		process.exit(1);
	}
	const bom = JSON.parse(readFileSync(SBOM_PATH, 'utf8'));
	return violationsFromComponents(bom.components ?? []);
}

/** @param {Violation[]} violations */
function printViolations(violations) {
	console.error('licenses:check failed — production dependency outside allowlist.\n');
	console.error(`Allowlist (${ALLOWLIST_PATH}): ${allowed.join(', ')}\n`);
	console.error('Violations:');
	for (const { package: pkg, license } of violations) {
		console.error(`  - ${pkg}: ${license}`);
	}
	console.error(`\nSee full inventory in ${SBOM_PATH}`);
}

const mode = process.argv[2];

if (mode === 'sbom') {
	const packages = scanProductionPackages();
	const count = writeSbom(packages);
	console.log(`sbom — wrote ${count} production component(s) to sbom.json`);
} else if (mode === 'check') {
	const violations = validateSbomFile();
	if (violations.length > 0) {
		printViolations(violations);
		process.exit(1);
	}
	const bom = JSON.parse(readFileSync(SBOM_PATH, 'utf8'));
	const count = bom.components?.length ?? 0;
	console.log(
		`licenses:check — ${count} production package(s) OK; allowlist: ${allowed.join(', ')}`,
	);
} else if (mode === 'ci') {
	const packages = scanProductionPackages();
	const count = writeSbom(packages);
	console.log(`sbom — wrote ${count} production component(s) to sbom.json`);
	const violations = violationsFromComponents(toCycloneDx(packages).components);
	if (violations.length > 0) {
		printViolations(violations);
		process.exit(1);
	}
	console.log(`licenses:ci — ${count} production package(s) OK; allowlist: ${allowed.join(', ')}`);
} else {
	console.error('Usage: node scripts/license-audit.mjs sbom | check | ci');
	process.exit(1);
}
