import { readFile, writeFile } from 'node:fs/promises';
import { byCumulativeLikes, likesObservedDate } from '../src/lib/animation-ranking.mjs';
import { readPendingAnimationCandidates } from './lib/resources.mjs';

const root = new URL('../', import.meta.url);
const registry = JSON.parse(await readFile(new URL('content/resources.json', root), 'utf8'));
const { records } = registry;
const pendingCandidates = await readPendingAnimationCandidates(registry, root);
const animations = records.filter(record => record.category === 'animation');
const ranked = animations.filter(record => record.likes).sort(byCumulativeLikes);
const evidencePaths = new Set(ranked.map(record => record.likes.evidence?.path ?? record.evidence.path));
const evidenceUrl = evidencePaths.size === 1 ? [...evidencePaths][0] : 'content/research/';
const previewCount = 10;
const text = {
  zh: {
    file: 'README.md', header: '| 排名 | 作品 | 发布者 | 累计点赞（观测日） |',
    intro: '这里列出 B 站官方累计点赞前十名。同赞按发布日期、BV 号排序。每条数据附官方链接和观测日（北京时间）。',
    browse: '打开在线完整榜单', evidence: '点赞观测证据', archive: '历史快照',
    candidateLabel: '待核点赞的候选', recent: '看最新投稿',
    quickTypes: ['看 MV', '看剧情短片', '看舞蹈'],
    pending: count => `${count} 条作品的累计点赞待核，详情见在线榜单。`,
  },
  en: {
    file: 'README.en.md', header: '| Rank | Work | Uploader | Total likes (observed) |',
    intro: 'The top ten by Bilibili’s official cumulative likes. Ties use publication date and BV ID. Each count links to the official endpoint and gives its observation date in Beijing time.',
    browse: 'Open the full online ranking', evidence: 'Like observation evidence', archive: 'Snapshot archive',
    candidateLabel: 'Candidates awaiting like verification', recent: 'Browse newest uploads',
    quickTypes: ['Browse MVs', 'Browse story shorts', 'Browse dance videos'],
    pending: count => `${count} entries await like verification. See the online ranking for details.`,
  },
  ja: {
    file: 'README.ja.md', header: '| 順位 | 作品 | 投稿者 | 累計いいね（観測日） |',
    intro: 'Bilibili 公式の累計いいね数の上位10件。同数の場合は公開日と BV ID の順。各数値に公式リンクと観測日（北京時間）を掲載。',
    browse: 'オンラインで全順位を見る', evidence: 'いいね数の観測記録', archive: '過去の観測記録',
    candidateLabel: 'いいね数の確認待ち候補', recent: '新しい投稿を見る',
    quickTypes: ['MV を見る', '物語の短編を見る', 'ダンスを見る'],
    pending: count => `${count} 件のいいね数は確認待ち。詳細はオンラインランキングへ。`,
  },
};

const start = '<!-- animation-ranking:start -->';
const end = '<!-- animation-ranking:end -->';
const cell = value => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
  .replace(/[\\|[\]]/g, '\\$&').replace(/[\r\n]+/g, ' ');

for (const [lang, copy] of Object.entries(text)) {
  const file = new URL(copy.file, root);
  const original = await readFile(file, 'utf8');
  const section = original.indexOf(start);
  const boundary = original.indexOf(end);
  if (section < 0 || boundary <= section) throw new Error(`Missing ranking markers in ${copy.file}`);

  const rows = ranked.slice(0, previewCount).map((record, index) => {
    const { count, observedAt, sourceUrl } = record.likes;
    const date = likesObservedDate.format(new Date(observedAt));
    return `| ${index + 1} | [${cell(record.title[lang])}](${record.url}) | ${cell(record.publisher)} | [${count.toLocaleString(lang)}](${sourceUrl}) · ${date} |`;
  });
  const online = `https://selinlee.github.io/ai-moe-atlas/${lang}/resources/?category=animation`;
  const parts = [copy.intro, `[${copy.browse}](${online}) · [${copy.evidence}](${evidenceUrl}) · [${copy.archive}](${online}#like-evidence)`];
  const quickLinks = ['mv', 'story', 'dance'].map((type, index) => `[${copy.quickTypes[index]}](${online}&type=${type})`);
  parts.push([`[${copy.recent}](${online}&sort=recent)`, ...quickLinks].join(' · '));
  if (pendingCandidates.length) parts[2] += ` · [${copy.candidateLabel}](${online}#pending-animation-evidence)`;
  if (rows.length) parts.push([copy.header, '| ---: | --- | --- | ---: |', ...rows].join('\n'));
  if (ranked.length < animations.length) parts.push(copy.pending(animations.length - ranked.length));

  const rendered = [start, ...parts, end].join('\n\n');
  const updated = (original.slice(0, section) + rendered + original.slice(boundary + end.length))
    .replace(/(href="#animations"><strong>[^<]+<\/strong><\/a><br><strong>)\d+(<\/strong>)/,
      (_, prefix, suffix) => prefix + animations.length + suffix);
  if (updated !== original) await writeFile(file, updated);
}
