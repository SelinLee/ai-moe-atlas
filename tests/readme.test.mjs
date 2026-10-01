import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile, stat} from 'node:fs/promises';
import {createHash} from 'node:crypto';

const root = new URL('../', import.meta.url);
const read = path => readFile(new URL(path, root), 'utf8');
const locales = [
  ['README.md', 'zh', '## 现在可以做什么'],
  ['README.en.md', 'en', '## What you can do'],
  ['README.ja.md', 'ja', '## できること'],
];
let expectedImages;
for (const [file, lang, features] of locales) {
  test(`${file}: gallery leads with licensed, attributed artwork and working local links`, async () => {
    const markdown = await read(file);
    const gallery = markdown.match(/<table>[\s\S]*?<\/table>/)?.[0];
    assert.ok(gallery, 'A character gallery is present');
    assert.ok(markdown.indexOf(gallery) < markdown.indexOf(features), 'Artwork precedes features');
    assert.match(markdown.slice(0, markdown.indexOf(gallery)), /## \[.+\]\(https:\/\/selinlee\.github\.io\/ai-moe-atlas\/\)/);
    const images = [...gallery.matchAll(/<img src="([^"]+)" width="\d+" alt="([^"]+)"/g)];
    assert.equal(images.length, 6);
    const paths = images.map(match => match[1]);
    expectedImages ??= paths;
    assert.deepEqual(paths, expectedImages, 'The three languages feature the same works');
    for (const [, path, alt] of images) {
      assert.ok(alt.length > 10, 'Images have descriptive alt text');
      const [, , id] = path.split('/');
      const manifest = JSON.parse(await read(`public/collected/${id}/manifest.json`));
      const source = JSON.parse(await read(`content/sources/${id}.json`));
      assert.equal(source.rights.scope, 'artwork');
      assert.equal(source.rights.display, true);
      assert.equal(source.rights.redistribute, true);
      assert.equal(source.rights.commercial, false);
      assert.ok(source.evidenceSnapshots.length > 0);
      assert.ok(gallery.includes(source.originalPublication), 'Gallery links to the creator publication');
      for (const author of source.attribution) assert.ok(gallery.includes(author.name));
      const output = manifest.assets.flatMap(asset => asset.outputs).find(output => `public/${output.path}` === path);
      assert.ok(output, 'Reuse an existing normalized image, not new artwork');
      const bytes = await readFile(new URL(path, root));
      assert.equal(createHash('sha256').update(bytes).digest('hex'), output.sha256);
      assert.ok(gallery.includes(`https://selinlee.github.io/ai-moe-atlas/${lang}/characters/${id}/`));
    }
    assert.match(markdown, /https:\/\/creativecommons\.org\/licenses\/by-nc-sa\/4\.0\//);
    assert.ok(markdown.includes('RIGHTS.md'));
    for (const [, target] of markdown.matchAll(/(?:\]\(|(?:href|src)=")([^\s"\)]+)/g)) {
      if (/^(?:https?:|#)/.test(target)) continue;
      await stat(new URL(target.split('#')[0], root));
    }
  });
}
