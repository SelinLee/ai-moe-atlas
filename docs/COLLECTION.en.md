# Collection manual

Existing online artwork → lead queue → creator and artwork-permission review → original collection → normalization → reviewed publication.

Useful Bilibili queries: 蓝色大肥鱼, 鲸鱼娘, DeepSeek 娘, 大 AI 和小 AI, AI 拟人. Follow original posts by 上善无形 and ZipZipPipe. Videos provide leads, not blanket frame permissions. Use isolated Google Chrome; leave blocked sources pending rather than using personal profiles.

```sh
npm run discover -- --platform bilibili --query '蓝色大肥鱼' --limit 20
npm run discover -- --platform github --query 'deepseek pet' --limit 20
npm run collect -- shangshan-whale
npm run assets
npm run validate
npm test
npm run build
```

| Record | Location |
| --- | --- |
| Search candidates, not published | `content/candidates/*.json` |
| Curated Bilibili source leads | `content/leads.json` |
| Character index / translations | `content/characters.json` |
| Reviewed collection specification | `content/sources/*.json` |
| Original bytes and metadata | `public/collected/<id>/<asset>/original.*` |
| Author / license evidence | `public/collected/<id>/evidence/` |
| Source URLs, hashes, lineage | `public/collected/<id>/manifest.json` |
| Download pack | `public/packs/<id>.zip` |

Collection accepts only reviewed artwork permissions. Pin GitHub revisions. For Bilibili retain original image URLs, permission snapshots, and byte hashes; public pages are mutable, so the snapshot is evidence at collection time, not an immutability claim. Never overwrite originals; assign a new ID when they change.

Resolution workflow: find the creator’s larger original → preserve it → export required dimensions. Current Lanczos enlargements are explicitly resampled. Future super-resolution must record model, settings, and before/after review without redesigning or replacing the source.
