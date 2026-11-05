import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile, stat} from 'node:fs/promises';
import {createHash} from 'node:crypto';

const root = new URL('../', import.meta.url);
const read = path => readFile(new URL(path, root), 'utf8');
const chibi=JSON.parse(await read('public/generated/super-chibi-v1/manifest.json'));
const references=JSON.parse(await read('public/generated/ai-models-v5/manifest.json'));
const layouts = [
 ['README.md', 'zh', '资源目录', '收录时间线与待补项', '角色图集'],
 ['README.en.md', 'en', 'Resource directory', 'Timeline and open items', 'Character galleries'],
 ['README.ja.md', 'ja', 'リソース一覧', '収録の経緯と今後の調査項目', 'キャラクターギャラリー']
];
const model = JSON.parse(await read('content/models/deep-whale-maid.json'));
for (const [file, lang, directory, timeline, galleries] of layouts) {
 test(`${file}: selected reference sheets lead with provenance and working local links`,async()=>{
  const markdown=await read(file);
  const sections = [directory, timeline, galleries].map(title => markdown.indexOf(`## ${title}\n`));
  const [directoryStart, timelineStart, galleryStart] = sections;
  assert.ok(0 < directoryStart && directoryStart < timelineStart && timelineStart < galleryStart);
  const intro = markdown.slice(0, directoryStart);
  for (const route of ['', 'assets/', 'studio/']) {
   assert.ok(intro.includes(`(https://selinlee.github.io/ai-moe-atlas/${lang}/${route})`));
  }
  assert.match(intro, /<img src="public\/generated\/rough-doodle-v1\//);
  const gallery = markdown.slice(galleryStart);
  assert.ok(gallery.indexOf('super-chibi-v1')<gallery.indexOf('ai-models-v5'),'Chibi sheets are the primary visual');
  const chibiImages=[...gallery.matchAll(/<img src="(public\/generated\/super-chibi-v1\/[^"]+)"/g)];
  assert.deepEqual(chibiImages.map(i=>i[1]),chibi.assets.map(a=>`public/${a.preview.path}`));
  assert.ok(gallery.includes(chibi.notice[lang]));
  assert.ok(gallery.includes(chibi.attributionNote[lang]));
  for(const a of chibi.assets){
   assert.ok(gallery.includes(`href="public/${a.original.path}"`),'Full turnaround is linked');
   assert.equal(createHash('sha256').update(await readFile(new URL(`public/${a.preview.path}`,root))).digest('hex'),a.preview.sha256);
  }
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
  assert.ok(markdown.includes(`public/${model.poster}`),'Existing model showcase is retained');
  assert.ok(markdown.includes('RIGHTS.md'));
  for(const [,target] of markdown.matchAll(/(?:\]\(|(?:href|src)=")([^\s"\)]+)/g)){
   if(/^(?:https?:|#)/.test(target))continue;
   await stat(new URL(target.split('#')[0],root));
  }
 });
}
