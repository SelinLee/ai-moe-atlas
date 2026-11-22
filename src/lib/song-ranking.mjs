import { byCumulativeLikes } from './animation-ranking.mjs';

export function rankSongsByLikes(songs, records) {
  return songs.map(song => {
    const leading = song.versions
      .map(version => records.get(version.id))
      .filter(record => record?.likes)
      .sort(byCumulativeLikes)[0];
    return { song, leading };
  }).sort((a, b) =>
    (b.leading?.likes.count ?? -1) - (a.leading?.likes.count ?? -1)
    || a.song.id.localeCompare(b.song.id));
}
