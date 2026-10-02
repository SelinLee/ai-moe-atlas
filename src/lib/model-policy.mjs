/** Asset-specific publication gate. Character/image permissions are intentionally not consulted. */
const locales = ['zh', 'en', 'ja'];
const text = value => typeof value === 'string' && value.trim().length > 0;
const localized = value => value && locales.every(locale => text(value[locale]));
const https = value => { try { const url = new URL(value); return url.protocol === 'https:' && !url.username && !url.password; } catch { return false; } };
export const localModelPath = (value, extensions) => typeof value === 'string' && /^models\/[a-zA-Z0-9_./-]+\.[a-zA-Z0-9]+$/.test(value) && !value.includes('..') && extensions.some(extension => value.endsWith(extension));
export function modelIssues(model) {
  if (!model || typeof model !== 'object') return ['manifest'];
  const issues = [];
  for (const key of ['id', 'characterId', 'version', 'license']) if (!text(model[key])) issues.push(key);
  for (const key of ['title', 'description', 'changes']) if (!localized(model[key])) issues.push(key);
  if (!['ready', 'preview'].includes(model.status)) issues.push('status');
  if (model.rightsReviewed !== true) issues.push('rightsReviewed');
  if (!localModelPath(model.src, ['.glb'])) issues.push('src');
  if (!localModelPath(model.poster, ['.webp', '.png', '.jpg', '.jpeg'])) issues.push('poster');
  for (const key of ['licenseUrl', 'sourceUrl']) if (!https(model[key])) issues.push(key);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(model.reviewedAt ?? '') || Number.isNaN(Date.parse(model.reviewedAt))) issues.push('reviewedAt');
  if (!/^[a-f0-9]{64}$/.test(model.sha256 ?? '')) issues.push('sha256');
  if (model.notice !== undefined && !localModelPath(model.notice, ['.txt'])) issues.push('notice');
  if (!Number.isSafeInteger(model.fileBytes) || model.fileBytes < 1) issues.push('fileBytes');
  if (!Array.isArray(model.attribution) || !model.attribution.length || model.attribution.some(a => !text(a.name) || !https(a.url) || !(text(a.role) || localized(a.role)))) issues.push('attribution');
  return issues;
}
export const canPreviewModel = model => modelIssues(model).length === 0;
