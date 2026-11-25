export const normalizeSearch = (value: string) => value.normalize('NFKC').toLowerCase();
const aliases = [
  [/\bqwen(?:\d+(?:\.\d+)?)?\b|千问|千問/, 'qwen 千问 千問'],
  [/\bdoubao\b|豆包/, 'doubao 豆包'],
  [/\bclaude\b|克劳德|克勞德/, 'claude 克劳德 克勞德'],
  [/\bminimax\b|海螺娘|海螺\s*ai/, 'minimax 海螺娘 海螺 ai'],
  [/\b(?:deepseek|whale girl|(?:blue )?fat fish)\b|大肥[鱼魚]|[鲸鯨][鱼魚]娘|クジラ娘/, 'deepseek whale girl blue fat fish 大肥鱼 大肥魚 鲸鱼娘 鯨魚娘 クジラ娘'],
] as const;

export function searchText(value: string) {
  const text = normalizeSearch(value);
  return [text, ...aliases.filter(([pattern]) => pattern.test(text)).map(([, names]) => names)].join(' ');
}
