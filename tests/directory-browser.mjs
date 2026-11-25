import { chromium } from 'playwright';
import assert from 'node:assert/strict';
const origin = process.env.ATLAS_TEST_URL ?? 'http://127.0.0.1:4322/ai-moe-atlas';
const browser = await chromium.launch({ channel:'chrome', headless:true });
try {
  const page = await browser.newPage({viewport:{width:390,height:844}});
  for (const lang of ['zh','en','ja']) {
    const root = `${origin}/${lang}`;
    await page.goto(root + '/');
    const home = await page.locator('[data-category-link]').evaluateAll(links => links.map(a => a.href));
    assert.equal(await page.locator('.site-nav a').count(), 3);
    assert.equal(await page.locator('a[href*="/studio/"]').count(), 0);
    await page.locator('.site-nav a[href$="/collection/"]').click();
    assert.deepEqual(await page.locator('[data-category-link]').evaluateAll(links => links.map(a => a.href)), home);
    const index = await (await page.request.get(root + '/collection/index.json')).json();
    const counts = await page.locator('[data-category-link]').evaluateAll(links =>
      links.map(a => [a.dataset.categoryLink, Number(a.querySelector('strong').textContent)]));
    for (const [category, count] of counts) {
      assert.equal(index.filter(row => row.categories.includes(category)).length, count, category);
    }
    const box = page.locator('[name="q"]');
    await box.fill('ＺＣｏｄｅ');
    await page.locator('[name="category"]').selectOption('personas');
    const results = page.locator('.directory-list li');
    await results.first().waitFor();
    assert.ok(await results.locator('a[href$="#persona-glm-zcode"]').count());
    assert.equal(await results.locator('a[download]').count(), 0);
    assert.equal(await page.locator('#browse-categories').isVisible(), false);
    const alternate = await page.locator('.language-switch a').first().getAttribute('href');
    assert.equal(new URL(alternate, page.url()).searchParams.get('q'), 'ＺＣｏｄｅ');
    await page.goto(root + '/collection/?category=characters');
    await results.first().waitFor();
    assert.equal(await results.count(), 30);
    await page.locator('#directory-more').click();
    assert.equal(await results.count(), 60);
    await page.locator('.directory-summary a').click();
    await box.fill('atlas-no-such-item-9999');
    await box.press('Enter');
    await page.waitForFunction(() => document.querySelector('#directory-results [role=status]').textContent === document.querySelector('#directory-results').dataset.empty);
    assert.equal(await results.count(), 0);
    assert.ok(await page.locator('[data-category-link="personas"]').isVisible());
    await page.goto(root + '/');
    await box.fill('shangshan');
    await box.press('Enter');
    const zip = results.locator('a[download][href$="/shangshan-whale.zip"]');
    await zip.waitFor();
    const download = page.waitForEvent('download');
    await zip.click();
    assert.equal((await download).suggestedFilename(),'shangshan-whale.zip');
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth > innerWidth + 1), false);
    for (const [query, hash] of [['',''], ['?asset=deep-whale-maid&pose=sleepy','#deep-whale-maid--sleepy'], ['?asset=unknown','']]) {
      await page.goto(root + '/studio/' + query, {waitUntil:'commit'});
      await page.waitForURL(root + '/assets/' + hash);
      if (hash) assert.equal(await page.locator(hash + ' a[download]').count(),1);
    }
  }
  console.log('All locales passed directory, download and legacy link checks.');
} finally {
  await browser.close();
}
