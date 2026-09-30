import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { localSource, presetAllowed, fitArtwork } from '../src/lib/studio-policy.mjs';
const reviews=JSON.parse(await readFile(new URL('../content/reviews/artwork-uses.json',import.meta.url),'utf8'));
const messages={required:'required',originalRequired:'original required',originalConfirm:'I confirm original and unpublished'};
test('unpublished originals need author, statement and confirmation without a fabricated URL',()=>{
  const f={type:'unpublished-original',author:'Creator',terms:'Personal use',confirmedOriginal:true,url:'https://unused.example/old'};
  const source=localSource(f,messages);
  assert.equal('pageUrl' in source,false);assert.equal(source.declaration.independentlyVerified,false);
  assert.equal(source.declaration.originalAndUnpublished,true);
  assert.equal(source.declaration.usageStatement,'Personal use');
  for(const patch of [{author:''},{terms:' '},{confirmedOriginal:false},{author:'a'.repeat(81)},{terms:'a'.repeat(301)}])assert.throws(()=>localSource({...f,...patch},messages));
});
test('public source still needs HTTPS and does not accept credentials or unknown source types',()=>{
  const f={type:'public-source',author:'Creator',terms:'User-supplied terms',url:'https://example.org/work'};
  assert.equal(localSource(f,messages).pageUrl,f.url);
  for(const url of ['', 'http://example.org','javascript:alert(1)','https://user:secret@example.org','https://example.org/'+ 'a'.repeat(2048)])assert.throws(()=>localSource({...f,url},messages));
  assert.throws(()=>localSource({...f,type:'invented'},messages));
});
test('preset permissions distinguish technical fitting from introduction cards',()=>{
  const review=reviews.find(r=>r.characterId==='zipzippipe-claude');
  for(const preset of ['avatar-canvas','full-portrait','custom'])assert.equal(presetAllowed(preset,{review,sourceType:'collected'}),true);
  assert.equal(presetAllowed('intro-card',{review,sourceType:'collected'}),false);
  assert.equal(presetAllowed('custom',{sourceType:'collected'}),false);
  const prohibited=structuredClone(review);prohibited.uses['technical-canvas'].decision='prohibited';
  assert.equal(presetAllowed('custom',{review:prohibited,sourceType:'collected'}),false);
  assert.equal(presetAllowed('intro-card',{review:reviews.find(r=>r.characterId==='deep-whale-maid'),sourceType:'collected'}),true);
  assert.equal(presetAllowed('intro-card',{sourceType:'public-source'}),false);
  assert.equal(presetAllowed('intro-card',{sourceType:'public-source',compositionConsent:true}),true);
  assert.equal(presetAllowed('intro-card',{sourceType:'unpublished-original',confirmedOriginal:true}),true);
  assert.equal(presetAllowed('intro-card',{sourceType:'unpublished-original',confirmedOriginal:false}),false);
  assert.equal(presetAllowed('invented',{sourceType:'unpublished-original',confirmedOriginal:true}),false);
});
test('credit-reserved layouts preserve corners and aspect ratio, including circular canvases',()=>{
  for(const [width,height] of [[2000,300],[300,2000],[1200,1800],[512,512]])for(const shape of ['square','portrait','circle']){
    const g=fitArtwork(width,height,512,280,shape,0);
    assert.ok(g.x>=0&&g.y>=0);assert.ok(g.x+g.drawW<=512+.001&&g.y+g.drawH<=280+.001);
    assert.ok(Math.abs(g.drawW/g.drawH-width/height)<1e-8);
    if(shape==='circle')assert.ok(Math.hypot(g.drawW/2,g.drawH/2)<=140+.001);
  }
});
