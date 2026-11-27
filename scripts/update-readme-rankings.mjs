import { readFile, writeFile } from 'node:fs/promises';
import { beijingTime, byCumulativeLikes } from '../src/lib/animation-ranking.mjs';
import { rankSongsByLikes } from '../src/lib/song-ranking.mjs';
import { readPendingAnimationCandidates } from './lib/resources.mjs';
import { unlistedSourceLeads } from '../src/lib/source-leads.mjs';

const root = new URL('../', import.meta.url);
const registry = JSON.parse(await readFile(new URL('content/resources.json', root), 'utf8'));
const songs = JSON.parse(await readFile(new URL('content/songs.json', root), 'utf8'));
const collections = JSON.parse(await readFile(new URL('content/resource-collections.json', root), 'utf8'));
const projectChannels = JSON.parse(await readFile(new URL('content/project-video-channels.json', root), 'utf8'));
const { records } = registry;
const [characters, leads, chibi, references, doodles] = await Promise.all([
  'content/characters.json', 'content/leads.json',
  'public/generated/super-chibi-v1/manifest.json', 'public/generated/ai-models-v5/manifest.json',
  'public/generated/rough-doodle-v1/manifest.json',
].map(async path => JSON.parse(await readFile(new URL(path, root), 'utf8'))));
const directoryCounts = {
  characters: characters.length,
  personas: records.filter(record => record.category === 'personas').length,
  songs: songs.length,
  references: chibi.assets.length + references.assets.length + doodles.assets.length + projectChannels.length,
  ...Object.fromEntries(Object.entries(collections).map(([category, entries]) => [category, entries.length])),
  animations: records.filter(record => record.category === 'animation').length,
  'desktop-pets': records.filter(record => record.category === 'interactive').length,
  sources: records.filter(record => record.category === 'sources').length + unlistedSourceLeads(records, leads).length,
};
const pendingCandidates = await readPendingAnimationCandidates(registry, root);
const animations = records.filter(record => record.category === 'animation');
const ranked = animations.filter(record => record.likes).sort(byCumulativeLikes);
const rankedSongs = rankSongsByLikes(songs, new Map(records.map(record => [record.id, record])))
  .filter(({ leading }) => leading);
const previewCount = 10;
const videoPreview = ranked.slice(0, previewCount);
const songPreview = rankedSongs.slice(0, previewCount);

function previewEvidence(records) {
  const paths = new Set(records.map(record => record.likes.evidence?.path ?? record.evidence.path));
  return paths.size === 1 ? paths.values().next().value : 'content/research/';
}

const videoEvidence = previewEvidence(videoPreview);
const songEvidence = previewEvidence(songPreview.map(({ leading }) => leading));
const text = {
  zh: {
    file: 'README.md', header: '| 排名 | 作品 | 发布者 | 累计点赞（北京时间） |',
    intro: '这里列出 B 站官方累计点赞前十名。同赞按发布日期、BV 号排序。每条数据附官方链接和观测时刻。',
    songHeader: '| 曲目 | 原曲 / 原唱 | 二创代表 | B 站点赞 |',
    songIntro: '每首歌以点赞最高的已收录版本计入排名。这里展示前十首，观测时刻见完整目录。',
    songBrowse: '打开完整歌曲榜与全部版本',
    browse: '打开在线完整榜单', evidence: '点赞观测证据', archive: '历史快照',
    candidateLabel: '待核点赞的候选', recent: '看最新投稿',
    quickTypes: ['看 MV', '看剧情短片', '看舞蹈'],
    pending: count => `${count} 条作品的累计点赞待核，详情见在线榜单。`,
  },
  en: {
    file: 'README.en.md', header: '| Rank | Work | Uploader | Total likes (Beijing time) |',
    intro: 'The top ten by Bilibili’s official cumulative likes. Ties use publication date and BV ID. Each count includes the time of observation and a link to the official endpoint.',
    songHeader: '| Track | Original | Featured fan version | Bilibili likes |',
    songIntro: 'The top ten tracks by the highest total likes on a listed version. Observation times are in the full directory.',
    songBrowse: 'Open the full song ranking and all versions',
    browse: 'Open the full online ranking', evidence: 'Like observation evidence', archive: 'Snapshot archive',
    candidateLabel: 'Candidates awaiting like verification', recent: 'Browse newest uploads',
    quickTypes: ['Browse MVs', 'Browse story shorts', 'Browse dance videos'],
    pending: count => `${count} entries await like verification. See the online ranking for details.`,
  },
  ja: {
    file: 'README.ja.md', header: '| 順位 | 作品 | 投稿者 | 累計いいね（北京時間） |',
    intro: 'Bilibili 公式の累計いいね数の上位10件。同数の場合は公開日と BV ID の順。各数値に公式リンクと観測時刻を掲載。',
    songHeader: '| 楽曲 | 原曲・原唱 | 代表的な二次創作 | Bilibili のいいね |',
    songIntro: '各曲で収録したバージョンの最多いいね数で並べた上位10曲です。観測時刻は全件一覧で確認できます。',
    songBrowse: '楽曲の全順位とすべてのバージョンを見る',
    browse: 'オンラインで全順位を見る', evidence: 'いいね数の観測記録', archive: '過去の観測記録',
    candidateLabel: 'いいね数の確認待ち候補', recent: '新しい投稿を見る',
    quickTypes: ['MV を見る', '物語の短編を見る', 'ダンスを見る'],
    pending: count => `${count} 件のいいね数は確認待ち。詳細はオンラインランキングへ。`,
  },
};

const cell = value => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
  .replace(/[\\|[\]]/g, '\\$&').replace(/[\r\n]+/g, ' ');

function replaceRanking(markdown, name, parts, file) {
  const start = `<!-- ${name}-ranking:start -->`;
  const end = `<!-- ${name}-ranking:end -->`;
  const section = markdown.indexOf(start);
  const boundary = markdown.indexOf(end);
  if (section < 0 || boundary <= section) throw new Error(`Missing ${name} ranking markers in ${file}`);
  return markdown.slice(0, section) + [start, ...parts, end].join('\n\n') + markdown.slice(boundary + end.length);
}

function updateDirectoryCount(markdown, category, count) {
  const label = new RegExp(`(<!-- category-picks:${category} -->\\n[^\\n]+\\]\\(#${category}\\)\\*\\* · )\\d+`);
  if (!label.test(markdown)) throw new Error(`Missing count for ${category} in the README directory`);
  return markdown.replace(label, (_, prefix) => prefix + count);
}

for (const [lang, copy] of Object.entries(text)) {
  const file = new URL(copy.file, root);
  const original = await readFile(file, 'utf8');

  const rows = videoPreview.map((record, index) => {
    const { count, observedAt, sourceUrl } = record.likes;
    const observed = beijingTime.format(new Date(observedAt));
    return `| ${index + 1} | [${cell(record.title[lang])}](${record.url}) | ${cell(record.publisher)} | [${count.toLocaleString(lang)}](${sourceUrl}) · ${observed} |`;
  });
  const online = `https://selinlee.github.io/ai-moe-atlas/${lang}/resources/?category=animation`;
  const parts = [copy.intro, `[${copy.browse}](${online}) · [${copy.evidence}](${videoEvidence}) · [${copy.archive}](${online}#like-evidence)`];
  const quickLinks = ['mv', 'story', 'dance'].map((type, index) => `[${copy.quickTypes[index]}](${online}&type=${type})`);
  parts.push([`[${copy.recent}](${online}&sort=recent)`, ...quickLinks].join(' · '));
  if (pendingCandidates.length) parts[2] += ` · [${copy.candidateLabel}](${online}#pending-animation-evidence)`;
  if (rows.length) parts.push([copy.header, '| ---: | --- | --- | ---: |', ...rows].join('\n'));
  if (ranked.length < animations.length) parts.push(copy.pending(animations.length - ranked.length));

  let updated = replaceRanking(original, 'animation', parts, copy.file);
  const songsUrl = `https://selinlee.github.io/ai-moe-atlas/${lang}/songs/`;
  const songRows = songPreview.map(({ song, leading }) =>
    `| [${cell(song.title[lang])}](${songsUrl}#${song.id}) | ${cell(song.original.credit)} | ${cell(leading.title[lang])} | ${leading.likes.count.toLocaleString(lang)} |`);
  const songParts = [copy.songIntro, [copy.songHeader, '| --- | --- | --- | ---: |', ...songRows].join('\n'),
    `[${copy.songBrowse}](${songsUrl}) · [${copy.evidence}](${songEvidence})`];
  updated = replaceRanking(updated, 'song', songParts, copy.file);
  for (const [category, count] of Object.entries(directoryCounts)) {
    updated = updateDirectoryCount(updated, category, count);
  }
  if (updated !== original) await writeFile(file, updated);
}
