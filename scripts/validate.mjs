import { readFile,readdir,access } from 'node:fs/promises';
import { assertSource,sha256 } from './lib/policy.mjs';
import { assertUsageReview } from '../src/lib/usage-policy.mjs';
import { assertCandidateReport } from './lib/candidates.mjs';
import { assertResources } from './lib/resources.mjs';
const resources=JSON.parse(await readFile('content/resources.json','utf8'));
const resourceCount=await assertResources(resources,new URL('../',import.meta.url));
console.log(`Validated ${resourceCount} source-only resource records, localized metadata and retained evidence hashes.`);

const categoryArtwork=JSON.parse(await readFile('content/category-preview-artwork.json','utf8'));
if (categoryArtwork.schemaVersion !== 1 || categoryArtwork.scope !== 'noncommercial-category-display') {
  throw new Error('Invalid category artwork scope');
}
for (const {id,target,source,terms,license,original,preview,notices=[]} of categoryArtwork.assets) {
  const {commit,sourceSha256,format} = source;
  if (!/^[a-z0-9-]+$/.test(id) || !/^[a-f0-9]{40}$/.test(commit) ||
      !['webp','png'].includes(format) || !source.rawUrl.endsWith(`.${format}`) ||
      !source.url.includes(`/blob/${commit}/`) || !source.rawUrl.includes(`/${commit}/`) ||
      !terms.includes(`/blob/${commit}/`)) {
    throw new Error(`Category artwork must retain pinned sources: ${id}`);
  }
  if (!resources.records.some(record => record.id === target) ||
      license !== 'https://creativecommons.org/licenses/by-nc-sa/4.0/' ||
      preview.parentSha256 !== sourceSha256 || original.sha256 !== sourceSha256) {
    throw new Error(`Category artwork attribution or provenance mismatch: ${id}`);
  }
  for (const [name,file] of [['original',original],['preview',preview]]) {
    const extension = name === 'original' ? format : 'webp';
    const path = `category-previews/${id}/${name}.${extension}`;
    if (file.path !== path || sha256(await readFile(`public/${path}`)) !== file.sha256) {
      throw new Error(`Category artwork file mismatch: ${id}/${name}`);
    }
  }
  const noticePaths = ['NOTICE.md','LICENSE'].map(name=>`category-previews/${id}/${name}`);
  for (const {path,sha256:expectedHash} of notices) {
    if (!noticePaths.includes(path) || sha256(await readFile(`public/${path}`)) !== expectedHash) {
      throw new Error(`Category artwork notice mismatch: ${id}`);
    }
  }
}

const reviews=JSON.parse(await readFile('content/reviews/artwork-uses.json','utf8'));
const chars=JSON.parse(await readFile('content/characters.json','utf8'));
const songs=JSON.parse(await readFile('content/songs.json','utf8'));
const songVersions=new Map(resources.records.map(record=>[record.id,record.url]));
const displayableSongImages=chars.filter(character=>reviews.find(review=>review.characterId===character.id)?.uses.featured.decision==='allowed');
const songImages=new Set([...displayableSongImages.map(character=>character.preview),...categoryArtwork.assets.map(asset=>asset.preview.path)]);
const songIds=new Set();
const publicLink=value=>{
 const url=new URL(value);
 return url.protocol==='https:'&&!url.username&&!url.password;
};
for(const song of songs){
 if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(song.id)||songIds.has(song.id)||
   !['zh','en','ja'].every(lang=>song.title?.[lang]?.trim())||!song.original?.credit?.trim()||!publicLink(song.original.url))throw new Error(`Invalid song source: ${song.id}`);
 songIds.add(song.id);
 if(!song.versions.length||new Set(song.versions.map(version=>version.id)).size!==song.versions.length||
   song.versions.some(version=>!songVersions.has(version.id)||songVersions.get(version.id)===song.original.url||
    !['cover','arrangement','mv','remix'].includes(version.type)))throw new Error(`Invalid song versions: ${song.id}`);
 if(song.image&&(!songImages.has(song.image.path)||!['characterReference','productionArt'].includes(song.image.kind)||
   !song.image.credit?.trim()||!publicLink(song.image.source)))throw new Error(`Invalid song artwork: ${song.id}`);
}
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

// Generated references have a separate archive; never treat them as collected originals.
const references=JSON.parse(await readFile('public/generated/ai-models-v5/manifest.json','utf8'));
const registry=JSON.parse(await readFile('public/generated/ai-models-v5/upstream-registry.json','utf8'));
const research=JSON.parse(await readFile('content/research/ai-video-2026-09-28.json','utf8'));
if(references.kind!=='generated-reference'||references.displayRequest.grantsUpstreamRights!==false)throw new Error('Generated references must retain their distinct provenance and display scope');
if(references.assets.length!==registry.assets.length||new Set(references.assets.map(a=>a.id)).size!==6)throw new Error('Expected six distinct identity references');
for(const key of ['title','description','notice'])for(const lang of ['zh','en','ja'])if(!references[key]?.[lang]?.trim())throw new Error(`Missing localized reference ${key}`);
for(const snapshot of references.snapshots)if(sha256(await readFile(`public/${snapshot.path}`))!==snapshot.sha256)throw new Error('Reference source snapshot mismatch');
for(const a of references.assets){
 const original=registry.assets.find(r=>r.id===a.id);
 const observation=research.observations.find(o=>o.entity===a.entity);
 if(!original||!chars.some(c=>c.id===a.characterId&&c.entity===a.entity))throw new Error('Invalid reference character mapping');
 if(a.original.sha256!==observation.generatedSha256||a.referenceEvidence.sha256!==observation.evidenceSha256||a.prompt!==original.prompt||a.sourceVideo!==original.source_video)throw new Error('Reference identity/provenance mismatch');
 for(const key of ['name','features'])for(const lang of ['zh','en','ja'])if(!a[key]?.[lang]?.trim())throw new Error('Missing localized reference data');
 for(const file of [a.original,a.preview]){
  if(!file.path.startsWith('generated/ai-models-v5/')||file.path.includes('..'))throw new Error('Invalid reference archive path');
  if(sha256(await readFile(`public/${file.path}`))!==file.sha256)throw new Error('Reference file hash mismatch');
 }
 if(a.preview.parentSha256!==a.original.sha256||a.rights.newLicenseGranted!==false||a.rights.inDownloadPacks!==false||!a.attribution.length)throw new Error('Reference processing or rights mismatch');
 await access(a.rights.evidencePath);
}
console.log('Validated six separately labeled generated references, source snapshots, identity mappings and preserved hashes.');

// Chibi turnarounds keep the selected source revision, bytes and separate rights scope.
const chibi=JSON.parse(await readFile('public/generated/super-chibi-v1/manifest.json','utf8'));
const chibiSource=JSON.parse(await readFile('public/generated/super-chibi-v1/upstream-manifest.json','utf8'));
if(chibi.kind!=='generated-reference'||chibi.displayRequest.grantsUpstreamRights!==false)throw new Error('Chibi display scope changed');
if(chibi.assets.length!==7||new Set(chibi.assets.map(a=>a.id)).size!==7)throw new Error('Expected seven distinct chibi sheets');
for(const key of ['title','description','notice','attributionNote'])for(const lang of ['zh','en','ja'])if(!chibi[key]?.[lang]?.trim())throw new Error(`Missing chibi ${key}/${lang}`);
const checkChibiFile=async file=>{
 if(!file.path.startsWith('generated/super-chibi-v1/')||file.path.includes('..'))throw new Error('Invalid chibi archive path');
 if(sha256(await readFile(`public/${file.path}`))!==file.sha256)throw new Error(`Chibi hash mismatch: ${file.path}`);
};
for(const snapshot of chibi.snapshots)await checkChibiFile(snapshot);
for(const a of chibi.assets){
 const source=chibiSource.assets.find(s=>s.character_id===a.id);
 if(!source||source.path!==a.sourcePath||source.sha256!==a.original.sha256||a.revision!==(source.image_revision??1))throw new Error('Chibi source revision mismatch');
 if(a.views.length!==3||a.views.join()!==source.views.join())throw new Error('Missing chibi views');
 for(const f of [a.original,a.preview,a.prompt,a.request,a.assetRecord])await checkChibiFile(f);
 if(a.preview.parentSha256!==a.original.sha256||a.rights.newLicenseGranted!==false||a.rights.inDownloadPacks!==false)throw new Error('Chibi processing or rights mismatch');
 for(const key of ['name','features'])for(const lang of ['zh','en','ja'])if(!a[key]?.[lang]?.trim())throw new Error('Missing localized chibi data');
 if(a.id==='glm'){
  if(a.attribution.length||a.characterId!==null||a.attributionStatus!=='original-creator-unverified'||a.rights.license!==null)throw new Error('Do not assign unverified GLM authorship or license');
 }else{
  const identity=references.assets.find(r=>r.id===a.id);
  if(!identity||a.characterId!==identity.characterId||JSON.stringify(a.attribution)!==JSON.stringify(identity.attribution)||JSON.stringify(a.rights)!==JSON.stringify(identity.rights))throw new Error('Chibi identity attribution or terms mismatch');
 }
 for(const reference of a.referenceInputs)if(reference.publishedHere&&sha256(await readFile(`public/${reference.publishedHere}`))!==reference.sha256)throw new Error('Chibi identity reference hash mismatch');
}
console.log('Validated seven current chibi revisions, preserved PNGs, previews, prompts, source snapshots and artwork-specific attribution.');

// Doodle previews preserve the selected identities and their artwork-specific records.
const doodles=JSON.parse(await readFile('public/generated/rough-doodle-v1/manifest.json','utf8'));
const generation=JSON.parse(await readFile('public/generated/rough-doodle-v1/generation-record.json','utf8'));
if(doodles.kind!=='generated-style-adaptation'||doodles.displayRequest.grantsUpstreamRights!==false)throw new Error('Doodle display scope changed');
if(doodles.assets.length!==chibi.assets.length||new Set(doodles.assets.map(a=>a.id)).size!==chibi.assets.length)throw new Error('Expected seven distinct doodles');
const checkDoodleFile=async file=>{
 if(!file.path.startsWith('generated/rough-doodle-v1/')||file.path.includes('..'))throw new Error('Invalid doodle archive path');
 if(sha256(await readFile(`public/${file.path}`))!==file.sha256)throw new Error(`Doodle hash mismatch: ${file.path}`);
};
await checkDoodleFile(doodles.stylePrompt);
await checkDoodleFile(doodles.generationRecord);
for(const lang of ['zh','en','ja']){
 if(!doodles.notice[lang]?.trim())throw new Error('Missing localized doodle notice');
 await access(doodles.templates[lang]);
}
for(const a of doodles.assets){
 const reference=chibi.assets.find(item=>item.id===a.id);
 const generated=generation.assets.find(item=>item.id===a.id);
 if(!reference||!generated||a.original.sha256!==generated.image.sha256)throw new Error('Doodle generation record mismatch');
 if(a.reference.sha256!==reference.original.sha256||a.reference.path!==`public/${reference.original.path}`||a.reference.revision!==reference.revision)throw new Error('Doodle reference mismatch');
 const pinned=`https://github.com/SelinLee/ai-moe-atlas/blob/${doodles.sourceCollection.commit}/${a.reference.path}`;
 if(a.reference.url!==pinned||a.reference.commit!==doodles.sourceCollection.commit)throw new Error('Doodle reference must be pinned to its source commit');
 if(a.prompt.sha256!==generated.prompt.sha256)throw new Error('Actual doodle prompt changed');
 if(JSON.stringify(a.attribution)!==JSON.stringify(reference.attribution)||JSON.stringify(a.rights)!==JSON.stringify(reference.rights))throw new Error('Doodle attribution or terms mismatch');
 if(a.preview.parentSha256!==a.original.sha256||a.original.width!==a.original.height)throw new Error('Doodle dimensions or preview parent mismatch');
 for(const file of [a.original,a.preview,a.prompt,a.request])await checkDoodleFile(file);
 const request=JSON.parse(await readFile(`public/${a.request.path}`,'utf8'));
 const prompt=await readFile(`public/${a.prompt.path}`,'utf8');
 if(request.prompt.trimEnd()!==prompt.trimEnd()||request.reference_sha256!==a.reference.sha256||request.output.sha256!==a.original.sha256)throw new Error('Doodle request mismatch');
}
if(sha256(await readFile(doodles.sourceCollection.path))!==doodles.sourceCollection.sha256)throw new Error('Doodle source collection changed');
console.log('Validated seven doodles, exact generation bytes and prompts, pinned references, previews and localized templates.');
