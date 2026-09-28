# AI Moe Atlas

[中文](README.md) · [English](README.en.md) · [日本語](README.ja.md)

A source-first archive of existing AI mascots, personifications, chibi characters, and reusable assets. Original creators, publications, and processing history stay attached.

**Collect, trace, obtain higher-resolution originals, normalize, and package. Do not invent characters, lore, expressions, or poses for this project.**

[English atlas](https://selinlee.github.io/ai-moe-atlas/en/) · [Assets](https://selinlee.github.io/ai-moe-atlas/en/assets/) · [Local studio](https://selinlee.github.io/ai-moe-atlas/en/studio/) · [Collection workflow](https://selinlee.github.io/ai-moe-atlas/en/collection/)

## First release

- Chinese, English, and Japanese UI and entries; 26 source entries and 12 indexed AI products/families.
- 13 downloadable collections, 19 byte-preserved source images, and 76 normalized outputs. Other entries are source links only.
- Packs include originals, 512 px PNG/WebP, 256 px avatars, 1024 px resampled files, provenance, and terms.
- Browser-local padding, dimensions, background, aspect ratio, and format tools. Exports include an image, original, and provenance ZIP. Images are never uploaded.
- Bilibili and GitHub discovery commands write an unreviewed queue, never publish automatically.

Collected from 上善无形’s Bilibili post, Small-tailqwq/dsh-deep-whale and [ZipZipPipe’s Pixiv collection](https://www.pixiv.net/artworks/148186519). The original three packs retain **CC BY-NC-SA 4.0**. The ten new GPT, Gemini, Claude, Kimi, Qwen, GLM, Grok, Doubao, Llama and MiniMax packs use the creator’s **attribution and non-commercial** terms; they are not relabeled with DeepSeek’s CC license. The code MIT license excludes third-party artwork.

## Run

Node.js 22.12+ (24 recommended) and npm are required.

```sh
npm ci
npm run dev
# http://localhost:4321/ai-moe-atlas/en/
npm test
npm run build
```

## Collect and normalize

```sh
npm run discover -- --platform bilibili --query '蓝色大肥鱼' --limit 20
npm run discover -- --platform github --query 'AI mascot' --limit 20
# Review sources and artwork permissions in content/sources/*.json first
npm run collect
npm run assets
npm run validate
```

Bilibili discovery uses an isolated installed Google Chrome session. Add `--visible` if interactive verification is required. Personal browser profiles are never used. GitHub search requires authenticated `gh`.

**1024 px files are resampled outputs, not recovered detail.** Prefer the creator’s higher-resolution original. This release does not integrate neural super-resolution, generative restoration, or automatic background removal. Full original composition is retained.

## Maintain

- [Contribution guide](docs/CONTRIBUTING.en.md)
- [Collection manual](docs/COLLECTION.en.md)
- [Artwork terms](RIGHTS.md)
- [Source records](content/sources/) and [Bilibili leads](content/leads.json)
- [Project constraints](AGENTS.md)

`content/characters.json` stores trilingual entries. `public/collected/` contains original bytes, evidence, and normalized files; `public/packs/` holds downloadable archives. Originals are immutable. GitHub files are pinned to commits; derivatives reference their parent SHA-256.

Pushes to main validate, test, build, and deploy through GitHub Actions. Pull requests only build. With a local server running, run `npm run test:browser` to exercise the site in installed Chrome.

## Scope

An indexed source is not automatically a downloadable asset. Nine AI designs from a Bilibili video series are indexed; creator-published originals and terms for GPT, Gemini, Claude, Kimi, Qwen, GLM, Grok, Doubao, Llama and MiniMax have now been collected. Animated-pet adaptation, video frame extraction, automatic cutouts, and AI super-resolution are outside this release. Never invent artwork to fill gaps.

[Baseline coverage and cross-project reuse review](docs/BASELINES.en.md)
