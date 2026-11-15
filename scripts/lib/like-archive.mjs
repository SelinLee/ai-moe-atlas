import { createHash } from 'node:crypto';
import { readdir, readFile } from 'node:fs/promises';

const dayPattern = /^\d{4}-\d{2}-\d{2}$/;
const filenamePattern = /^(bilibili-cumulative-likes(?:-[a-z0-9]+)*)\.json$/;
const bvidPattern = /^BV[0-9A-Za-z]{10}$/;
const videoEndpoint = 'https://api.bilibili.com/x/web-interface/view?bvid=';
const snapshotFields = ['method','contextUrl','contextHttpStatus','capturedAt','metric','source','field','videos','pendingCandidates'];
const videoFields = ['bvid','snapshotUrl','observedAt','httpStatus','code','title','publisher','publisherId','publicationDate','pubdate','likes'];
const candidateFields = ['bvid','requestUrl','observedAt','httpStatus','code','discoveredTitle','status','likes','previousEvidence','previousObservedAt','publicPage','discoveryUrl','discoveredAt'];
const pageFields = ['url','finalUrl','httpStatus','accessedAt','title'];
const hasOnly = (value, fields) => value && typeof value === 'object' && !Array.isArray(value)
  && Object.keys(value).every(key => fields.includes(key));
const hasScalarValues = value => Object.values(value).every(item => item === null || ['string','number'].includes(typeof item));

function isPublicSnapshot(snapshot) {
  if (!hasOnly(snapshot, snapshotFields) || snapshot.source !== 'bilibili-view-api' || snapshot.metric !== 'total-likes'
    || snapshot.field !== 'data.stat.like' || !Number.isFinite(Date.parse(snapshot.capturedAt))
    || !['https://www.bilibili.com/','https://www.bilibili.com/zh-Hans'].includes(snapshot.contextUrl)
    || !Array.isArray(snapshot.videos) || !Array.isArray(snapshot.pendingCandidates ?? [])) return false;
  const {videos, pendingCandidates = [], ...metadata} = snapshot;
  return hasScalarValues(metadata) && videos.every(row => hasOnly(row, videoFields) && hasScalarValues(row) && bvidPattern.test(row.bvid)
    && row.snapshotUrl === videoEndpoint + row.bvid && row.httpStatus === 200 && row.code === 0
    && Number.isSafeInteger(row.likes) && row.likes >= 0 && Number.isFinite(Date.parse(row.observedAt)))
    && (pendingCandidates ?? []).every(row => {
      if (!hasOnly(row, candidateFields) || !bvidPattern.test(row.bvid) || row.requestUrl !== videoEndpoint + row.bvid
        || row.likes !== null || !Number.isFinite(Date.parse(row.observedAt))) return false;
      const {publicPage, ...candidate} = row;
      if (!hasScalarValues(candidate)) return false;
      if (row.discoveryUrl !== undefined && (!/^https:\/\/search\.bilibili\.com\/(?:zh-Hans\/)?all\?keyword=[^&]+&order=pubdate$/.test(row.discoveryUrl)
        || !Number.isFinite(Date.parse(row.discoveredAt)))) return false;
      const videoUrl = `https://www.bilibili.com/video/${row.bvid}/`;
      return publicPage === undefined || (hasOnly(publicPage, pageFields) && hasScalarValues(publicPage)
        && publicPage.url === videoUrl && publicPage.finalUrl === videoUrl);
    });
}

export async function readLikeArchive(root) {
  const research = new URL('content/research/', root);
  const days = (await readdir(research, { withFileTypes: true }))
    .filter(entry => entry.isDirectory() && dayPattern.test(entry.name));
  const archives = (await Promise.all(days.map(async ({name: date}) => {
    const folder = new URL(`${date}/`, research);
    const files = (await readdir(folder, { withFileTypes: true }))
      .filter(entry => entry.isFile() && filenamePattern.test(entry.name));
    return Promise.all(files.map(async ({name: filename}) => {
      const path = `content/research/${date}/${filename}`;
      const bytes = await readFile(new URL(filename, folder));
      const snapshot = JSON.parse(bytes);
      if (!isPublicSnapshot(snapshot)) throw new Error(`Unexpected data in public like archive: ${path}`);
      return {
        date, name: filename.slice(0, -5), path, route: `evidence/likes/${date}/${filename}`,
        bytes, sha256: createHash('sha256').update(bytes).digest('hex'),
        capturedAt: snapshot.capturedAt, videoCount: snapshot.videos.length,
        pendingCount: snapshot.pendingCandidates?.length ?? 0,
      };
    }));
  }))).flat();
  return archives.sort((a, b) => Date.parse(b.capturedAt) - Date.parse(a.capturedAt) || a.path.localeCompare(b.path));
}
