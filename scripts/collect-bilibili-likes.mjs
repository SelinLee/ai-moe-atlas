import { readFile } from 'node:fs/promises';
import { chromium } from 'playwright';
import { readPendingAnimationCandidates } from './lib/resources.mjs';

const args = process.argv.slice(2);
const candidatesOnly = args[0] === '--candidates-only';
const videosOnly = args[0] === '--videos-only';
const candidateSelection = args[0] === '--candidate-selection';
const supplied = candidatesOnly || videosOnly || candidateSelection ? args.slice(1) : args;
if (supplied.some(id => !/^BV[0-9A-Za-z]{10}$/.test(id))) {
  throw new Error('Arguments must be Bilibili BV IDs');
}

const root = new URL('../', import.meta.url);
const registry = JSON.parse(await readFile(new URL('content/resources.json', root), 'utf8'));
const ids = new Set(registry.records.filter(record => record.category === 'animation').map(record => record.bvid));
const selectedVideos = [...new Set(supplied)];
if (videosOnly && (!selectedVideos.length || selectedVideos.some(id => !ids.has(id)))) {
  throw new Error('--videos-only requires at least one cataloged BV ID');
}
if (candidateSelection && (!selectedVideos.length || selectedVideos.some(id => ids.has(id)))) {
  throw new Error('--candidate-selection requires at least one BV ID outside the catalog');
}
const tracked = (await readPendingAnimationCandidates(registry, root)).map(row => row.bvid);
const leads = [...new Set([...tracked, ...supplied])].filter(id => !ids.has(id));
const browser = await chromium.launch({ channel: 'chrome', headless: true });

const isVerified = row => row.httpStatus === 200 && row.code === 0 && row.metadata?.bvid === row.bvid
  && Number.isSafeInteger(row.metadata.likes) && row.metadata.likes >= 0;

try {
  const page = await browser.newPage({ locale: 'zh-CN' });
  const response = await page.goto('https://www.bilibili.com/zh-Hans', { waitUntil: 'domcontentloaded', timeout: 24000 });
  if (!response?.ok()) throw new Error(`Bilibili homepage returned ${response?.status()}`);

  const observations = [];
  let requested = [...ids, ...leads];
  let captureScope = 'catalog-and-candidates';
  if (candidatesOnly) {
    requested = leads;
    captureScope = 'candidates-only';
  }
  if (videosOnly) {
    requested = selectedVideos;
    captureScope = 'catalog-selection';
  }
  if (candidateSelection) {
    requested = selectedVideos;
    captureScope = 'candidate-selection';
  }
  let stoppedEarly = false;
  for (let index = 0; index < requested.length; index += 5) {
    const batch = await page.evaluate(async bvids => Promise.all(bvids.map(async bvid => {
      const requestUrl = 'https://api.bilibili.com/x/web-interface/view?bvid=' + bvid;
      try {
        const response = await fetch(requestUrl, { credentials: 'include', signal: AbortSignal.timeout(9000) });
        const data = await response.json().catch(() => null);
        const video = data?.data;
        return {
          bvid, requestUrl, observedAt: new Date().toISOString(), httpStatus: response.status,
          code: data?.code ?? null,
          metadata: video ? {
            bvid: video.bvid, title: video.title, publisher: video.owner?.name, publisherId: video.owner?.mid,
            pubdate: video.pubdate, duration: video.duration, desc: video.desc, likes: video.stat?.like,
          } : null,
        };
      } catch (error) {
        return { bvid, requestUrl, observedAt: new Date().toISOString(), error: String(error) };
      }
    })), requested.slice(index, index + 5));
    observations.push(...batch);
    if (observations.length < requested.length && batch.every(row => [412, 429].includes(row.httpStatus))) {
      stoppedEarly = true;
      break;
    }
  }

  const snapshot = {
    method: 'isolated-headless-google-chrome', contextUrl: page.url(), contextHttpStatus: response.status(),
    capturedAt: new Date().toISOString(), metric: 'total-likes', source: 'bilibili-view-api', field: 'data.stat.like',
    videos: observations.filter(row => ids.has(row.bvid)),
    trackedCandidateIds: tracked,
    candidates: observations.filter(row => !ids.has(row.bvid)),
    captureScope,
    captureComplete: !stoppedEarly,
    requestedCount: requested.length,
    attemptedCount: observations.length,
  };
  process.stdout.write(JSON.stringify(snapshot, null, 2) + '\n');

  const unverified = observations.filter(row => !isVerified(row));
  if (stoppedEarly) {
    process.stderr.write(`Collection stopped after ${observations.length} of ${requested.length} requests because every request in the last batch returned HTTP 412 or 429.\n`);
    process.exitCode = 1;
  }
  if (unverified.length) {
    process.stderr.write(`Unverified observations: ${unverified.map(row => row.bvid).join(', ')}\n`);
    if (unverified.some(row => ids.has(row.bvid) || supplied.includes(row.bvid))) process.exitCode = 1;
  }
} finally {
  await browser.close();
}
