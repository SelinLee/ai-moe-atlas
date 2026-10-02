import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { readFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import sharp from 'sharp';
import JSZip from 'jszip';
const origin=process.env.ATLAS_TEST_URL??'http://127.0.0.1:4322/ai-moe-atlas';
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
await mkdir('.qa',{recursive:true});
const fixture=await sharp({create:{width:600,height:900,channels:4,background:'#a4d3e2'}}).png().toBuffer();
const browser=await chromium.launch({...(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{channel:'chrome'}),headless:true});
const context=await browser.newContext({viewport:{width:1440,height:1100},acceptDownloads:true});
const page=await context.newPage();const errors=[],requests=[];
page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>requests.push(r));
const ready=()=>page.waitForFunction(()=>!document.getElementById('export-pack').disabled);
async function exported(name){
  const preview=await page.locator('#canvas').evaluate(c=>c.toDataURL('image/png'));
  const dl=page.waitForEvent('download');await page.click('#export-pack');const download=await dl;await download.saveAs(`.qa/${name}.zip`);
  const zip=await JSZip.loadAsync(await readFile(`.qa/${name}.zip`));const m=JSON.parse(await zip.file('provenance.json').async('string'));
  const bytes=await zip.file(m.output.file).async('nodebuffer');assert.equal(hash(bytes),m.output.sha256);
  if(m.processing.format==='png')assert.deepEqual(bytes,Buffer.from(preview.split(',')[1],'base64'),'preview must be the exact exported PNG');
  assert.equal(m.output.visibleCredits,true);assert.ok(m.processing.layout.credits.text.length>0);
  const g=m.processing.layout.image;assert.ok(g.y+g.drawH<=m.processing.layout.credits.y+.001);
  return {zip,m,bytes};
}
try{
  for(const lang of ['zh','en','ja']){
    console.log(`Studio ${lang}: presets, original declaration and matching export`);
    await page.goto(`${origin}/${lang}/studio/?asset=deep-whale-maid&pose=delighted`);await ready();
    assert.equal(await page.locator('#preset').inputValue(),'full-portrait');
    assert.equal(await page.locator('#output-size').textContent(),'768 × 1024');
    await page.selectOption('#preset','avatar-canvas');await ready();assert.equal(await page.locator('#output-size').textContent(),'512 × 512');
    const avatar=await exported(`avatar-${lang}`);assert.equal(avatar.m.processing.preset,'avatar-canvas');assert.equal(avatar.m.output.width,512);
    assert.match(avatar.m.processing.layout.credits.text,/上善无形/);assert.match(avatar.m.processing.layout.credits.text,/ZipZipPipe/);assert.match(avatar.m.processing.layout.credits.text,/Small-tailqwq/);
    assert.match(avatar.m.processing.layout.credits.text,/creativecommons.org/);
    await page.selectOption('#preset','intro-card');await page.fill('#card-title','My writing companion');await ready();
    const card=await exported(`intro-${lang}`);assert.equal(card.m.processing.layout.title,'My writing companion');assert.ok(card.m.processing.layout.headerHeight>0);
    assert.equal(card.m.useReview.uses['intro-card'].decision,'allowed');
    assert.equal(card.m.output.layoutLicense,'CC-BY-NC-SA-4.0');
    await page.screenshot({path:`.qa/studio-p1-${lang}.png`,fullPage:true});
    await page.goto(`${origin}/${lang}/studio/?asset=zipzippipe-chatgpt&pose=portrait`);await ready();
    assert.equal(await page.locator('#preset option[value="intro-card"]').isDisabled(),true);
    await page.selectOption('#preset','avatar-canvas');await ready();const technical=await exported(`technical-avatar-${lang}`);
    assert.equal(technical.m.source.rights.modify,false);assert.equal(technical.m.processing.layout.title,'');
    assert.deepEqual(await technical.zip.file('source-original.jpg').async('nodebuffer'),await readFile('public/collected/zipzippipe-chatgpt/portrait/original.jpg'));
    const downloads=[];const onDownload=d=>downloads.push(d);page.on('download',onDownload);
    await page.evaluate(()=>document.getElementById('preset').value='intro-card');await page.click('#export-pack');
    assert.ok((await page.locator('#studio-status').textContent()).length>0);assert.equal(downloads.length,0);
    await page.selectOption('#preset','full-portrait');await ready();
    await page.locator('#upload').setInputFiles({name:'source-original.png',mimeType:'image/png',buffer:fixture});await ready();
    assert.equal(await page.locator('#character-select').inputValue(),'__local__');assert.equal(await page.locator('#pose-select').isVisible(),false);
    assert.equal(await page.locator('#preset option[value="intro-card"]').isDisabled(),true);
    await page.fill('#source-url','https://example.org/previous-public-work');
    await page.selectOption('#source-type','unpublished-original');
    assert.equal(await page.locator('#source-url').isVisible(),false);assert.equal(await page.locator('#source-url').isDisabled(),true);
    await page.fill('#source-author','Original Tester');await page.fill('#source-terms','For my personal use.');
    await page.click('#export-pack');assert.equal(downloads.length,0);
    assert.equal(await page.locator('#preset option[value="intro-card"]').isDisabled(),true);
    await page.locator('#original-confirm').check();await ready();
    assert.equal(await page.locator('#preset option[value="intro-card"]').isDisabled(),false);
    const own=await exported(`unpublished-${lang}`);
    assert.equal(own.m.source.type,'unpublished-original');assert.equal('pageUrl' in own.m.source,false);
    assert.equal(own.m.source.declaration.independentlyVerified,false);assert.equal(own.m.source.declaration.originalAndUnpublished,true);
    assert.equal(own.m.original.sha256,hash(fixture));assert.equal(own.m.useReview,null);assert.ok(own.m.exportedAt);
    assert.deepEqual(await own.zip.file('source-original.png').async('nodebuffer'),fixture);
    assert.notEqual(own.m.output.file,'source-original.png');
    assert.equal(JSON.stringify(own.m).includes('previous-public-work'),false);
    assert.equal(Object.keys(own.zip.files).some(f=>f.startsWith('evidence/')),false);
    const note=await own.zip.file('README.txt').async('string');assert.match(note,/Original Tester/);assert.match(note,/not independently verified/);assert.match(note,/未经独立核验/);assert.match(note,/独立検証/);
    assert.equal(new URL(page.url()).search,'');
    await page.setViewportSize({width:390,height:844});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);
    await page.screenshot({path:`.qa/studio-p1-${lang}-mobile.png`,fullPage:true});await page.setViewportSize({width:1440,height:1100});
    // Switching to public mode re-enables the URL requirement and removes original status.
    await page.selectOption('#source-type','public-source');await page.fill('#source-url','');const before=downloads.length;await page.click('#export-pack');assert.equal(downloads.length,before);
    await page.fill('#source-url','https://example.org/my-work');const publicExport=await exported(`public-${lang}`);assert.equal(publicExport.m.source.type,'public-source');assert.equal(publicExport.m.source.declaration.originalAndUnpublished,undefined);
    // A new upload must never inherit the previous original declaration or author.
    await page.locator('#upload').setInputFiles({name:'another.png',mimeType:'image/png',buffer:fixture});await ready();
    assert.equal(await page.locator('#original-confirm').isChecked(),false);assert.equal(await page.locator('#source-author').inputValue(),'');
    await page.selectOption('#character-select','deep-whale-maid');await ready();
    assert.equal(await page.locator('#local-source-fields').isVisible(),false);assert.equal(await page.locator('#pose-select').isVisible(),true);
    assert.equal(await page.locator('#character-select option[value="__local__"]').count(),0);
    page.off('download',onDownload);
  }
  // Missing evidence must block the ZIP; a retry may succeed after the network recovers.
  await page.goto(`${origin}/en/studio/?asset=deep-whale-maid&pose=delighted`);await ready();
  await page.route('**/evidence/NOTICE.txt',route=>route.fulfill({status:200,body:'tampered evidence'}));
  let unexpected=false;const capture=()=>unexpected=true;page.on('download',capture);await page.click('#export-pack');
  await page.waitForFunction(()=>document.getElementById('studio-status').textContent.includes('hash'));
  assert.equal(unexpected,false);await page.unroute('**/evidence/NOTICE.txt');page.off('download',capture);await exported('retry-after-evidence-failure');
  // Clipboard errors expose selectable text, instead of hiding the attribution.
  await page.evaluate(()=>Object.defineProperty(navigator.clipboard,'writeText',{configurable:true,value:()=>Promise.reject(new Error('Denied'))}));
  await page.click('#copy-export-credit');assert.match(await page.locator('#credit-status').textContent(),/failed/);
  assert.match(await page.evaluate(()=>window.getSelection().toString()),/Small-tailqwq/);
  // A network wait keeps all editing controls disabled until the export snapshot is complete.
  let resume;const hold=new Promise(resolve=>resume=resolve);
  await page.route('**/evidence/NOTICE.txt',async route=>{await hold;await route.continue();});
  const lockedDownload=page.waitForEvent('download');lockedDownload.catch(()=>{});await page.click('#export-pack');
  assert.equal(await page.locator('#studio-controls').evaluate(e=>e.disabled),true);assert.equal(await page.locator('#upload').isDisabled(),true);
  resume();await lockedDownload;await page.unroute('**/evidence/NOTICE.txt');await ready();
  // Canvas conversion failure does not produce a misleading successful ZIP.
  await page.evaluate(()=>{window.originalToBlob=HTMLCanvasElement.prototype.toBlob;HTMLCanvasElement.prototype.toBlob=function(cb){cb(null);};});
  unexpected=false;page.on('download',capture);await page.click('#export-pack');await ready();assert.equal(unexpected,false);assert.match(await page.locator('#studio-status').textContent(),/image|Image/);
  await page.evaluate(()=>HTMLCanvasElement.prototype.toBlob=window.originalToBlob);page.off('download',capture);
  // Invalid original bytes cannot become a reviewed export.
  await page.route('**/deep-whale-maid/delighted/original.png',route=>route.fulfill({status:200,contentType:'image/png',body:fixture}));
  await page.reload();await page.waitForFunction(()=>document.getElementById('studio-status').textContent.includes('hash'));
  assert.equal(await page.locator('#export-pack').isDisabled(),true);
  assert.equal(requests.some(r=>['POST','PUT','PATCH'].includes(r.method())),false,'local images and declarations must not be uploaded');
  assert.equal(requests.some(r=>r.url().includes('Original%20Tester')||r.url().includes('personal%20use')),false);
  assert.deepEqual(errors,[]);console.log('Studio Chrome QA passed.');
}finally{await browser.close();}
