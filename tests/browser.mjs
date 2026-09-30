import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {readFile,mkdir} from 'node:fs/promises';
import JSZip from 'jszip';
import sharp from 'sharp';
const origin=process.env.ATLAS_TEST_URL??'http://127.0.0.1:4322/ai-moe-atlas';
const chars=JSON.parse(await readFile('content/characters.json','utf8'));
await mkdir('.qa',{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});
const context=await browser.newContext({viewport:{width:1440,height:1000},acceptDownloads:true});
const page=await context.newPage();const errors=[];
page.on('pageerror',e=>errors.push(e.message));
page.on('response',r=>{if(r.url().startsWith(origin)&&r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});
try {
 for(const [lang,htmlLang] of [['zh','zh-CN'],['en','en'],['ja','ja']]){
  console.log(`Checking ${lang} routes and downloads`);
  for(const route of ['', 'assets/','models/','collection/','contribute/',...chars.map(c=>`characters/${c.id}/`)]){
   const response=await page.goto(`${origin}/${lang}/${route}`,{waitUntil:'domcontentloaded'});assert.equal(response.status(),200);assert.equal(await page.locator('html').getAttribute('lang'),htmlLang);
   assert.ok((await page.locator('h1').textContent()).trim());
   const canonical=await page.locator('link[rel="canonical"]').getAttribute('href');
   assert.equal(canonical,`https://selinlee.github.io/ai-moe-atlas/${lang}/${route}`);
   assert.equal(await page.locator('meta[property="og:url"]').getAttribute('content'),canonical);
   const cover=await page.locator('meta[property="og:image"]').getAttribute('content');
   assert.equal(cover,`https://selinlee.github.io/ai-moe-atlas/og/${lang}/${route.startsWith('characters/')?route.split('/')[1]:'index'}.png`);
   const coverResponse=await context.request.get(`${new URL(origin).origin}${new URL(cover).pathname}`);
   assert.equal(coverResponse.status(),200);
   const coverMeta=await sharp(await coverResponse.body()).metadata();assert.equal(coverMeta.width,1200);assert.equal(coverMeta.height,630);
   await page.locator('img').evaluateAll(imgs=>Promise.all(imgs.map(async i=>{
    i.loading='eager';
    // Switching a lazy image to eager can precede its new fetch. Wait for load
    // before decode, and fail on real load errors instead of swallowing them.
    if(!i.complete)await new Promise((resolve,reject)=>{
     i.addEventListener('load',resolve,{once:true});
     i.addEventListener('error',()=>reject(new Error(`Image failed: ${i.src}`)),{once:true});
    });
    await i.decode();
   })));
   assert.deepEqual(await page.locator('img').evaluateAll(imgs=>imgs.filter(i=>!i.naturalWidth).map(i=>i.src)),[]);
  }
  await page.goto(`${origin}/${lang}/`,{waitUntil:'domcontentloaded'});
  await page.goto(`${origin}/${lang}/models/`,{waitUntil:'domcontentloaded'});
  assert.equal(await page.locator('[data-baseline]').count(),12);
  assert.equal(await page.locator('[data-state="ready"]').count(),11);
  assert.equal(await page.locator('[data-state="candidate"]').count(),1);
  assert.equal(await page.locator('[data-state="missing"]').count(),0);
  assert.equal(await page.locator('[data-state="candidate"] img').count(),0);
  await page.goto(`${origin}/${lang}/characters/zipzippipe-chatgpt/`,{waitUntil:'domcontentloaded'});
  assert.equal(await page.locator('.observation-panel a').getAttribute('href'),'https://www.bilibili.com/video/BV14phK66Ejw/');
  await page.goto(`${origin}/${lang}/`,{waitUntil:'domcontentloaded'});
  await page.locator('#search').fill('ZipZipPipe');assert.equal(await page.locator('[data-card]:visible').count(),12);
  await page.locator('#search').fill('nothing-matches-xyz');await page.locator('#empty-state').waitFor({state:'visible'});
  await page.locator('#clear-filters').click();assert.equal(await page.locator('[data-card]:visible').count(),chars.length);
  await page.locator('[data-kind-filter="collected"]').click();assert.equal(await page.locator('[data-card]:visible').count(),chars.filter(c=>c.kind==='collected').length);
  await page.locator('[data-kind-filter="all"]').click();await page.screenshot({path:`.qa/atlas-${lang}-desktop.png`,fullPage:false});
  await page.setViewportSize({width:390,height:844});
  for(const route of ['','assets/','studio/','models/','collection/','characters/deep-whale-maid/']){
   await page.goto(`${origin}/${lang}/${route}`,{waitUntil:'domcontentloaded'});
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,`Mobile overflow: ${lang}/${route}`);
  }
  await page.goto(`${origin}/${lang}/`,{waitUntil:'domcontentloaded'});await page.screenshot({path:`.qa/atlas-${lang}-mobile.png`,fullPage:false});
  await page.setViewportSize({width:1440,height:1000});
  await page.goto(`${origin}/${lang}/?model=claude&style=pixel&kind=reference&q=Clawd`,{waitUntil:'domcontentloaded'});
  assert.equal(await page.locator('[data-card]:visible').count(),1);
  assert.equal(await page.locator('#style-filter').inputValue(),'pixel');
  const saved=page.url();await page.reload();assert.equal(await page.locator('[data-card]:visible').count(),1);
  const other=await context.newPage();await other.goto(saved);assert.equal(await other.locator('[data-card]:visible').count(),1);await other.close();
  await page.locator('#style-filter').selectOption('anime');assert.equal(await page.locator('[data-card]:visible').count(),0);
  await page.goBack();assert.equal(await page.locator('#style-filter').inputValue(),'pixel');assert.equal(await page.locator('[data-card]:visible').count(),1);
  await page.goForward();assert.equal(await page.locator('#style-filter').inputValue(),'anime');
  const to=lang==='ja'?'en':'ja';await page.locator(`.language-switch a[hreflang="${to}"]`).click();
  assert.equal(await page.locator('#style-filter').inputValue(),'anime');assert.equal(await page.locator('#search').inputValue(),'Clawd');
  await page.locator('#reset-filters').click();assert.equal(new URL(page.url()).search,'');assert.equal(await page.locator('[data-card]:visible').count(),chars.length);
  await page.locator('#search').pressSequentially('Clawd');
  await page.goBack();assert.equal(await page.locator('#search').inputValue(),'');
  await page.goForward();assert.equal(await page.locator('#search').inputValue(),'Clawd');
  await page.goto(`${origin}/${lang}/?model=bad&style=bad&kind=bad`);assert.equal(new URL(page.url()).search,'');
  assert.equal(await page.locator('.featured-card').count(),8);
  await context.grantPermissions(['clipboard-read','clipboard-write']);
  await page.locator('#copy-results').click();assert.equal(await page.evaluate(()=>navigator.clipboard.readText()),page.url());
  await page.evaluate(()=>Object.defineProperty(navigator.clipboard,'writeText',{configurable:true,value:()=>Promise.reject(new Error('Denied'))}));
  await page.locator('#copy-results').click();await page.locator('#results-link').waitFor({state:'visible'});assert.equal(await page.locator('#results-link').inputValue(),page.url());
  await page.goto(`${origin}/${lang}/characters/deep-whale-maid/`);
  await page.locator('.detail-info a[href*="/studio/?"]').focus();await page.keyboard.press('Enter');
  await page.waitForFunction(()=>!document.getElementById('export-pack').disabled);
  assert.equal(await page.locator('#character-select').inputValue(),'deep-whale-maid');assert.equal(await page.locator('#pose-select').inputValue(),'delighted');
  await page.goto(`${origin}/${lang}/characters/deep-whale-maid/`);
  await page.setViewportSize({width:390,height:844});
  await page.locator('.expression-actions a[href*="pose=sleepy"]').click();
  await page.waitForFunction(()=>!document.getElementById('export-pack').disabled);assert.equal(await page.locator('#pose-select').inputValue(),'sleepy');
  await page.setViewportSize({width:1440,height:1000});
  await page.goto(`${origin}/${lang}/characters/clawd-desktop/`);assert.equal(await page.locator('.detail-info a[href*="/studio/?"]').count(),0);
  await page.goto(`${origin}/${lang}/studio/?asset=deep-whale-maid&pose=sleepy`,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>!document.getElementById('export-pack').disabled);
  assert.equal(await page.locator('#pose-select').inputValue(),'sleepy');
  await page.locator('#advanced-settings').evaluate(e=>e.open=true);
  await page.selectOption('#size','1024');await page.selectOption('#shape','portrait');await page.selectOption('#format','webp');
  const dl=page.waitForEvent('download');await page.click('#export-pack');const download=await dl;const out=`.qa/export-${lang}.zip`;await download.saveAs(out);
  const zip=await JSZip.loadAsync(await readFile(out));const manifest=JSON.parse(await zip.file('provenance.json').async('string'));
  assert.equal(manifest.output.width,768);assert.equal(manifest.output.height,1024);assert.equal(manifest.source.rights.license,'CC-BY-NC-SA-4.0');assert.equal(manifest.processing.generative,false);
  assert.ok(Object.keys(zip.files).some(p=>p==='evidence/NOTICE.txt'));const m=await sharp(await zip.file(manifest.output.file).async('nodebuffer')).metadata();assert.equal(m.width,768);assert.equal(m.format,'webp');
  const target=lang==='ja'?'en':'ja';await page.locator(`.language-switch a[hreflang="${target}"]`).click();await page.waitForFunction(()=>!document.getElementById('export-pack').disabled);assert.equal(await page.locator('#pose-select').inputValue(),'sleepy');
 }
 await page.goto(`${origin}/en/studio/?asset=zipzippipe-chatgpt&pose=portrait`,{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>!document.getElementById('export-pack').disabled);
 assert.ok((await page.locator('#usage-note').textContent()).includes('Creator terms'));
 const originalDownload=page.waitForEvent('download');await page.click('#export-pack');await (await originalDownload).saveAs('.qa/pixiv-export.zip');
 const originalZip=await JSZip.loadAsync(await readFile('.qa/pixiv-export.zip'));
 assert.ok(originalZip.file('source-original.jpg'));
 assert.deepEqual(await originalZip.file('source-original.jpg').async('nodebuffer'),await readFile('public/collected/zipzippipe-chatgpt/portrait/original.jpg'));
 const originalManifest=JSON.parse(await originalZip.file('provenance.json').async('string'));
 assert.equal(originalManifest.source.rights.license,'LicenseRef-ZipZipPipe-NC');
 assert.equal(originalManifest.source.rights.modify,false);
 assert.ok((await originalZip.file('README.txt').async('string')).includes('Creator terms'));
 await page.goto(`${origin}/en/studio/`,{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>!document.getElementById('export-pack').disabled);
 await page.locator('#upload').setInputFiles('public/collected/shangshan-whale/portrait/original.png');await page.waitForFunction(()=>!document.getElementById('export-pack').disabled);
 await page.click('#export-pack');await page.waitForFunction(()=>document.getElementById('studio-status').textContent.includes('source URL'));
 await page.fill('#source-url','https://www.bilibili.com/opus/1231977657712771073');await page.fill('#source-author','上善无形');await page.fill('#source-terms','CC BY-NC-SA 4.0');await page.locator('#advanced-settings').evaluate(e=>e.open=true);await page.selectOption('#format','jpeg');await page.selectOption('#shape','circle');
 const localDL=page.waitForEvent('download');await page.click('#export-pack');await (await localDL).saveAs('.qa/local-export.zip');
 const z=await JSZip.loadAsync(await readFile('.qa/local-export.zip'));const mm=JSON.parse(await z.file('provenance.json').async('string'));assert.equal(mm.source.attribution[0].name,'上善无形');assert.ok(z.file('source-original.png'));
 await page.screenshot({path:'.qa/studio-desktop.png'});
 assert.deepEqual(errors,[]);console.log('Chrome QA passed: every localized route, loaded images, search, filters, mobile layout, locale switching, and source-preserving exports.');
}finally{await browser.close();}
