import { readFile,readdir,access } from 'node:fs/promises';
import { assertSource,sha256 } from './lib/policy.mjs';
import { assertUsageReview } from '../src/lib/usage-policy.mjs';
import { assertCandidateReport } from './lib/candidates.mjs';
const reviews=JSON.parse(await readFile('content/reviews/artwork-uses.json','utf8'));
const chars=JSON.parse(await readFile('content/characters.json','utf8'));
const entities=JSON.parse(await readFile('content/entities.json','utf8'));
const baselines=JSON.parse(await readFile('content/baselines.json','utf8'));
// Parse every content JSON, including unpublished research and candidate records.
for(const file of await readdir('content',{recursive:true}))if(file.endsWith('.json'))JSON.parse(await readFile(`content/${file}`,'utf8'));
const sources=await Promise.all((await readdir('content/sources')).filter(f=>f.endsWith('.json')).map(async f=>JSON.parse(await readFile(`content/sources/${f}`,'utf8'))));
let candidateCount=0;
for(const file of (await readdir('content/candidates')).filter(f=>f.endsWith('.json')))candidateCount+=assertCandidateReport(JSON.parse(await readFile(`content/candidates/${file}`,'utf8')),{entities,characters:chars,sources,reviews});
if(baselines.length!==entities.length||new Set(baselines.map(b=>b.entity)).size!==entities.length)throw new Error('Each AI needs exactly one baseline selection');
for(const b of baselines){
 if(!entities.some(e=>e.id===b.entity))throw new Error('Unknown baseline AI');
 if(b.characterId!==null&&!chars.some(c=>c.id===b.characterId&&c.entity===b.entity))throw new Error(`Baseline character belongs to another AI or is missing: ${b.entity}`);
 for(const lang of ['zh','en','ja'])if(!b.nextAction?.[lang]?.trim())throw new Error('Missing localized baseline next action');
}
const seen=new Set();let images=0;
if(reviews.length!==chars.length||new Set(reviews.map(r=>r.characterId)).size!==chars.length)throw new Error('Each artwork entry requires one use review');
for(const c of chars){
 const review=reviews.find(r=>r.characterId===c.id);if(!review)throw new Error('Missing use review');assertUsageReview(review);
 if(JSON.stringify(review.attribution)!==JSON.stringify(c.attribution))throw new Error('Use review attribution mismatch');
 if(seen.has(c.id)||!/^[a-z0-9-]+$/.test(c.id))throw new Error(`Duplicate/invalid character: ${c.id}`);seen.add(c.id);
 if(c.origin!=='web-collected'||!['collected','reference'].includes(c.kind))throw new Error('Only existing, web-collected characters may be published');
 if(!entities.some(e=>e.id===c.entity))throw new Error(`Unknown entity: ${c.entity}`);
 for(const key of ['name','description','story','features','provenanceNote'])for(const lang of ['zh','en','ja'])if(!c[key]?.[lang]?.trim())throw new Error(`Missing ${lang} ${key}: ${c.id}`);
 if(!c.source?.startsWith('https://')||!c.originalPublication?.startsWith('https://')||!c.attribution?.length)throw new Error(`Missing provenance: ${c.id}`);
 if(c.downloadable){
  const s=JSON.parse(await readFile(`content/sources/${c.id}.json`,'utf8'));assertSource(s);
  const m=JSON.parse(await readFile(`public/collected/${c.id}/manifest.json`,'utf8'));
  if(JSON.stringify(review.artworks)!==JSON.stringify(m.source.originals.map(o=>({assetId:o.id,sha256:o.sha256}))))throw new Error('Use review must cover exact original hashes');
  if(JSON.stringify(review.evidence)!==JSON.stringify(m.source.evidence)||review.evidenceUrl!==s.rights.evidenceUrl)throw new Error('Use review evidence mismatch');
  if(m.normalization.generative!==false||m.source.rights.license!==c.license||m.source.originalPublication!==c.originalPublication)throw new Error(`Provenance/terms mismatch: ${c.id}`);
  if(m.assets.length!==c.assets.length)throw new Error('Asset count mismatch');
  for(const o of m.source.originals){if(sha256(await readFile(`public/${o.localPath}`))!==o.sha256)throw new Error('Original hash mismatch');images++;}
  for(const a of m.assets){for(const f of a.outputs){if(f.parentSha256!==a.originalSha256||sha256(await readFile(`public/${f.path}`))!==f.sha256)throw new Error('Derivative provenance/hash mismatch');}}
  for(const e of m.source.evidence)if(sha256(await readFile(`public/${e.localPath}`))!==e.sha256)throw new Error('Permission evidence mismatch');
  await access(`public/packs/${c.id}.zip`);await access(`public/${c.preview}`);
 }else if(c.assets.length||c.preview||review.artworks.length||review.evidence.length||Object.values(review.uses).some(u=>u.decision==='allowed'))throw new Error(`Unlicensed image mirrored or use allowed: ${c.id}`);
}
console.log(`Validated ${chars.length} sourced entries, ${entities.length} AI families, ${images} preserved originals, 3 languages, and every derivative hash.`);
console.log(`Validated ${candidateCount} unpublished candidates and metadata-only publication boundaries.`);
