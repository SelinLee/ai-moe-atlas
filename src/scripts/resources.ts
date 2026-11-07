const filters = [...document.querySelectorAll<HTMLButtonElement>('[data-resource-filter]')];
const typeFilters = [...document.querySelectorAll<HTMLButtonElement>('[data-resource-type-filter]')];
const cards = [...document.querySelectorAll<HTMLElement>('[data-resource-category]')];
const typeGroup = document.querySelector<HTMLElement>('#resource-types')!;
const input = document.querySelector<HTMLInputElement>('#resource-search')!;
const countOutput = document.querySelector<HTMLElement>('#resource-count')!;
const empty = document.querySelector<HTMLElement>('#resource-empty')!;
const pending = document.querySelector<HTMLDetailsElement>('#pending-animation-evidence');
let category = 'all';
let type = 'all';

function readURL() {
  const params = new URL(location.href).searchParams;
  category = filters.find(button => button.dataset.resourceFilter === params.get('category'))?.dataset.resourceFilter ?? 'all';
  type = category === 'animation'
    ? typeFilters.find(button => button.dataset.resourceTypeFilter === params.get('type'))?.dataset.resourceTypeFilter ?? 'all'
    : 'all';
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
  let count = 0;
  for (const card of cards) {
    const matchesCategory = category === 'all' || card.dataset.resourceCategory === category;
    const matchesType = type === 'all' || card.dataset.resourceType === type;
    card.hidden = !matchesCategory || !matchesType || !card.dataset.resourceSearch!.toLocaleLowerCase().includes(search);
    if (!card.hidden) count++;
  }
  typeGroup.hidden = category !== 'animation';
  if (pending) pending.hidden = category !== 'all' && category !== 'animation';
  for (const button of filters) markSelected(button, button.dataset.resourceFilter === category);
  for (const button of typeFilters) markSelected(button, button.dataset.resourceTypeFilter === type);
  countOutput.textContent = String(count);
  empty.hidden = count > 0;

  if (writeURL) {
    const url = new URL(location.href);
    for (const [key, value] of [['category', category === 'all' ? '' : category], ['type', type === 'all' ? '' : type], ['q', query]]) {
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
  if (category !== 'animation') type = 'all';
  update();
});
for (const button of typeFilters) button.addEventListener('click', () => {
  type = button.dataset.resourceTypeFilter!;
  update();
});
input.maxLength = 200;
input.addEventListener('input', () => update());
document.querySelector('#resource-reset')!.addEventListener('click', () => {
  category = 'all';
  type = 'all';
  input.value = '';
  update();
});
window.addEventListener('popstate', () => {
  readURL();
  update(false);
});
readURL();
update(false);
