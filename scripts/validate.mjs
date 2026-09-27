import { readFile,readdir,access } from 'node:fs/promises';
import { assertSource,sha256 } from './lib/policy.mjs';
const chars=JSON.parse(await readFile('content/characters.json','utf8'));
const entities=JSON.parse(await readFile('content/entities.json','utf8'));
const baselines=JSON.parse(await readFile('content/baselines.json','utf8'));
if(baselines.length!==entities.length||new Set(baselines.map(b=>b.entity)).size!==entities.length)throw new Error('Each AI needs exactly one baseline selection');
for(const b of baselines){
 if(!entities.some(e=>e.id===b.entity))throw new Error('Unknown baseline AI');
 if(b.characterId!==null&&!chars.some(c=>c.id===b.characterId&&c.entity===b.entity))throw new Error(`Baseline character belongs to another AI or is missing: ${b.entity}`);
 for(const lang of ['zh','en','ja'])if(!b.nextAction?.[lang]?.trim())throw new Error('Missing localized baseline next action');
}
const seen=new Set();let images=0;
for(const c of chars){
 if(seen.has(c.id)||!/^[a-z0-9-]+$/.test(c.id))throw new Error(`Duplicate/invalid character: ${c.id}`);seen.add(c.id);
 if(c.origin!=='web-collected'||!['collected','reference'].includes(c.kind))throw new Error('Only existing, web-collected characters may be published');
 if(!entities.some(e=>e.id===c.entity))throw new Error(`Unknown entity: ${c.entity}`);
 for(const key of ['name','description','story','features','provenanceNote'])for(const lang of ['zh','en','ja'])if(!c[key]?.[lang]?.trim())throw new Error(`Missing ${lang} ${key}: ${c.id}`);
 if(!c.source?.startsWith('https://')||!c.originalPublication?.startsWith('https://')||!c.attribution?.length)throw new Error(`Missing provenance: ${c.id}`);
 if(c.downloadable){
  const s=JSON.parse(await readFile(`content/sources/${c.id}.json`,'utf8'));assertSource(s);
  const m=JSON.parse(await readFile(`public/collected/${c.id}/manifest.json`,'utf8'));
  if(m.normalization.generative!==false||m.source.rights.license!==c.license||m.source.originalPublication!==c.originalPublication)throw new Error(`Provenance/terms mismatch: ${c.id}`);
  if(m.assets.length!==c.assets.length)throw new Error('Asset count mismatch');
  for(const o of m.source.originals){if(sha256(await readFile(`public/${o.localPath}`))!==o.sha256)throw new Error('Original hash mismatch');images++;}
  for(const a of m.assets){for(const f of a.outputs){if(f.parentSha256!==a.originalSha256||sha256(await readFile(`public/${f.path}`))!==f.sha256)throw new Error('Derivative provenance/hash mismatch');}}
  for(const e of m.source.evidence)if(sha256(await readFile(`public/${e.localPath}`))!==e.sha256)throw new Error('Permission evidence mismatch');
  await access(`public/packs/${c.id}.zip`);await access(`public/${c.preview}`);
 }else if(c.assets.length||c.preview)throw new Error(`Unlicensed image mirrored: ${c.id}`);
}
console.log(`Validated ${chars.length} sourced entries, ${entities.length} AI families, ${images} preserved originals, 3 languages, and every derivative hash.`);
