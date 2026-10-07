# 每个 AI 的保底形象

2026-10-08 更新：用户明确指定 ai-models-v5 六张生成参考页作为主页形象，现已另建生成派生资料档案，保留来源与生成标记。下面的 2026-09-28 核对结论为历史记录；作者原图与现有下载包保持独立。 [形象资料与来源](REFERENCES.zh.md)

[English](BASELINES.en.md) · [日本語](BASELINES.ja.md)

目标：先为索引内每个 AI 收集一张可展示、可溯源的已有形象，再扩充表情与素材。本站默认展示不表示官方、唯一或社区公认版本。

截至 2026-09-29：12 个 AI 中，11 个已具备展示与下载素材，1 个（Copilot）仅有来源链接。来源链接不算完成图片覆盖。

| AI | 优先版本 | 当前缺口 |
| --- | --- | --- |
| DeepSeek | 已入库的鲸鱼娘女仆素材 | 已可用；保留上善无形 → ZipZipPipe → Small-tailqwq 署名链 |
| GPT、Gemini、Claude、Kimi、千问 | ZipZipPipe 本人 Pixiv 原图集 | 已采集五张高清原图及作者条件 |
| GLM、Grok、MiniMax | ZipZipPipe 本人 Pixiv 原图集 | 已采集三张高清原图及作者条件 |
| 豆包 | ZipZipPipe 本人 Pixiv 原图集 | 已采集高清原图；OpenPet 候选仅保留出处 |
| Meta Llama | ZipZipPipe 本人 Pixiv 原图集 | 已采集羊驼形象高清原图 |
| Copilot | yamamemo 候选 | 原图使用条件；当前仅来源链接 |

## 图集页码归属

《AI娘化》17 张的对应关系已逐页核对，其中十张已采集：第 3 张 Claude、第 4 张 GPT、第 5 张 Gemini、第 6 张 Kimi、第 7 张 GLM、第 8 张 Grok、第 11 张豆包（Seed）、第 13 张千问、第 14 张 Llama、第 16 张 MiniMax。另有 DeepSeek 两张，以及 Mistral、文心一言等四个不在索引内的角色（含一张带 RWKV 吊牌者）；本站索引里没有这些 AI，因此未采集。

归属依据是图上标识（GLM 的 “Z”、Grok 的 X 形巨斧、豆包的 SEED、Llama 的羊驼耳尾与 “∞”、MiniMax 的海螺与 MINIMAX 字样）、作者在《大AI和小AI们》简介中列出的九款顺序，以及知乎与百度贴吧的公开人设整理。公开整理只用于交叉核对，不作为授权依据。

## ai_video 的复用核对

检查了 `characters/assets/ai-models-v5/README.md`、`registry.json`、六张参考页的生成记录、GPT 参考页和 `projects/tech_report_v2-2026-09-28/work/raw/ai-cast-references/` 中对应截图。

- 可复用：六个 AI 的对应关系、已观察到的外观特征、视频出处与署名线索。已补充到现有条目，没有重复创建角色。
- 本地保留：核对用的网页截图和文件 SHA-256。截图含播放器、字幕与弹幕，并非作者独立原图；没有作为素材发布。
- 不作为收集原图入库：六张 `*-reference.png`。登记文件明确记载内置 image_gen 生成，包含常规比例与新 Q 版，属于衍生参考页。与截图比较，服装细节、构图及姿态有变化，不是单纯高清化或规范化。

[各AI娘形象盘点](https://www.bilibili.com/video/BV14phK66Ejw/)的截图可核对 GPT、Gemini、Claude、Kimi、千问，并记录“图片形象来源自 ZipZipPipe”。[蓝色大肥鱼是怎么来的？](https://www.bilibili.com/video/BV1Brtc63EyW/)提供 DeepSeek 传播线索；[让你别找千问外包，没让你找克劳德啊！](https://www.bilibili.com/video/BV12yeU6KEUt/)的保存文本也注明 ZipZipPipe。这些二级来源不能替代原作者的逐图许可。

## 接下来按这个顺序收集

1. 已完成 GPT、Gemini、Claude、Kimi、千问、GLM、Grok、豆包、Llama、MiniMax：从作者 Pixiv 图集采集高清原图。
2. 为 Copilot 寻找允许展示与再分发的原图版本；当前仍只有来源链接。
3. 图集中尚未采集的 Mistral、文心一言等角色先不处理——`entities.json` 里没有这些 AI，不为凑数量扩充索引。
4. 每项通过“已有角色、AI 对应准确、原始出处、作品级使用条件、原图校验、三语说明”检查后，生成等比规范化图片与附来源的素材包。

候选选择见 [baselines.json](../content/baselines.json)；跨项目核对记录见 [ai-video-2026-09-28.json](../content/research/ai-video-2026-09-28.json)；身份核对线索见 [leads.json](../content/leads.json)。状态由实际入库文件推导，不能手工把只有链接的条目标为已完成。

## 高清原图已找到

[ZipZipPipe《AI娘化》](https://www.pixiv.net/artworks/148186519)：Claude 第3张、GPT 第4张、Gemini 第5张、Kimi 第6张、GLM 第7张、Grok 第8张、豆包第11张、千问第13张、Llama 第14张、MiniMax 第16张。GLM 与 Kimi 为 1152 × 2048，其余八张均为 3072 × 5504。保留原 JPG 白底、原始字节、页码、发布时间、作者说明和 SHA-256。图集元数据标记作者使用 AI；本站未重绘。

用户已允许在找不到高清原图时，用已有素材生成固定形象并单独标注。本轮十张原图均已找到，因此没有启用生图替代。上面的 ai_video 核对记录是寻找原图前的研究记录。
