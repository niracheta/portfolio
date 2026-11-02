import { test } from 'node:test';
import assert from 'node:assert/strict';
import { assertBuilt, textFiles, read, rel } from './helpers.mjs';

// Anything matching these must never ship on a public page.
const FORBIDDEN = [
  { name: 'RFC1918 10/8', re: /\b10\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/ },
  { name: 'RFC1918 172.16/12', re: /\b172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}\b/ },
  { name: 'RFC1918 192.168/16', re: /\b192\.168\.\d{1,3}\.\d{1,3}\b/ },
  { name: 'Tailscale CGNAT 100.64/10', re: /\b100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\.\d{1,3}\.\d{1,3}\b/ },
  { name: 'Cloudflare user token', re: /cfut_[A-Za-z0-9]{20,}/ },
  { name: 'Generic API key shape', re: /\b(sk|pk|ghp|gho|ghs|xox[bp])[-_][A-Za-z0-9]{20,}\b/ },
  { name: '32-hex ID (CF zone/account)', re: /\b[a-f0-9]{32}\b/ },
  { name: 'Tailscale auth key', re: /tskey-[A-Za-z0-9-]{10,}/ },
  { name: 'Private key block', re: /-----BEGIN [A-Z ]*PRIVATE KEY-----/ },
];

test('dist exists', () => assertBuilt());

for (const { name, re } of FORBIDDEN) {
  test(`no ${name} in built output`, () => {
    const hits = [];
    for (const f of textFiles()) {
      const m = read(f).match(re);
      if (m) hits.push(`${rel(f)}: ${m[0]}`);
    }
    assert.deepEqual(hits, [], `leak found:\n${hits.join('\n')}`);
  });
}

test('no em dashes in HTML (house style)', () => {
  const hits = [];
  for (const f of textFiles().filter((p) => p.endsWith('.html'))) {
    if (read(f).includes('\u2014')) hits.push(rel(f));
  }
  assert.deepEqual(hits, [], `em dash found in:\n${hits.join('\n')}`);
});
