import projectChannels from '../../content/project-video-channels.json';
import { characters, entityName } from './data';
import { resources, stickerEntries, rigEntries, rigFormats, comicEntries, categories, type Category } from './resources';
import { chibiCollection } from './chibi';
import { referenceCollection } from './references';
import doodles from '../../public/generated/rough-doodle-v1/manifest.json';
import songs from '../../content/songs.json';
import categoryArtwork from '../../content/category-preview-artwork.json';
import { canUse } from './usage';
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
  image?: { src: string; credit: string; source: string };
  mediaLabel?: string;
  action: { label: string; href: string; download?: boolean };
};

// These portraits identify the character described by a text card. Each caption links to the art separately.
const personaPortraits: Record<string, string> = {
  'persona-glm-zcode': 'zipzippipe-glm',
  'persona-glm-deslop': 'zipzippipe-glm',
  'persona-gemini-zcode': 'zipzippipe-gemini',
  'persona-claude-deslop': 'zipzippipe-claude',
  'persona-gpt-deslop': 'zipzippipe-chatgpt',
  'persona-gpt-coopanion': 'zipzippipe-chatgpt',
  'persona-deepseek-astrbot': 'shangshan-whale',
  'persona-deepseek-fanpack': 'shangshan-whale',
  'persona-deepseek-linsport-coding': 'shangshan-whale',
  'persona-deepseek-linsport-teaching': 'shangshan-whale',
  'persona-deepseek-zexuan-qq': 'shangshan-whale',
};
const portraits = new Map(characters.filter(c => c.preview && canUse(c.id, 'featured')).map(c => [c.id, c]));
const projectImages = new Map(categoryArtwork.assets.map(a => [a.target, a]));

function portrait(id: string, kind: string, lang: Locale): SearchResult['image'] {
  const c = portraits.get(id);
  if (!c?.preview) return;
  return {
    src: path(c.preview),
    credit: `${kind} · ${c.attribution.map(a => a.name).join(' → ')}`,
    source: path(`${lang}/characters/${c.id}/`),
  };
}

export function directoryIndex(lang: Locale) {
  const n = navigation[lang];
  const s = t(lang);
  const rs = resourceText[lang];
  const rows: SearchResult[] = characters.map(c => ({
    title: c.name[lang],
    by: [!portraits.has(c.id) && c.author, c.downloadable && (c.licenseLabel?.[lang] ?? c.license)].filter(Boolean).join(' · '),
    categories: ['characters'],
    image: portrait(c.id, n.artCredit, lang),
    href: path(`${lang}/characters/${c.id}/`),
    keywords: [
      ...Object.values(c.name), entityName(c.entity), c.author, c.description[lang],
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
      image: song.image && {
        src: path(song.image.path),
        credit: `${rs.songs[song.image.kind as 'productionArt' | 'characterReference']} · ${song.image.credit}`,
        source: song.image.source,
      },
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
      const canShowSheet = sheet.rights.status === 'upstream-sharealike-statement' && sheet.rights.license === 'CC-BY-NC-SA-4.0';
      const credit = sheet.attribution.map(a => a.name).join(' → ');
      const href = route === 'doodle' ? `${repo}/blob/main/docs/DOODLE.${lang}.md` : path(`${lang}/${route}/#${sheet.id}`);
      rows.push({
        title: `${sheet.name[lang]} · ${label}`,
        by: canShowSheet ? 'CC BY-NC-SA 4.0' : credit,
        categories: ['references'],
        keywords: ['SelinLee ai-moe-atlas', sheet.id, sheet.characterId, ...Object.values(sheet.name)].join(' '),
        href,
        image: canShowSheet ? {
          src: path(sheet.preview.path),
          credit: `${n.generatedArt} · ${credit}`,
          source: href,
        } : undefined,
        action: { label: n.viewImage, href: path(sheet.original.path) },
      });
    }
  }
  for (const channel of projectChannels) {
    rows.push({
      title: channel.title[lang],
      by: 'SelinLee · ai-moe-atlas',
      categories: ['references'],
      href: channel.url,
      keywords: [...Object.values(channel.title), channel.url].join(' '),
      action: { label: rs.visit, href: channel.url },
    });
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
    const artwork = projectImages.get(r.id);
    let mediaLabel;
    if (comic) mediaLabel = [comic.sequence && rs.comicSequence(comic.sequence), comic.episode && rs.comicEpisode(comic.episode)].filter(Boolean).join(' · ') || undefined;
    else if (rig) mediaLabel = rigFormats[rig.format as keyof typeof rigFormats];
    else if (!artwork && r.category === 'animation' && r.subtype) {
      const seconds = r.durationSeconds;
      const duration = seconds ? `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}` : '';
      mediaLabel = [rs.types[r.subtype as keyof typeof rs.types], duration].filter(Boolean).join(' · ');
    }
    rows.push({
      title: r.title[lang],
      by: r.publisher,
      categories: groups,
      href: path(`${lang}/resources/?category=${groups[0]}#${r.id}`),
      keywords: [
        ...Object.values(r.title), r.sourceTitle, r.bvid, r.id, r.summary[lang], rig?.format,
        comic?.series, comic?.episode && rs.comicEpisode(comic.episode), comic?.sequence && rs.comicSequence(comic.sequence), ...(sticker?.characters ?? []),
        ...(sticker?.tags ?? []).map(tag => rs.stickerTags[tag as keyof typeof rs.stickerTags]),
      ].filter(Boolean).join(' '),
      image: artwork ? {
        src: path(artwork.preview.path),
        credit: `${n.projectArt} · ${artwork.credit}`,
        source: artwork.terms,
      } : portrait(personaPortraits[r.id], rs.songs.characterReference, lang),
      mediaLabel,
      action: { label: r.category === 'personas' ? rs.persona.original : rs.visit, href: r.url },
    });
  }
  for (const row of rows) {
    const labels = row.categories.map(c => rs.category[c].title);
    row.keywords = searchText([row.title, row.by, row.image?.credit, row.keywords, ...labels].join(' '));
  }
  const comicOrder = (row: SearchResult) => comicEntries.get(row.href.split('#').at(-1) ?? '')?.order ?? Number.MAX_SAFE_INTEGER;
  rows.sort((a, b) => categories.indexOf(a.categories[0]) - categories.indexOf(b.categories[0])
    || (a.categories[0] === 'comics' && b.categories[0] === 'comics'
      ? comicOrder(a) - comicOrder(b) : Number(Boolean(b.image)) - Number(Boolean(a.image))));
  // Show one illustrated entry from each available category when browsing everything.
  const highlights = new Set(categories.filter(c => c !== 'comics').map(c => rows.find(row => row.categories[0] === c && row.image)).filter(row => row !== undefined));
  return [...highlights, ...rows.filter(row => !highlights.has(row))];
}
