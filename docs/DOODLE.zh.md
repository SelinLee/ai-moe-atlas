# 日系粗糙数字涂鸦 · 提示词模板

[中文](DOODLE.zh.md) · [English](DOODLE.en.md) · [日本語](DOODLE.ja.md)

2026-11-03 · 七位现有角色的生成派生展示图，统一为 1254 × 1254 白底半身像。使用内置 image_gen，以当前 Q 版三视图中的正面形象为身份参考。

## 可复制模板

上传角色参考图，复制下面整段提示词，并将末尾的 {{占位符}} 替换为角色的具体特征。异色瞳、侧编发、帽子等须写清画面左右。

```text
Use case: style-transfer.
输入图片是角色身份参考，不是要沿用的画风。只画其中正面角色的一张半身像，禁止复刻三视图或多个角色。

将参考图片中的角色转换为日系粗糙数字涂鸦风格。

整体画风：
一张极其随意、粗糙、稚拙的日系萌系动漫人物数字涂鸦，仿佛使用普通绘画软件中的粗糙蜡笔、马克笔快速绘制完成。保留原角色的辨识度、发型、发色、五官特征、服装、配饰和标志性表情。

线稿：
* 使用明显的黑色粗糙笔触勾勒人物。
* 线条粗细极不均匀，部分突然加粗，部分断开。
* 轮廓松散、不准确、略微歪斜。
* 线条具有明显的手绘颗粒感和涂抹感。
* 不追求精准描边，允许线条错位、重叠和不完整。
* 禁止精细流畅的矢量线稿。

上色：
* 使用大面积不透明的简单平涂。
* 颜色略微溢出轮廓，允许漏涂和白色空隙。
* 阴影使用少量粗糙的灰色或同色系深色笔触。
* 高光使用随意涂抹的白色短笔触。
* 保留蜡笔、粉彩和马克笔混合的粗糙质感。
* 不使用复杂渐变、精细光影和丰富色彩层次。

人物五官：
* 保留原角色的眼睛颜色、眼型和标志性神态。
* 五官适当简化，眼睛使用粗黑线条和简单色块表现。
* 嘴巴尽量简洁，鼻子可以省略。
* 面部可以添加少量随意的粉色腮红笔触。
* 表情保留原角色特点，不要擅自改变性格气质。

头发与服装：
* 完整保留原角色最具辨识度的发型和发色。
* 头发由几块大面积色块构成，不绘制大量细碎发丝。
* 服装保留原有颜色、轮廓和标志性配饰。
* 衣服褶皱和装饰高度简化。
* 不要擅自更换服装或增加原图不存在的配饰。

构图：
* 1:1 正方形画布。
* 角色半身像，头部比例略大。
* 人物居中，保留自然的白色留白。
* 纯白背景，不添加文字、复杂场景或装饰边框。

最重要的风格限制：
画面必须粗糙、潦草、简单、稚拙，像随手画出来的可爱动漫涂鸦，而不是精致插画刻意模仿草稿。

禁止自动精修，禁止精细线稿，禁止复杂头发结构，禁止细腻渐变，禁止3D效果，禁止过度光影，禁止增加复杂服装细节。

最终效果：低完成度、粗黑轮廓、大色块平涂、随意白色高光、明显蜡笔颗粒感的日系动漫数字涂鸦。

执行补充：正方形纯白画布，唯一角色，画到腰部附近，头部略大，角、耳、帽饰等完整留在画布内。减少笔画数量，而不只是给精致插画叠加噪点：头发只用几整块，衣服装饰只保留识别所需的粗略几笔。必须明显幼拙、松散、有歪斜的真涂鸦感。头发原有双色关系用分区平涂表示，不画细腻渐变。不要标题、签名、水印或散落文字。

角色身份锁定，以参考图为准
角色 {{角色名称}}
发型与发色 {{发型、发色、分区颜色}}
眼睛与表情 {{眼睛颜色、异色瞳左右、标志性表情}}
服装与配饰 {{原有服装配色、关键配饰及画面左右}}
必须保留的识别点 {{三至五项身份特征}}
```

## 本轮成图与实际提示词

上方是可复用模板。下表中的 TXT 是这次生成时实际提交的中文提示词，包含逐角色身份补充。英文和日文模板为对应翻译。

| 角色 | 完整 PNG | 实际提示词 | 本轮参考图 | 许可记录 |
| --- | --- | --- | --- | --- |
| GPT | [查看图片](../public/generated/rough-doodle-v1/openai/doodle-v1.png) | [TXT](../public/generated/rough-doodle-v1/openai/prompt.txt) | [固定版本](https://github.com/SelinLee/ai-moe-atlas/blob/a3b0e05ddfb54d91961ee7f3c8ad57578a5332e1/public/generated/super-chibi-v1/openai/turnaround-v1.png) | 改编许可未确认 |
| Gemini | [查看图片](../public/generated/rough-doodle-v1/gemini/doodle-v1.png) | [TXT](../public/generated/rough-doodle-v1/gemini/prompt.txt) | [固定版本](https://github.com/SelinLee/ai-moe-atlas/blob/a3b0e05ddfb54d91961ee7f3c8ad57578a5332e1/public/generated/super-chibi-v1/gemini/turnaround-v2.png) | 改编许可未确认 |
| Claude | [查看图片](../public/generated/rough-doodle-v1/claude/doodle-v1.png) | [TXT](../public/generated/rough-doodle-v1/claude/prompt.txt) | [固定版本](https://github.com/SelinLee/ai-moe-atlas/blob/a3b0e05ddfb54d91961ee7f3c8ad57578a5332e1/public/generated/super-chibi-v1/claude/turnaround-v1.png) | 改编许可未确认 |
| DeepSeek | [查看图片](../public/generated/rough-doodle-v1/deepseek/doodle-v1.png) | [TXT](../public/generated/rough-doodle-v1/deepseek/prompt.txt) | [固定版本](https://github.com/SelinLee/ai-moe-atlas/blob/a3b0e05ddfb54d91961ee7f3c8ad57578a5332e1/public/generated/super-chibi-v1/deepseek/turnaround-v1.png) | CC-BY-NC-SA-4.0 |
| Kimi | [查看图片](../public/generated/rough-doodle-v1/kimi/doodle-v1.png) | [TXT](../public/generated/rough-doodle-v1/kimi/prompt.txt) | [固定版本](https://github.com/SelinLee/ai-moe-atlas/blob/a3b0e05ddfb54d91961ee7f3c8ad57578a5332e1/public/generated/super-chibi-v1/kimi/turnaround-v2.png) | 改编许可未确认 |
| Qwen 千问 | [查看图片](../public/generated/rough-doodle-v1/qwen/doodle-v1.png) | [TXT](../public/generated/rough-doodle-v1/qwen/prompt.txt) | [固定版本](https://github.com/SelinLee/ai-moe-atlas/blob/a3b0e05ddfb54d91961ee7f3c8ad57578a5332e1/public/generated/super-chibi-v1/qwen/turnaround-v2.png) | 改编许可未确认 |
| GLM | [查看图片](../public/generated/rough-doodle-v1/glm/doodle-v1.png) | [TXT](../public/generated/rough-doodle-v1/glm/prompt.txt) | [固定版本](https://github.com/SelinLee/ai-moe-atlas/blob/a3b0e05ddfb54d91961ee7f3c8ad57578a5332e1/public/generated/super-chibi-v1/glm/turnaround-v1.png) | 作者及许可待核实 |

## 署名、来源与使用条件

GPT、Gemini、Claude、Kimi、千问的社区设计出自 ZipZipPipe。DeepSeek 的署名链为上善无形 → ZipZipPipe。GLM 狐娘依据视频 BV1iDeQ6fEFi，原设计作者尚未确认。

DeepSeek 保留 CC BY-NC-SA 4.0 声明及署名、非商业、相同方式共享条件。其余五位 ZipZipPipe 角色的改编许可尚未确认，GLM 的作者与许可尚待核实。每张图的许可状态及证据路径见清单。七张图按维护者本次要求用于展示，展示请求不新增上游权利，下载素材包仍按各作品已有的用途核验记录提供。

本轮把精细线稿与多层光影改为粗黑笔触、大色块及蜡笔颗粒，保留原有配色、表情与主要配饰。Kimi 挂书上的 K、GLM 发饰上的 Z 按“无文字”要求省略。预览仅等比缩小和转换 WebP，PNG 保留生成时字节。

[作者图集](https://www.pixiv.net/artworks/148186519) · [DeepSeek 原角色来源](https://www.bilibili.com/opus/1231977657712771073)

[实际共用风格提示词](../public/generated/rough-doodle-v1/style-prompt.txt) · [文件、SHA-256 与处理记录](../public/generated/rough-doodle-v1/manifest.json)
