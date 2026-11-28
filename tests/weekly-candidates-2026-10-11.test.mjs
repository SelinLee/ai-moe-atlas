import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import {assertCandidateReport} from '../scripts/lib/candidates.mjs';
import {allowsUse,purposes} from '../src/lib/usage-policy.mjs';
const json=async p=>JSON.parse(await readFile(new URL(`../${p}`,import.meta.url),'utf8'));
const report=await json('content/candidates/manual-2026-10-11.json');
const prior=await json('content/candidates/manual-2026-10-05.json');
const context={entities:await json('content/entities.json'),characters:await json('content/characters.json'),reviews:await json('content/reviews/artwork-uses.json'),sources:await Promise.all((await readdir(new URL('../content/sources/',import.meta.url))).map(f=>json(`content/sources/${f}`)))};
const get=id=>report.candidates.find(c=>c.id===id);
const invalid=mutate=>{const r=structuredClone(report);mutate(r);assert.throws(()=>assertCandidateReport(r,context));};
test('weekly queue adds twelve distinct source groups, eleven illustrated and one text-only',()=>{
 assert.equal(assertCandidateReport(report,context),12);
 assert.equal(report.candidates.filter(c=>c.sourceType==='illustrated-source').length,11);
 assert.equal(get('qiita-natsu-san-ai-personification').sourceType,'text-only-lead');
 const combined=[...prior.candidates,...report.candidates];
 assert.equal(new Set(combined.map(c=>c.id)).size,24);
 assert.equal(new Set(combined.flatMap(c=>[c.url,...c.relatedSources.map(s=>s.url)])).size,combined.flatMap(c=>[c.url,...c.relatedSources.map(s=>s.url)]).length);
 for(const c of report.candidates)for(const p of purposes)assert.equal(allowsUse(context.reviews,c.id,p),false);
});
test('publisher CC claim preserves unresolved upstream rights and cannot allow export',()=>{
 const c=get('github-ai-school-op-cast');
 assert.equal(c.products.length,18);assert.equal(c.license.status,'unknown');
 assert.equal(c.license.publisherClaim.identifier,'CC-BY-NC-4.0');
 assert.equal(c.license.publisherClaim.upstreamReview,'pending');
 assert.match(c.license.publisherClaim.evidenceUrl,/\/blob\/[a-f0-9]{40}\/LICENSE$/);
 for(const k of ['downloadable','studioExport'])invalid(r=>r.candidates.find(x=>x.id===c.id)[k]=true);
 invalid(r=>r.candidates.find(x=>x.id===c.id).license.publisherClaim.upstreamReview='cleared');
 invalid(r=>r.candidates.find(x=>x.id===c.id).license.publisherClaim.evidenceUrl='https://github.com/lshhhhhhh/ai-school-op/blob/main/LICENSE');
 invalid(r=>r.candidates.find(x=>x.id===c.id).license.status='CC-BY-NC-4.0');
});
test('Copilot identities and generation variants remain separate',()=>{
 const y=get('note-yuki-five-ai-introduction');assert.equal(y.products.find(p=>p.product==='Microsoft Copilot').entityId,'copilot');
 const s=get('note-yuki-sengoku-ai');assert.equal(s.products.length,9);
 for(const label of ['Copilot','GitHub Copilot','YahooAI'])assert.equal(s.products.find(p=>p.product===label).entityId,null);
 assert.equal(get('note-protocolfour-ai').products.some(p=>p.product==='MetaAI'),false);
 assert.equal(get('note-sagyo-eggi-five-ai').products.length,5);
 assert.deepEqual(get('note-green-thursday-deepseek-pair').products[0].characterNames,['スー(Si)','シュン(Xun)']);
 for(const id of ['note-hyperhouse-mistral','note-kawamura-le-chonk'])assert.equal(get(id).characterCount,null);
 invalid(r=>r.candidates[0].sourceType='licensed-pack');
});
test('API and repository dates retain timestamp and evidence provenance',()=>{
 invalid(r=>r.candidates[0].observedDatetime=null);
 invalid(r=>delete r.candidates[0].verification.current.metadataEndpoint);
 invalid(r=>r.candidates[0].publicationDate='2000-01-01');
 invalid(r=>delete r.candidates.find(c=>c.id==='github-ai-school-op-cast').publicationEvidenceUrl);
});
