const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

test('home declara canonical, Open Graph e entidades estruturadas', () => {
  assert.match(html, /<link rel="canonical" href="https:\/\/www\.argosleiloes\.com\.br\/">/);
  assert.match(html, /<meta property="og:url" content="https:\/\/www\.argosleiloes\.com\.br\/">/);

  const blocks = Array.from(html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g));
  assert.equal(blocks.length, 1);
  const schema = JSON.parse(blocks[0][1]);
  const types = new Set(schema['@graph'].map(entity => entity['@type']));

  assert.ok(types.has('Organization'));
  assert.ok(types.has('WebSite'));
  assert.ok(types.has('WebPage'));
  assert.ok(types.has('SoftwareApplication'));
});
