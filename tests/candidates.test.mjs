import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { assertCandidateReport } from '../scripts/lib/candidates.mjs';
import { allowsUse, purposes } from '../src/lib/usage-policy.mjs';
const json = async path => JSON.parse(await readFile(new URL(`../${path}`, import.meta.url), 'utf8'));
const report = await json('content/candidates/manual-2026-10-05.json');
const entities = await json('content/entities.json'), characters = await json('content/characters.json'), reviews = await json('content/reviews/artwork-uses.json');
const sources = await Promise.all((await readdir(new URL('../content/sources/', import.meta.url))).filter(f=>f.endsWith('.json')).map(f=>json(`content/sources/${f}`)));
const context = { entities, characters, sources, reviews };
const candidate = id => report.candidates.find(c => c.id === id);
const invalid = mutate => { const copy = structuredClone(report); mutate(copy); assert.throws(()=>assertCandidateReport(copy, context)); };

test('legacy discovery and all twelve metadata-only source groups validate', async () => {
  assert.equal(assertCandidateReport(await json('content/candidates/bilibili-2026-09-27T17-29-26-212Z.json'), context), 15);
  const unknownPublisher=await json('content/candidates/bilibili-2026-09-27T17-29-26-212Z.json');
  unknownPublisher.candidates[0].publisher=null;
  assert.equal(assertCandidateReport(unknownPublisher,context),15);
  assert.equal(assertCandidateReport(report, context), 12);
  const urls = report.candidates.flatMap(c=>[c.url,...c.relatedSources.map(s=>s.url)]);
  assert.equal(urls.filter(url=>url.startsWith('https://note.com/')).length, 13);
  assert.equal(new Set(urls).size, urls.length);
  for (const c of report.candidates) for (const purpose of purposes) assert.equal(allowsUse(reviews, c.id, purpose), false);
});

test('unknown licenses cannot authorize candidate images, packs, previews or exports', () => {
  for (const change of [{downloadable:true},{preview:'candidate.png'},{assets:[{id:'image'}]},{studioExport:true},{files:['original.png']},{usage:'collected'},{permissions:'allowed'},{status:'approved'}]) invalid(r=>Object.assign(r.candidates[0],change));
  invalid(r=>r.automaticPublication=true);
  invalid(r=>r.candidates[0].license.evidenceUrl=r.candidates[0].url);
  invalid(r=>delete r.metadataVersion);
  for (const key of ['characters','sources','reviews']) {
    const c=report.candidates[0],copy=structuredClone(context);
    copy[key].push(key==='reviews'?{characterId:c.id}:{id:c.id});
    assert.throws(()=>assertCandidateReport(report,copy));
  }
});

test('Copilot ambiguity and absent products do not contaminate Microsoft baseline', () => {
  assert.equal(candidate('note-yumie-copilot-claude').products[0].entityId,null);
  assert.equal(candidate('note-yuki-github-copilot').products[0].entityId,null);
  invalid(r=>r.candidates[0].products[0].provider='Microsoft');
  invalid(r=>r.candidates[1].products[0].entityId='copilot');
  invalid(r=>r.candidates.find(c=>c.id==='note-yuki-perplexity').products[0].entityId='chatgpt');
  assert.equal(entities.some(e=>['perplexity','genspark','github-copilot'].includes(e.id)),false);
});

test('characters and generators retain the intended group relationships', () => {
  assert.deepEqual(candidate('note-green-thursday-claude-team').products[0].characterNames,['マサミ','アスハ','ユヅキ']);
  const claude=candidate('note-tsurezurew-claude-generators');
  assert.deepEqual(claude.products.map(p=>p.product),['Claude']);
  assert.deepEqual(claude.generatorVariants.map(v=>v.generator),['ChatGPT','Gemini','Grok']);
  assert.equal(candidate('note-skuma-ai-matrix').grouping,'cross-brand-matrix');
  const yaro=candidate('note-yarotech-five-ai');
  assert.equal(yaro.characterCount,5);assert.equal(yaro.products.length,5);assert.equal(yaro.relatedSources.length,2);
  assert.deepEqual(yaro.products.flatMap(p=>p.characterNames),['チャッピー','ジミー','クロ助','クロコ','コロ']);
  assert.deepEqual(candidate('note-kawamura-yoshida-gemini').products.map(p=>p.entityId),['chatgpt','gemini']);
});

test('redirected Mico announcement retains history without claiming a fresh verification', () => {
  const mico=candidate('microsoft-mico');
  assert.equal(mico.publicationDateBasis,'historical-user-provided');
  assert.equal(mico.verification.current.result,'redirected');
  assert.equal(mico.verification.current.verifiedAt,null);
  assert.equal(mico.relatedSources[0].verification.current.result,'verified-metadata');
  assert.equal(mico.originalCreator,null);assert.equal(mico.license.status,'unknown');
  invalid(r=>r.candidates.find(c=>c.id==='microsoft-mico').verification.current.verifiedAt=report.searchedAt);
  invalid(r=>r.candidates[0].verification.current.httpStatus=403);
  invalid(r=>r.candidates[8].relatedSources[0].url=r.candidates[0].url);
  invalid(r=>r.candidates[1].id=r.candidates[0].id);
});
