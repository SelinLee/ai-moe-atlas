import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {likesObservedDate} from '../../src/lib/animation-ranking.mjs';
const localized=x=>['zh','en','ja'].every(l=>typeof x?.[l]==='string'&&x[l].trim());
const https=x=>{try{const u=new URL(x);return u.protocol==='https:'&&!u.username&&!u.password;}catch{return false;}};
const sha256=b=>createHash('sha256').update(b).digest('hex');

async function readEvidence(evidence,root){
  if(!/^content\/research\/\d{4}-\d{2}-\d{2}\/[a-z0-9]+(?:-[a-z0-9]+)*\.json$/.test(evidence?.path)||evidence.kind!=='browser-metadata-extract')throw new Error('Invalid resource evidence path');
  const bytes=await readFile(new URL(evidence.path,root));
  if(sha256(bytes)!==evidence.sha256)throw new Error('Resource evidence hash mismatch');
  return JSON.parse(bytes);
}

export async function readArchivedPrompt(archive, root) {
  if (!/^persona-prompts\/[a-z0-9-]+\/[a-z0-9-]+\.txt$/.test(archive.path)) throw new Error('Invalid archived prompt path');
  const bytes = await readFile(new URL('public/' + archive.path, root));
  const lines = bytes.toString('utf8').split(/\r?\n/);
  const start = archive.bodyStartLine;
  if (!Number.isInteger(start) || start < 1 || !lines[start - 1]?.trim()) throw new Error('Invalid prompt body start');
  return {bytes, body: lines.slice(start - 1).join('\n')};
}

async function checkPersona(record, snapshot, root) {
  const source = snapshot.pinnedDocument;
  const terms = snapshot.termsDocument;
  if (record.verification.result !== 'metadata-verified' || (source?.url ?? snapshot.url) !== record.url ||
    !snapshot.section || !record.relations.some(link => link.role === 'usage-terms' && link.url === terms?.url)) {
    throw new Error('Persona needs a verified prompt and its terms');
  }
  if (new URL(record.url).hostname === 'github.com' && (!source || terms.commit !== source.commit ||
    !terms.url.startsWith(record.url.split('/blob/')[0] + '/blob/' + source.commit + '/'))) {
    throw new Error('GitHub prompt and terms must share a pinned revision');
  }
  const archive = record.promptArchive;
  if (!archive) return;
  const permission = snapshot.textPermission;
  if (!archive.license?.trim() || permission?.license !== archive.license ||
    !permission.scopeSection || !record.relations.some(link => link.url === permission.scopeUrl) ||
    archive.licensePath !== archive.path.replace(/\/[^/]+$/, '/LICENSE.txt')) {
    throw new Error('Archived prompt requires text-specific permission and a license notice');
  }
  const {bytes} = await readArchivedPrompt(archive, root);
  const notice = await readFile(new URL('public/' + archive.licensePath, root));
  if (sha256(bytes) !== (source ?? snapshot).sourceSha256 || sha256(notice) !== terms.sourceSha256) throw new Error('Prompt or license hash mismatch');
}

export async function readPendingAnimationCandidates(registry, root) {
  if (!registry.pendingAnimationEvidence) return [];
  const snapshot = await readEvidence(registry.pendingAnimationEvidence, root);
  if (snapshot.source !== 'bilibili-view-api' || snapshot.metric !== 'total-likes' || !Array.isArray(snapshot.pendingCandidates)) {
    throw new Error('Invalid pending animation evidence');
  }
  const ids = new Set(registry.records.map(record => record.bvid));
  for (const row of snapshot.pendingCandidates) {
    if (!/^BV[0-9A-Za-z]{10}$/.test(row.bvid) || ids.has(row.bvid) || row.likes !== null ||
      typeof row.discoveredTitle !== 'string' || !row.discoveredTitle.trim() ||
      !['source-unavailable', 'likes-unavailable'].includes(row.status) || !Number.isFinite(Date.parse(row.observedAt)) ||
      row.requestUrl !== 'https://api.bilibili.com/x/web-interface/view?bvid=' + row.bvid) {
      throw new Error('Invalid or duplicate pending animation candidate');
    }
    ids.add(row.bvid);
  }
  return snapshot.pendingCandidates;
}

export function assertResourceCollections(collections, records) {
  const byId = new Map(records.map(record => [record.id, record]));
  for (const category of ['stickers', 'rigs', 'comics']) {
    const entries = collections[category];
    if (!Array.isArray(entries) || new Set(entries.map(entry => entry.id)).size !== entries.length) {
      throw new Error('Invalid resource collection: ' + category);
    }
    for (const entry of entries) {
      const record = byId.get(entry.id);
      if (record?.verification?.result !== 'metadata-verified' ||
        !(record.category === 'sources' || category === 'rigs' && record.category === 'interactive')) {
        throw new Error('Collection entry needs a verified source: ' + entry.id);
      }
    }
  }
  for (const {id, characters, tags} of collections.stickers) {
    if (!characters?.length || characters.some(name => !name.trim()) || !tags?.length ||
      tags.some(tag => !['pair','solo','happy','shy','confused','angry','variants','chat','meme'].includes(tag))) {
      throw new Error('Invalid sticker tags: ' + id);
    }
  }
  for (const {id, format} of collections.rigs) {
    if (!['live2d','mmd','vrm','2.5d'].includes(format)) throw new Error('Invalid rig format: ' + id);
  }
  const lastSequences = new Map();
  for (const {id, series, episode, sequence, adaptation} of collections.comics) {
    const video = byId.get(adaptation);
    if (adaptation && (video?.category !== 'animation' || !byId.get(id).relations.some(link => link.url === video.url))) {
      throw new Error('Comic adaptation must match the original source record: ' + id);
    }
    if (series === undefined && episode === undefined && sequence === undefined) continue;
    const order = sequence ?? episode;
    if (!series?.trim() || !Number.isSafeInteger(order) || order <= (lastSequences.get(series) ?? 0) ||
        (episode !== undefined && (!Number.isSafeInteger(episode) || episode < 1))) {
      throw new Error('Comic uploads must be listed in series order: ' + id);
    }
    lastSequences.set(series, order);
  }
}

export async function assertResources(registry,root){
  if(registry.schemaVersion!==1||registry.scope!=='source-metadata-only'||!/^\d{4}-\d{2}-\d{2}$/.test(registry.updatedAt)||!Array.isArray(registry.records))throw new Error('Invalid resource registry');
  await readPendingAnimationCandidates(registry, root);
  const ids=new Set(),urls=new Set();
  for(const r of registry.records){
    if(!/^[a-z0-9-]+$/.test(r.id)||ids.has(r.id)||urls.has(r.url)||!https(r.url))throw new Error('Invalid or duplicate resource identity');ids.add(r.id);urls.add(r.url);
    if(!['animation','interactive','personas','sources'].includes(r.category)||!localized(r.title)||!localized(r.summary)||!localized(r.rights)||!r.publisher?.trim())throw new Error('Missing localized resource metadata');
    const expectedUsage=r.promptArchive?'licensed-prompt-text':'source-only';
    if(r.usage!==expectedUsage||r.downloadable!==false||['preview','assets','imageUrl','thumbnail','packUrl','studioExport'].some(k=>k in r))throw new Error('Invalid resource usage or artwork export');
    if(!/^\d{4}-\d{2}-\d{2}$/.test(r.addedAt)||r.addedAt>registry.updatedAt||r.publicationDate!==null&&(!/^\d{4}-\d{2}-\d{2}$/.test(r.publicationDate)||r.publicationDate>r.addedAt))throw new Error('Invalid resource dates');
    if(!Array.isArray(r.relations)||r.relations.some(l=>!https(l.url)||!l.title?.trim()||!l.role?.trim()))throw new Error('Invalid resource source chain');
    const v=r.verification;
    if(!['metadata-verified','index-verified','partial-response','blocked'].includes(v?.result)||!v.method?.includes('google-chrome')||!Number.isInteger(v.httpStatus)||!v.scope?.trim()||!Number.isFinite(Date.parse(v.attemptedAt)))throw new Error('Missing resource verification scope');
    if(['metadata-verified','index-verified'].includes(v.result)&&v.httpStatus!==200)throw new Error('Restricted source cannot claim verified metadata');
    if(r.category==='animation'&&(!/^BV[0-9A-Za-z]{10}$/.test(r.bvid)||!r.url.includes(r.bvid)||!['op','mv','story','commentary','dance','game'].includes(r.subtype)))throw new Error('Video record requires its BV ID and subtype');
    const snapshot=await readEvidence(r.evidence,root);
    if(r.category==='personas')await checkPersona(r,snapshot,root);
    else if(r.promptArchive)throw new Error('Only persona records may archive prompt text');
    if(snapshot.httpStatus!==v.httpStatus||snapshot.accessedAt!==v.attemptedAt)throw new Error('Resource evidence disagrees with verification');
    const indexedVideo=snapshot.videos?.find(video=>video.bvid===r.bvid);
    if(v.result==='index-verified'&&(!indexedVideo||indexedVideo.url!==r.url||indexedVideo.title!==r.sourceTitle||indexedVideo.publisher!==r.publisher||indexedVideo.publicationDate!==r.publicationDate))throw new Error('Video identity differs from the retained index');
    if(r.publishedAt!==undefined&&!r.likes?.evidence)throw new Error('Exact publication time requires official video evidence');
    if(r.likes){
      const {count,observedAt,sourceUrl,evidence}=r.likes;
      const likeSnapshot=evidence?await readEvidence(evidence,root):snapshot;
      const observation=likeSnapshot.videos?.find(video=>video.bvid===r.bvid);
      if(r.category!=='animation'||!Number.isSafeInteger(count)||count<0||
        !Number.isFinite(Date.parse(observedAt))||likeSnapshot.metric!=='total-likes'||
        observation?.likes!==count||observation.observedAt!==observedAt||
        sourceUrl!==observation.snapshotUrl||!https(sourceUrl))throw new Error('Like count requires matching cumulative evidence');
      if(evidence&&(likeSnapshot.source!=='bilibili-view-api'||observation.httpStatus!==200||observation.code!==0||
        observation.publisher!==r.publisher||observation.title!==r.sourceTitle||observation.publicationDate!==r.publicationDate||
        sourceUrl!=='https://api.bilibili.com/x/web-interface/view?bvid='+r.bvid))throw new Error('Bilibili like evidence must match the video and a successful official response');
      if(r.publishedAt!==undefined){
        const published=new Date(r.publishedAt);
        if(!Number.isSafeInteger(observation.pubdate)||published.getTime()!==observation.pubdate*1000||
          published.toISOString()!==r.publishedAt||likesObservedDate.format(published)!==r.publicationDate||
          published.getTime()>Date.parse(observedAt))throw new Error('Publication time differs from the retained official video evidence');
      }
    }
    if(snapshot.pinnedDocument){
      const {commit,url,rawUrl,sourceSha256}=snapshot.pinnedDocument;
      if(!/^[a-f0-9]{40}$/.test(commit)||url!==r.url||!https(rawUrl)||!url.includes('/blob/'+commit+'/')||!rawUrl.includes('/'+commit+'/')||!/^[a-f0-9]{64}$/.test(sourceSha256))throw new Error('Invalid pinned document evidence');
    }
    if(snapshot.metadata?.pubdate){
      const date=likesObservedDate.format(new Date(snapshot.metadata.pubdate*1000));
      if(date!==r.publicationDate||snapshot.metadata.owner.name!==r.publisher||snapshot.metadata.bvid!==r.bvid)throw new Error('Video identity or publication date differs from retained metadata');
    }
    if(snapshot.pinnedSource){
      const p=snapshot.pinnedSource;
      if(!/^[a-f0-9]{40}$/.test(p.commit)||!p.url.includes(p.commit)||!r.url.includes(p.commit)||!/^content\/research\/2026-11-06\/[a-zA-Z0-9-]+\.md$/.test(p.path)||sha256(await readFile(new URL(p.path,root)))!==p.sha256)throw new Error('Pinned resource bytes or commit mismatch');
    }
  }
  return registry.records.length;
}
