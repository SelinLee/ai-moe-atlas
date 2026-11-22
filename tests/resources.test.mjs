import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {assertResources,readPendingAnimationCandidates} from '../scripts/lib/resources.mjs';
import {beijingTime,byCumulativeLikes,byPublicationTime} from '../src/lib/animation-ranking.mjs';
import {rankSongsByLikes} from '../src/lib/song-ranking.mjs';
import {readLikeArchive} from '../scripts/lib/like-archive.mjs';
const root=new URL('../',import.meta.url);
const registry=JSON.parse(await readFile(new URL('content/resources.json',root),'utf8'));
test('the song ranking uses the best observed version and retains unranked tracks',()=>{
  const songs=[
    {id:'unranked',versions:[{id:'source'}]},
    {id:'zero',versions:[{id:'zero-version'}]},
    {id:'one',versions:[{id:'one-version'}]},
    {id:'two',versions:[{id:'two-version'},{id:'leading-version'}]},
  ];
  const records=new Map([['zero-version',0],['one-version',5],['two-version',4],['leading-version',7]]
    .map(([id,count])=>[id,{id,likes:{count}}]));
  assert.deepEqual(rankSongsByLikes(songs,records).map(({song,leading})=>[song.id,leading?.id]),[
    ['two','leading-version'],['one','one-version'],['zero','zero-version'],['unranked',undefined],
  ]);
});
test('Beijing observation timestamps preserve the time and local day',()=>{
  assert.equal(beijingTime.format(new Date('2026-11-20T16:00:01.000Z')),'2026-11-21 00:00:01');
});
test('new resources retain source chains, video metadata and hashed evidence',async()=>{
  assert.equal(await assertResources(registry,root),registry.records.length);
  const commentary=registry.records.find(r=>r.bvid==='BV1YFn46SEEr');
  assert.ok(commentary.relations.some(r=>r.url.endsWith('/BV1AAnt6qEek/')));
  assert.ok(registry.records.some(r=>r.category==='interactive'));
});
test('source-only records reject artwork exports, missing languages and false verification',async()=>{
  for(const mutate of [r=>r.preview='unreviewed.webp',r=>r.downloadable=true,r=>delete r.summary.ja,r=>r.verification.httpStatus=412,r=>r.evidence.sha256='0'.repeat(64)]){
    const copy=structuredClone(registry);mutate(copy.records.find(r=>r.verification.result==='metadata-verified'));
    await assert.rejects(()=>assertResources(copy,root));
  }
});
test('same-day uploads sort by official time while equal likes use the BV ID',async()=>{
  const first={id:'bv1a',publicationDate:'2026-11-08',publishedAt:'2026-11-07T17:00:00.000Z',likes:{count:10}};
  const last={...first,id:'bv1z',publishedAt:'2026-11-07T18:00:00.000Z'};
  const dateOnly={...first,id:'bv10',publishedAt:undefined};
  assert.deepEqual([first,dateOnly,last].sort(byPublicationTime),[last,first,dateOnly]);
  assert.deepEqual([last,first].sort(byCumulativeLikes),[first,last]);
  const copy=structuredClone(registry);
  const video=copy.records.find(row=>row.publishedAt);
  video.publishedAt=new Date(Date.parse(video.publishedAt)-1000).toISOString();
  await assert.rejects(()=>assertResources(copy,root),/Publication time differs/);
});
test('pending animation evidence is checked and cannot duplicate cataloged BV IDs',async()=>{
  const path='content/research/2026-11-07/bilibili-cumulative-likes-provenance.json';
  const bytes=await readFile(new URL(path,root));
  const pendingAnimationEvidence={path,kind:'browser-metadata-extract',sha256:createHash('sha256').update(bytes).digest('hex')};
  const draft={records:[],pendingAnimationEvidence};
  const candidates=await readPendingAnimationCandidates(draft,root);
  assert.deepEqual(candidates.map(row=>row.bvid),['BV1rfsf6PEiQ','BV1NL4u6MEGE']);
  await assert.rejects(()=>readPendingAnimationCandidates({...draft,records:[{bvid:candidates[0].bvid}]},root),/duplicate/);
  await assert.rejects(()=>readPendingAnimationCandidates({...draft,pendingAnimationEvidence:{...pendingAnimationEvidence,sha256:'0'.repeat(64)}},root),/hash mismatch/);
});
test('the public like archive retains current evidence bytes and historical batches',async()=>{
  const archives=await readLikeArchive(root);
  const current=archives.find(archive=>archive.path===registry.pendingAnimationEvidence.path);
  assert.equal(current.sha256,registry.pendingAnimationEvidence.sha256);
  assert.deepEqual(current.bytes,await readFile(new URL(current.path,root)));
  const ranked=registry.records.filter(row=>row.likes);
  const archiveByPath=new Map(archives.map(archive=>[archive.path,archive]));
  const snapshotPath=row=>row.likes.evidence?.path ?? row.evidence.path;
  assert.ok(ranked.every(row=>archiveByPath.has(snapshotPath(row))));
  assert.equal(current.videoCount,ranked.filter(row=>snapshotPath(row)===current.path).length);
  const lastSuccessful=new Map(ranked.map(row=>[row.bvid,row.likes]));
  if(!current.scope)assert.equal(current.videoCount+current.refreshFailures.length,ranked.length);
  for(const failure of current.refreshFailures){
    const previous=lastSuccessful.get(failure.bvid);
    assert.ok(previous && previous.evidence.path!==current.path);
    assert.ok(Date.parse(previous.observedAt)<Date.parse(failure.observedAt));
  }
  assert.ok(archives.some(archive=>archive.route==='evidence/likes/2026-11-07/bilibili-cumulative-likes.json'));
});
