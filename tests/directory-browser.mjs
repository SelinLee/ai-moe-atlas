import { chromium } from 'playwright';
import assert from 'node:assert/strict';
const origin = process.env.ATLAS_TEST_URL ?? 'http://127.0.0.1:4322/ai-moe-atlas';
const browser = await chromium.launch({ channel:'chrome', headless:true });
try {
  const page = await browser.newPage({viewport:{width:390,height:844}});
  for (const lang of ['zh','en','ja']) {
    const root = `${origin}/${lang}`;
    await page.goto(root + '/');
    const home = await page.locator('[data-category-link]').evaluateAll(links => links.map(a => ({
      key:a.dataset.categoryLink, count:Number(a.querySelector('strong').textContent), href:a.href,
    })));
    assert.equal(await page.locator('.site-nav a').count(), 3);
    assert.equal(await page.locator('a[href*="/studio/"]').count(), 0);
    await page.locator('.site-nav a[href$="/collection/"]').click();
    const sidebar = page.locator('.directory-sidebar');
    const tab = key => sidebar.locator(`[data-scope="${key}"]`);
    const results = page.locator('.directory-list li');
    const box = page.locator('[name="q"]');
    const index = await (await page.request.get(root + '/collection/index.json')).json();
    assert.deepEqual(await sidebar.locator('a').evaluateAll(links => links.map(a => a.dataset.scope)), ['', ...home.map(c => c.key)]);
    assert.equal(await results.count(),30);
    for (const width of [1280, 390, 320]) {
      await page.setViewportSize({width, height:844});
      const left = await sidebar.boundingBox(), right = await page.locator('#directory-results').boundingBox();
      assert.ok(left.x + left.width <= right.x && Math.abs(left.y-right.y)<2, `Side-by-side at ${width}px`);
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth > innerWidth + 1), false);
    }
    await page.setViewportSize({width:390, height:844});
    await page.locator('#directory-more').click();
    await results.nth(59).waitFor();
    await page.evaluate(()=>window.directoryDocument=document);
    for (const {key, count, href} of home) {
      assert.equal(index.filter(row => row.categories.includes(key)).length, count, key);
      await tab(key).click();
      await results.first().waitFor();
      assert.equal(await results.count(), Math.min(count, 30));
      assert.equal(await tab(key).getAttribute('aria-current'), 'true');
      assert.equal(await page.locator('#directory-category-page').evaluate(a=>a.href), href);
      assert.equal(Number.parseInt(await page.locator('#directory-results [role=status]').innerText()), count);
    }
    assert.ok(await page.evaluate(()=>window.directoryDocument===document));
    await box.fill('ＺＣｏｄｅ');
    await tab('personas').click();
    await results.locator('a[href$="#persona-glm-zcode"]').waitFor();
    assert.equal(await results.locator('a[download]').count(), 0);
    const alternate = await page.locator('.language-switch a').first().getAttribute('href');
    assert.equal(new URL(alternate, page.url()).searchParams.get('q'), 'ＺＣｏｄｅ');
    await tab('songs').click();
    await page.goBack();
    await results.locator('a[href$="#persona-glm-zcode"]').waitFor();
    assert.equal(await tab('personas').getAttribute('aria-current'),'true');
    await page.reload();
    await results.locator('a[href$="#persona-glm-zcode"]').waitFor();
    await page.locator('#directory-clear').click();
    assert.equal(new URL(page.url()).searchParams.get('category'),'personas');
    assert.equal(await box.inputValue(),'');
    await box.fill('atlas-no-such-item-9999');
    await box.press('Enter');
    await page.waitForFunction(() => document.querySelector('#directory-results [role=status]').textContent === document.querySelector('#directory-results').dataset.empty);
    assert.equal(await results.count(), 0);
    assert.ok(await sidebar.isVisible());
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
  const root = origin + '/zh/collection/';
  await page.goto(root);
  const indexUrl = new URL('index.json', root).href;
  let count = 0;
  let release;
  const gate = new Promise(resolve => {release = resolve;});
  await page.route(indexUrl, async route => {
    count++;
    if (count === 1) return route.fulfill({status:503, body:''});
    await gate;
    await route.continue();
  });
  await page.locator('[data-scope="personas"]').click();
  await page.locator('#directory-retry').click();
  await page.locator('[data-scope="songs"]').click();
  release();
  await page.locator('.directory-list a[href*="/songs/#"]').first().waitFor();
  assert.equal(count,2);
  assert.equal(await page.locator('.directory-list a[href*="category=personas"]').count(),0);
  await page.unroute(indexUrl);
  console.log('All locales passed directory, download and legacy link checks.');
} finally {
  await browser.close();
}
