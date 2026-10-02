Deep Whale Maid v0.2.0 / 鲸鱼娘全身模型 / クジラ娘全身モデル

English
A static stylized full-body interpretation. The approved v0.1 face is preserved.
Includes hands-on-hips maid clothing, two stockinged legs, Mary Jane shoes and a
continuous curved whale tail with broad flukes. The cropped reference does not
show the legs: lower-body clothing and shoes, side/back volumes and tail depth
are inferred additions, not canonical creator details.

Open the .blend in Blender 4.3.2 or later to inspect and edit the mesh.
Import deep-whale-maid.glb using a glTF 2.0-capable 3D application or web viewer.
The GLB is self-contained; it has no external textures or decoder dependency.
No rig, skeleton, blendshapes, physics or animation is included.

Rebuild from the supplied procedural script, from the package root:
blender --background --python scripts/modeling/build-whale-maid-fullbody.py -- --render-views
The script writes the GLB under public/models/deep-whale-maid/v0.2.0 and review
renders/source under artifacts/models/deep-whale-maid/v0.2.0. Override the local
review directory with the ATLAS_MODEL_REVIEW_DIR environment variable if needed.

License: CC BY-NC-SA 4.0. Non-commercial use, full attribution and ShareAlike.
Read NOTICE.txt, UPSTREAM-NOTICE.txt and LICENSE-ARTWORK.txt before reuse.
The original reference image is not included. This is an AI-assisted derivative,
not an official creator model or a conversion of an existing MMD/Warudo model.

中文
这是静态风格化全身衍生模型，保留 v0.1 已确认头部与表情；包含叉腰女仆服、
双腿与长袜、玛丽珍鞋，以及连续弯曲的宽鳍鲸尾。参考图没有展示腿部，所以下肢、
鞋袜、侧后方体积与鲸尾厚度为推断性补充，并非官方设定。
在 Blender 4.3.2 或更新版本中打开 .blend 即可查看与编辑；GLB 可导入支持 glTF 2.0
的软件或网页查看器。无外置纹理或解码依赖；不含骨骼、绑定、表情变形、物理或动画。
重建命令见上方。使用须遵守 CC BY-NC-SA 4.0：非商业、完整署名及相同方式共享。
请先阅读各 NOTICE / LICENSE 文件。未附原参考图，未使用现成 MMD/Warudo 模型。

日本語
v0.1 の承認済みの頭部・表情を維持した静止デフォルメ全身派生モデルです。
腰に手を当てたメイド服、両脚とストッキング、メリージェーン靴、幅広い尾びれを持つ
連続した湾曲尾を収録。参考画像に脚がないため、下半身、靴下・靴、側背面、尾の厚み
は推測による追加であり、公式設定ではありません。
Blender 4.3.2 以降で .blend を開いて編集できます。GLB は glTF 2.0 対応ソフトや
ブラウザビューアで利用可能で、外部テクスチャや追加デコーダーは不要です。
骨格、リグ、表情モーフ、物理、アニメーションは未実装。再生成コマンドは上記参照。
CC BY-NC-SA 4.0 の非営利・作者表示・同一条件での共有を守り、NOTICE / LICENSE を
ご確認ください。参考画像は同梱せず、既存 MMD/Warudo モデルは使用していません。
