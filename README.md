# AI 萌化百科 · AI Moe Atlas

[中文](README.md) · [English](README.en.md) · [日本語](README.ja.md)

收集网络上已有的 AI 虚拟形象、拟人角色与 Q 版素材，保留原作者、原始发布页和完整加工记录。

**只做收集、溯源、高清原图获取、规范化与素材化。不为本项目创造角色、补写设定、生成新表情或姿态。**

[中文图鉴](https://selinlee.github.io/ai-moe-atlas/zh/) · [素材库](https://selinlee.github.io/ai-moe-atlas/zh/assets/) · [本地素材工坊](https://selinlee.github.io/ai-moe-atlas/zh/studio/) · [采集流程](https://selinlee.github.io/ai-moe-atlas/zh/collection/)

## 第一版

- 中文、英文、日文界面与词条；24 个来源条目，12 个 AI 产品/系列索引。
- 3 组可下载素材、9 张保留原始字节的原图、36 个规范化输出。其余条目只索引，未镜像原图。
- 原图、512 px PNG/WebP、256 px 头像、1024 px 插值版、来源清单和使用条件一起打包。
- 本地工坊支持留白、尺寸、背景、比例和格式调整，导出图片 + 原图 + 来源记录 ZIP。图片不上传。
- B 站与 GitHub 线索采集命令；搜索结果进入待核验清单，不自动发布。

素材主要来自上善无形的 B 站原始动态与 Small-tailqwq/dsh-deep-whale 的现有图片。下载素材采用各自原有许可，当前三个包均为 **CC BY-NC-SA 4.0，仅限非商业用途**。仓库代码的 MIT 许可不覆盖第三方图片。

## 运行

需要 Node.js 22.12+（推荐 24）和 npm。

```sh
npm ci
npm run dev
# http://localhost:4321/ai-moe-atlas/zh/
npm test
npm run build
```

## 收集与加工

```sh
# 使用独立的本机 Google Chrome 会话搜索 B 站，需安装 Chrome
npm run discover -- --platform bilibili --query '蓝色大肥鱼' --limit 20
# 页面要求验证时可以加 --visible；不使用个人浏览器资料
npm run discover -- --platform github --query 'AI mascot' --limit 20
# 人工核验后维护 content/sources/*.json，再采集原图
npm run collect
# 仅对已核验的原图执行确定性的本地规范化处理
npm run assets
npm run validate
```

GitHub 搜索需要已登录的 `gh`。首次安装 Playwright 只用于控制本机 Chrome，无需安装 Chromium。

**1024 px 版是插值或缩放输出，不代表恢复了真实细节。** 优先寻找作者高清原图；当前未集成神经网络超分辨率或生成式修复，也不默认抠除背景。所有导出保留整张原图的内容。

## 资料与维护

- [投稿指南](CONTRIBUTING.md)
- [采集操作手册](docs/COLLECTION.zh.md)
- [素材使用条件](RIGHTS.md)
- [来源记录](content/sources/)、[B 站研究线索](content/leads.json)
- [项目约束](AGENTS.md)

`content/characters.json` 是三语角色资料；`public/collected/` 保存原图、来源证据和规范化结果；`public/packs/` 保存下载包。原图不可覆盖，GitHub 素材固定到具体提交，派生文件通过 SHA-256 指向父原图。

推送 main 后，GitHub Actions 验证资料与来源关系、运行测试并发布 GitHub Pages。PR 仅构建，不发布。浏览器测试：先启动本地服务，再执行 `npm run test:browser`。

## 已知范围

来源条目并不等于可下载素材。B 站九款 AI 的视频系列已建立索引，独立原图与各自使用条件仍需逐项核验。桌宠动画适配、视频提帧、自动抠图与 AI 超分不包含在本版中。禁止为凑数量而新造形象。

[每个 AI 的保底形象与跨项目复用核对](docs/BASELINES.zh.md)
