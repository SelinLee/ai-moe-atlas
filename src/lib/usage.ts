import reviews from '../../content/reviews/artwork-uses.json';
import { allowsUse } from './usage-policy.mjs';
export const canUse = (id: string, purpose: string) => allowsUse(reviews, id, purpose);
export const useReview = (id: string) => reviews.find(r => r.characterId === id);
