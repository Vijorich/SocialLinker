import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const roots = ['assets', 'tests', 'scripts'];
const files = [];
const visit = dir => {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) visit(path);
    else if (/\.(?:js|mjs)$/.test(entry)) files.push(path);
  }
};
for (const root of roots) visit(root);
for (const file of files) {
  const result = spawnSync(process.execPath, ['--check', file], { stdio: 'inherit' });
  if (result.status !== 0) process.exit(result.status ?? 1);
}
console.log(`syntax: ${files.length} JavaScript files checked, all parse clean`);
