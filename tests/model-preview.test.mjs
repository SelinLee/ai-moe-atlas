import { test } from 'node:test';
import assert from 'node:assert/strict';
import { canPreviewModel, localModelPath, modelIssues } from '../src/lib/model-policy.mjs';
const tr = value => ({ zh: value, en: value, ja: value });
const model = { id:'whale-3d', characterId:'deep-whale-maid', version:'0.1.0', status:'preview', rightsReviewed:true,
  src:'models/whale/0.1.0/model.glb', poster:'models/whale/0.1.0/poster.webp', title:tr('Whale'), description:tr('Description'), changes:tr('Changes'),
  license:'CC-BY-NC-SA-4.0', licenseUrl:'https://creativecommons.org/licenses/by-nc-sa/4.0/', sourceUrl:'https://example.org/model',
  attribution:[{name:'Artist',url:'https://example.org/artist',role:'model-author'}], reviewedAt:'2026-10-02', fileBytes:1024, sha256:'a'.repeat(64) };
test('model publication requires a distinct, complete asset-specific rights review', () => {
  assert.equal(canPreviewModel(model),true);
  assert.equal(canPreviewModel({...model,status:'ready'}),true);
  for (const key of Object.keys(model)) assert.equal(canPreviewModel({...model,[key]:undefined}),false,`missing ${key}`);
  for (const status of ['pending','blocked','draft','READY']) assert.equal(canPreviewModel({...model,status}),false);
  for (const rightsReviewed of [false,undefined,'true',1]) assert.equal(canPreviewModel({...model,rightsReviewed}),false);
  assert.equal(canPreviewModel(null),false);
});
test('models only load same-site GLB files and validated local posters', () => {
  for (const src of ['https://example.org/model.glb','//example.org/model.glb','models/../private.glb','models/x.gltf','models/x.glb?secret=x','models/x.glb#x','models/%2e%2e/x.glb']) assert.equal(canPreviewModel({...model,src}),false,src);
  for (const poster of ['http://example.org/x.png','models/x.svg','models/../x.png']) assert.equal(canPreviewModel({...model,poster}),false,poster);
  assert.equal(localModelPath('models/model.glb',['.glb']),true);
});
test('three languages, model credits, and trustworthy source links are mandatory', () => {
  assert.ok(modelIssues({...model,title:{en:'Only English'}}).includes('title'));
  assert.equal(canPreviewModel({...model,description:{...model.description,ja:''}}),false);
  assert.equal(canPreviewModel({...model,attribution:[]}),false);
  assert.equal(canPreviewModel({...model,attribution:[{...model.attribution[0],role:tr('Model maker')}]}),true);
  for (const sourceUrl of ['javascript:alert(1)','data:text/plain,hello','http://example.org','https://name:secret@example.org']) assert.equal(canPreviewModel({...model,sourceUrl}),false);
  for (const fileBytes of [0,-1,Infinity,1.5,'1024']) assert.equal(canPreviewModel({...model,fileBytes}),false);
});
