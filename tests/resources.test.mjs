import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {assertResources} from '../scripts/lib/resources.mjs';
const root=new URL('../',import.meta.url);
const registry=JSON.parse(await readFile(new URL('content/resources.json',root),'utf8'));
test('new resources retain source chains, video metadata and hashed evidence',async()=>{
  assert.equal(await assertResources(registry,root),registry.records.length);
  const commentary=registry.records.find(r=>r.bvid==='BV1YFn46SEEr');
  assert.ok(commentary.relations.some(r=>r.url.endsWith('/BV1AAnt6qEek/')));
  assert.ok(registry.records.some(r=>r.category==='interactive'));
});
test('source-only records reject artwork exports, missing languages and false verification',async()=>{
  for(const mutate of [r=>r.preview='unreviewed.webp',r=>r.downloadable=true,r=>delete r.summary.ja,r=>r.verification.httpStatus=412,r=>r.evidence.sha256='0'.repeat(64)]){
    const copy=structuredClone(registry);mutate(copy.records.find(r=>r.verification.result==='metadata-verified'));
    await assert.rejects(()=>assertResources(copy,root));
  }
});
