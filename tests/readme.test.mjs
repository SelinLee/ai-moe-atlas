import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile, stat} from 'node:fs/promises';
import {createHash} from 'node:crypto';

const root = new URL('../', import.meta.url);
const read = path => readFile(new URL(path, root), 'utf8');
const references=JSON.parse(await read('public/generated/ai-models-v5/manifest.json'));
for (const [file,lang,features] of [['README.md','zh','## 现在可以做什么'],['README.en.md','en','## What you can do'],['README.ja.md','ja','## できること']]) {
 test(`${file}: selected reference sheets lead with provenance and working local links`,async()=>{
  const markdown=await read(file);
  const gallery=markdown.slice(markdown.indexOf('## ',markdown.indexOf('## [')+3),markdown.indexOf(features));
  assert.ok(gallery.includes('ai-models-v5'));
  const images=[...gallery.matchAll(/!\[[^\]]+\]\((public\/generated\/[^)]+)\)/g)];
  assert.equal(images.length,6);
  assert.deepEqual(images.map(i=>i[1]),references.assets.map(a=>`public/${a.preview.path}`));
  assert.ok(gallery.includes(references.notice[lang]),'Generation and rights labels remain visible');
  for(const a of references.assets){
   const bytes=await readFile(new URL(`public/${a.preview.path}`,root));
   assert.equal(createHash('sha256').update(bytes).digest('hex'),a.preview.sha256);
   for(const author of a.attribution)assert.ok(gallery.includes(author.name));
  }
  assert.ok(markdown.includes('public/models/deep-whale-maid/v0.4.0/poster.webp'),'Existing model showcase is retained');
  assert.ok(markdown.includes('RIGHTS.md'));
  for(const [,target] of markdown.matchAll(/(?:\]\(|(?:href|src)=")([^\s"\)]+)/g)){
   if(/^(?:https?:|#)/.test(target))continue;
   await stat(new URL(target.split('#')[0],root));
  }
 });
}
