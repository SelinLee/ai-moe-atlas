import type { SearchResult } from '../lib/directory';
import { normalizeSearch } from '../lib/search-text';

const form = document.querySelector<HTMLFormElement>('.directory-form')!;
const box = form.elements.namedItem('q') as HTMLInputElement;
const area = document.getElementById('directory-results')!;
const list = area.querySelector('ul')!;
const status = area.querySelector('[role=status]')!;
const title = document.getElementById('directory-title')!;
const categoryPage = document.querySelector<HTMLAnchorElement>('#directory-category-page')!;
const more = document.querySelector<HTMLButtonElement>('#directory-more')!;
const retry = document.querySelector<HTMLButtonElement>('#directory-retry')!;
const clear = document.querySelector<HTMLAnchorElement>('#directory-clear')!;
const tabs = [...document.querySelectorAll<HTMLAnchorElement>('.directory-sidebar a')];
const scopes = new Map(tabs.map(tab => [tab.dataset.scope!, {
  label: tab.getAttribute('aria-label') ?? tab.textContent.trim(),
  page: tab.href,
  icon: tab.querySelector('svg')!,
}]));
const cardTemplate = document.querySelector<HTMLTemplateElement>('#directory-card-template')!;
const pageSize = Number(area.dataset.pageSize);
let index: Promise<SearchResult[]> | undefined;
let category = '', revision = 0;
let matches: SearchResult[] = [], shown = list.children.length;

function loadIndex() {
  return index ??= fetch(area.dataset.index!).then(response => {
    if (!response.ok) throw new Error(String(response.status));
    return response.json() as Promise<SearchResult[]>;
  }).catch(error => {
    index = undefined;
    throw error;
  });
}

function urlFor(scope: string, query: string) {
  const url = new URL(form.action);
  if (scope) url.searchParams.set('category', scope);
  if (query.trim()) url.searchParams.set('q', query.trim());
  return url;
}

function appendResults() {
  const batch = matches.slice(shown, shown + pageSize);
  const fragment = document.createDocumentFragment();
  for (const row of batch) {
    const item = cardTemplate.content.firstElementChild!.cloneNode(true) as HTMLLIElement;
    const kind = category || row.categories[0];
    item.dataset.kind = kind;
    const media = item.querySelector('.directory-art')!;
    const credit = item.querySelector<HTMLAnchorElement>('.directory-credit')!;
    if (row.image) {
      item.dataset.picture = '';
      const image = document.createElement('img');
      image.alt = '';
      image.width = 256;
      image.height = 160;
      image.loading = 'lazy';
      image.decoding = 'async';
      image.src = row.image.src;
      media.append(image);
      credit.href = row.image.source;
      credit.textContent = row.image.credit;
      credit.hidden = false;
    } else {
      media.append(scopes.get(kind)!.icon.cloneNode(true));
    }
    if (row.mediaLabel) {
      const label = document.createElement('span');
      label.textContent = row.mediaLabel;
      media.append(label);
    }
    const target = new URL(row.href, location.href);
    if (category && target.searchParams.has('category')) target.searchParams.set('category', category);
    item.querySelector<HTMLAnchorElement>('.directory-entry')!.href = target.href;
    item.querySelector('strong')!.textContent = row.title;
    item.querySelector('.directory-byline')!.textContent = [!category && scopes.get(kind)?.label, row.by].filter(Boolean).join(' · ');
    const action = item.querySelector<HTMLAnchorElement>('.directory-action')!;
    action.href = row.action.href;
    action.textContent = row.action.label;
    if (row.action.download) action.download = '';
    fragment.append(item);
  }
  list.append(fragment);
  shown += batch.length;
  more.hidden = shown >= matches.length;
}

async function refresh(keepFirstPage = false) {
  const request = ++revision;
  const params = new URLSearchParams(location.search);
  category = params.get('category') ?? '';
  if (!scopes.has(category)) category = '';
  box.value = (params.get('q') ?? '').slice(0, box.maxLength);
  const query = normalizeSearch(box.value.trim());
  const current = scopes.get(category)!;
  title.textContent = current.label;
  categoryPage.hidden = !category;
  categoryPage.href = current.page;
  clear.hidden = !query;
  clear.href = urlFor(category, '').href;
  for (const tab of tabs) {
    tab.href = urlFor(tab.dataset.scope!, box.value).href;
    if (tab.dataset.scope === category) tab.setAttribute('aria-current','true');
    else tab.removeAttribute('aria-current');
  }
  for (const link of document.querySelectorAll<HTMLAnchorElement>('.language-switch a')) link.search = location.search;
  retry.hidden = true;
  if (keepFirstPage && !query && !category) {
    more.hidden = shown >= Number(area.dataset.total);
    return;
  }
  more.hidden = true;
  list.replaceChildren();
  shown = 0;
  status.textContent = area.dataset.loading!;
  try {
    const rows = await loadIndex();
    if (request !== revision) return;
    const terms = query.split(/\s+/).filter(Boolean);
    matches = rows.filter(row =>
      (!category || row.categories.some(c => c === category)) && terms.every(term => row.keywords.includes(term)));
    if (query) {
      const rank = (row: SearchResult) => {
        const name = normalizeSearch(row.title);
        return name === query ? 0 : name.includes(query) ? 1 : 2;
      };
      matches.sort((a, b) => rank(a) - rank(b));
    }
    status.textContent = matches.length ? `${matches.length} ${area.dataset.units}` : area.dataset.empty!;
    appendResults();
  } catch {
    if (request !== revision) return;
    status.textContent = area.dataset.failure!;
    retry.hidden = false;
  }
}

function navigate(url: URL) {
  if (url.href !== location.href) history.pushState(null, '', url);
  refresh();
  if (area.getBoundingClientRect().top < 0) area.scrollIntoView({block:'start'});
}

for (const tab of tabs) {
  tab.addEventListener('click', event => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    navigate(urlFor(tab.dataset.scope!, box.value));
  });
}
form.addEventListener('submit', event => {
  event.preventDefault();
  navigate(urlFor(category, box.value));
});
clear.addEventListener('click', event => {
  if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  event.preventDefault();
  navigate(new URL(clear.href));
  box.focus();
});
more.addEventListener('click', async () => {
  const request = revision;
  more.disabled = true;
  try {
    // The first page is already in the static HTML on a fresh, unfiltered visit.
    if (!matches.length) {
      const rows = await loadIndex();
      if (request !== revision) return;
      matches = rows;
    }
    appendResults();
  } catch {
    if (request === revision) {
      status.textContent = area.dataset.failure!;
      retry.hidden = false;
      more.hidden = true;
    }
  } finally {
    more.disabled = false;
  }
});
retry.addEventListener('click', () => refresh());
window.addEventListener('popstate', () => refresh());
refresh(true);
