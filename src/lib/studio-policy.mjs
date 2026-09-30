import { allowsUse } from './usage-policy.mjs';
export const studioPresets = ['full-portrait', 'avatar-canvas', 'intro-card', 'custom'];
export function presetAllowed(preset, { review, sourceType, confirmedOriginal = false, compositionConsent = false }) {
  if (!studioPresets.includes(preset)) return false;
  if (sourceType === 'collected') return allowsUse(review ? [review] : [], review?.characterId, preset === 'custom' ? 'technical-canvas' : preset);
  if (!['public-source', 'unpublished-original'].includes(sourceType)) return false;
  if (preset !== 'intro-card') return true;
  return sourceType === 'unpublished-original' ? confirmedOriginal : compositionConsent;
}

export function localSource({ type, url = '', author = '', terms = '', confirmedOriginal = false, compositionConsent = false }, messages) {
  author = author.trim(); terms = terms.trim(); url = url.trim();
  if (!author || !terms || author.length > 80 || terms.length > 300) throw new Error(messages.required);
  const source = {
    type, attribution: [{ name: author }],
    rights: { terms, verification: 'user-supplied, not independently verified' },
    declaration: { userSupplied: true, independentlyVerified: false, compositionConsent },
  };
  if (type === 'unpublished-original') {
    if (!confirmedOriginal) throw new Error(messages.originalRequired);
    source.declaration.originalAndUnpublished = true;
    source.declaration.statement = messages.originalConfirm;
    source.declaration.usageStatement = terms;
    source.declaration.compositionConsent = true;
    // No public URL is invented or copied from the inactive public-source fields.
  } else if (type === 'public-source') {
    let valid = false;
    try { const parsed = new URL(url); valid = parsed.protocol === 'https:' && !parsed.username && !parsed.password && url.length <= 2048; } catch {}
    if (!valid) throw new Error(messages.required);
    source.pageUrl = url;
  } else throw new Error(messages.required);
  return source;
}

export function fitArtwork(width, height, boxW, boxH, shape, padding) {
  if (![width, height, boxW, boxH].every(n => Number.isFinite(n) && n > 0)) throw new Error('Invalid dimensions');
  const diameter = Math.min(boxW, boxH);
  const factor = 1 - Math.max(0, Math.min(.3, padding)) * 2;
  const scale = shape === 'circle'
    ? diameter * factor / Math.hypot(width, height)
    : Math.min(boxW / width, boxH / height) * factor;
  return { x: (boxW - width * scale) / 2, y: (boxH - height * scale) / 2, drawW: width * scale, drawH: height * scale, scale };
}
