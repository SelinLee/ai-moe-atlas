import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { sha256 } from '../src/lib/model-integrity.mjs';
const read=p=>readFileSync(p);
const model=JSON.parse(read('content/models/deep-whale-maid.json'));
test('October 10 release keeps verified candidate bytes and editable source',()=>{
  assert.equal(model.version,'0.5.0');
  assert.equal(model.candidateExportSha256,'575ce515c2c12b946a0589dfb7d5c14f834715d91e6ea39237227fa1ca534335');
  assert.equal(sha256(read(`public/${model.src}`)),model.sha256);
  assert.equal(sha256(read(`public/${model.editableSource.path}`)),'8475b1ab793daa3cbe2e59dda3c4ae6016c31e5bf871a1644057905e29b533fa');
  assert.equal(model.sourceBlendSha256,model.editableSource.sha256);
  assert.equal(sha256(read(`public/${model.poster}`)),model.posterSha256);
  assert.equal(sha256(read(`public/${model.generatedReference.localPath}`)),model.generatedReference.sha256);
});
test('v0.4 baseline remains intact and available for rollback',()=>{
  assert.ok(model.previousVersions.some(v=>v.version==='0.4.0'));
  const baseline=JSON.parse(read('public/models/deep-whale-maid/v0.4.0/manifest.json'));
  assert.equal(baseline.sha256,'deb80d14756f15e2637c948b2a05d524bd2a876cca04714b7dd0bab35b636fe1');
  assert.equal(sha256(read(`public/${baseline.src}`)),baseline.sha256);
});
