import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {readFile,mkdir} from 'node:fs/promises';
const registry=JSON.parse(await readFile('content/resources.json','utf8'));
const animationCount=registry.records.filter(r=>r.category==='animation').length;
const ranked=registry.records.filter(r=>r.likes).sort((a,b)=>
  b.likes.count-a.likes.count||b.publicationDate.localeCompare(a.publicationDate)||a.id.localeCompare(b.id));
const interactiveCount=registry.records.filter(r=>r.category==='interactive').length+3;
const origin=process.env.ATLAS_TEST_URL??'http://127.0.0.1:4322/ai-moe-atlas';
await mkdir('.qa',{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});
const context=await browser.newContext({viewport:{width:1440,height:1000}});
const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
try{
 for(const lang of ['zh','en','ja']){
  const response=await page.goto(`${origin}/${lang}/`,{waitUntil:'networkidle'});assert.equal(response.status(),200);
  assert.equal(await page.locator('[data-category-link]').count(),6);
  assert.equal(await page.locator('main h1').count(),1);
  assert.ok(await page.locator('[data-category-link="sources"]').evaluate(el=>el.getBoundingClientRect().bottom<innerHeight),'All six categories fit the desktop first screen');
  const cards=await page.locator('[data-category-link]').evaluateAll(links=>links.map(a=>a.href));
  for(const url of cards){const r=await context.request.get(url);assert.equal(r.status(),200,url);}
  await page.screenshot({path:`.qa/resources-home-${lang}-desktop.png`});
  await page.locator('[data-category-link="animation"]').click();
  await page.waitForSelector('[data-resource-category="sources"][hidden]',{state:'attached'});
  assert.equal(await page.locator('[data-resource-category]:visible').count(),animationCount);
  assert.equal(await page.locator('#resource-count').innerText(),String(animationCount));
  const visibleAnimations=page.locator('[data-resource-category="animation"]:visible');
  assert.deepEqual(await visibleAnimations.evaluateAll((cards,count)=>cards.map(card=>card.id).slice(0,count),ranked.length),ranked.map(r=>r.id));
  assert.match(await visibleAnimations.first().innerText(),new RegExp(ranked[0].likes.count.toLocaleString(lang)));
  assert.ok(await visibleAnimations.first().locator(`a[href="${ranked[0].likes.sourceUrl}"]`).first().isVisible());
  assert.equal(await page.locator('.resource-list img,.resource-list video,.resource-list iframe').count(),0);
  await page.locator('#resource-search').fill('BV1YFn46SEEr');
  assert.equal(await page.locator('[data-resource-category]:visible').count(),1);
  assert.ok((await page.locator('.language-switch a').first().getAttribute('href')).includes('q=BV1YFn46SEEr'));
  await page.reload();assert.equal(await page.locator('[data-resource-category]:visible').count(),1);
  await page.locator('#bv1yfn46seer summary').click();
  assert.ok(await page.locator('#bv1yfn46seer details a[href*="BV1AAnt6qEek"]').isVisible());
  const languageLink=page.locator('.language-switch a').filter({hasText:lang==='ja'?'English':'日本語'});await languageLink.click();
  assert.equal(await page.locator('[data-resource-category]:visible').count(),1);
  assert.ok(page.url().includes('category=animation'));
  await page.goto(`${origin}/${lang}/resources/?category=animation`,{waitUntil:'networkidle'});
  await page.screenshot({path:`.qa/resources-animation-${lang}-desktop.png`});
  await page.locator('[data-resource-filter="interactive"]').click();assert.equal(await page.locator('[data-resource-category]:visible').count(),interactiveCount);
  await page.locator('#resource-search').fill('no-such-work-xyz');assert.ok(await page.locator('#resource-empty').isVisible());
  await page.locator('#resource-reset').click();assert.equal(await page.locator('[data-resource-category]:visible').count(),registry.records.length+14);
  await page.goto(`${origin}/${lang}/resources/?category=unknown&q=CrossPet`);assert.equal(await page.locator('[data-resource-category]:visible').count(),1);
  for(const width of [390,768]){
   await page.setViewportSize({width,height:844});
   for(const route of ['', 'resources/?category=animation','resources/?category=interactive']){
    await page.goto(`${origin}/${lang}/${route}`,{waitUntil:'networkidle'});
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,`${lang}/${route} overflows ${width}px`);
   }
   if(width===390){await page.goto(`${origin}/${lang}/`);await page.screenshot({path:`.qa/resources-home-${lang}-mobile.png`});}
  }
  await page.setViewportSize({width:1440,height:1000});
  console.log(`Resource navigation, filters, language links and responsive layouts passed: ${lang}`);
 }
 assert.deepEqual(errors,[]);
}finally{await browser.close();}
