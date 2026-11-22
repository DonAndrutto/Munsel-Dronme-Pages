import { createHash } from 'node:crypto';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join, relative, sep } from 'node:path';

const digest = bytes => createHash('sha256').update(bytes).digest('base64');
const files = {};
const entries = await readdir('dist', { recursive: true, withFileTypes: true });
for (const entry of entries) {
  if (!entry.isFile() || entry.name === 'sw.js') continue;
  const path = join(entry.parentPath, entry.name);
  files[relative('dist', path).split(sep).join('/')] = 'sha256-' + digest(await readFile(path));
}

const manifest = JSON.stringify(files, Object.keys(files).sort());
const template = await readFile(new URL('./worker.js', import.meta.url), 'utf8');
const version = digest(template + manifest);
await writeFile('dist/sw.js', template.replace('__VERSION__', version).replace('__FILES__', () => manifest));
console.log('Offline practice includes ' + Object.keys(files).length + ' files.');
