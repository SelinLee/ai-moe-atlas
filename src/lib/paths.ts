import { repo } from './repo.mjs';
export const base = import.meta.env.BASE_URL.replace(/\/$/, '');
export const path = (p = '') => `${base}/${p.replace(/^\//, '')}`;
export { repo };
