import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import {assertCandidateReport} from '../scripts/lib/candidates.mjs';
import {allowsUse,purposes} from '../src/lib/usage-policy.mjs';
const json=async p=>JSON.parse(await readFile(new URL(`../${p}`,import.meta.url),'utf8'));
const report=await json('content/candidates/manual-2026-11-01.json');
const reports=await Promise.all((await readdir(new URL('../content/candidates/',import.meta.url))).filter(f=>f.endsWith('.json')).map(f=>json(`content/candidates/${f}`)));
const context={entities:await json('content/entities.json'),characters:await json('content/characters.json'),reviews:await json('content/reviews/artwork-uses.json'),sources:await Promise.all((await readdir(new URL('../content/sources/',import.meta.url))).map(f=>json(`content/sources/${f}`)))};
test('November bounded intake keeps four unique source records and no publishing permissions',()=>{
 assert.equal(assertCandidateReport(report,context),4);
 const all=reports.flatMap(r=>r.candidates),ids=all.map(c=>c.id).filter(Boolean),urls=all.flatMap(c=>[c.url,...(c.relatedSources??[]).map(s=>s.url)]);
 assert.equal(new Set(ids).size,ids.length);assert.equal(new Set(urls).size,urls.length);
 for(const c of report.candidates){for(const p of purposes)assert.equal(allowsUse(context.reviews,c.id,p),false);assert.equal(c.observedDatetime,null);assert.equal(c.publicationTimeZone,null);assert.equal(c.publicationDateBasis,'visible-page-date');}
});
test('source text does not inflate artwork counts or clear IB-CC and generator claims',()=>{
 assert.equal(report.candidates.filter(c=>c.sourceType==='illustrated-source').length,3);
 assert.equal(report.candidates.find(c=>c.id==='chichipui-koukaku-chatgpt-lead').sourceType,'text-only-lead');
 assert.equal(report.candidates.find(c=>c.id==='note-poppo-claude').products.length,1);
 assert.ok(report.candidates.every(c=>c.characterCount===null&&c.license.status==='unknown'));
 for(const [key,value] of [['downloadable',true],['studioExport',true],['preview','https://example.org/art.png'],['assets',['art.png']]]){const r=structuredClone(report);r.candidates[0][key]=value;assert.throws(()=>assertCandidateReport(r,context));}
});
