import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve, join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import sharp from 'sharp';
const script=resolve('scripts/modeling/package-model.mjs');
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const json=path=>readFile(path,'utf8').then(JSON.parse);
async function fixture(buildScript='scripts/modeling/build-test.py'){
  const root=await mkdtemp(join(tmpdir(),'atlas-package-test-'));
  const directory=join(root,'public/models/test/v0.0.0');
  await mkdir(directory,{recursive:true});await mkdir(join(root,'content/models'),{recursive:true});
  const model={id:'test-only-model',version:'0.0.0',src:'models/test/v0.0.0/model.glb',poster:'models/test/v0.0.0/poster.webp',
    fileBytes:1,sha256:'stale GLB hash',posterSha256:'stale poster hash',buildScript,
    buildScriptSha256:'preserved when source is unavailable',sourceBlendSha256:'explicitly packaged source hash',
    license:'test license',reference:{sha256:'untouched reference fingerprint'}};
  await writeFile(join(root,'content/models/deep-whale-maid.json'),JSON.stringify(model));
  await writeFile(join(directory,'model.glb'),Buffer.from('Self-authored disposable packaging-test bytes; never published.'));
  await sharp({create:{width:24,height:24,channels:4,background:'#ee6633'}}).png().toFile(join(directory,'poster.png'));
  return {root,directory,model};
}
function run(root){
  const result=spawnSync(process.execPath,[script],{cwd:root,encoding:'utf8'});
  assert.equal(result.status,0,result.stderr||result.stdout);
}
test('model packaging recomputes encoded-poster and configured build-script hashes on every run',async()=>{
  const f=await fixture();
  try{
    const buildPath=join(f.root,f.model.buildScript);await mkdir(join(f.root,'scripts/modeling'),{recursive:true});
    await writeFile(buildPath,'# Self-authored disposable build test\n');
    run(f.root);
    const first=await json(join(f.root,'content/models/deep-whale-maid.json'));
    assert.deepEqual(await json(join(f.directory,'manifest.json')),first);
    const glb=await readFile(join(f.directory,'model.glb'));
    assert.equal(first.fileBytes,glb.length);assert.equal(first.sha256,hash(glb));
    assert.equal(first.posterSha256,hash(await readFile(join(f.directory,'poster.webp'))));
    assert.equal(first.buildScriptSha256,hash(await readFile(buildPath)));
    assert.equal(first.sourceBlendSha256,f.model.sourceBlendSha256);assert.deepEqual(first.reference,f.model.reference);
    await sharp({create:{width:24,height:24,channels:4,background:'#2266cc'}}).png().toFile(join(f.directory,'poster.png'));
    await writeFile(buildPath,'# Revised self-authored disposable build test\n');
    run(f.root);
    const second=await json(join(f.root,'content/models/deep-whale-maid.json'));
    assert.notEqual(second.posterSha256,first.posterSha256);assert.notEqual(second.buildScriptSha256,first.buildScriptSha256);
    assert.equal(second.posterSha256,hash(await readFile(join(f.directory,'poster.webp'))));
    assert.equal(second.buildScriptSha256,hash(await readFile(buildPath)));
    assert.deepEqual(await json(join(f.directory,'manifest.json')),second);
  }finally{await rm(f.root,{recursive:true,force:true});}
});
test('model packaging does not invent unavailable build or Blender source fingerprints',async()=>{
  for(const buildScript of [undefined,'scripts/modeling/not-packaged.py']){
    const f=await fixture(buildScript);
    if(buildScript===undefined){delete f.model.buildScript;await writeFile(join(f.root,'content/models/deep-whale-maid.json'),JSON.stringify(f.model));}
    try{
      run(f.root);const result=await json(join(f.root,'content/models/deep-whale-maid.json'));
      assert.equal(result.posterSha256,hash(await readFile(join(f.directory,'poster.webp'))));
      assert.equal(result.buildScriptSha256,f.model.buildScriptSha256);
      assert.equal(result.sourceBlendSha256,f.model.sourceBlendSha256);
    }finally{await rm(f.root,{recursive:true,force:true});}
  }
});
