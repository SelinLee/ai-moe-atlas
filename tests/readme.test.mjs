import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile, stat} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {beijingTime,byCumulativeLikes} from '../src/lib/animation-ranking.mjs';
import {rankSongsByLikes} from '../src/lib/song-ranking.mjs';
import {unlistedSourceLeads} from '../src/lib/source-leads.mjs';

const root = new URL('../', import.meta.url);
const read = path => readFile(new URL(path, root), 'utf8');
const chibi=JSON.parse(await read('public/generated/super-chibi-v1/manifest.json'));
const references=JSON.parse(await read('public/generated/ai-models-v5/manifest.json'));
const doodles=JSON.parse(await read('public/generated/rough-doodle-v1/manifest.json'));
const emotes = JSON.parse(await read('public/generated/doodle-emotes-v1/manifest.json'));
const projectChannels=JSON.parse(await read('content/project-video-channels.json'));
const {records}=JSON.parse(await read('content/resources.json'));
const leads=JSON.parse(await read('content/leads.json'));
const characters=JSON.parse(await read('content/characters.json'));
const songs=JSON.parse(await read('content/songs.json'));
const collections=JSON.parse(await read('content/resource-collections.json'));
const resourceById=new Map(records.map(record=>[record.id,record]));
const topVideos=records.filter(record=>record.likes).sort(byCumulativeLikes).slice(0,10);
const topSongs=rankSongsByLikes(songs,resourceById)
 .filter(({leading})=>leading).slice(0,10);
const topSongIds=topSongs.map(({song})=>song.id);
const layouts = [
 ['README.md', 'zh', '资源目录', '收录时间线与待补项', '角色图集'],
 ['README.en.md', 'en', 'Resource directory', 'Timeline and open items', 'Character galleries'],
 ['README.ja.md', 'ja', 'リソース一覧', '収録の経緯と今後の調査項目', 'キャラクターギャラリー']
];
const categories = ['references', 'characters', 'personas', 'songs', ...Object.keys(collections), 'animations', 'desktop-pets', 'sources'];
const directEntryLinks = {
 ...Object.fromEntries(Object.entries(collections).map(([category, entries]) =>
  [category, new Set(entries.map(entry => resourceById.get(entry.id).url))])),
 personas: new Set(records.filter(record => record.category === 'personas').map(record => record.url)),
 songs: new Set(songs.flatMap(song => song.versions.map(version => resourceById.get(version.id).url))),
 animations: new Set(records.filter(record => record.category === 'animation').map(record => record.url)),
 'desktop-pets': new Set(records.filter(record => record.category === 'interactive').map(record => record.url)),
 sources: new Set([
  ...leads.map(lead => lead.url),
  ...records.filter(record => record.category === 'sources').flatMap(record => [record.url, ...record.relations.map(link => link.url)])
 ])
};
for (const [file, lang, directory, timeline, galleries] of layouts) {
 test(`${file}: compact previews match the video and song rankings`,async()=>{
  const markdown=await read(file);
  const videos=markdown.split('<!-- animation-ranking:start -->')[1].split('<!-- animation-ranking:end -->')[0];
  const videoRows=videos.split('\n').filter(row=>/^\| \d+ \|/.test(row));
  assert.equal(videoRows.length,topVideos.length);
  for(const [index,record] of topVideos.entries()){
   assert.ok(videoRows[index].includes(`(${record.likes.sourceUrl}) · ${beijingTime.format(new Date(record.likes.observedAt))}`));
  }
  const songTable=markdown.split('<!-- song-ranking:start -->')[1].split('<!-- song-ranking:end -->')[0];
  assert.deepEqual([...songTable.matchAll(/\/songs\/#([a-z0-9-]+)/g)].map(match=>match[1]),topSongIds);
  for (const [table, leaders] of [[videos, topVideos], [songTable, topSongs.map(({leading}) => leading)]]) {
   const paths = [...new Set(leaders.map(record => record.likes.evidence?.path ?? record.evidence.path))];
   assert.ok(table.includes(`(${paths.length === 1 ? paths[0] : 'content/research/'})`));
  }
 });
 test(`${file}: the desktop-pet section shows the ranked ten and links to the full catalog`,async()=>{
  const markdown=await read(file);
  const desktop=markdown.split('<a id="desktop-pets"></a>')[1].split('<a id="sources"></a>')[0];
  const evidence=desktop.match(/\((content\/research\/\d{4}-\d{2}-\d{2}\/github-interactive-stars-[a-z0-9-]+\.json)\)/);
  assert.ok(evidence);
  const {records:stars}=JSON.parse(await read(evidence[1]));
  const table=desktop.split('\n').filter(line=>line.startsWith('| '));
  assert.equal(table.length,12);
  const expected=stars.slice(0,10);
  assert.equal(expected.length,10);
  assert.deepEqual(table.slice(2).map(row=>{
   const match=row.match(/^\| (\d+) \| \[[^\]]+\]\(https:\/\/[^)]+\) \| \[([\d,]+)\]\((https:\/\/[^)]+)\) \|$/);
   assert.ok(match,row);
   return [Number(match[1]), Number(match[2].replaceAll(',','')), match[3]];
  }),expected.map((row,index)=>[index+1,row.stars,row.url]));
  assert.ok(desktop.includes(`(https://selinlee.github.io/ai-moe-atlas/${lang}/resources/?category=interactive)`));
 });
 test(`${file}: the directory leads with project creations and links each category to its entries`,async()=>{
  const markdown = await read(file);
  const directoryStart = markdown.indexOf(`## ${directory}\n`);
  const firstSection = markdown.indexOf('<a id="references"></a>', directoryStart);
  const contents = markdown.slice(directoryStart, firstSection);
  const categorySections = markdown.slice(firstSection, markdown.indexOf(`## ${timeline}\n`));
  assert.deepEqual([...contents.matchAll(/<!-- category-picks:([\w-]+) -->/g)].map(m=>m[1]), categories);
  const counts = {
   characters: characters.length,
   personas: directEntryLinks.personas.size,
   songs: songs.length,
   references: chibi.assets.length + references.assets.length + doodles.assets.length + emotes.imageCount + projectChannels.length,
   ...Object.fromEntries(Object.entries(collections).map(([category, entries]) => [category, entries.length])),
   animations: records.filter(record => record.category === 'animation').length,
   'desktop-pets': records.filter(record => record.category === 'interactive').length,
   sources: records.filter(record => record.category === 'sources').length + unlistedSourceLeads(records, leads).length
  };
  assert.doesNotMatch(contents + categorySections, /<img\b|!\[/);
  for (const category of categories) {
   assert.ok(categorySections.includes(`<a id="${category}"></a>\n\n### `), category);
   const block = contents.split(`<!-- category-picks:${category} -->\n`)[1]?.split('\n\n')[0];
   assert.ok(block, category);
   const [label, entries] = block.split('\n');
   assert.match(label, new RegExp(`\\]\\(#${category}\\)\\*\\* · ${counts[category] ?? '\\d+'} `));
   assert.ok(label.endsWith('\\'), category);
   const targets = [...entries.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)].map(match=>match[1]);
   if (category === 'references') {
    assert.deepEqual(targets, [
     `https://selinlee.github.io/ai-moe-atlas/${lang}/chibi/`, `docs/DOODLE.${lang}.md`, `https://selinlee.github.io/ai-moe-atlas/${lang}/emotes/`,
     ...projectChannels.map(channel=>channel.url),
    ]);
    assert.ok(categorySections.includes(`(public/generated/README.md#${lang})`));
    continue;
   }
   const links = targets.map(target => {
    const url = new URL(target);
    if (url.hostname === 'selinlee.github.io') {
     assert.ok(url.pathname.startsWith(`/ai-moe-atlas/${lang}/`), url.href);
    }
    if (directEntryLinks[category]) {
     assert.ok(directEntryLinks[category].has(url.href), `${category}: ${url.href}`);
    }
    if (category === 'characters') {
     assert.ok(characters.some(character => url.href === `https://selinlee.github.io/ai-moe-atlas/${lang}/characters/${character.id}/`), url.href);
    }
    return url.href;
   });
   assert.equal(links.length, 3, category);
   assert.equal(new Set(links).size, 3, category);
  }
 });
 test(`${file}: selected reference sheets lead with provenance and working local links`,async()=>{
  const markdown=await read(file);
  const sections = [directory, timeline, galleries].map(title => markdown.indexOf(`## ${title}\n`));
  const [directoryStart, timelineStart, galleryStart] = sections;
  assert.ok(0 < directoryStart && directoryStart < timelineStart && timelineStart < galleryStart);
  const intro = markdown.slice(0, directoryStart);
  for (const route of ['', 'assets/', 'collection/']) {
   assert.ok(intro.includes(`(https://selinlee.github.io/ai-moe-atlas/${lang}/${route})`));
  }
  assert.match(intro, /<img src="public\/generated\/rough-doodle-v1\//);
  const gallery = markdown.slice(galleryStart);
  assert.ok(gallery.indexOf('super-chibi-v1')<gallery.indexOf('ai-models-v5'),'Chibi sheets are the primary visual');
  const chibiImages=[...gallery.matchAll(/<img src="(public\/generated\/super-chibi-v1\/[^"]+)"/g)];
  assert.deepEqual(chibiImages.map(i=>i[1]),chibi.assets.map(a=>`public/${a.preview.path}`));
  const sheetGuide = await read(`docs/CHIBI.${lang}.md`);
  const notice = sheetGuide.split('\n\n').find(block => block.startsWith({zh:'本项目基于',en:'This project used AI',ja:'本プロジェクトが'}[lang]));
  assert.ok(notice && gallery.includes(notice));
  assert.ok(!markdown.includes('ai_video'));
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
  assert.doesNotMatch(markdown, /models\/deep-whale-maid|#model-preview/);
  assert.ok(markdown.includes('RIGHTS.md'));
  for(const [,target] of markdown.matchAll(/(?:\]\(|(?:href|src)=")([^\s"\)]+)/g)){
   if(/^(?:https?:|#)/.test(target))continue;
   await stat(new URL(target.split('#')[0],root));
  }
 });
}
