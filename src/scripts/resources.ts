import { normalizeSearch, searchText } from '../lib/search-text';
const categorySelect = document.querySelector<HTMLSelectElement>('#resource-category')!;
const heading = document.querySelector<HTMLElement>('#resource-heading')!;
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
  categorySelect.value = params.get('category') ?? 'all';
  category = categorySelect.value || 'all';
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
  const introCategory = category === 'all' ? 'default' : category;
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
  categorySelect.value = category;
  heading.textContent = category === 'all' ? heading.dataset.title! : categorySelect.selectedOptions[0].label;
  list.classList.toggle('filtered-category', category !== 'all');
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

categorySelect.addEventListener('change', () => {
  category = categorySelect.value;
  type = 'all';
  sort.value = 'likes';
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
