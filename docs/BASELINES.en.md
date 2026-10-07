# One baseline character per AI

2026-10-08 update: the user explicitly selected all six generated ai-models-v5 reference sheets for homepage display. They now have a separate generated-reference archive with provenance and generation labels. The 2026-09-28 findings below are historical; creator originals and existing download packs remain separate. [Identity archive and sources](REFERENCES.en.md)

[中文](BASELINES.zh.md) · [日本語](BASELINES.ja.md)

Collect one existing, traceable image that can be displayed for each AI before expanding asset variants. A site default is not an official, exclusive or universally accepted design.

As of 2026-09-29: of 12 AI families, 11 have displayable, downloadable assets and 1 (Copilot) has source links only. Source links do not count as completed image coverage.

| AI | Priority version | Remaining work |
| --- | --- | --- |
| DeepSeek | Collected whale-maid assets | Ready; retain 上善无形 → ZipZipPipe → Small-tailqwq attribution |
| GPT, Gemini, Claude, Kimi, Qwen | ZipZipPipe’s own Pixiv collection | Five high-resolution originals and creator terms collected |
| GLM, Grok, MiniMax | ZipZipPipe’s own Pixiv collection | Three high-resolution originals and creator terms collected |
| Doubao | ZipZipPipe’s own Pixiv collection | High-resolution original collected; the OpenPet candidate stays link-only |
| Meta Llama | ZipZipPipe’s own Pixiv collection | Alpaca-character high-resolution original collected |
| Copilot | yamamemo candidate | Image usage terms; links only for now |

## Page-by-page mapping of the collection

All 17 images of “AI娘化” were reviewed; ten are collected: image 3 Claude, image 4 GPT, image 5 Gemini, image 6 Kimi, image 7 GLM, image 8 Grok, image 11 Doubao (Seed), image 13 Qwen, image 14 Llama and image 16 MiniMax. The set also holds two DeepSeek images plus four characters outside the Atlas index, among them Mistral, 文心一言 and one wearing an RWKV tag. Nothing was collected for those AIs.

Identification rests on marks inside the artwork (GLM’s “Z”, Grok’s X-shaped axe, Doubao’s SEED, Llama’s alpaca ears, tail and “∞”, and MiniMax’s conch and MINIMAX lettering), the nine-AI order the creator gives in the “大AI和小AI们” description, and public character write-ups on Zhihu and Baidu Tieba. Those write-ups are used only to cross-check page numbers, never as a permission basis.

## Reusing the ai_video research

Reviewed `characters/assets/ai-models-v5/README.md`, `registry.json`, generation records for six reference sheets, the GPT sheet, and corresponding screenshots in `projects/tech_report_v2-2026-09-28/work/raw/ai-cast-references/`.

- Reused: six AI mappings, observed visual features, video sources and attribution leads. Existing entries were enriched without duplicating characters.
- Kept locally: browser screenshots and SHA-256 records. Screenshots include player UI, subtitles and comments; they are not standalone creator originals and were not published as assets.
- Excluded from collected originals: all six `*-reference.png` sheets. The registry records image_gen production with standard and new chibi depictions. Comparison shows changed costume details, composition and poses, rather than only upscaling or normalization.

Screenshots of [各AI娘形象盘点](https://www.bilibili.com/video/BV14phK66Ejw/) corroborate GPT, Gemini, Claude, Kimi and Qwen and credit ZipZipPipe. [蓝色大肥鱼是怎么来的？](https://www.bilibili.com/video/BV1Brtc63EyW/) is a DeepSeek history lead. Saved text from [让你别找千问外包，没让你找克劳德啊！](https://www.bilibili.com/video/BV12yeU6KEUt/) also credits ZipZipPipe. Secondary publications do not establish artwork-specific permissions.

## Collection order

1. Completed: collect creator-published originals for GPT, Gemini, Claude, Kimi, Qwen, GLM, Grok, Doubao, Llama and MiniMax from Pixiv.
2. Find a Copilot original with display and redistribution permission; links only for now.
3. Leave the uncollected Mistral and 文心一言 designs alone — those AIs are not in `entities.json`, and the index is not padded for count.
4. Verify existing design, AI association, original publication, artwork-specific permissions, original hashes and three-language notes before making proportional normalized images and source-preserving packs.

Selections: [baselines.json](../content/baselines.json). Cross-project evidence record: [ai-video-2026-09-28.json](../content/research/ai-video-2026-09-28.json). Identity cross-check leads: [leads.json](../content/leads.json). Readiness is derived from collected assets, never manually assigned to a source-only entry.

## High-resolution originals found

[ZipZipPipe’s AI娘化](https://www.pixiv.net/artworks/148186519): Claude image 3, GPT image 4, Gemini image 5, Kimi image 6, GLM image 7, Grok image 8, Doubao image 11, Qwen image 13, Llama image 14 and MiniMax image 16. GLM and Kimi are 1152 × 2048; the other eight are 3072 × 5504. White-background JPEG originals, bytes, page numbers, publication date, creator terms and SHA-256 are preserved. Collection metadata marks the creator’s work as AI-assisted; Atlas did not redraw it.

The user authorized separately labeled fixed depictions generated from collected references if high-resolution originals cannot be found. All ten were found, so generation was unnecessary. The ai_video review above documents the earlier tracing step.
