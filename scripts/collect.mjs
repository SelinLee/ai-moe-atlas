import { readdir, readFile, mkdir, writeFile, access } from 'node:fs/promises';
import sharp from 'sharp';
import { assertSource, sha256, sourceUrl } from './lib/policy.mjs';

// Never scrape directly into published content. Only reviewed source records enter here.
const requested=process.argv[2];
const files=(await readdir('content/sources')).filter(f=>f.endsWith('.json')&&(!requested||f===`${requested}.json`));
if (!files.length) throw new Error('No reviewed source found');
async function download(url){
 const response=await fetch(url,{signal:AbortSignal.timeout(45000),redirect:'error',headers:new URL(url).hostname==='i.pximg.net'?{Referer:'https://www.pixiv.net/'}:{}});
 if(!response.ok)throw new Error(`${response.status}: ${url}`);
 if(Number(response.headers.get('content-length'))>25_000_000)throw new Error('Source exceeds 25 MB');
 const chunks=[];let size=0;for await(const chunk of response.body){size+=chunk.length;if(size>25_000_000)throw new Error('Source exceeds 25 MB');chunks.push(chunk);}return Buffer.concat(chunks);
}
for(const file of files){
 const s=JSON.parse(await readFile(`content/sources/${file}`,'utf8'));assertSource(s);
 const dir=`public/collected/${s.id}`;await mkdir(`${dir}/evidence`,{recursive:true});
 let previous;try{previous=JSON.parse(await readFile(`${dir}/source.json`,'utf8'));}catch(e){if(e.code!=='ENOENT')throw e;}
 if(previous && previous.revision!==s.revision)throw new Error('Use a new source ID for a new upstream revision; originals are immutable');
 const record={...s,retrievedAt:previous?.retrievedAt??new Date().toISOString(),evidence:[],originals:[]};
 async function retain(path,url){
  let bytes;try{bytes=await readFile(path);}catch(e){if(e.code!=='ENOENT')throw e;bytes=await download(url);await writeFile(path,bytes,{flag:'wx'});}
  const prior=[...(previous?.originals??[]),...(previous?.evidence??[])].find(x=>x.localPath===path.replace('public/',''));
  if(prior && sha256(bytes)!==prior.sha256)throw new Error(`Original hash mismatch: ${path}`);
  return bytes;
 }
 for(const p of s.evidenceFiles??[]){const url=sourceUrl(s,p),localPath=`${dir}/evidence/${p.split('/').at(-1)}.txt`;const bytes=await retain(localPath,url);record.evidence.push({sourceUrl:url,localPath:localPath.replace('public/',''),sha256:sha256(bytes)});}
 for(const [i,e] of (s.evidenceSnapshots??[]).entries()) {const localPath=`${dir}/evidence/source-statement-${i+1}.json`;const bytes=Buffer.from(JSON.stringify(e,null,2)+'\n');await writeFile(localPath,bytes);record.evidence.push({sourceUrl:e.url,localPath:localPath.replace('public/',''),sha256:sha256(bytes)});}
 for(const f of s.files){
  await mkdir(`${dir}/${f.id}`,{recursive:true});const ext=f.path.split('.').at(-1).toLowerCase(),url=sourceUrl(s,f.path),localPath=`${dir}/${f.id}/original.${ext}`;
  const bytes=await retain(localPath,url);const m=await sharp(bytes,{limitInputPixels:40_000_000}).metadata();
  if(f.sha256&&sha256(bytes)!==f.sha256)throw new Error('Reviewed source hash mismatch');
  record.originals.push({...f,sourceUrl:url,sourcePage:['bilibili','pixiv'].includes(s.platform)?s.pageUrl:`https://github.com/${s.repository}/blob/${s.revision}/${f.path}`,localPath:localPath.replace('public/',''),sha256:sha256(bytes),width:m.width,height:m.height,alpha:!!m.hasAlpha,bytes:bytes.length});
 }
 await writeFile(`${dir}/source.json`,JSON.stringify(record,null,2)+'\n');console.log(`Collected ${s.id}: ${record.originals.length} originals, attribution and license evidence retained`);
}
