# Contribution guide

Submit only existing online characters and published works. Never generate new designs to fill this atlas.

1. Find the creator, original publication, and original image URL. Preserve Bilibili video/post IDs; distinguish uploaders from character designers.
2. Add leads to `content/candidates/` or use the Source issue form. Mark unknown authors, dates, status, and terms as unknown.
3. Review artwork-specific permissions. If only the source is verified, add a `reference` entry with `downloadable: false` and no mirrored image.
4. For distributable, modifiable images, create `content/sources/<id>.json` with evidence, the complete attribution chain, original publication, review date, and files. Pin GitHub sources to a 40-character commit SHA. Preserve Bilibili original image URLs and permission statements.
5. Run `npm run collect`, then `npm run assets`. Original bytes are immutable; derived outputs have parent hashes.
6. Provide Chinese, English, and Japanese names, descriptions, notes, appearance, and provenance.
7. Run tests and build; submit a pull request for review.

Only faithful dimensions, canvas, and format adjustments are included. No generative redesign, automatic cutouts, or neural upscaling. Do not remove watermarks or credits. Interpolation is not recovered detail. New originals require new IDs/versions, not overwrites. Removal may require handling repository history, releases, and deployment caches, not just hiding a link.

[Collection manual](COLLECTION.en.md) · [Artwork terms](../RIGHTS.md)
