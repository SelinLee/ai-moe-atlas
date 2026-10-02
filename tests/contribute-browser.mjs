import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { readFile, mkdir } from 'node:fs/promises';
import { forms, issueURL } from '../src/lib/contribution.mjs';
const origin = process.env.ATLAS_TEST_URL ?? 'http://127.0.0.1:4322/ai-moe-atlas';
const repo = 'https://github.com/SelinLee/ai-moe-atlas';
await mkdir('.qa', { recursive: true });
const browser = await chromium.launch({ ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : { channel: 'chrome' }), headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 1100 } });
const page = await context.newPage();
const errors = [], external = [];
page.on('pageerror', e => errors.push(e.message));
page.on('response', r => { if (r.url().startsWith(origin) && r.status() >= 400) errors.push(`${r.status()} ${r.url()}`); });
page.on('request', r => { if (!r.url().startsWith(origin) && !r.url().startsWith('data:')) external.push(r.url()); });
// The page only composes a GitHub issue link; window.open is stubbed so the
// test never contacts github.com and can read the exact composed URL.
await page.addInitScript(() => {
  window.__opened = [];
  window.open = url => { window.__opened.push(String(url)); return null; };
});
const opened = async index => new URL((await page.evaluate(() => window.__opened))[index]);
try {
  for (const lang of ['zh', 'en', 'ja']) {
    console.log(`Contribute ${lang}: lead, correction and rights forms`);
    await page.goto(`${origin}/${lang}/contribute/`, { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => { window.__opened = []; });
    // Required fields gate the link; an empty submission composes nothing.
    await page.locator('#lead-form button[type=submit]').click();
    assert.equal((await page.evaluate(() => window.__opened)).length, 0);
    await page.fill('#lead-source', 'https://www.bilibili.com/video/BV1tE9XBbErS/');
    await page.selectOption('#lead-ai', 'DeepSeek');
    await page.locator('#lead-known').evaluate(e => e.open = true);
    await page.fill('#lead-creator', '未知');
    await page.locator('#lead-form button[type=submit]').click();
    const leadURL = await opened(0);
    assert.ok(leadURL.href.startsWith(`${repo}/issues/new?template=source.yml`));
    assert.equal(leadURL.searchParams.get('source'), 'https://www.bilibili.com/video/BV1tE9XBbErS/');
    assert.equal(leadURL.searchParams.get('ai'), 'DeepSeek');
    assert.equal(leadURL.searchParams.get('creator'), '未知');
    assert.equal(leadURL.searchParams.get('rights'), null);
    assert.ok((await page.locator('#lead-status').textContent()).length > 0);

    await page.selectOption('#correction-entry', { index: 1 });
    await page.fill('#correction-details', 'Creator attribution is wrong.');
    await page.locator('#correction-form button[type=submit]').click();
    const correctionURL = await opened(1);
    assert.equal(correctionURL.searchParams.get('template'), 'correction.yml');
    assert.match(correctionURL.searchParams.get('entry'), /^https:\/\/selinlee\.github\.io\/ai-moe-atlas\//);
    assert.equal(correctionURL.searchParams.get('details'), 'Creator attribution is wrong.');
    assert.ok((await page.locator('#correction-status').textContent()).length > 0);

    await page.selectOption('#rights-entry', { index: 1 });
    await page.selectOption('#rights-role', 'creator');
    await page.check('#rights-form input[value="featured"]');
    await page.check('#rights-form input[value="intro-card"]');
    await page.selectOption('#rights-decision', 'allowed');
    await page.fill('#rights-evidence', 'LICENSE-ARTWORK in my repository');
    await page.locator('#rights-form button[type=submit]').click();
    const rightsURL = await opened(2);
    assert.equal(rightsURL.searchParams.get('template'), 'rights.yml');
    assert.equal(rightsURL.searchParams.get('role'), 'creator');
    assert.equal(rightsURL.searchParams.get('scope'), 'featured, intro-card');
    assert.equal(rightsURL.searchParams.get('decision'), 'allowed');
    assert.equal(rightsURL.searchParams.get('evidence'), 'LICENSE-ARTWORK in my repository');
    assert.equal(rightsURL.searchParams.get('contact'), null);
    assert.ok((await page.locator('#rights-status').textContent()).length > 0);
    // Unselected uses are never implied by a confirmation.
    assert.equal(await page.locator('#rights-form input[value="lineup-card"]').isChecked(), false);
    // Every purpose the atlas reviews is offered in the confirmation form.
    assert.equal(await page.locator('#rights-form input[name=scope]').count(), 8);
    await page.screenshot({ path: `.qa/contribute-${lang}.png`, fullPage: true });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${origin}/${lang}/contribute/`, { waitUntil: 'domcontentloaded' });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false, `Mobile overflow: ${lang}/contribute/`);
    await page.screenshot({ path: `.qa/contribute-${lang}-mobile.png`, fullPage: false });
    await page.setViewportSize({ width: 1440, height: 1100 });
  }
  // Templates carry every field the page composes.
  for (const spec of Object.values(forms)) {
    const body = await readFile(new URL(`../.github/ISSUE_TEMPLATE/${spec.template}.yml`, import.meta.url), 'utf8');
    for (const field of spec.fields) assert.match(body, new RegExp(`^\\s+id: ${field}$`, 'm'), `${spec.template}.yml missing ${field}`);
  }
  assert.equal(new URL(issueURL('source', { source: 'https://x.test/', ai: 'Claude' })).searchParams.get('template'), 'source.yml');
  // Only the declared webfont hosts are contacted; nothing posts form contents.
  assert.deepEqual(external.filter(u => !/^https:\/\/fonts\.(googleapis|gstatic)\.com\//.test(u)), [], 'no request leaves the page');
  assert.deepEqual(errors, []);
  console.log('Chrome QA passed: contribution forms compose correct GitHub issue links and send nothing.');
} finally { await browser.close(); }
