import { readFilters, filterURL } from '../lib/catalog-state.mjs';
const search=document.querySelector<HTMLInputElement>('#search')!;
const entity=document.querySelector<HTMLSelectElement>('#entity-filter')!;
const style=document.querySelector<HTMLSelectElement>('#style-filter')!;
const buttons=[...document.querySelectorAll<HTMLButtonElement>('[data-kind-filter]')];
const link=document.querySelector<HTMLInputElement>('#results-link')!;
const status=document.querySelector<HTMLElement>('#share-status')!;
const models=[...entity.options].map(o=>o.value);
search.maxLength=200;
let kind='all', typing=false;
const state=()=>({q:search.value,model:entity.value,style:style.value,kind});

function syncLinks(){
  document.querySelectorAll<HTMLAnchorElement>('.language-switch a').forEach(a=>{a.search=location.search;});
  link.value=location.href;status.textContent='';link.hidden=true;
}
function filter(){
  let count=0;const q=search.value.trim().normalize('NFKC').toLowerCase();
  document.querySelectorAll<HTMLElement>('#catalog [data-card]').forEach(card=>{
    const show=(!q||card.dataset.search!.normalize('NFKC').toLowerCase().includes(q))
      &&(kind==='all'||card.dataset.kind===kind)&&(entity.value==='all'||card.dataset.entity===entity.value)
      &&(style.value==='all'||card.dataset.style===style.value);
    card.hidden=!show;if(show)count++;
  });
  buttons.forEach(b=>{const selected=b.dataset.kindFilter===kind;b.classList.toggle('selected',selected);b.setAttribute('aria-pressed',String(selected));});
  document.querySelector('#result-count')!.textContent=String(count);
  document.querySelector<HTMLElement>('#empty-state')!.hidden=count>0;
}
function update(push:boolean){
  const url=filterURL(location.href,state());
  if(url.href!==location.href)history[push?'pushState':'replaceState'](null,'',url);
  filter();syncLinks();
}
function restore(){
  const value=readFilters(location.search,models);
  search.value=value.q;entity.value=value.model;style.value=value.style;kind=value.kind;typing=false;
  update(false);
}
// One history entry per typing session; discrete filters always start a new entry.
search.addEventListener('input',()=>{update(!typing);typing=true;});
search.addEventListener('blur',()=>{typing=false;});
buttons.forEach(b=>b.addEventListener('click',()=>{kind=b.dataset.kindFilter!;typing=false;update(true);}));
[entity,style].forEach(select=>select.addEventListener('change',()=>{typing=false;update(true);}));
for(const id of ['clear-filters','reset-filters'])document.getElementById(id)!.addEventListener('click',()=>{
  search.value='';entity.value='all';style.value='all';kind='all';typing=false;update(true);search.focus();
});
window.addEventListener('popstate',restore);
document.querySelector<HTMLButtonElement>('#copy-results')!.addEventListener('click',async e=>{
  const button=e.currentTarget as HTMLButtonElement;const url=location.href;
  try{await navigator.clipboard.writeText(url);if(location.href===url)status.textContent=button.dataset.done!;}
  catch{if(location.href===url){status.textContent=button.dataset.failed!;link.value=url;link.hidden=false;link.focus();link.select();}}
});
document.addEventListener('keydown',e=>{if(e.key==='/'&&!(e.target instanceof HTMLInputElement||e.target instanceof HTMLTextAreaElement||e.target instanceof HTMLSelectElement||(e.target as HTMLElement).isContentEditable)){e.preventDefault();search.focus();}});
restore();
