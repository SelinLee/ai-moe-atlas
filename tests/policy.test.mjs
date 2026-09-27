import test from 'node:test';import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';
import {assertSource,sha256} from '../scripts/lib/policy.mjs';import {frameGeometry} from '../src/lib/geometry.mjs';
const source=JSON.parse(await readFile(new URL('../content/sources/deep-whale-maid.json',import.meta.url),'utf8'));
test('code-only licenses cannot authorize artwork collection',()=>{assert.throws(()=>assertSource({...source,rights:{...source.rights,scope:'software'}}));});
test('unknown modification permission blocks processing',()=>{assert.throws(()=>assertSource({...source,rights:{...source.rights,modify:false}}));});
test('unpinned revisions cannot silently change originals',()=>{assert.throws(()=>assertSource({...source,revision:'main'}));});
test('source path traversal is rejected',()=>{assert.throws(()=>assertSource({...source,files:[{id:'x',path:'../../secret.png'}]}));});
test('valid reviewed artwork source passes',()=>{assert.doesNotThrow(()=>assertSource(source));});
test('normalized canvases preserve the complete source aspect ratio',()=>{for(const shape of ['square','circle','portrait']){const g=frameGeometry(1200,1800,512,shape,.1);assert.ok(Math.abs(g.drawW/g.drawH-2/3)<1e-10);assert.ok(g.x>=0&&g.y>=0);assert.ok(g.drawW<=g.w&&g.drawH<=g.h);if(shape==='circle')assert.ok(Math.hypot(g.drawW/2,g.drawH/2)<=g.w/2);}});
test('source fingerprints detect modifications',()=>{assert.notEqual(sha256('original'),sha256('modified'));});
const pixiv=JSON.parse(await readFile(new URL('../content/sources/zipzippipe-chatgpt.json',import.meta.url),'utf8'));
test('custom creator terms allow reviewed technical normalization without claiming creative adaptation rights',()=>{
 assert.equal(pixiv.rights.modify,false);assert.equal(pixiv.rights.normalizationOnly,true);
 assert.doesNotThrow(()=>assertSource(pixiv));
 assert.throws(()=>assertSource({...pixiv,rights:{...pixiv.rights,normalizationOnly:false}}));
});
test('Pixiv originals must match the reviewed artwork, host and content hash',()=>{
 for(const change of [{url:'https://example.com/img-original/148186519_p3.jpg'},{url:pixiv.files[0].url.replace('148186519','12345')},{sha256:'unknown'}]){
  assert.throws(()=>assertSource({...pixiv,files:[{...pixiv.files[0],...change}]}));
 }
});
