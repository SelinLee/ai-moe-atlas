const filters = [...document.querySelectorAll<HTMLButtonElement>('[data-resource-filter]')];
const typeFilters = [...document.querySelectorAll<HTMLButtonElement>('[data-resource-type-filter]')];
const cards = [...document.querySelectorAll<HTMLElement>('[data-resource-category]')];
const typeGroup = document.querySelector<HTMLElement>('#resource-types')!;
const input = document.querySelector<HTMLInputElement>('#resource-search')!;
const sort = document.querySelector<HTMLSelectElement>('#resource-sort')!;
const sortLabel = document.querySelector<HTMLElement>('#resource-sort-label')!;
const list = document.querySelector<HTMLElement>('#resource-list')!;
const countOutput = document.querySelector<HTMLElement>('#resource-count')!;
const empty = document.querySelector<HTMLElement>('#resource-empty')!;
const pending = document.querySelector<HTMLDetailsElement>('#pending-animation-evidence');
const pendingCount = document.querySelector<HTMLElement>('#pending-animation-count');
const pendingRows = [...document.querySelectorAll<HTMLElement>('[data-pending-search]')];
const byLikes = cards.filter(card => card.dataset.resourceCategory === 'animation');
const byRecent = [...byLikes].sort((a, b) => Number(a.dataset.recentOrder) - Number(b.dataset.recentOrder));
const firstOther = cards.find(card => card.dataset.resourceCategory !== 'animation') ?? null;
let appliedOrder = 'likes';
let category = 'all';
let type = 'all';

function readURL() {
  const params = new URL(location.href).searchParams;
  category = filters.find(button => button.dataset.resourceFilter === params.get('category'))?.dataset.resourceFilter ?? 'all';
  type = category === 'animation'
    ? typeFilters.find(button => button.dataset.resourceTypeFilter === params.get('type'))?.dataset.resourceTypeFilter ?? 'all'
    : 'all';
  sort.value = category === 'animation' && params.get('sort') === 'recent' ? 'recent' : 'likes';
  input.value = (params.get('q') ?? '').slice(0, 200);
  if (pending && location.hash === '#pending-animation-evidence') pending.open = true;
}

function markSelected(button: HTMLButtonElement, selected: boolean) {
  button.classList.toggle('selected', selected);
  button.setAttribute('aria-pressed', String(selected));
}

function update(writeURL = true) {
  const query = input.value.trim().slice(0, 200);
  const search = query.toLocaleLowerCase();
  if (sort.value !== appliedOrder) {
    const ordered = document.createDocumentFragment();
    ordered.append(...(sort.value === 'recent' ? byRecent : byLikes));
    list.insertBefore(ordered, firstOther);
    appliedOrder = sort.value;
  }
  let count = 0;
  for (const card of cards) {
    const matchesCategory = category === 'all' || card.dataset.resourceCategory === category;
    const matchesType = type === 'all' || card.dataset.resourceType === type;
    card.hidden = !matchesCategory || !matchesType || !card.dataset.resourceSearch!.toLocaleLowerCase().includes(search);
    if (!card.hidden) count++;
  }
  typeGroup.hidden = category !== 'animation';
  sortLabel.hidden = category !== 'animation';
  if (pending && pendingCount) {
    for (const row of pendingRows) row.hidden = !row.dataset.pendingSearch!.toLocaleLowerCase().includes(search);
    const matches = pendingRows.filter(row => !row.hidden).length;
    pending.hidden = (category !== 'all' && category !== 'animation') || matches === 0;
    pendingCount.textContent = String(matches);
    if (search && !pending.hidden) pending.open = true;
  }
  for (const button of filters) markSelected(button, button.dataset.resourceFilter === category);
  for (const button of typeFilters) markSelected(button, button.dataset.resourceTypeFilter === type);
  countOutput.textContent = String(count);
  empty.hidden = count > 0 || Boolean(pending && search && !pending.hidden);

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
  category = button.dataset.resourceFilter!;
  if (category !== 'animation') {
    type = 'all';
    sort.value = 'likes';
  }
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
