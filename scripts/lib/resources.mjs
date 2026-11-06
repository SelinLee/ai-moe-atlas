import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const localized=x=>['zh','en','ja'].every(l=>typeof x?.[l]==='string'&&x[l].trim());
const https=x=>{try{const u=new URL(x);return u.protocol==='https:'&&!u.username&&!u.password;}catch{return false;}};
const sha256=b=>createHash('sha256').update(b).digest('hex');

export async function assertResources(registry,root){
  if(registry.schemaVersion!==1||registry.scope!=='source-metadata-only'||!/^\d{4}-\d{2}-\d{2}$/.test(registry.updatedAt)||!Array.isArray(registry.records))throw new Error('Invalid resource registry');
  const ids=new Set(),urls=new Set();
  for(const r of registry.records){
    if(!/^[a-z0-9-]+$/.test(r.id)||ids.has(r.id)||urls.has(r.url)||!https(r.url))throw new Error('Invalid or duplicate resource identity');ids.add(r.id);urls.add(r.url);
    if(!['animation','interactive','sources'].includes(r.category)||!localized(r.title)||!localized(r.summary)||!localized(r.rights)||!r.publisher?.trim())throw new Error('Missing localized resource metadata');
    if(r.usage!=='source-only'||r.downloadable!==false||['preview','assets','imageUrl','thumbnail','packUrl','studioExport'].some(k=>k in r))throw new Error('Source-only resources cannot publish artwork or export capabilities');
    if(!/^\d{4}-\d{2}-\d{2}$/.test(r.addedAt)||r.addedAt>registry.updatedAt||r.publicationDate!==null&&(!/^\d{4}-\d{2}-\d{2}$/.test(r.publicationDate)||r.publicationDate>r.addedAt))throw new Error('Invalid resource dates');
    if(!Array.isArray(r.relations)||r.relations.some(l=>!https(l.url)||!l.title?.trim()||!l.role?.trim()))throw new Error('Invalid resource source chain');
    const v=r.verification;
    if(!['metadata-verified','partial-response','blocked'].includes(v?.result)||!v.method?.includes('google-chrome')||!Number.isInteger(v.httpStatus)||!v.scope?.trim()||!Number.isFinite(Date.parse(v.attemptedAt)))throw new Error('Missing resource verification scope');
    if(v.result==='metadata-verified'&&v.httpStatus!==200)throw new Error('Restricted source cannot claim full metadata verification');
    if(r.category==='animation'&&(!/^BV[0-9A-Za-z]{10}$/.test(r.bvid)||!r.url.includes(r.bvid)||!['op','mv','story','commentary','dance','game'].includes(r.subtype)))throw new Error('Video record requires its BV ID and subtype');
    const e=r.evidence;
    if(!/^content\/research\/2026-11-06\/[a-z0-9-]+\.json$/.test(e?.path)||e.kind!=='browser-metadata-extract')throw new Error('Invalid resource evidence path');
    const bytes=await readFile(new URL(e.path,root));if(sha256(bytes)!==e.sha256)throw new Error('Resource evidence hash mismatch');
    const snapshot=JSON.parse(bytes);if(snapshot.httpStatus!==v.httpStatus||snapshot.accessedAt!==v.attemptedAt)throw new Error('Resource evidence disagrees with verification');
    if(snapshot.metadata?.pubdate){
      const date=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Shanghai',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(snapshot.metadata.pubdate*1000));
      if(date!==r.publicationDate||snapshot.metadata.owner.name!==r.publisher||snapshot.metadata.bvid!==r.bvid)throw new Error('Video identity or publication date differs from retained metadata');
    }
    if(snapshot.pinnedSource){
      const p=snapshot.pinnedSource;
      if(!/^[a-f0-9]{40}$/.test(p.commit)||!p.url.includes(p.commit)||!r.url.includes(p.commit)||!/^content\/research\/2026-11-06\/[a-zA-Z0-9-]+\.md$/.test(p.path)||sha256(await readFile(new URL(p.path,root)))!==p.sha256)throw new Error('Pinned resource bytes or commit mismatch');
    }
  }
  return registry.records.length;
}
