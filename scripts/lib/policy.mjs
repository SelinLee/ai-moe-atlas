import { createHash } from 'node:crypto';
export const sha256 = data => createHash('sha256').update(data).digest('hex');
export function assertSource(s) {
  if (!/^[a-z0-9-]+$/.test(s.id)) throw new Error('Invalid source ID');
  if(s.platform==='pixiv') {
    if(!/^https:\/\/www\.pixiv\.net\/artworks\/\d+$/.test(s.pageUrl)||!s.evidenceSnapshots?.length)throw new Error('Pixiv requires an artwork page and creator statement');
    const id=s.pageUrl.split('/').at(-1);
    for(const f of s.files??[]){
      const u=new URL(f.url);
      if(u.protocol!=='https:'||u.hostname!=='i.pximg.net'||!u.pathname.startsWith('/img-original/')||!new RegExp(`/${id}_p\\d+\\.(jpg|png)$`).test(u.pathname)||!/^[a-f0-9]{64}$/.test(f.sha256??''))throw new Error('Pixiv requires reviewed original URLs and hashes');
    }
  } else if(s.platform==='bilibili') {
    if(!/^https:\/\/(www\.|t\.)bilibili\.com\/(opus\/)?\d+/.test(s.pageUrl) || !s.evidenceSnapshots?.length) throw new Error('Bilibili collection requires a source post and permission snapshot');
    for(const f of s.files??[]) {
      const u=new URL(f.url);if(u.protocol!=='https:'||!/^i\d+\.hdslb\.com$/.test(u.hostname)||!u.pathname.startsWith('/bfs/new_dyn/'))throw new Error('Unapproved source image URL');
    }
  } else if (!/^[\w.-]+\/[\w.-]+$/.test(s.repository) || !/^[a-f0-9]{40}$/.test(s.revision)) throw new Error('Collection requires an immutable GitHub revision');
  if (!s.pageUrl?.startsWith('https://') || !s.originalPublication?.startsWith('https://') || !s.attribution?.length) throw new Error('Source publication and attribution are required');
  const technicalOnly=s.rights?.normalizationOnly===true&&s.rights?.modificationScope==='technical-format-and-size-only'&&s.rights?.terms?.zh&&s.rights?.terms?.en&&s.rights?.terms?.ja;
  if (s.rights?.scope !== 'artwork' || !s.rights.display || !s.rights.redistribute || !(s.rights.modify||technicalOnly) || !s.rights.evidenceUrl || !s.rights.reviewedAt) throw new Error('Explicit, reviewed artwork permissions are required before collection');
  if (!(s.evidenceFiles?.length||s.evidenceSnapshots?.length) || !s.files?.length) throw new Error('Evidence and source files are required');
  for (const f of s.files) {
    if (!/^[a-z0-9-]+$/.test(f.id)) throw new Error('Invalid asset ID');
    if (!/\.(png|webp|jpe?g)$/i.test(f.path)) throw new Error('Only raster image sources are accepted');
  }
  for (const p of [...s.files.map(f=>f.path), ...(s.evidenceFiles??[])]) {
    if (p.startsWith('/') || p.split('/').some(p=>p==='..') || p.includes('\\')) throw new Error('Unsafe source path');
  }
}
export function sourceUrl(s, file) { return ['bilibili','pixiv'].includes(s.platform) ? s.files.find(f=>f.path===file).url : `https://raw.githubusercontent.com/${s.repository}/${s.revision}/${file.split('/').map(encodeURIComponent).join('/')}`; }
