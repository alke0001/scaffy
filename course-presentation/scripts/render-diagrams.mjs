import { execFileSync } from 'node:child_process';
import { mkdirSync, readdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const presentationRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = join(presentationRoot, '..');
const inDir = join(presentationRoot, 'diagrams');
const outDir = join(presentationRoot, 'assets/diagrams');

mkdirSync(outDir, { recursive: true });

const mmdc =
	process.platform === 'win32'
		? join(repoRoot, 'node_modules/.bin/mmdc.cmd')
		: join(repoRoot, 'node_modules/.bin/mmdc');

if (!existsSync(mmdc)) {
	console.error('mmdc not found — run from repo root: pnpm add -D @mermaid-js/mermaid-cli');
	process.exit(1);
}

const mmdFiles = readdirSync(inDir).filter((name) => name.endsWith('.mmd'));

for (const file of mmdFiles) {
	const input = join(inDir, file);
	const output = join(outDir, file.replace(/\.mmd$/, '.svg'));
	execFileSync(mmdc, ['-i', input, '-o', output, '-b', 'transparent', '-t', 'dark'], {
		stdio: 'inherit',
		...(process.platform === 'win32' ? { shell: true } : {}),
	});
	console.log(
		`rendered ${file} → course-presentation/assets/diagrams/${file.replace(/\.mmd$/, '.svg')}`,
	);
}
