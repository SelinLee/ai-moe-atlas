import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { collectFields, forms, issueURL, usePurposes } from '../src/lib/contribution.mjs';

const repo = 'https://github.com/SelinLee/ai-moe-atlas';

test('issue links point at the matching template and drop empty or unknown fields', () => {
  const url = new URL(issueURL('source', { source: 'https://www.bilibili.com/opus/1', ai: 'DeepSeek', creator: '', chain: '' }));
  assert.equal(url.origin + url.pathname, `${repo}/issues/new`);
  assert.equal(url.searchParams.get('template'), 'source.yml');
  assert.equal(url.searchParams.get('source'), 'https://www.bilibili.com/opus/1');
  assert.equal(url.searchParams.has('creator'), false);
  // Values are escaped, so a crafted value cannot append extra issue parameters.
  assert.equal(url.searchParams.get('ai'), 'DeepSeek');
  assert.equal(url.search.split('&').length, 3);
  const injected = new URL(issueURL('correction', { entry: 'https://x.test/a', details: 'a&template=source.yml&extra=1' }));
  assert.equal(injected.searchParams.get('details'), 'a&template=source.yml&extra=1');
  assert.equal(injected.searchParams.get('template'), 'correction.yml');
  assert.equal(injected.searchParams.get('extra'), null);
});

test('each form collects only its own declared fields', () => {
  assert.deepEqual(collectFields('lead', { source: 'https://x.test/', ai: 'Claude', evil: 'x' }), { source: 'https://x.test/', ai: 'Claude' });
  assert.deepEqual(collectFields('correction', { entry: 'https://x.test/a', details: 'wrong author', ai: 'Claude' }), { entry: 'https://x.test/a', details: 'wrong author' });
  assert.deepEqual(collectFields('rights', { entry: 'https://x.test/a', role: 'creator', scope: 'featured, intro-card', decision: 'allowed', evidence: 'LICENSE' }),
    { entry: 'https://x.test/a', role: 'creator', scope: 'featured, intro-card', decision: 'allowed', evidence: 'LICENSE' });
  for (const [name, form] of Object.entries(forms)) for (const field of form.required) assert.ok(form.fields.includes(field), `${name} requires ${field}`);
});

test('contribution templates exist and cover every reviewed purpose', async () => {
  for (const template of ['source', 'correction', 'rights']) {
    const body = await readFile(new URL(`../.github/ISSUE_TEMPLATE/${template}.yml`, import.meta.url), 'utf8');
    assert.match(body, /^name:/m);
    const elements = body.split(/^  - type: /m).slice(1);
    for (const field of forms[template === 'source' ? 'lead' : template].fields) {
      const element = elements.find(e => new RegExp(`^    id: ${field}$`, 'm').test(e));
      assert.match(element ?? '', /^(input|textarea)\n/, `${template}.${field} must support text query prefills`);
    }
    const ids = [...body.matchAll(/^\s*- type: (?:input|textarea|dropdown)\s*$|^\s+id: (\S+)$/gm)].map(m => m[1]).filter(Boolean);
    for (const field of forms[template === 'source' ? 'lead' : template].fields) assert.ok(ids.includes(field), `${template}.yml missing ${field}`);
    for (const field of forms[template === 'source' ? 'lead' : template].required) {
      const block = body.split(new RegExp(`^\\s+id: ${field}$`, 'm'))[1] ?? '';
      assert.match(block, /required: true/, `${template}.yml: ${field} should be required`);
    }
  }
  assert.deepEqual(usePurposes, ['featured', 'social-cover', 'avatar-canvas', 'full-portrait', 'technical-canvas', 'intro-card', 'lineup-card', 'readme-demo']);
});
