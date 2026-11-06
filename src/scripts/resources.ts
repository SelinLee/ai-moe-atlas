const filters=[...document.querySelectorAll<HTMLButtonElement>('[data-resource-filter]')];
const cards=[...document.querySelectorAll<HTMLElement>('[data-resource-category]')];
const input=document.querySelector<HTMLInputElement>('#resource-search')!;
const allowed=filters.map(b=>b.dataset.resourceFilter!);
const params=new URL(location.href).searchParams;
let category=allowed.includes(params.get('category')??'')?params.get('category')!:'all';
input.value=(params.get('q')??'').slice(0,200);
function update(writeURL=true){
  const query=input.value.trim().toLocaleLowerCase();let count=0;
  for(const card of cards){card.hidden=!(category==='all'||card.dataset.resourceCategory===category)||!card.dataset.resourceSearch!.toLocaleLowerCase().includes(query);if(!card.hidden)count++;}
  for(const button of filters){const selected=button.dataset.resourceFilter===category;button.classList.toggle('selected',selected);button.setAttribute('aria-pressed',String(selected));}
  document.querySelector('#resource-count')!.textContent=String(count);
  document.querySelector<HTMLElement>('#resource-empty')!.hidden=count>0;
  if(writeURL){const url=new URL(location.href);category==='all'?url.searchParams.delete('category'):url.searchParams.set('category',category);query?url.searchParams.set('q',input.value.trim().slice(0,200)):url.searchParams.delete('q');history.replaceState(null,'',url);}
  document.querySelectorAll<HTMLAnchorElement>('.language-switch a').forEach(a=>{a.search=location.search;a.hash=location.hash;});
}
for(const button of filters)button.addEventListener('click',()=>{category=button.dataset.resourceFilter!;update();});
input.maxLength=200;input.addEventListener('input',()=>update());
document.querySelector('#resource-reset')!.addEventListener('click',()=>{category='all';input.value='';update();});
window.addEventListener('popstate',()=>{const p=new URL(location.href).searchParams;category=allowed.includes(p.get('category')??'')?p.get('category')!:'all';input.value=(p.get('q')??'').slice(0,200);update(false);});
update(false);
