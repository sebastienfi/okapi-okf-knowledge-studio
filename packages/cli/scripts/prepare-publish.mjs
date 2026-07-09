// prepack/postpack hook: the npm page renders README.md from THIS package
// directory, but the canonical README and LICENSE live at the repo root.
// prepack copies them in (rewriting relative repo links to absolute GitHub
// URLs so images and doc links render on npmjs.com); postpack removes them
// again so the working tree stays clean.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const pkgDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = path.resolve(pkgDir, '../..');
const REPO_URL = 'https://github.com/sebastienfi/okapi-okf-knowledge-studio';
const RAW_URL = 'https://raw.githubusercontent.com/sebastienfi/okapi-okf-knowledge-studio/main';

const copies = [path.join(pkgDir, 'README.md'), path.join(pkgDir, 'LICENSE')];

const mode = process.argv[2];
if (mode === 'clean') {
  for (const file of copies) fs.rmSync(file, { force: true });
} else {
  const readme = fs
    .readFileSync(path.join(repoRoot, 'README.md'), 'utf8')
    // images must point at raw content to render on npmjs.com
    .replaceAll('src="docs/', `src="${RAW_URL}/docs/`)
    .replaceAll('](docs/', `](${REPO_URL}/blob/main/docs/`)
    .replaceAll('](CONTRIBUTING.md)', `](${REPO_URL}/blob/main/CONTRIBUTING.md)`)
    .replaceAll('](LICENSE)', `](${REPO_URL}/blob/main/LICENSE)`);
  fs.writeFileSync(path.join(pkgDir, 'README.md'), readme);
  fs.copyFileSync(path.join(repoRoot, 'LICENSE'), path.join(pkgDir, 'LICENSE'));
}
