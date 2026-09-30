import JSZip from 'jszip';
import { frameGeometry } from '../lib/geometry.mjs';
import { fitArtwork, localSource, presetAllowed } from '../lib/studio-policy.mjs';
import { studioText } from '../lib/studio-text';

const root=document.querySelector<HTMLElement>('#studio')!;
const {s,labels,options,base,site,lang}=JSON.parse(root.dataset.config!);
const el=<T extends HTMLElement>(id:string)=>document.getElementById(id) as T;
const select=(id:string)=>el<HTMLSelectElement>(id);
const input=(id:string)=>el<HTMLInputElement>(id);
const canvas=el<HTMLCanvasElement>('canvas'),ctx=canvas.getContext('2d')!;
const status=el('studio-status'),button=el<HTMLButtonElement>('export-pack');
let image:HTMLImageElement|null=null,sourceBytes:ArrayBuffer|null=null,sourceRecord:any=null;
let filename='asset',local=false,generation=0,originalMime='image/png',exporting=false;
let selected:any=null,layout:any=null;
const params=new URLSearchParams(location.search);
if(options.some((o:any)=>o.id===params.get('asset')))select('character-select').value=params.get('asset')!;
const sourceType=()=>local?select('source-type').value:'collected';
const permission=()=>({review:selected?.review,sourceType:sourceType(),confirmedOriginal:input('original-confirm').checked,compositionConsent:input('composition-consent').checked});
const isAllowed=(preset:string)=>presetAllowed(preset,permission());
const localFields=()=>({type:sourceType(),url:input('source-url').value,author:input('source-author').value,terms:el<HTMLTextAreaElement>('source-terms').value,confirmedOriginal:input('original-confirm').checked,compositionConsent:input('composition-consent').checked});

function poseOptions(){
  const c=options.find((o:any)=>o.id===select('character-select').value);
  select('pose-select').replaceChildren(...c.manifest.source.originals.map((o:any)=>new Option(o.label[lang],o.id)));
  if(c.manifest.source.originals.some((o:any)=>o.id===params.get('pose')))select('pose-select').value=params.get('pose')!;
}
function syncSelection(){
  const url=new URL(location.href);
  for(const key of ['asset','pose'])url.searchParams.delete(key);
  if(!local){url.searchParams.set('asset',select('character-select').value);url.searchParams.set('pose',select('pose-select').value);}
  history.replaceState(null,'',url);
  document.querySelectorAll<HTMLAnchorElement>('.language-switch a').forEach(a=>{a.search=url.search;});
}
function sourceForExport(){
  return local?localSource(localFields(),labels):{...structuredClone(selected.manifest.source),type:'collected'};
}
function previewSource(){
  if(!local)return selected?.manifest.source;
  const f=localFields();
  return {type:f.type,pageUrl:f.type==='public-source'?f.url.trim():undefined,attribution:[{name:f.author.trim()||labels.author}],rights:{terms:f.terms.trim()},declaration:{independentlyVerified:false}};
}
function creditText(source:any,compact=false){
  if(!source)return '';
  const names=source.attribution.map((a:any)=>a.name+(!compact&&a.url?' — '+a.url:'')).join(' / ');
  const rows=[names];
  if(local){
    rows.push(source.type==='unpublished-original'?labels.unpublishedCredit:labels.publicCredit);
    if(source.pageUrl)rows.push(source.pageUrl);
    if(source.rights.terms)rows.push(source.rights.terms);
  }else{
    rows.push(source.originalPublication);
    // This stable detail page retains prior modification notices and the full chain.
    rows.push(new URL(`${base}${lang}/characters/${selected.id}/`,site).href);
    if(source.rights.license==='CC-BY-NC-SA-4.0')rows.push('CC BY-NC-SA 4.0 · '+labels.cc,'https://creativecommons.org/licenses/by-nc-sa/4.0/');
    else rows.push(source.rights.license==='LicenseRef-ZipZipPipe-NC'?labels.creator:(source.rights.terms?.[lang]??source.rights.license),source.rights.evidenceUrl);
    if(!compact){
      rows.push(source.pageUrl);
      if(source.rights.terms)rows.push(typeof source.rights.terms==='object'?source.rights.terms[lang]:source.rights.terms);
    }
  }
  rows.push(select('preset').value==='intro-card'?labels.cardChanges:labels.changes);
  return [...new Set(rows.filter(Boolean))].join('\n');
}
function wrap(text:string,width:number){
  const lines:string[]=[];
  for(const paragraph of text.split('\n')){
    let line='';
    for(const char of Array.from(paragraph)){
      if(line&&ctx.measureText(line+char).width>width){lines.push(line);line=char;}else line+=char;
    }
    lines.push(line);
  }
  return lines;
}
function draw(){
  layout=null;if(!image){button.disabled=true;return;}
  if(!isAllowed(select('preset').value)){ctx.clearRect(0,0,canvas.width,canvas.height);el('export-credit').textContent='';button.disabled=true;status.textContent=labels.blocked;return;}
  try{
    const shape=select('shape').value,size=Number(select('size').value),padding=Number(input('padding').value)/100;
    const bounds=frameGeometry(image.naturalWidth,image.naturalHeight,size,shape,padding);
    canvas.width=bounds.w;canvas.height=bounds.h;
    const margin=Math.max(12,Math.round(bounds.w*.025)),fontSize=Math.max(11,Math.round(bounds.w/52)),lineHeight=Math.ceil(fontSize*1.45);
    ctx.font=`${fontSize}px system-ui, sans-serif`;ctx.textBaseline='top';
    const source=previewSource(),credit=creditText(source,true);
    el('export-credit').textContent=creditText(source);
    const lines=wrap(credit,bounds.w-margin*2);
    const footerHeight=lines.length*lineHeight+margin*2;
    let headerHeight=0,titleLines:string[]=[];
    const title=select('preset').value==='intro-card'?input('card-title').value.trim():'';
    if(title){ctx.font=`600 ${fontSize*1.65}px system-ui, sans-serif`;titleLines=wrap(title,bounds.w-margin*2);headerHeight=titleLines.length*Math.ceil(fontSize*2)+margin*2;}
    const artworkHeight=bounds.h-footerHeight-headerHeight;
    if(artworkHeight<bounds.h*.25)throw new Error(labels.layoutError);
    const g=fitArtwork(image.naturalWidth,image.naturalHeight,bounds.w,artworkHeight,shape,padding);
    const format=select('format').value;let bg=select('background').value;if(bg==='custom')bg=input('custom-color').value;
    ctx.clearRect(0,0,bounds.w,bounds.h);
    if(format==='jpeg'){ctx.fillStyle='#fff';ctx.fillRect(0,0,bounds.w,bounds.h);}
    ctx.save();ctx.translate(0,headerHeight);
    if(shape==='circle'){ctx.beginPath();ctx.arc(bounds.w/2,artworkHeight/2,Math.min(bounds.w,artworkHeight)/2,0,Math.PI*2);ctx.clip();}
    if(bg!=='transparent'){ctx.fillStyle=bg;ctx.fillRect(0,0,bounds.w,artworkHeight);}
    ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';ctx.drawImage(image,g.x,g.y,g.drawW,g.drawH);ctx.restore();
    const footerY=bounds.h-footerHeight;
    ctx.fillStyle='#ffffff';ctx.fillRect(0,footerY,bounds.w,footerHeight);
    ctx.fillStyle='#203b2a';ctx.font=`${fontSize}px system-ui, sans-serif`;
    lines.forEach((line,i)=>ctx.fillText(line,margin,footerY+margin+i*lineHeight));
    if(headerHeight){ctx.fillStyle='#ffffff';ctx.fillRect(0,0,bounds.w,headerHeight);ctx.fillStyle='#203b2a';ctx.font=`600 ${fontSize*1.65}px system-ui, sans-serif`;titleLines.forEach((line,i)=>ctx.fillText(line,margin,margin+i*Math.ceil(fontSize*2)));}
    layout={image:{...g,y:g.y+headerHeight},credits:{text:credit,fontSize,lines:lines.length,y:footerY,height:footerHeight},title,headerHeight};
    el('output-size').textContent=`${bounds.w} × ${bounds.h}`;el('padding-value').textContent=`${Math.round(padding*100)}%`;
    el('jpeg-note').hidden=format!=='jpeg';el('upscale-note').hidden=g.scale<=1;input('custom-color').hidden=select('background').value!=='custom';
    button.disabled=exporting;status.textContent=s.ready;
  }catch(e){ctx.clearRect(0,0,canvas.width,canvas.height);button.disabled=true;status.textContent=(e as Error).message;}
}
function updatePermissions(){
  [...select('preset').options].forEach(option=>{option.disabled=!isAllowed(option.value);});
  if(!isAllowed(select('preset').value))select('preset').value=isAllowed('full-portrait')?'full-portrait':'custom';
  const preset=select('preset').value;
  el('card-title-field').hidden=preset!=='intro-card';
  const purpose=preset==='custom'?'technical-canvas':preset;
  el('preset-conditions').textContent=local?labels.unverified:selected?.review?.uses[purpose]?.conditions?.[lang]??labels.blocked;
}
function applyPreset(){
  updatePermissions();const preset=select('preset').value;
  if(preset!=='custom'){
    select('shape').value=preset==='avatar-canvas'?'square':'portrait';
    select('size').value=preset==='avatar-canvas'?'512':'1024';
    select('format').value='png';select('background').value='transparent';input('padding').value='8';
  }
  draw();
}
function sourceFieldsChanged(){
  const unpublished=sourceType()==='unpublished-original';
  el('source-url-field').hidden=unpublished;input('source-url').disabled=unpublished;
  el('original-confirm-field').hidden=!unpublished;el('composition-consent-field').hidden=unpublished;
  updatePermissions();draw();el('credit-status').textContent='';
}
async function hash(bytes:ArrayBuffer){return [...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(v=>v.toString(16).padStart(2,'0')).join('');}
function clearLoaded(){image=null;sourceBytes=null;sourceRecord=null;layout=null;button.disabled=true;ctx.clearRect(0,0,canvas.width,canvas.height);el('export-credit').textContent='';el('native-size').textContent='';el('credit-status').textContent='';}
async function load(bytes:ArrayBuffer,mime:string,token:number,record:any){
  const url=URL.createObjectURL(new Blob([bytes],{type:mime}));const img=new Image();
  try{
    img.src=url;try{await img.decode();}catch{throw new Error(s.imageError);}if(token!==generation)return;
    if(img.naturalWidth*img.naturalHeight>40_000_000)throw new Error(s.pixelsTooLarge);
    if(record.sha256&&await hash(bytes)!==record.sha256)throw new Error(labels.evidenceError);
    if(token!==generation)return;
    image=img;sourceBytes=bytes;sourceRecord=record;originalMime=mime;
    el('native-size').textContent=`${s.native}: ${img.naturalWidth} × ${img.naturalHeight}`;applyPreset();
  }finally{URL.revokeObjectURL(url);}
}
async function loadCollected(){
  const token=++generation;clearLoaded();status.textContent=s.processing;local=false;
  select('character-select').querySelector('option[value="__local__"]')?.remove();
  select('pose-select').closest('.form-group')!.removeAttribute('hidden');
  el('local-source-fields').hidden=true;input('upload').value='';el('usage-note').hidden=false;el('upload-name').textContent='';
  selected=options.find((o:any)=>o.id===select('character-select').value);
  const o=selected.manifest.source.originals.find((x:any)=>x.id===select('pose-select').value);
  el('usage-note').textContent=selected.manifest.source.rights.terms?.[lang]??s.rightsText;
  filename=`${selected.id}-${o.id}`;input('card-title').value=selected.name;
  const a=el<HTMLAnchorElement>('source-link');a.href=`${base}${lang}/characters/${selected.id}/`;a.hidden=false;
  syncSelection();updatePermissions();
  try{
    const response=await fetch(base+o.localPath);if(!response.ok)throw new Error(labels.evidenceError);
    await load(await response.arrayBuffer(),o.localPath.endsWith('.webp')?'image/webp':/\.jpe?g$/i.test(o.localPath)?'image/jpeg':'image/png',token,o);
  }catch(e){if(token===generation){clearLoaded();status.textContent=(e as Error).message||s.imageError;}}
}
select('character-select').addEventListener('change',()=>{if(select('character-select').value==='__local__')return;poseOptions();loadCollected();});select('pose-select').addEventListener('change',loadCollected);
select('preset').addEventListener('change',applyPreset);
for(const id of ['shape','size','background','format','padding','custom-color'])el(id).addEventListener(['padding','custom-color'].includes(id)?'input':'change',()=>{select('preset').value='custom';updatePermissions();draw();});
for(const id of ['source-type','original-confirm','composition-consent'])el(id).addEventListener('change',sourceFieldsChanged);
for(const id of ['source-author','source-terms','source-url','card-title'])el(id).addEventListener('input',sourceFieldsChanged);
input('upload').addEventListener('change',async()=>{
  const file=input('upload').files?.[0];if(!file)return;
  const token=++generation;clearLoaded();local=true;selected=null;el('local-source-fields').hidden=false;el('source-link').hidden=true;el('usage-note').hidden=true;
  if(!select('character-select').querySelector('option[value="__local__"]'))select('character-select').prepend(new Option(s.chooseLocal,'__local__'));
  select('character-select').value='__local__';select('pose-select').closest('.form-group')!.setAttribute('hidden','');
  select('source-type').value='public-source';input('original-confirm').checked=false;input('composition-consent').checked=false;
  input('source-author').value='';input('source-url').value='';el<HTMLTextAreaElement>('source-terms').value='';
  syncSelection();sourceFieldsChanged();
  try{
    el('upload-name').textContent=file.name;
    if(!['image/png','image/jpeg','image/webp'].includes(file.type))throw new Error(s.imageError);
    if(file.size>20*1024*1024)throw new Error(s.fileTooLarge);
    status.textContent=s.processing;filename=file.name.replace(/\.[^.]+$/,'').replace(/[^\p{L}\p{N}_-]/gu,'-').slice(0,80)||'image';input('card-title').value=filename;
    await load(await file.arrayBuffer(),file.type,token,{filename:file.name,userSupplied:true});
  }catch(e){if(token===generation){clearLoaded();status.textContent=(e as Error).message;}}
});
el('reset').addEventListener('click',()=>{select('preset').value='full-portrait';applyPreset();});
el('copy-export-credit').addEventListener('click',async()=>{
  try{await navigator.clipboard.writeText(el('export-credit').textContent??'');el('credit-status').textContent=labels.copied;}
  catch{el('credit-status').textContent=labels.copyFailed;el('export-credit').focus();const range=document.createRange();range.selectNodeContents(el('export-credit'));window.getSelection()?.removeAllRanges();window.getSelection()?.addRange(range);}
});
button.addEventListener('click',async()=>{
  if(!image||!sourceBytes||exporting)return;
  const token=generation;
  try{
    if(!isAllowed(select('preset').value))throw new Error(labels.blocked);
    const source=sourceForExport();draw();if(!layout)throw new Error(labels.layoutError);
    const originalBytes=sourceBytes,originalRecord=structuredClone(sourceRecord),imageWidth=image.naturalWidth,imageHeight=image.naturalHeight;
    const savedLayout=structuredClone(layout),preset=select('preset').value,format=select('format').value;
    const processing={tool:'AI Moe Atlas / browser Canvas',generative:false,preset,shape:select('shape').value,padding:Number(input('padding').value)/100,background:select('background').value==='custom'?input('custom-color').value:select('background').value,format,method:'contain-resample-with-visible-credits',note:s.upscaleNote,layout:savedLayout};
    const review=local?null:structuredClone(selected.review);
    const readmeCredits=creditText(source);
    exporting=true;button.disabled=true;el<HTMLFieldSetElement>('studio-controls').disabled=true;status.textContent=s.processing;
    const blob=await new Promise<Blob>((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(new Error(s.imageError)),`image/${format}`,.94));
    if(blob.type!==`image/${format}`)throw new Error(s.imageError);
    const outputBytes=await blob.arrayBuffer();
    const manifest={source,original:{...originalRecord,sha256:await hash(originalBytes),width:imageWidth,height:imageHeight},output:{file:`${filename}-result.${format==='jpeg'?'jpg':format}`,sha256:await hash(outputBytes),width:canvas.width,height:canvas.height,visibleCredits:true,...(!local&&preset==='intro-card'?{layoutLicense:source.rights.license}:{})},processing,useReview:review,exportedAt:new Date().toISOString()};
    const zip=new JSZip();zip.file(manifest.output.file,outputBytes);
    zip.file('source-original.'+({'image/png':'png','image/jpeg':'jpg','image/webp':'webp'}[originalMime]??'bin'),originalBytes);
    zip.file('provenance.json',JSON.stringify(manifest,null,2));
    if(!local){
      for(const evidence of source.evidence){
        const res=await fetch(base+evidence.localPath);if(!res.ok)throw new Error(labels.evidenceError);
        const bytes=await res.arrayBuffer();if(await hash(bytes)!==evidence.sha256)throw new Error(labels.evidenceError);
        zip.file(`evidence/${evidence.localPath.split('/').at(-1)}`,bytes);
      }
    }
    const instructions=Object.values(studioText).map(t=>`${t.contains}\n${t.result}\n${preset==='intro-card'?t.cardChanges:t.changes}${source.declaration?'\n'+t.unverified:''}`).join('\n\n');
    const sourceTerms=typeof source.rights.terms==='object'?Object.values(source.rights.terms).join('\n'):source.rights.terms??'';
    zip.file('README.txt',`${readmeCredits}\n\n${sourceTerms}\n\n${instructions}\n\nSHA-256: ${manifest.original.sha256}\n${manifest.exportedAt}\n`);
    const archive=await zip.generateAsync({type:'blob'});
    if(token!==generation)throw new Error(labels.changed);
    const url=URL.createObjectURL(archive),a=document.createElement('a');a.href=url;a.download=`${filename}-with-source.zip`;a.click();setTimeout(()=>URL.revokeObjectURL(url),60000);status.textContent=s.exported;
  }catch(e){status.textContent=(e as Error).message;}
  finally{exporting=false;el<HTMLFieldSetElement>('studio-controls').disabled=false;button.disabled=!image||!layout;}
});
poseOptions();loadCollected();
