import registry from '../../content/resources.json';
import leads from '../../content/leads.json';
import { characters } from './data';
import chibi from '../../public/generated/super-chibi-v1/manifest.json';
import references from '../../public/generated/ai-models-v5/manifest.json';
import doodles from '../../public/generated/rough-doodle-v1/manifest.json';
import { path } from './paths';
import { resourceText } from './resource-text';
import type { Locale } from './i18n';

export const categories=['characters','assets','references','animation','interactive','sources'] as const;
export type Category=typeof categories[number];
type Localized={zh:string;en:string;ja:string};
export type Resource={
  id:string;category:'animation'|'interactive'|'sources';title:Localized;url:string;publisher:string;
  summary:Localized;rights:Localized;publicationDate:string|null;addedAt?:string;sourceTitle?:string;
  verification?:{result:string;scope:string};bvid?:string;subtype?:string;durationSeconds?:number|null;
  likes?:{count:number;observedAt:string;sourceUrl:string};
  relations:{title:string;url:string;role:string}[];
};
const external:Resource[]=registry.records as Resource[];
const sourceTitles:Record<string,Localized>={
  'pixiv-ai-girls':{zh:'AI娘化 · 作者原图集',en:'AI personifications · creator collection',ja:'AI娘化 · 作者の作品集'},
  'bili-original':{zh:'鲸鱼娘形象 · 上善无形',en:'Whale-girl original · Shangshan',ja:'クジラ娘の原作 · 上善无形'},
  'bili-statement':{zh:'素材来源与使用声明 · ZipZipPipe',en:'Sources and usage statement · ZipZipPipe',ja:'素材の出典と利用声明 · ZipZipPipe'},
  'bili-nine-ai':{zh:'大AI和小AI们',en:'Big AIs and little AIs',ja:'大きなAIと小さなAIたち'},
  'bili-mmd':{zh:'MMD 模型配布 · 蓝色大肥鱼',en:'MMD model distribution · Blue Fat Fish',ja:'MMDモデル配布 · 青い大きな魚'},
  'bili-history':{zh:'蓝色大肥鱼是怎么来的？',en:'Where did Blue Fat Fish come from?',ja:'青い大きな魚はどこから来た？'},
  'bili-fish':{zh:'你怎么知道我钓到了蓝色大肥鱼？',en:'How did you know I caught a Blue Fat Fish?',ja:'青い大きな魚を釣ったって、どうして分かったの？'},
  'bili-cast-inventory':{zh:'各 AI 娘形象盘点',en:'AI-girl character design overview',ja:'AI娘のキャラクターデザイン一覧'},
  'bili-outsourcing':{zh:'让你别找千问外包，没让你找克劳德啊！',en:'No outsourcing to Qwen—why did you ask Claude?',ja:'千問への外注を止めたらClaudeに頼んだの？'},
  'bili-billionaires':{zh:'“亿万”身家的她们',en:'The billionaire AI girls',ja:'億万長者のAI娘たち'},
  'identity-cross-check':{zh:'各 AI 娘的公开形象整理',en:'Public AI-girl design references',ja:'公開されたAI娘デザインの整理'},
};
const sourceRecords:Resource[]=leads.map(l=>({
  id:l.id,category:'sources',title:sourceTitles[l.id],sourceTitle:l.title,url:l.url,publisher:l.creator,
  summary:l.note,rights:{zh:'按原作逐件使用条件核对；已有收录状态详见来源档案。',en:'Check artwork-specific terms at the original. Existing collection status is documented in the source archive.',ja:'原作の作品別利用条件を確認してください。収録状況は既存の出典記録を参照。'},
  publicationDate:null,relations:[],
}));
const projectIds=['openpet-deepseek','clawd-desktop','dayu-whale'];
const projects:Resource[]=projectIds.map(id=>{
  const c=characters.find(c=>c.id===id)!;
  return {id:id==='openpet-deepseek'?'openpet-project':id,category:'interactive',title:c.name,url:c.source.replace(/\/tree\/main\/deepseek$/,''),publisher:c.author,summary:c.description,rights:c.provenanceNote,publicationDate:null,relations:[]};
});
export const resources:Resource[]=[...external,...projects,...sourceRecords];
export const directoryCategories=['animation','interactive','sources'] as const;
export const byPublicationDate=(a:Resource,b:Resource)=>(b.publicationDate??'').localeCompare(a.publicationDate??'')||a.id.localeCompare(b.id);
export const animations=resources.filter(r=>r.category==='animation').sort((a,b)=>
  (b.likes?.count??-1)-(a.likes?.count??-1)||byPublicationDate(a,b));
export const rankedAnimations=animations.filter(r=>r.likes);
export const animationRanks=new Map(rankedAnimations.map((r,i)=>[r.id,i+1]));
export const resourcesUpdatedAt=registry.updatedAt;
export const likesObservedDate=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Shanghai',year:'numeric',month:'2-digit',day:'2-digit'});
export const resourceCounts:Record<Category,number>={
  characters:characters.length,assets:characters.filter(c=>c.downloadable).length,
  references:chibi.assets.length+references.assets.length+doodles.assets.length,
  animation:animations.length,interactive:resources.filter(r=>r.category==='interactive').length,
  sources:resources.filter(r=>r.category==='sources').length,
};
export function categoryURL(category:Category,lang:Locale){
  if(category==='characters')return path(`${lang}/#catalog`);
  if(category==='assets')return path(`${lang}/assets/`);
  if(category==='references')return path(`${lang}/#reference-resources`);
  return path(`${lang}/resources/?category=${category}`);
}
export function verificationLabel(r:Resource,lang:Locale){
  const s=resourceText[lang];
  if(r.verification?.result==='index-verified')return s.indexed;
  return r.verification?.result==='metadata-verified'?s.metadata:r.verification?s.partial:s.archived;
}
