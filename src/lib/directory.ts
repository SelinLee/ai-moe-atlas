import { characters, entityName } from './data';
import { resources, stickerEntries, rigEntries, comicEntries, categories, type Category } from './resources';
import { chibiCollection } from './chibi';
import { referenceCollection } from './references';
import doodles from '../../public/generated/rough-doodle-v1/manifest.json';
import songs from '../../content/songs.json';
import { path, repo } from './paths';
import { navigation } from './navigation';
import { resourceText } from './resource-text';
import { t, type Locale } from './i18n';
import { searchText } from './search-text';

export type SearchResult = {
  title: string;
  by: string;
  categories: Category[];
  href: string;
  keywords: string;
  action: { label: string; href: string; download?: boolean };
};

export function directoryIndex(lang: Locale) {
  const n = navigation[lang];
  const s = t(lang);
  const rs = resourceText[lang];
  const rows: SearchResult[] = characters.map(c => ({
    title: c.name[lang],
    by: [c.author, c.downloadable && (c.licenseLabel?.[lang] ?? c.license)].filter(Boolean).join(' · '),
    categories: ['characters'],
    href: path(`${lang}/characters/${c.id}/`),
    keywords: [
      ...Object.values(c.name), entityName(c.entity), c.description[lang],
      c.sourceTitle, c.source, ...c.attribution.map(a => a.name),
    ].join(' '),
    action: c.downloadable
      ? { label: n.pack, href: path(`packs/${c.id}.zip`), download: true }
      : { label: s.viewSource, href: c.source },
  }));
  for (const song of songs) {
    rows.push({
      title: song.title[lang],
      by: song.original.credit,
      categories: ['songs'],
      href: path(`${lang}/songs/#${song.id}`),
      keywords: [...Object.values(song.title), song.original.url, ...song.versions.map(v => v.id)].join(' '),
      action: { label: rs.songs.original, href: song.original.url },
    });
  }
  const series = [
    [chibiCollection, n.chibi, 'chibi'],
    [referenceCollection, n.v5, 'references'],
    [doodles, n.doodle, 'doodle'],
  ] as const;
  for (const [collection, label, route] of series) {
    for (const sheet of collection.assets) {
      rows.push({
        title: `${sheet.name[lang]} · ${label}`,
        by: sheet.attribution.map(a => a.name).join(' → '),
        categories: ['references'],
        keywords: [sheet.id, sheet.characterId, ...Object.values(sheet.name)].join(' '),
        href: route === 'doodle'
          ? `${repo}/blob/main/docs/DOODLE.${lang}.md`
          : path(`${lang}/${route}/#${sheet.id}`),
        action: { label: n.viewImage, href: path(sheet.original.path) },
      });
    }
  }
  for (const r of resources) {
    const sticker = stickerEntries.get(r.id);
    const rig = rigEntries.get(r.id);
    const comic = comicEntries.get(r.id);
    const groups: Category[] = [];
    if (sticker) groups.push('stickers');
    if (rig) groups.push('rigs');
    if (comic) groups.push('comics');
    groups.push(r.category);
    rows.push({
      title: r.title[lang],
      by: r.publisher,
      categories: groups,
      href: path(`${lang}/resources/?category=${groups[0]}#${r.id}`),
      keywords: [
        ...Object.values(r.title), r.sourceTitle, r.bvid, r.id, r.summary[lang], rig?.format,
        comic?.series, comic && rs.comicEpisode(comic.episode), ...(sticker?.characters ?? []),
        ...(sticker?.tags ?? []).map(tag => rs.stickerTags[tag as keyof typeof rs.stickerTags]),
      ].filter(Boolean).join(' '),
      action: { label: r.category === 'personas' ? rs.persona.original : rs.visit, href: r.url },
    });
  }
  for (const row of rows) {
    const labels = row.categories.map(c => rs.category[c].title);
    row.keywords = searchText([row.title, row.by, row.keywords, ...labels].join(' '));
  }
  return rows.sort((a, b) => categories.indexOf(a.categories[0]) - categories.indexOf(b.categories[0]));
}
