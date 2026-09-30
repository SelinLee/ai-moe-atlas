export function readFilters(search, models) {
  const p = new URLSearchParams(search);
  return {
    q: (p.get('q') ?? '').slice(0, 200),
    model: models.includes(p.get('model')) ? p.get('model') : 'all',
    style: ['anime', 'pixel'].includes(p.get('style')) ? p.get('style') : 'all',
    kind: ['collected', 'reference'].includes(p.get('kind')) ? p.get('kind') : 'all',
  };
}
export function filterURL(href, state) {
  const url = new URL(href);
  for (const key of ['q', 'model', 'style', 'kind']) {
    const value = state[key];
    if (value && (key === 'q' || value !== 'all')) url.searchParams.set(key, value);
    else url.searchParams.delete(key);
  }
  return url;
}
