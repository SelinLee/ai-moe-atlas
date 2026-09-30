import { chromium } from 'playwright';
import { mkdir, copyFile, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
const origin=process.env.ATLAS_TEST_URL??'http://127.0.0.1:4322/ai-moe-atlas';
await mkdir('public/demo',{recursive:true});await mkdir('.qa/demo',{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});
try {
  for(const lang of ['zh','en','ja']) {
    const context=await browser.newContext({viewport:{width:1200,height:820},permissions:['clipboard-read','clipboard-write']});
    const page=await context.newPage();
    // Source-only pixel entry: the capture does not republish third-party artwork.
    await page.goto(`${origin}/${lang}/?style=pixel#catalog`);
    const capture=async index=>{
      await page.locator('#catalog').scrollIntoViewIfNeeded();
      await page.screenshot({path:`.qa/demo/${lang}-${index}.png`});
    };
    await capture(1);
    await page.locator('#entity-filter').selectOption('claude');await capture(2);
    await page.locator('#search').fill('Clawd');await page.locator('#copy-results').click();await capture(3);
    const url=await page.evaluate(()=>navigator.clipboard.readText());await page.goto(url);await capture(4);
    await page.locator('[data-card]:visible .card-title a').click();
    await page.screenshot({path:`.qa/demo/${lang}-5.png`});
    await copyFile(`.qa/demo/${lang}-3.png`,`public/demo/discovery-${lang}.png`);
    const frames=Array.from({length:5},(_,i)=>`file '${lang}-${i+1}.png'\nduration 3`).join('\n')+`\nfile '${lang}-5.png'\n`;
    await writeFile(`.qa/demo/${lang}.txt`,frames);
    execFileSync('ffmpeg',['-y','-loglevel','error','-f','concat','-safe','0','-i',`.qa/demo/${lang}.txt`,'-t','15','-r','15','-c:v','libx264','-pix_fmt','yuv420p','-movflags','+faststart',`public/demo/discovery-${lang}.mp4`]);
    await context.close();
  }
} finally {await browser.close();}
