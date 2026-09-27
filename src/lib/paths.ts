export const base = import.meta.env.BASE_URL.replace(/\/$/, '');
export const path = (p = '') => `${base}/${p.replace(/^\//, '')}`;
export const repo = 'https://github.com/SelinLee/ai-moe-atlas';
