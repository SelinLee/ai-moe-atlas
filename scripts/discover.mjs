import { parseArgs } from 'node:util';
import { execFileSync } from 'node:child_process';
import { writeFile,mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';
const {values}=parseArgs({options:{platform:{type:'string',default:'bilibili'},query:{type:'string',default:'蓝色大肥鱼'},limit:{type:'string',default:'20'},visible:{type:'boolean',default:false}}});
const limit=Math.min(50,Math.max(1,Number(values.limit)||20));let candidates=[];
if(values.platform==='github'){
 const result=JSON.parse(execFileSync('gh',['search','repos',values.query,'--limit',String(limit),'--json','fullName,description,url'],{encoding:'utf8'}));
 candidates=result.map(r=>({title:r.fullName,description:r.description,url:r.url,publisher:r.fullName.split('/')[0],status:'unreviewed',permissions:'unknown'}));
}else if(values.platform==='bilibili'){
 const browser=await chromium.launch({channel:'chrome',headless:!values.visible});
 try{const page=await browser.newPage({locale:'zh-CN'});await page.goto('https://search.bilibili.com/all?keyword='+encodeURIComponent(values.query),{waitUntil:'domcontentloaded',timeout:45000});await page.locator('a[href*="/video/BV"]').first().waitFor({timeout:20000});
 const links=await page.locator('a[href*="/video/BV"]').evaluateAll(as=>as.map(a=>({title:(a.getAttribute('title')||a.textContent||'').trim(),url:a.href,publisher:a.closest('.bili-video-card')?.querySelector('.bili-video-card__info--author')?.textContent?.trim()||null})).filter(a=>a.title&&!a.title.startsWith('稍后再看')&&a.title!=='高级弹幕'));
 const seen=new Set();candidates=links.filter(a=>{const m=a.url.match(/BV[\w]+/);if(!m||seen.has(m[0]))return false;seen.add(m[0]);a.url=`https://www.bilibili.com/video/${m[0]}/`;return true;}).slice(0,limit).map(x=>({...x,status:'unreviewed',permissions:'unknown',originalCreator:null}));
 if(!candidates.length)throw new Error('No results. The site may require verification; retry with --visible. Do not use an existing browser profile.');
 }finally{await browser.close();}
}else throw new Error('Supported discovery platforms: bilibili, github');
const timestamp=new Date().toISOString();const report={schemaVersion:1,platform:values.platform,query:values.query,searchedAt:timestamp,automaticPublication:false,candidates};
await mkdir('content/candidates',{recursive:true});const output=`content/candidates/${values.platform}-${timestamp.replace(/[:.]/g,'-')}.json`;await writeFile(output,JSON.stringify(report,null,2)+'\n');console.log(`${candidates.length} unreviewed leads saved to ${output}. Verify original authors, source images, and artwork terms before collection.`);
