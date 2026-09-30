export const purposes = ['featured', 'social-cover', 'avatar-canvas', 'full-portrait', 'technical-canvas', 'intro-card', 'lineup-card', 'readme-demo'];

// No fallback to downloadable, display, or general modification permission.
export function allowsUse(reviews, characterId, purpose) {
  if (!purposes.includes(purpose)) return false;
  const review = reviews.find(r => r.characterId === characterId);
  return review?.uses?.[purpose]?.decision === 'allowed'
    && !!review.reviewedAt && !!review.evidence?.length && !!review.artworks?.length;
}

export function assertUsageReview(review) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(review.reviewedAt ?? '') || !review.attribution?.length) throw new Error('Missing use-review date or attribution');
  for (const purpose of purposes) {
    const use = review.uses?.[purpose];
    if (!['allowed', 'unconfirmed', 'prohibited'].includes(use?.decision)) throw new Error(`Missing use decision: ${purpose}`);
    for (const lang of ['zh', 'en', 'ja']) if (!use.conditions?.[lang]?.trim()) throw new Error('Missing localized use conditions');
    if (use.decision === 'allowed' && !allowsUse([review], review.characterId, purpose)) throw new Error('Allowed use needs retained artwork and evidence');
  }
}
