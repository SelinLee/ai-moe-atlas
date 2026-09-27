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
  for(const route of ['', 'assets/','models/','collection/','contribute/',...chars.map(c=>`characters/${c.id}/`)]){
   const response=await page.goto(`${origin}/${lang}/${route}`,{waitUntil:'domcontentloaded'});assert.equal(response.status(),200);assert.equal(await page.locator('html').getAttribute('lang'),htmlLang);
   assert.ok((await page.locator('h1').textContent()).trim());
   await page.locator('img').evaluateAll(imgs=>Promise.all(imgs.map(i=>i.decode().catch(()=>{}))));
   assert.deepEqual(await page.locator('img').evaluateAll(imgs=>imgs.filter(i=>!i.naturalWidth).map(i=>i.src)),[]);
  }
  await page.goto(`${origin}/${lang}/`,{waitUntil:'domcontentloaded'});
  await page.goto(`${origin}/${lang}/models/`,{waitUntil:'domcontentloaded'});
  assert.equal(await page.locator('[data-baseline]').count(),12);
  assert.equal(await page.locator('[data-state="ready"]').count(),1);
  assert.equal(await page.locator('[data-state="candidate"]').count(),10);
  assert.equal(await page.locator('[data-state="missing"]').count(),1);
  assert.equal(await page.locator('[data-state="candidate"] img').count(),0);
  await page.goto(`${origin}/${lang}/characters/zipzippipe-chatgpt/`,{waitUntil:'domcontentloaded'});
  assert.equal(await page.locator('.observation-panel a').getAttribute('href'),'https://www.bilibili.com/video/BV14phK66Ejw/');
  await page.goto(`${origin}/${lang}/`,{waitUntil:'domcontentloaded'});
  await page.locator('#search').fill('ZipZipPipe');assert.equal(await page.locator('[data-card]:visible').count(),10);
  await page.locator('#search').fill('nothing-matches-xyz');await page.locator('#empty-state').waitFor({state:'visible'});
  await page.locator('#clear-filters').click();assert.equal(await page.locator('[data-card]:visible').count(),chars.length);
  await page.locator('[data-kind-filter="collected"]').click();assert.equal(await page.locator('[data-card]:visible').count(),3);
  await page.locator('[data-kind-filter="all"]').click();await page.screenshot({path:`.qa/atlas-${lang}-desktop.png`,fullPage:false});
  await page.setViewportSize({width:390,height:844});
  for(const route of ['','assets/','studio/','models/','collection/','characters/deep-whale-maid/']){
   await page.goto(`${origin}/${lang}/${route}`,{waitUntil:'domcontentloaded'});
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,`Mobile overflow: ${lang}/${route}`);
  }
  await page.goto(`${origin}/${lang}/`,{waitUntil:'domcontentloaded'});await page.screenshot({path:`.qa/atlas-${lang}-mobile.png`,fullPage:false});
  await page.setViewportSize({width:1440,height:1000});
  await page.goto(`${origin}/${lang}/studio/?asset=deep-whale-maid&pose=sleepy`,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>!document.getElementById('export-pack').disabled);
  assert.equal(await page.locator('#pose-select').inputValue(),'sleepy');
  await page.selectOption('#size','1024');await page.selectOption('#shape','portrait');await page.selectOption('#format','webp');
  const dl=page.waitForEvent('download');await page.click('#export-pack');const download=await dl;const out=`.qa/export-${lang}.zip`;await download.saveAs(out);
  const zip=await JSZip.loadAsync(await readFile(out));const manifest=JSON.parse(await zip.file('provenance.json').async('string'));
  assert.equal(manifest.output.width,768);assert.equal(manifest.output.height,1024);assert.equal(manifest.source.rights.license,'CC-BY-NC-SA-4.0');assert.equal(manifest.processing.generative,false);
  assert.ok(Object.keys(zip.files).some(p=>p==='evidence/NOTICE.txt'));const m=await sharp(await zip.file(manifest.output.file).async('nodebuffer')).metadata();assert.equal(m.width,768);assert.equal(m.format,'webp');
  const target=lang==='ja'?'en':'ja';await page.locator(`.language-switch a[hreflang="${target}"]`).click();await page.waitForFunction(()=>!document.getElementById('export-pack').disabled);assert.equal(await page.locator('#pose-select').inputValue(),'sleepy');
 }
 await page.goto(`${origin}/en/studio/`,{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>!document.getElementById('export-pack').disabled);
 await page.locator('#upload').setInputFiles('public/collected/shangshan-whale/portrait/original.png');await page.waitForFunction(()=>!document.getElementById('export-pack').disabled);
 await page.click('#export-pack');await page.waitForFunction(()=>document.getElementById('studio-status').textContent.includes('source URL'));
 await page.fill('#source-url','https://www.bilibili.com/opus/1231977657712771073');await page.fill('#source-author','上善无形');await page.fill('#source-terms','CC BY-NC-SA 4.0');await page.selectOption('#format','jpeg');await page.selectOption('#shape','circle');
 const localDL=page.waitForEvent('download');await page.click('#export-pack');await (await localDL).saveAs('.qa/local-export.zip');
 const z=await JSZip.loadAsync(await readFile('.qa/local-export.zip'));const mm=JSON.parse(await z.file('provenance.json').async('string'));assert.equal(mm.source.attribution[0].name,'上善无形');assert.ok(z.file('source-original.png'));
 await page.screenshot({path:'.qa/studio-desktop.png'});
 assert.deepEqual(errors,[]);console.log('Chrome QA passed: every localized route, loaded images, search, filters, mobile layout, locale switching, and source-preserving exports.');
}finally{await browser.close();}
