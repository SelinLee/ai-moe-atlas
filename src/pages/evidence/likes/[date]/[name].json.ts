import { pathToFileURL } from 'node:url';
import { readLikeArchive } from '../../../../../scripts/lib/like-archive.mjs';

export async function getStaticPaths() {
  const archives = await readLikeArchive(pathToFileURL(`${process.cwd()}/`));
  return archives.map(({ date, name, bytes }) => ({ params: { date, name }, props: { bytes } }));
}

export function GET({ props }: { props: { bytes: Uint8Array } }) {
  return new Response(new Uint8Array(props.bytes), { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
}
