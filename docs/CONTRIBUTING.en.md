# Contribution guide

Submit only existing online characters and published works. Never generate new designs to fill this atlas.

1. Find the creator, original publication, and original image URL. Preserve Bilibili video/post IDs; distinguish uploaders from character designers.
2. Add leads to `content/candidates/` or use the Source issue form. Mark unknown authors, dates, status, and terms as unknown.
3. Review artwork-specific permissions. If only the source is verified, add a `reference` entry with `downloadable: false` and no mirrored image.
4. For distributable, modifiable images, create `content/sources/<id>.json` with evidence, the complete attribution chain, original publication, review date, and files. Pin GitHub sources to a 40-character commit SHA. Preserve Bilibili original image URLs and permission statements.
5. Run `npm run collect`, then `npm run assets`. Original bytes are immutable; derived outputs have parent hashes.
6. Provide Chinese, English, and Japanese names, descriptions, notes, appearance, and provenance.
7. Run tests and build; submit a pull request for review.

## Three contribution routes

| Route | Use | Required |
| --- | --- | --- |
| Source lead (`source`) | Submit an existing online character and its publication | Original artwork URL, related AI |
| Correction or removal (`correction`) | Fix a creator, source, link, or term; request removal | Entry URL, correction and evidence |
| Creator & permission confirmation (`rights`) | Confirm credit, original link, and specific permitted uses | Entry URL, role, decision, evidence |

The lead form on the website asks only for the original artwork URL and the related AI. Creator, attribution chain, terms, and existing images sit behind “Known details”; write “unknown” rather than guessing. All three routes are GitHub issues and need a GitHub account. There is no account-free option today; if user testing shows the account is the main obstacle, another route will be considered then.

The confirmation form lists every purpose the atlas reviews. Unselected purposes stay unconfirmed and never gain permission automatically. A maintainer verifies each submission before the use record changes, and unverified decisions are never published. Do not put identity documents, private contacts, or other sensitive personal data in a public form.

Only faithful dimensions, canvas, and format adjustments are included. No generative redesign, automatic cutouts, or neural upscaling. Do not remove watermarks or credits. Interpolation is not recovered detail. New originals require new IDs/versions, not overwrites. Removal may require handling repository history, releases, and deployment caches, not just hiding a link.

[Collection manual](COLLECTION.en.md) · [Artwork terms](../RIGHTS.md)
