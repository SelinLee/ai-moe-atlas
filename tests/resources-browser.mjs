import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {readFile,mkdir} from 'node:fs/promises';
import {readPendingAnimationCandidates} from '../scripts/lib/resources.mjs';
const registry=JSON.parse(await readFile('content/resources.json','utf8'));
const leads=JSON.parse(await readFile('content/leads.json','utf8'));
const pending=await readPendingAnimationCandidates(registry,new URL('../',import.meta.url));
const animationCount=registry.records.filter(r=>r.category==='animation').length;
const ranked=registry.records.filter(r=>r.likes).sort((a,b)=>
  b.likes.count-a.likes.count||b.publicationDate.localeCompare(a.publicationDate)||a.id.localeCompare(b.id));
const interactiveCount=registry.records.filter(r=>r.category==='interactive').length;
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
  if(pending.length){
   const panel=page.locator('#pending-animation-evidence');
   assert.ok(await panel.isVisible());
   assert.equal(await panel.getAttribute('open'),null);
   await panel.locator('summary').click();
   const candidates=await panel.locator('li').evaluateAll(rows=>rows.map(row=>({
    original:row.querySelector('a')?.href,
    source:row.querySelector('p a')?.href,
    checked:row.querySelector('time')?.dateTime,
   })));
   assert.deepEqual(candidates,pending.map(row=>({
    original:`https://www.bilibili.com/video/${row.bvid}/`,source:row.requestUrl,checked:row.observedAt,
   })));
   assert.equal(await page.locator('#resource-count').innerText(),String(animationCount));
  }
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
  await page.goto(`${origin}/${lang}/resources/?category=animation#pending-animation-evidence`,{waitUntil:'networkidle'});
  if(pending.length)assert.ok(await page.locator('#pending-animation-evidence').evaluate(panel=>panel.open));
  await page.screenshot({path:`.qa/resources-animation-${lang}-desktop.png`});
  const mvFilter=page.locator('[data-resource-type-filter="mv"]');
  const rankedMvs=ranked.filter(r=>r.subtype==='mv');
  await mvFilter.click();
  assert.equal(await mvFilter.getAttribute('aria-pressed'),'true');
  assert.equal(new URL(page.url()).searchParams.get('type'),'mv');
  assert.equal(await visibleAnimations.count(),registry.records.filter(r=>r.category==='animation'&&r.subtype==='mv').length);
  assert.deepEqual(await visibleAnimations.evaluateAll((cards,count)=>cards.map(card=>card.id).slice(0,count),rankedMvs.length),rankedMvs.map(r=>r.id));
  const shownRanks=await visibleAnimations.locator('.resource-byline strong').allTextContents();
  assert.deepEqual(shownRanks.map(value=>Number(value.match(/^#(\d+)/)?.[1])),rankedMvs.map(r=>ranked.indexOf(r)+1));
  await page.locator('#resource-search').fill('BV1C7h16jEHJ');
  await page.reload();
  assert.ok(await page.locator('#bv1c7h16jehj').isVisible());
  await languageLink.click();
  assert.equal(await mvFilter.getAttribute('aria-pressed'),'true');
  assert.equal(await page.locator('[data-resource-category]:visible').count(),1);
  await page.locator('#resource-search').fill('');
  await page.locator('[data-resource-filter="interactive"]').click();assert.equal(await page.locator('[data-resource-category]:visible').count(),interactiveCount);
  assert.ok(await page.locator('#pending-animation-evidence').isHidden());
  assert.ok(await page.locator('#resource-types').isHidden());
  assert.equal(new URL(page.url()).searchParams.has('type'),false);
  await page.locator('#resource-search').fill('no-such-work-xyz');assert.ok(await page.locator('#resource-empty').isVisible());
  await page.locator('#resource-reset').click();assert.equal(await page.locator('[data-resource-category]:visible').count(),registry.records.length+leads.length);
  await page.goto(`${origin}/${lang}/resources/?category=unknown&q=BV1C7h16jEHJ`);
  assert.equal(await page.locator('[data-resource-category]:visible').count(),1);
  assert.ok(await page.locator('#bv1c7h16jehj').isVisible());
  for(const width of [390,768]){
   await page.setViewportSize({width,height:844});
   for(const route of ['', 'resources/?category=animation&type=mv','resources/?category=interactive']){
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
