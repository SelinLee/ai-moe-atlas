import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';
import { canPreviewModel, modelIssues } from '../src/lib/model-policy.mjs';
import { inspectGlb, modelFileIssues, modelManifestPath, sha256 } from '../src/lib/model-integrity.mjs';
const directory='content/models';
const files=existsSync(directory)?readdirSync(directory).filter(file=>file.endsWith('.json')):[];
const manifests=files.map(file=>JSON.parse(readFileSync(join(directory,file),'utf8')));
const published=manifests.filter(model=>['ready','preview'].includes(model.status));
const readPublic=path=>readFileSync(join('public',path));

test('every published 3D manifest has intact self-contained GLB bytes and a matching public manifest',()=>{
  assert.ok(published.some(model=>model.characterId==='deep-whale-maid'),'Whale Maid prototype is present');
  for (const model of published) {
    assert.deepEqual(modelIssues(model),[],model.id);
    assert.equal(canPreviewModel(model),true);
    assert.deepEqual(modelFileIssues(model),[],model.id);
    const bytes=readPublic(model.src);const gltf=inspectGlb(bytes);
    assert.equal(bytes.length,model.fileBytes);assert.equal(sha256(bytes),model.sha256);
    assert.equal(bytes.readUInt32LE(0),0x46546c67);assert.equal(bytes.readUInt32LE(4),2);assert.equal(bytes.readUInt32LE(8),bytes.length);
    assert.deepEqual(JSON.parse(readPublic(modelManifestPath(model)).toString()),model,'Public model metadata must match the reviewed source record');
    assert.ok(bytes.length<15*1024*1024,'Keep deliberately loaded mobile previews below 15 MiB');
    for(const credit of model.attribution)assert.ok(gltf.asset.copyright.includes(credit.name),`Embedded copyright must retain ${credit.name}`);
    assert.ok(gltf.asset.copyright.toLowerCase().replace(/[-\s]/g,'').includes(model.license.toLowerCase().replace(/[-\s]/g,'')),'Embedded copyright retains the model license');
    assert.equal((gltf.buffers??[]).some(buffer=>buffer.uri),false);
    assert.equal((gltf.images??[]).some(image=>image.uri&&!image.uri.startsWith('data:')),false);
    assert.equal((gltf.extensionsRequired??[]).some(extension=>/draco|meshopt|basisu/i.test(extension)),false,'Do not silently fetch third-party decoder code');
  }
});
test('3D reference and permission evidence still match the preserved source bytes',()=>{
  for(const model of published.filter(model=>model.characterId==='deep-whale-maid')){
    const reference=model.reference;
    assert.ok(reference,'Reconstruction must identify its exact reference');
    const source=JSON.parse(readPublic(`collected/${model.characterId}/manifest.json`).toString()).source;
    const original=source.originals.find(original=>original.id===reference.id);
    assert.ok(original,'Reference must be an existing preserved original');
    for(const key of ['sha256','localPath','sourceUrl','sourcePage','bytes','width','height'])assert.equal(reference[key],original[key],key);
    const originalBytes=readPublic(reference.localPath);
    assert.equal(sha256(originalBytes),reference.sha256);assert.equal(originalBytes.length,reference.bytes);
    assert.equal(model.sourceUrl,reference.sourcePage);
    assert.match(model.sourceUrl,/\/blob\/[a-f0-9]{40}\//,'Reference publication must be revision-pinned');
    assert.equal(source.rights.modify,true);assert.equal(source.rights.redistribute,true);assert.equal(source.rights.commercial,false);
    assert.equal(model.license,source.rights.license);
    assert.ok(reference.evidence?.length>=2);
    for(const evidence of reference.evidence)assert.equal(sha256(readPublic(evidence.localPath)),evidence.sha256,evidence.localPath);
    const notice=readPublic(model.notice).toString();
    for(const credit of model.attribution)assert.ok(notice.includes(credit.name));
    assert.ok(notice.includes(model.licenseUrl));assert.ok(notice.includes(reference.sourcePage));
    assert.match(notice,/non-commercial/i);assert.match(notice,/share.*same license/is);
  }
});
test('prototype limitations are explicit in all three languages and agree with the GLB',()=>{
  const model=published.find(model=>model.characterId==='deep-whale-maid');
  assert.equal(model.status,'preview');assert.equal(model.fullBody,false);assert.equal(model.rigged,false);assert.equal(model.animated,false);assert.equal(model.unseenViews,'inferred');
  const gltf=inspectGlb(readPublic(model.src));
  assert.equal(gltf.animations?.length??0,0);assert.equal(gltf.skins?.length??0,0);
  assert.equal(gltf.meshes.some(mesh=>mesh.primitives.some(primitive=>primitive.targets?.length)),false);
  assert.match(model.description.zh,/静态胸像/);assert.match(model.description.zh,/不是全身模型/);assert.match(model.description.zh,/未绑定.*动画/);
  assert.match(model.description.en,/static bust/);assert.match(model.description.en,/not a full-body model/);assert.match(model.description.en,/no rig or animation/);
  assert.match(model.description.ja,/静止バスト/);assert.match(model.description.ja,/全身モデルではなく/);assert.match(model.description.ja,/リグ.*アニメーション.*未実装/);
  assert.match(model.changes.zh,/侧面.*背面.*推断/);assert.match(model.changes.en,/Side and back.*inferred/);assert.match(model.changes.ja,/側面.*背面.*推測/);
});
test('poster decodes, metadata links do not expose unapproved download/commerce actions, and no QA fixture remains',async()=>{
  for(const model of published){
    const poster=await sharp(readPublic(model.poster)).metadata();
    assert.ok(['png','webp','jpeg'].includes(poster.format));assert.ok(poster.width>=400&&poster.height>=400);
    const ui=readFileSync('src/components/ModelPreview.astro','utf8');
    assert.match(ui,/model\.notice/);assert.match(ui,/model\.publicManifest/);
    assert.doesNotMatch(ui,/<a\b[^>]*\bdownload(?:\s|=|>)/);
    assert.doesNotMatch(ui,/href=\{path\(model\.src\)\}/);
    assert.doesNotMatch(ui,/checkout|payment|\bbuy\b|\bsell\b/i);
  }
  const paths=[];function walk(directory){for(const entry of readdirSync(directory,{withFileTypes:true})){const path=join(directory,entry.name);paths.push(path);if(entry.isDirectory())walk(path);}}
  walk('public/models');walk('content/models');
  assert.equal(paths.some(path=>/__viewer-test|fixture|\.tmp(?:$|\/)/i.test(path)),false);
  assert.equal(manifests.some(model=>/QA geometry fixture|local-qa/i.test(JSON.stringify(model))),false);
});
test('GLB inspection rejects truncation, wrong versions, and corrupt lengths before publication',()=>{
  const bytes=readPublic(published[0].src);
  for(const bad of [Buffer.from('fake'),bytes.subarray(0,bytes.length-4)])assert.throws(()=>inspectGlb(bad));
  const badMagic=Buffer.from(bytes);badMagic.writeUInt32LE(0,0);assert.throws(()=>inspectGlb(badMagic),/magic/);
  const badVersion=Buffer.from(bytes);badVersion.writeUInt32LE(1,4);assert.throws(()=>inspectGlb(badVersion),/version/);
  const badChunk=Buffer.from(bytes);badChunk.writeUInt32LE(0xffffffff,12);assert.throws(()=>inspectGlb(badChunk),/length/);
  const wrongHash={...published[0],sha256:'0'.repeat(64)};assert.ok(modelFileIssues(wrongHash).includes('sha256 mismatch'));
  const wrongLength={...published[0],fileBytes:1};assert.ok(modelFileIssues(wrongLength).includes('fileBytes mismatch'));
});
