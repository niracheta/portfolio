import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { assertBuilt, htmlFiles, read, rel, DIST } from './helpers.mjs';

test('dist exists', () => assertBuilt());

test('every internal href/src resolves to a file in dist', () => {
  const broken = [];
  for (const f of htmlFiles()) {
    const html = read(f);
    for (const [, url] of html.matchAll(/(?:href|src)="(\/[^"#?]*)/g)) {
      const target = url.endsWith('/') ? join(DIST, url, 'index.html') : join(DIST, url);
      if (!existsSync(target)) broken.push(`${rel(f)} -> ${url}`);
    }
  }
  assert.deepEqual(broken, [], `broken links:\n${broken.join('\n')}`);
});

test('external links open safely', () => {
  const bad = [];
  for (const f of htmlFiles()) {
    for (const [tag] of read(f).matchAll(/<a [^>]*target="_blank"[^>]*>/g)) {
      if (!/rel="[^"]*noopener/.test(tag)) bad.push(`${rel(f)}: ${tag}`);
    }
  }
  assert.deepEqual(bad, []);
});
