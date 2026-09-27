# 每个 AI 的保底形象

[English](BASELINES.en.md) · [日本語](BASELINES.ja.md)

目标：先为索引内每个 AI 收集一张可展示、可溯源的已有形象，再扩充表情与素材。本站默认展示不表示官方、唯一或社区公认版本。

截至 2026-09-28：12 个 AI 中，1 个已具备展示与下载素材，10 个有候选来源，1 个尚无候选。来源链接不算完成图片覆盖。

| AI | 优先版本 | 当前缺口 |
| --- | --- | --- |
| DeepSeek | 已入库的鲸鱼娘女仆素材 | 已可用；保留上善无形 → ZipZipPipe → Small-tailqwq 署名链 |
| GPT、Gemini、Claude、Kimi、千问 | ZipZipPipe 系列；已用 ai_video 原始视频截图核对外观 | 作者独立原图、逐图使用条件 |
| Grok、GLM、MiniMax | ZipZipPipe《大AI和小AI们》 | 单独外观核对、作者原图与使用条件 |
| 豆包 | OpenPet 候选 | 寻找允许展示、修改与再分发的版本；当前仅来源链接 |
| Copilot | yamamemo 候选 | 原图使用条件；当前仅来源链接 |
| Meta Llama | 待寻找 | 不将 llama.cpp 的吉祥物当作 Meta 模型的形象 |

## ai_video 的复用核对

检查了 `characters/assets/ai-models-v5/README.md`、`registry.json`、六张参考页的生成记录、GPT 参考页和 `projects/tech_report_v2-2026-09-28/work/raw/ai-cast-references/` 中对应截图。

- 可复用：六个 AI 的对应关系、已观察到的外观特征、视频出处与署名线索。已补充到现有条目，没有重复创建角色。
- 本地保留：核对用的网页截图和文件 SHA-256。截图含播放器、字幕与弹幕，并非作者独立原图；没有作为素材发布。
- 不作为收集原图入库：六张 `*-reference.png`。登记文件明确记载内置 image_gen 生成，包含常规比例与新 Q 版，属于衍生参考页。与截图比较，服装细节、构图及姿态有变化，不是单纯高清化或规范化。

[各AI娘形象盘点](https://www.bilibili.com/video/BV14phK66Ejw/)的截图可核对 GPT、Gemini、Claude、Kimi、千问，并记录“图片形象来源自 ZipZipPipe”。[蓝色大肥鱼是怎么来的？](https://www.bilibili.com/video/BV1Brtc63EyW/)提供 DeepSeek 传播线索；[让你别找千问外包，没让你找克劳德啊！](https://www.bilibili.com/video/BV12yeU6KEUt/)的保存文本也注明 ZipZipPipe。这些二级来源不能替代原作者的逐图许可。

## 接下来按这个顺序收集

1. 优先补 GPT、Gemini、Claude、Kimi、千问：已有明确外观参照，沿 ZipZipPipe 原始发布页找独立高清图。
2. 核对同系列 Grok、GLM、MiniMax，补齐图片、出处和适用条件。
3. 为豆包、Copilot 找可发布版本，单独寻找 Meta Llama。
4. 每项通过“已有角色、AI 对应准确、原始出处、作品级使用条件、原图校验、三语说明”检查后，生成等比规范化图片与附来源的素材包。

候选选择见 [baselines.json](../content/baselines.json)；跨项目核对记录见 [ai-video-2026-09-28.json](../content/research/ai-video-2026-09-28.json)。状态由实际入库文件推导，不能手工把只有链接的条目标为已完成。
