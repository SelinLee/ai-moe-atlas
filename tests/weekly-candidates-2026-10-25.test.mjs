import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import {assertCandidateReport} from '../scripts/lib/candidates.mjs';
import {allowsUse,purposes} from '../src/lib/usage-policy.mjs';
const json=async p=>JSON.parse(await readFile(new URL(`../${p}`,import.meta.url),'utf8'));
const report=await json('content/candidates/manual-2026-10-25.json');
const reports=await Promise.all((await readdir(new URL('../content/candidates/',import.meta.url))).filter(f=>f.endsWith('.json')).map(f=>json(`content/candidates/${f}`)));
const context={entities:await json('content/entities.json'),characters:await json('content/characters.json'),reviews:await json('content/reviews/artwork-uses.json'),sources:await Promise.all((await readdir(new URL('../content/sources/',import.meta.url))).map(f=>json(`content/sources/${f}`)))};
test('October 25 intake adds four source groups with no ID or URL duplication across queues',()=>{
 assert.equal(assertCandidateReport(report,context),4);
 const all=reports.flatMap(r=>r.candidates);
 const ids=all.map(c=>c.id).filter(Boolean);assert.equal(new Set(ids).size,ids.length);
 const urls=all.flatMap(c=>[c.url,...(c.relatedSources??[]).map(s=>s.url)]);assert.equal(new Set(urls).size,urls.length);
 for(const c of report.candidates){
  assert.equal(c.publicationDateBasis,'visible-page-date');assert.equal(c.observedDatetime,null);assert.equal(c.publicationTimeZone,null);
  assert.equal(c.verification.current.httpStatus,200);
  for(const p of purposes)assert.equal(allowsUse(context.reviews,c.id,p),false);
 }
});
test('limited creation statement cannot open downloads, export or effective rights',()=>{
 const original=report.candidates.find(c=>c.id==='note-gigabit-ai-team');
 assert.equal(original.products.length,4);assert.match(original.license.note.en,/permits creating images/);
 for(const [key,value] of [['downloadable',true],['studioExport',true],['preview','https://example.com/art.png'],['assets',['art.png']]]){
  const r=structuredClone(report);r.candidates.find(c=>c.id===original.id)[key]=value;assert.throws(()=>assertCandidateReport(r,context));
 }
 const r=structuredClone(report);r.candidates[0].license.status='cleared';assert.throws(()=>assertCandidateReport(r,context));
});
test('article scope separates generator mentions and non-brand variants',()=>{
 const get=id=>report.candidates.find(c=>c.id===id);
 assert.deepEqual(get('note-ttaku-gemini').products.map(p=>p.product),['Gemini']);
 assert.deepEqual(get('note-lilysoma-chiho').products.map(p=>p.characterNames),[['千帆']]);
 assert.equal(get('note-ai-to-illust-three-ai').products.length,3);
 assert.ok(report.candidates.every(c=>c.products.every(p=>!p.official)));
});
