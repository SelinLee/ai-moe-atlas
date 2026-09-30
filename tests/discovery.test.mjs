import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { allowsUse, assertUsageReview, purposes } from '../src/lib/usage-policy.mjs';
import { readFilters, filterURL } from '../src/lib/catalog-state.mjs';
const reviews=JSON.parse(await readFile(new URL('../content/reviews/artwork-uses.json',import.meta.url),'utf8'));
test('specific uses fail closed and require retained evidence',()=>{
  assert.equal(allowsUse(reviews,'zipzippipe-claude','featured'),true);
  for(const use of ['social-cover','intro-card','lineup-card','readme-demo'])assert.equal(allowsUse(reviews,'zipzippipe-claude',use),false);
  assert.equal(allowsUse(reviews,'missing','featured'),false);
  assert.equal(allowsUse(reviews,'zipzippipe-claude','new-purpose'),false);
  const r=structuredClone(reviews.find(r=>r.characterId==='zipzippipe-claude'));
  r.evidence=[];assert.equal(allowsUse([r],r.characterId,'featured'),false);assert.throws(()=>assertUsageReview(r));
  for(const r of reviews)assert.doesNotThrow(()=>assertUsageReview(r));
});
test('prohibited overrides an otherwise eligible artwork',()=>{
  const r=structuredClone(reviews[0]);r.uses.featured.decision='prohibited';
  assert.equal(allowsUse([r],r.characterId,'featured'),false);
});
test('filter links validate values, bound text and preserve unrelated campaign parameters',()=>{
  assert.deepEqual(readFilters('?model=unknown&kind=invalid&style=clay&q=hello',['deepseek']),{q:'hello',model:'all',kind:'all',style:'all'});
  const s={q:'鲸鱼 & AI',model:'deepseek',kind:'collected',style:'anime'};
  const u=filterURL('https://example.org/sub/zh/?utm_source=demo#catalog',s);
  assert.deepEqual(readFilters(u.search,['deepseek']),s);
  assert.equal(u.pathname,'/sub/zh/');assert.equal(u.searchParams.get('utm_source'),'demo');
  assert.equal(readFilters('?q='+ 'x'.repeat(500),[]).q.length,200);
  const clear=filterURL(u.href,{q:'',model:'all',kind:'all',style:'all'});
  assert.equal(clear.search,'?utm_source=demo');
});
