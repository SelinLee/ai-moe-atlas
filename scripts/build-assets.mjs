import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises';
import sharp from 'sharp';
import JSZip from 'jszip';
import { assertSource, sha256 } from './lib/policy.mjs';
await mkdir('public/packs',{recursive:true});
const requested=process.argv[2];
const fixedDate=new Date('2026-01-01T00:00:00Z');
for(const f of (await readdir('content/sources')).filter(f=>f.endsWith('.json')&&(!requested||f===`${requested}.json`))){
 const s=JSON.parse(await readFile(`content/sources/${f}`,'utf8'));assertSource(s);
 const dir=`public/collected/${s.id}`;const record=JSON.parse(await readFile(`${dir}/source.json`,'utf8'));
 if(record.revision!==s.revision)throw new Error('Source revision mismatch');
 const zip=new JSZip();const manifest={version:1,characterId:s.characterId,source:record,normalization:{tool:`sharp ${sharp.versions.sharp}`,policy:'preserve-original-identity',generative:false,notes:'Fit complete original to canvas. No new pose, expression, costume, background removal, or invented detail. 2x output is resampling, not recovered detail.'},assets:[]};
 for(const o of record.originals){
  const bytes=await readFile(`public/${o.localPath}`);if(sha256(bytes)!==o.sha256)throw new Error('Original was modified');
  const outputs=[];
  const variants=[{name:'standard.png',size:512,format:'png'},{name:'preview.webp',size:512,format:'webp'},{name:'avatar.png',size:256,format:'png'},{name:'large-1024.png',size:1024,format:'png'}];
  for(const v of variants){
   const result=await sharp(bytes,{limitInputPixels:40_000_000}).rotate().resize(v.size,v.size,{fit:'contain',background:{r:0,g:0,b:0,alpha:0},kernel:'lanczos3'}).toFormat(v.format,v.format==='webp'?{quality:92}:{compressionLevel:9}).toBuffer();
   const out=`${dir}/${o.id}/${v.name}`;await writeFile(out,result);
   outputs.push({path:out.replace('public/',''),sha256:sha256(result),width:v.size,height:v.size,operation:'contain-resample',upscaled:v.size>Math.max(o.width,o.height),parentSha256:o.sha256});
   zip.file(`${o.id}/${v.name}`,result,{date:fixedDate});
  }
  zip.file(`${o.id}/${o.localPath.split('/').at(-1)}`,bytes,{date:fixedDate});manifest.assets.push({id:o.id,label:o.label,original:o.localPath,originalSha256:o.sha256,outputs});
 }
 for(const e of record.evidence){const b=await readFile(`public/${e.localPath}`);if(sha256(b)!==e.sha256)throw new Error('License evidence changed');zip.file(`evidence/${e.localPath.split('/').at(-1)}`,b,{date:fixedDate});}
 const attribution=record.attribution.map(x=>`${x.name} — ${x.role} — ${x.url}`).join('\n');
 const terms=s.rights.terms?`${s.rights.terms.zh}\n${s.rights.terms.en}\n${s.rights.terms.ja}`:'Non-commercial only. Attribution and ShareAlike required.\n仅限非商业使用；保留完整署名链；衍生素材以相同许可共享。\n非営利利用のみ。全作者のクレジットと同一ライセンスでの共有が必要です。';
 const readme=`# ${s.id}\n\n中文 / English / 日本語\n\n## 来源 / Source / 出典\n${s.pageUrl}\nRevision: ${s.revision}\n\n${attribution}\n\n## 使用条件 / Terms / 利用条件\n${s.rights.license}\n${terms}\nRead the original terms and notices in evidence/; Bilibili sources include the creator’s permission statement and license link.\n\n## 加工 / Processing / 加工内容\nAI Moe Atlas only fits existing collected images to standard canvases and converts formats. Original bytes are preserved. No new character, pose, expression, or design was generated. 1024 px files may be resampled enlargements, not new image detail.\n仅进行画布规范化、等比缩放和格式转换，保留原始字节。未生成新角色、新表情或新姿态。1024 像素文件可能为插值放大，并非新增细节。\n既存の収集画像の余白・寸法・形式のみを統一しています。原本を保存し、新しいキャラクター・表情・ポーズは生成していません。1024 px 版は補間拡大の場合があり、細部の復元ではありません。\n\nSee manifest.json for source URLs, SHA-256, dimensions, transformations and permission evidence.\n`;
 await writeFile(`${dir}/manifest.json`,JSON.stringify(manifest,null,2)+'\n');await writeFile(`${dir}/README.txt`,readme);
 zip.file('README.txt',readme,{date:fixedDate});zip.file('manifest.json',JSON.stringify(manifest,null,2),{date:fixedDate});
 await writeFile(`public/packs/${s.id}.zip`,await zip.generateAsync({type:'nodebuffer',compression:'DEFLATE',compressionOptions:{level:6}}));
 console.log(`Packaged ${s.id}: ${manifest.assets.length} collected images; source files unchanged`);
}
