# 収集マニュアル

ネット上の既存作品 → 候補一覧 → 原作者・利用条件の確認 → 原図保存 → 規格統一 → 確認後公開。

Bilibili の検索語：蓝色大肥鱼、鲸鱼娘、DeepSeek 娘、大 AI 和小 AI、AI 拟人。上善无形と ZipZipPipe の元投稿を優先。動画は手がかりであり、全フレームの利用許諾にはなりません。独立した Google Chrome を使用し、ログイン・確認が必要な場合は候補として保留します。

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

美術の許諾を確認した記録のみ収集します。GitHub はコミット固定、Bilibili は元画像 URL・許諾スナップショット・ハッシュを保存。公開ページは変化するため、記録は収集時点の証拠です。原図は上書きせず、変更時は新しい ID を使用します。

高解像度化の順序：作者の大きな原図を探す → 原本を保存 → 必要寸法を出力。現在の Lanczos 拡大は補間と明記。将来の超解像もモデル・設定・比較を記録し、原図の再デザインや置き換えを行わないでください。
