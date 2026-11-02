import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { assertBuilt, pagePath, read, DIST } from './helpers.mjs';

const ROUTES = ['/', '/projects/', '/resume/'];

test('dist exists', () => assertBuilt());

for (const route of ROUTES) {
  test(`${route} exists with title, description, h1, lang`, () => {
    const p = pagePath(route);
    assert.ok(existsSync(p), `missing ${p}`);
    const html = read(p);
    assert.match(html, /<html[^>]*lang="en"/);
    assert.match(html, /<title>[^<]*Nicolas Iracheta[^<]*<\/title>/);
    assert.match(html, /<meta name="description" content="[^"]{50,}"/);
    assert.equal((html.match(/<h1[\s>]/g) || []).length, 1, 'exactly one h1');
  });
}

test('404.html exists', () => {
  assert.ok(existsSync(join(DIST, '404.html')));
});

test('at least 3 project pages', () => {
  const html = read(pagePath('/projects/'));
  const links = new Set(html.match(/href="\/projects\/[a-z0-9-]+\/"/g) || []);
  assert.ok(links.size >= 3, `found ${links.size} project links`);
});

test('resume PDF is linked and present', () => {
  const html = read(pagePath('/resume/'));
  assert.match(html, /href="\/Nicolas_Iracheta_Resume\.pdf"/);
  assert.ok(existsSync(join(DIST, 'Nicolas_Iracheta_Resume.pdf')));
});

test('no client-side JS shipped', () => {
  const html = read(pagePath('/'));
  assert.doesNotMatch(html, /<script(?![^>]*type="application\/ld\+json")/);
});
