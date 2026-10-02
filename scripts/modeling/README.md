# Character model reconstruction

## Current local deliverable: refined full-body v0.3.0

The selected C face has larger, rounder eyes, softer brows and a small omega smile. It retains the refined layered hair, thinner cloth edges and fuller whale tail. Its editable Blender source has 181 named mesh parts. As with v0.2, legs, footwear, tail depth and unseen views are inferred; no rig or animation is included. Public deployment status is separate from this local deliverable.

Run `blender --background --python scripts/modeling/build-whale-maid-refined.py -- --render-views`, review the exported mesh and all views, then run `node scripts/modeling/package-model.mjs`. Set `ATLAS_MODEL_REVIEW_DIR` to choose the local source/render directory. The script-free email pack contains the GLB, editable Blend and license documents; keep executable build scripts in a separate developer pack or this repository.

全身细修 v0.3.0：选定 C 版圆眼脸部，保留细修发束、服装边缘和加粗鲸尾。181 个分件可在 Blender 编辑；腿部、鞋袜与未展示的视角为推断，无绑定或动画。

全身細部改良 v0.3.0：C の丸い目の顔を採用し、改良した髪・服の縁・太い尾を維持。Blender で181部品を編集可能。脚・靴や見えない角度は推測で、リグとアニメーションは未実装です。

## Full-body v0.2.0

A static full-body interpretation with two separately modeled stockinged legs, Mary Jane shoes, a hands-on-hips maid costume, and a continuous whale tail with paired flukes. The approved v0.1 face is retained. The cropped reference does not establish the lower legs or footwear; these and unseen side/back volumes are explicitly inferred. There is no rig, facial morph system, physics or animation.

Run `blender --background --python scripts/modeling/build-whale-maid-fullbody.py -- --render-views`, then `node scripts/modeling/package-model.mjs`. Review all views and the exact exported GLB before changing the current model manifest. Existing published version directories are immutable; create a new version for future changes. v0.1 files remain available byte-for-byte.

全身 v0.2.0：双腿、长袜、玛丽珍鞋、叉腰女仆裙装与连续鲸尾。保留已确认的脸部；裁切外的腿、鞋及侧后方是推断设计，无绑定、表情系统、物理或动画。

全身 v0.2.0：両脚、ストッキング、メリージェーン靴、腰に手を当てたメイド服、連続したクジラの尾。顔は v0.1 を維持。写っていない脚・靴・側背面は推測で、リグ・表情システム・物理・アニメーションは未実装です。

## Deep Whale Maid v0.1.0

This is an **AI-assisted procedural stylized bust prototype**, adapted from the
licensed `delighted` portrait. It is not an official model, a full-body avatar,
or a conversion of an existing MMD/Warudo release. Side/back volumes are inferred.
No rig, animation, or expression blendshapes are included.

The mesh, poster and other derivative renderings are **CC BY-NC-SA 4.0** with the
full attribution chain. The website's MIT license does not cover them. Read
`public/models/deep-whale-maid/v0.1.0/NOTICE.txt`, `UPSTREAM-NOTICE.txt` and
`LICENSE-ARTWORK.txt` before reuse. Keep those files with redistributed assets.

### Rebuild

Requires Blender 4.3.2 or compatible. No external add-ons, textures or AI-service
credentials are needed. Original source bytes are never changed.

```sh
blender --background --python scripts/modeling/build-whale-maid.py -- --render-views
```

Outputs a self-contained GLB under `public/models/deep-whale-maid/v0.1.0/` and
source `.blend` / front, side, back and three-quarter renders under
`artifacts/models/deep-whale-maid/` (ignored). Set `ATLAS_MODEL_REVIEW_DIR` to
choose another local review directory. A GUI Blender session may run the same
script to inspect and record a procedural build.

Run `node scripts/modeling/package-model.mjs` to WebP-encode the three-quarter poster and update the GLB
`fileBytes` and `sha256` in both model manifests after rebuilding; poster/asset
hash checks deliberately fail if only one copy is changed. Source references,
license evidence and unseen-view limitations must remain present.

### Quality checks

- Compare actual source pixels, not just their description
- Inspect front, side and back for gaps, intersections and silhouette
- Export coherent normals, material-group primitives, no unused UVs or external assets
- Validate GLB with Khronos glTF Validator
- Re-import the GLB and render to check exported materials and face details
- Run `npm test` and `npm run build`
- Run `npm run test:model` against a permitted local/deployed URL (use
  `ATLAS_TEST_URL` and `CHROME_PATH` as needed)

This first version is deliberately marked `preview`. A later full-body/rigged
version needs a new reviewed source/asset manifest and its own visual checks.

## 中文

这是根据已授权正面插画重建的 AI 辅助风格化静态胸像，不是官方或全身模型。
侧后方为推断，无骨骼绑定或动画。网格与渲染图继承 CC BY-NC-SA 4.0，须保留
完整署名链、注明修改、非商用且以相同许可共享。网站代码的 MIT 不适用于素材。

## 日本語

許諾済み正面イラストをもとにした AI 支援のデフォルメ静止バスト試作です。
公式・全身モデルではなく、側面と背面は推測です。リグやアニメーションは未実装。
メッシュとレンダリング画像は CC BY-NC-SA 4.0 を継承します。作者表示・変更の明示・
非営利・同一条件での共有が必要です。サイトコードの MIT は素材には適用されません。
