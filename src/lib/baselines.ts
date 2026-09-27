import selections from '../../content/baselines.json';
import { characters, entities } from './data';

export const baselines = entities.map(entity => {
  const selection = selections.find(item => item.entity === entity.id)!;
  const character = characters.find(item => item.id === selection.characterId);
  const state = !character ? 'missing' : character.preview && character.downloadable ? 'ready' : 'candidate';
  return { entity, character, selection, state };
});
export const baselineText = {
  zh: {
    title: '先让每个 AI，都有一个形象。',
    intro: '每个 AI 优先收集一个有出处、可展示的已有形象，再扩充素材。默认展示只是本站的选择，不代表官方或唯一版本。',
    ready: '可展示与下载', candidate: '有候选，原图或使用条件待补', missing: '尚无候选',
    readyCount: '已具备保底形象', candidateCount: '已有来源候选', missingCount: '仍需寻找形象',
    next: '下一步', selected: '本站默认形象', proposed: '优先采集候选',
    notice: '来源链接不计入已完成覆盖。只有原图、来源与使用条件核验通过，才计为可展示。',
    evidence: '补充核对来源', evidenceNote: '以下视频截图用于识别角色与追溯出处，不作为原图或再分发许可。',
    guide: '查看保底收集与复用记录',
  },
  en: {
    title: 'One sourced character for every AI.',
    intro: 'Collect one existing, traceable image we can display for each AI before expanding its asset library. A site default is an editorial choice, not an official or exclusive design.',
    ready: 'Display and download ready', candidate: 'Candidate found; image or terms pending', missing: 'No candidate yet',
    readyCount: 'AI families ready', candidateCount: 'with source candidates', missingCount: 'still need a character',
    next: 'Next step', selected: 'Site default', proposed: 'Priority candidate',
    notice: 'Source links do not count as completed visual coverage. Originals, attribution and usage terms must be verified first.',
    evidence: 'Additional identity evidence', evidenceNote: 'These video screenshots help identify characters and trace their sources. They are not original image files or redistribution permission.',
    guide: 'Read the baseline collection and reuse review',
  },
  ja: {
    title: 'まず、すべての AI にひとつの姿を。',
    intro: '各 AI につき、出典が明確で表示できる既存画像をひとつ集めてから、素材を増やします。標準表示は当サイトの選定であり、公式や唯一のデザインではありません。',
    ready: '表示・ダウンロード可', candidate: '候補あり・原画像または条件を確認中', missing: '候補なし',
    readyCount: 'AI の画像を収集済み', candidateCount: 'AI の候補あり', missingCount: 'AI の形象を探索中',
    next: '次の作業', selected: 'サイトの標準表示', proposed: '優先収集候補',
    notice: '出典リンクだけでは画像の収集完了に数えません。原画像・出典・利用条件の確認が必要です。',
    evidence: '追加の照合資料', evidenceNote: '動画のスクリーンショットは外見の照合と出典調査に使用。原画像や再配布許可の代わりにはなりません。',
    guide: '収集計画と再利用の確認記録',
  },
};
