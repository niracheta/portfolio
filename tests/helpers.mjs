import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';

export const DIST = new URL('../dist/', import.meta.url).pathname;

export function assertBuilt() {
  if (!existsSync(DIST)) {
    throw new Error('dist/ missing: run `npm run build` first (or use `npm run check`)');
  }
}

export function walk(dir = DIST) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...walk(p));
    else out.push(p);
  }
  return out;
}

export function htmlFiles() {
  return walk().filter((p) => p.endsWith('.html'));
}

export function textFiles() {
  return walk().filter((p) => /\.(html|css|js|txt|xml|json|svg)$/.test(p));
}

export function read(p) {
  return readFileSync(p, 'utf8');
}

export function rel(p) {
  return '/' + relative(DIST, p);
}

export function pagePath(route) {
  // '/' -> dist/index.html, '/resume/' -> dist/resume/index.html
  const clean = route.replace(/^\/|\/$/g, '');
  return join(DIST, clean, 'index.html');
}
