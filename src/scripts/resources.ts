const filters = [...document.querySelectorAll<HTMLButtonElement>('[data-resource-filter]')];
const typeFilters = [...document.querySelectorAll<HTMLButtonElement>('[data-resource-type-filter]')];
const typeGroups = [...document.querySelectorAll<HTMLElement>('[data-resource-type-group]')];
const intros = [...document.querySelectorAll<HTMLElement>('[data-resource-intro]')];
const cards = [...document.querySelectorAll<HTMLElement>('[data-resource-category]')];
const input = document.querySelector<HTMLInputElement>('#resource-search')!;
const sort = document.querySelector<HTMLSelectElement>('#resource-sort')!;
const sortLabel = document.querySelector<HTMLElement>('#resource-sort-label')!;
const list = document.querySelector<HTMLElement>('#resource-list')!;
const countOutput = document.querySelector<HTMLElement>('#resource-count')!;
const empty = document.querySelector<HTMLElement>('#resource-empty')!;
const archive = document.querySelector<HTMLDetailsElement>('#like-evidence');
const pending = document.querySelector<HTMLDetailsElement>('#pending-animation-evidence');
const pendingCount = document.querySelector<HTMLElement>('#pending-animation-count');
const pendingRows = [...document.querySelectorAll<HTMLElement>('[data-pending-search]')];
const normalizeSearch = (value: string) => value.normalize('NFKC').toLowerCase();
const aliases = [
  [/\bqwen(?:\d+(?:\.\d+)?)?\b|千问|千問/, 'qwen 千问 千問'],
  [/\bdoubao\b|豆包/, 'doubao 豆包'],
  [/\bclaude\b|克劳德|克勞德/, 'claude 克劳德 克勞德'],
  [/\bminimax\b|海螺娘|海螺\s*ai/, 'minimax 海螺娘 海螺 ai'],
  [/\b(?:deepseek|whale girl|(?:blue )?fat fish)\b|大肥[鱼魚]|[鲸鯨][鱼魚]娘|クジラ娘/, 'deepseek whale girl blue fat fish 大肥鱼 大肥魚 鲸鱼娘 鯨魚娘 クジラ娘'],
] as const;

function searchText(value: string) {
  const text = normalizeSearch(value);
  return [text, ...aliases.filter(([pattern]) => pattern.test(text)).map(([, names]) => names)].join(' ');
}

const cardSearch = cards.map(card => searchText(card.dataset.resourceSearch ?? ''));
const pendingSearch = pendingRows.map(row => searchText(row.dataset.pendingSearch ?? ''));
const byLikes = cards.filter(card => card.dataset.resourceCategory === 'animation');
const byRecent = [...byLikes].sort((a, b) => Number(a.dataset.recentOrder) - Number(b.dataset.recentOrder));
const nonAnimation = cards.filter(card => card.dataset.resourceCategory !== 'animation');
const byComicOrder = nonAnimation.filter(card => card.dataset.comicOrder !== undefined)
  .sort((a, b) => Number(a.dataset.comicOrder) - Number(b.dataset.comicOrder));
const categoryMatchers: Record<string, (card: HTMLElement) => boolean> = {
  stickers: card => card.hasAttribute('data-sticker'),
  rigs: card => card.dataset.rigFormat !== undefined,
  comics: card => card.dataset.comicOrder !== undefined,
};
let appliedOrder = 'likes';
let comicOrderActive = false;
let category = 'all';
let type = 'all';

function activeTypeGroup() {
  return typeGroups.find(group => group.dataset.resourceTypeGroup === category);
}

function readURL() {
  const params = new URL(location.href).searchParams;
  category = filters.find(button => button.dataset.resourceFilter === params.get('category'))?.dataset.resourceFilter ?? 'all';
  const group = activeTypeGroup();
  type = typeFilters.find(button => group?.contains(button) && button.dataset.resourceTypeFilter === params.get('type'))?.dataset.resourceTypeFilter ?? 'all';
  sort.value = category === 'animation' && params.get('sort') === 'recent' ? 'recent' : 'likes';
  input.value = (params.get('q') ?? '').slice(0, 200);
  if (archive && location.hash === '#like-evidence') archive.open = true;
  if (pending && location.hash === '#pending-animation-evidence') pending.open = true;
}

function markSelected(button: HTMLButtonElement, selected: boolean) {
  button.classList.toggle('selected', selected);
  button.setAttribute('aria-pressed', String(selected));
}

function update(writeURL = true) {
  const query = input.value.trim().slice(0, 200);
  const terms = query ? normalizeSearch(query).split(/\s+/) : [];
  const matchesSearch = (text: string) => terms.every(term => text.includes(term));
  if (sort.value !== appliedOrder) {
    list.prepend(...(sort.value === 'recent' ? byRecent : byLikes));
    appliedOrder = sort.value;
  }
  const showComics = category === 'comics';
  if (showComics !== comicOrderActive) {
    list.append(...(showComics ? byComicOrder : nonAnimation));
    comicOrderActive = showComics;
  }
  const inCollection = categoryMatchers[category];
  const group = activeTypeGroup();
  const introCategory = inCollection || category === 'animation' ? category : 'default';
  for (const intro of intros) intro.hidden = intro.dataset.resourceIntro !== introCategory;
  let count = 0;
  for (const [index, card] of cards.entries()) {
    const matchesCategory = category === 'all' || card.dataset.resourceCategory === category || inCollection?.(card);
    const matchesType = type === 'all' || (category === 'rigs' ? card.dataset.rigFormat : card.dataset.resourceType) === type;
    card.hidden = !matchesCategory || !matchesType || !matchesSearch(cardSearch[index]);
    if (!card.hidden) count++;
  }
  for (const typeGroup of typeGroups) typeGroup.hidden = typeGroup !== group;
  sortLabel.hidden = category !== 'animation';
  if (archive) archive.hidden = category !== 'all' && category !== 'animation';
  if (pending && pendingCount) {
    for (const [index, row] of pendingRows.entries()) row.hidden = !matchesSearch(pendingSearch[index]);
    const matches = pendingRows.filter(row => !row.hidden).length;
    pending.hidden = (category !== 'all' && category !== 'animation') || matches === 0;
    pendingCount.textContent = String(matches);
    if (terms.length && !pending.hidden) pending.open = true;
  }
  for (const button of filters) markSelected(button, button.dataset.resourceFilter === category);
  for (const button of typeFilters) markSelected(button, button.dataset.resourceTypeFilter === (group?.contains(button) ? type : 'all'));
  countOutput.textContent = String(count);
  empty.hidden = count > 0 || Boolean(pending && terms.length && !pending.hidden);

  if (writeURL) {
    const url = new URL(location.href);
    for (const [key, value] of [['category', category === 'all' ? '' : category], ['type', type === 'all' ? '' : type], ['sort', sort.value === 'recent' ? 'recent' : ''], ['q', query]]) {
      if (value) url.searchParams.set(key, value);
      else url.searchParams.delete(key);
    }
    history.replaceState(null, '', url);
  }
  for (const link of document.querySelectorAll<HTMLAnchorElement>('.language-switch a')) {
    link.search = location.search;
    link.hash = location.hash;
  }
}

for (const button of filters) button.addEventListener('click', () => {
  if (category !== button.dataset.resourceFilter) {
    type = 'all';
    sort.value = 'likes';
  }
  category = button.dataset.resourceFilter!;
  update();
});
for (const button of typeFilters) button.addEventListener('click', () => {
  type = button.dataset.resourceTypeFilter!;
  update();
});
input.maxLength = 200;
input.addEventListener('input', () => update());
sort.addEventListener('change', () => update());
document.querySelector('#resource-reset')!.addEventListener('click', () => {
  category = 'all';
  type = 'all';
  sort.value = 'likes';
  input.value = '';
  update();
});
window.addEventListener('popstate', () => {
  readURL();
  update(false);
});
readURL();
update(false);
