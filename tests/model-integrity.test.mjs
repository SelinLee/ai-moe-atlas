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
test('localized model-shape and motion claims agree with the GLB',()=>{
  const negativeRig={zh:/未绑定|无绑定|尚未绑定|不含[^。]*骨骼/,en:/no rig|unrigged|not (?:yet )?rigged|without (?:a )?rig/i,ja:/リグ[^。]*未実装|リグなし|未リグ|リグ[^。]*未設定/};
  const negativeAnimation={zh:/未绑定或制作动画|无动画|未制作动画|不含[^。]*动画|尚未[^。]*动画/,en:/no rig or animation|no animation|unanimated|without animation|not animated/i,ja:/アニメーション[^。]*未実装|アニメーションなし|未アニメーション/};
  const bodyWords={zh:/全身/,en:/full[- ]body/i,ja:/全身/};
  const bustWords={zh:/胸像/,en:/bust/i,ja:/バスト/};
  const deniesBody={zh:/不是全身|非全身|仅[^。]*胸像/,en:/not (?:a )?full[- ]body|bust only/i,ja:/全身モデルではなく|バストのみ/};
  const inferred={zh:/侧面.*背面.*(?:推断|推测)|侧后.*(?:推断|推测)/,en:/side.*back.*inferred/i,ja:/側面.*背面.*推測|側背面.*推測/};
  for(const model of published.filter(model=>model.characterId==='deep-whale-maid')){
    for(const field of ['fullBody','rigged','animated'])assert.equal(typeof model[field],'boolean',`${model.version}: ${field} is explicit`);
    const gltf=inspectGlb(readPublic(model.src));
    assert.equal((gltf.skins?.length??0)>0,model.rigged,`${model.version}: rig claim matches skeleton data`);
    assert.equal((gltf.animations?.length??0)>0,model.animated,`${model.version}: animation claim matches clips`);
    for(const lang of ['zh','en','ja']){
      const description=model.description[lang];const text=`${description} ${model.changes[lang]}`;
      assert.match(description,model.fullBody?bodyWords[lang]:bustWords[lang],`${model.version}: ${lang} describes its actual shape`);
      if(model.fullBody)assert.doesNotMatch(description,deniesBody[lang],`${lang} must not retain the old bust-only caveat`);
      else assert.match(description,deniesBody[lang],`${lang} explicitly discloses the bust limitation`);
      if(model.rigged)assert.doesNotMatch(text,negativeRig[lang],`${lang} must not claim an actual rig is missing`);
      else assert.match(text,negativeRig[lang],`${lang} explicitly discloses no rig`);
      if(model.animated)assert.doesNotMatch(text,negativeAnimation[lang],`${lang} must not claim actual clips are missing`);
      else assert.match(text,negativeAnimation[lang],`${lang} explicitly discloses no animation`);
      if(model.unseenViews==='inferred')assert.match(text,inferred[lang],`${lang} discloses inferred views`);
    }
  }
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
test('the published v0.1 bust and its public provenance remain byte-for-byte preserved',()=>{
  const base='models/deep-whale-maid/v0.1.0';
  const manifestBytes=readPublic(`${base}/manifest.json`);
  assert.equal(sha256(manifestBytes),'aec7b681c58525b99cfd1303ff1b92f9d6d16c110b34c5e9ccc6b251f5fcb8e8','An upgrade must not rewrite v0.1 provenance');
  const original=JSON.parse(manifestBytes.toString());
  assert.equal(original.version,'0.1.0');assert.equal(original.fullBody,false);
  assert.equal(original.src,`${base}/deep-whale-maid.glb`);
  assert.equal(original.fileBytes,6376860);
  assert.equal(original.sha256,'a76e1f3a9db05c62ac836c6ceb268af60f91ec2a999233252c22a90840d1cc07');
  const modelBytes=readPublic(original.src);
  assert.equal(modelBytes.length,original.fileBytes);assert.equal(sha256(modelBytes),original.sha256);
  assert.deepEqual(modelFileIssues(original),[]);
  assert.ok(readPublic(original.notice).length>0);assert.ok(readPublic(original.poster).length>0);
});
