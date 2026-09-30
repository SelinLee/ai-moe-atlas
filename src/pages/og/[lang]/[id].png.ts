import sharp from 'sharp';
import { characters } from '../../../lib/data';
import { locales } from '../../../lib/i18n';
import { discoveryText } from '../../../lib/discovery-text';

export function getStaticPaths() {
  return locales.flatMap(lang=>[
    {params:{lang,id:'index'},props:{title:discoveryText[lang].title,subtitle:discoveryText[lang].intro}},
    ...characters.map(c=>({params:{lang,id:c.id},props:{title:c.name[lang],subtitle:c.author}})),
  ]);
}
const escape=(s:string)=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]!));
const lines=(s:string,n:number)=>{const chars=Array.from(s);return Array.from({length:Math.ceil(chars.length/n)},(_,i)=>chars.slice(i*n,(i+1)*n).join(''));};
export async function GET({props}:{props:{title:string;subtitle:string}}) {
  // Intentionally text-only: atlas display permission is not promotional permission.
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630"><rect width="1200" height="630" fill="#edf4ee"/><rect x="56" y="64" width="8" height="500" fill="#166b50"/><g font-family="sans-serif" fill="#203b2a"><text x="100" y="130" font-size="28">AI MOE ATLAS · AI 萌化百科 · AI 萌え図鑑</text>${lines(props.title,28).slice(0,3).map((s,i)=>`<text x="100" y="${235+i*70}" font-size="48">${escape(s)}</text>`).join('')}${lines(props.subtitle,48).slice(0,3).map((s,i)=>`<text x="100" y="${465+i*34}" font-size="23">${escape(s)}</text>`).join('')}<text x="100" y="585" font-size="19">Source · Creator · Artwork-specific terms</text></g></svg>`;
  return new Response(new Uint8Array(await sharp(Buffer.from(svg)).png().toBuffer()),{headers:{'Content-Type':'image/png'}});
}
