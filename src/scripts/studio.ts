import JSZip from 'jszip';
import { frameGeometry } from '../lib/geometry.mjs';
const root=document.querySelector<HTMLElement>('#studio')!;
const {s,labels,options,base,lang}=JSON.parse(root.dataset.config!);
const el=<T extends HTMLElement>(id:string)=>document.getElementById(id) as T;
const select=(id:string)=>el<HTMLSelectElement>(id);
const canvas=el<HTMLCanvasElement>('canvas'),ctx=canvas.getContext('2d')!;
const status=el('studio-status'),button=el<HTMLButtonElement>('export-pack');
let image:HTMLImageElement|null=null,sourceBytes:ArrayBuffer|null=null,sourceRecord:any=null,filename='asset',local=false,generation=0,originalMime='image/png';
let selectedManifest:any=null;
const params=new URLSearchParams(location.search);
if(options.some((o:any)=>o.id===params.get('asset')))select('character-select').value=params.get('asset')!;
function poseOptions(){const c=options.find((o:any)=>o.id===select('character-select').value);select('pose-select').replaceChildren(...c.manifest.source.originals.map((o:any)=>new Option(o.label[lang],o.id)));if(c.manifest.source.originals.some((o:any)=>o.id===params.get('pose')))select('pose-select').value=params.get('pose')!;}
function draw(){if(!image)return;const shape=select('shape').value,size=Number(select('size').value),padding=Number(el<HTMLInputElement>('padding').value)/100;const g=frameGeometry(image.naturalWidth,image.naturalHeight,size,shape,padding);canvas.width=g.w;canvas.height=g.h;ctx.clearRect(0,0,g.w,g.h);
 const format=select('format').value;let bg=select('background').value;if(bg==='custom')bg=el<HTMLInputElement>('custom-color').value;
 if(format==='jpeg'){ctx.fillStyle='#fff';ctx.fillRect(0,0,g.w,g.h);}ctx.save();
 if(shape==='circle'){ctx.beginPath();ctx.arc(g.w/2,g.h/2,g.w/2,0,Math.PI*2);ctx.clip();}
 if(bg!=='transparent'){ctx.fillStyle=bg;ctx.fillRect(0,0,g.w,g.h);}ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';ctx.drawImage(image,g.x,g.y,g.drawW,g.drawH);ctx.restore();
 el('output-size').textContent=`${g.w} × ${g.h}`;el('padding-value').textContent=`${Math.round(padding*100)}%`;el('jpeg-note').hidden=format!=='jpeg';el('upscale-note').hidden=g.scale<=1;el('custom-color').hidden=select('background').value!=='custom';
}
async function load(bytes:ArrayBuffer,mime:string,token:number){const url=URL.createObjectURL(new Blob([bytes],{type:mime}));const img=new Image();try{img.src=url;await img.decode();if(token!==generation)return false;if(img.naturalWidth*img.naturalHeight>40_000_000)throw new Error(s.pixelsTooLarge);image=img;sourceBytes=bytes;originalMime=mime;el('native-size').textContent=`${s.native}: ${img.naturalWidth} × ${img.naturalHeight}`;draw();button.disabled=false;status.textContent=s.ready;return true;}finally{URL.revokeObjectURL(url);}}
async function loadCollected(){const token=++generation;button.disabled=true;status.textContent=s.processing;local=false;el('local-source-fields').hidden=true;el<HTMLInputElement>('upload').value='';el('usage-note').hidden=false;
 const c=options.find((o:any)=>o.id===select('character-select').value);const o=c.manifest.source.originals.find((x:any)=>x.id===select('pose-select').value);selectedManifest=c.manifest;sourceRecord=o;filename=`${c.id}-${o.id}`;
 const a=el<HTMLAnchorElement>('source-link');a.href=`${base}${lang}/characters/${c.id}/`;a.hidden=false;
 try{const response=await fetch(base+o.localPath);if(!response.ok)throw new Error();await load(await response.arrayBuffer(),o.localPath.endsWith('.webp')?'image/webp':'image/png',token);}catch{if(token===generation){status.textContent=s.imageError;image=null;ctx.clearRect(0,0,canvas.width,canvas.height);}}
}
select('character-select').addEventListener('change',()=>{poseOptions();loadCollected();});select('pose-select').addEventListener('change',loadCollected);
['shape','size','background','format'].forEach(id=>select(id).addEventListener('change',draw));['padding','custom-color'].forEach(id=>el(id).addEventListener('input',draw));
el<HTMLInputElement>('upload').addEventListener('change',async e=>{const file=(e.target as HTMLInputElement).files?.[0];if(!file)return;const token=++generation;button.disabled=true;image=null;sourceBytes=null;ctx.clearRect(0,0,canvas.width,canvas.height);local=true;el('local-source-fields').hidden=false;el('source-link').hidden=true;el('usage-note').hidden=true;
 try{if(!['image/png','image/jpeg','image/webp'].includes(file.type))throw new Error(s.imageError);if(file.size>20*1024*1024)throw new Error(s.fileTooLarge);status.textContent=s.processing;filename=file.name.replace(/\.[^.]+$/,'').replace(/[^\p{L}\p{N}_-]/gu,'-').slice(0,80)||'image';sourceRecord={filename:file.name,userSupplied:true};await load(await file.arrayBuffer(),file.type,token);}catch(e){status.textContent=(e as Error).message;}});
el('reset').addEventListener('click',()=>{select('shape').value='square';select('size').value='512';select('format').value='png';select('background').value='transparent';el<HTMLInputElement>('padding').value='12';draw();});
async function hash(bytes:ArrayBuffer){return [...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(v=>v.toString(16).padStart(2,'0')).join('');}
button.addEventListener('click',async()=>{if(!image||!sourceBytes)return;button.disabled=true;status.textContent=s.processing;
 try{let source=selectedManifest?.source;if(local){const url=el<HTMLInputElement>('source-url').value.trim(),author=el<HTMLInputElement>('source-author').value.trim(),terms=el<HTMLInputElement>('source-terms').value.trim();let valid=false;try{valid=new URL(url).protocol==='https:';}catch{}if(!valid||!author||!terms)throw new Error(labels.required);source={pageUrl:url,attribution:[{name:author}],rights:{terms,verification:'user-supplied, not independently verified'}};}
 const format=select('format').value;const blob=await new Promise<Blob>((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(new Error(s.imageError)),`image/${format}`,.94));if(blob.type!==`image/${format}`)throw new Error(s.imageError);
 const outputBytes=await blob.arrayBuffer();const manifest={source,original:{...sourceRecord,sha256:await hash(sourceBytes),width:image.naturalWidth,height:image.naturalHeight},output:{file:`${filename}.${format==='jpeg'?'jpg':format}`,sha256:await hash(outputBytes),width:canvas.width,height:canvas.height},processing:{tool:'AI Moe Atlas / browser Canvas',generative:false,shape:select('shape').value,padding:Number(el<HTMLInputElement>('padding').value)/100,background:select('background').value==='custom'?el<HTMLInputElement>('custom-color').value:select('background').value,format,method:'contain-resample',note:s.upscaleNote},exportedAt:new Date().toISOString()};
 const zip=new JSZip();zip.file(manifest.output.file,outputBytes);zip.file('source-original.'+({'image/png':'png','image/jpeg':'jpg','image/webp':'webp'}[originalMime]??'bin'),sourceBytes);zip.file('provenance.json',JSON.stringify(manifest,null,2));
 if(!local){for(const evidence of source.evidence){const res=await fetch(base+evidence.localPath);if(!res.ok)throw new Error(s.imageError);zip.file(`evidence/${evidence.localPath.split('/').at(-1)}`,await res.arrayBuffer());}}
 zip.file('README.txt',`${source.pageUrl}\n${source.attribution.map((a:any)=>a.name+(a.url?' — '+a.url:'')).join('\n')}\n${source.rights.license??source.rights.terms}\n\n${s.changesText}\n${s.upscaleNote}\n\nOriginal bytes and provenance.json are included. Retain source credits and original terms.\n保留原始署名与许可，详见 provenance.json。\n元のクレジットと利用条件を保持してください。\n`);
 const url=URL.createObjectURL(await zip.generateAsync({type:'blob'}));const a=document.createElement('a');a.href=url;a.download=`${filename}-with-source.zip`;a.click();setTimeout(()=>URL.revokeObjectURL(url),60000);status.textContent=s.exported;
 }catch(e){status.textContent=(e as Error).message;}finally{button.disabled=!image;}
});
poseOptions();loadCollected();
