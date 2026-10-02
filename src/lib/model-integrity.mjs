import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { localModelPath } from './model-policy.mjs';
export const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');

/** Inspect a self-contained GLB without starting a renderer or following external URLs. */
export function inspectGlb(bytes) {
  if (bytes.length < 28 || bytes.readUInt32LE(0) !== 0x46546c67) throw Error('Invalid GLB magic/header');
  if (bytes.readUInt32LE(4) !== 2) throw Error('Only GLB version 2 is supported');
  if (bytes.readUInt32LE(8) !== bytes.length) throw Error('GLB declared length does not match its bytes');
  let offset=12; const chunks=[];
  while (offset < bytes.length) {
    if (offset+8 > bytes.length) throw Error('Truncated GLB chunk header');
    const length=bytes.readUInt32LE(offset); const type=bytes.readUInt32LE(offset+4);
    if (length%4 !== 0 || offset+8+length > bytes.length) throw Error('Invalid GLB chunk length/alignment');
    chunks.push({type,bytes:bytes.subarray(offset+8,offset+8+length)});offset+=8+length;
  }
  if (chunks.length !== 2 || chunks[0].type !== 0x4e4f534a || chunks[1].type !== 0x004e4942) throw Error('Expected one JSON chunk followed by one embedded BIN chunk');
  const document=JSON.parse(chunks[0].bytes.toString('utf8'));
  if (document.asset?.version !== '2.0' || !document.asset?.copyright?.trim()) throw Error('Missing glTF version or embedded copyright');
  if (document.buffers?.length !== 1 || document.buffers[0].uri) throw Error('Model must use one embedded buffer');
  const byteLength=document.buffers[0].byteLength;
  if (!Number.isSafeInteger(byteLength) || byteLength < 1 || byteLength > chunks[1].bytes.length || chunks[1].bytes.length-byteLength > 3) throw Error('Invalid embedded buffer length');
  for (const view of document.bufferViews ?? []) {
    if (view.buffer !== 0 || !Number.isSafeInteger(view.byteLength) || view.byteLength < 1 || !Number.isSafeInteger(view.byteOffset ?? 0) || (view.byteOffset ?? 0) < 0 || (view.byteOffset ?? 0)+view.byteLength > byteLength) throw Error('Buffer view exceeds the embedded data');
  }
  if (document.images?.some(image=>image.uri && !image.uri.startsWith('data:'))) throw Error('External image dependencies are not allowed');
  if (!document.meshes?.length || !document.nodes?.length || !document.scenes?.length) throw Error('Model has no renderable scene');
  return document;
}

export function modelFileIssues(model, publicRoot='public') {
  const issues=[];
  try {
    if (!localModelPath(model.src,['.glb']) || !localModelPath(model.poster,['.png','.webp','.jpg','.jpeg'])) return ['unsafe model paths'];
    const bytes=readFileSync(resolve(publicRoot,model.src));
    readFileSync(resolve(publicRoot,model.poster));
    if (bytes.length !== model.fileBytes) issues.push('fileBytes mismatch');
    if (sha256(bytes) !== model.sha256) issues.push('sha256 mismatch');
    inspectGlb(bytes);
    if (model.notice) {
      if (!localModelPath(model.notice,['.txt'])) issues.push('unsafe notice path');
      else if (!readFileSync(resolve(publicRoot,model.notice),'utf8').trim()) issues.push('empty model notice');
    }
  } catch (error) { issues.push(error.message); }
  return issues;
}
export const modelManifestPath = model => `${dirname(model.src)}/manifest.json`;
