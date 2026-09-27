# 采集操作手册

已有网络形象 → 线索队列 → 原作者与授权核验 → 原图采集 → 规范化 → 人工审核发布。

B 站重点关键词：蓝色大肥鱼、鲸鱼娘、DeepSeek 娘、大 AI 和小 AI、AI 拟人。优先追溯上善无形与 ZipZipPipe 的原始动态，视频可提供角色线索，但不能据此给所有帧统一授权。Google Chrome 使用独立会话，遇到登录或验证时保留待核验状态，不调用用户个人资料。

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

采集只接受经过明确美术许可审核的来源记录。GitHub 来源固定提交，B 站来源保存原始图片 URL、许可快照与文件校验值。公开网页会变化，保留的是采集时点的证据，不宣称不可变。重复采集不得覆盖原图；更换原图时新建编号。

高清化顺序：寻找作者大图 → 保留大图原件 → 导出所需尺寸。当前的 Lanczos 插值明确标记为插值版。未来如增加超分，必须保存模型、参数与前后对照并人工核对身份特征；不得替代或覆盖原图。
