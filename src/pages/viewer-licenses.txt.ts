import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
// Ship the complete license notices with the locally bundled viewer, not just CDN links.
export function GET() {
  const packages = ['@google/model-viewer', '@monogrid/gainmap-js', 'three', 'lit', 'lit-element', 'lit-html', '@lit/reactive-element'];
  const notices = packages.map(name => {
    const directory = resolve('node_modules', name);
    const metadata = JSON.parse(readFileSync(resolve(directory, 'package.json'), 'utf8'));
    return `${name} ${metadata.version}\n${'='.repeat(72)}\n${readFileSync(resolve(directory, 'LICENSE'), 'utf8')}`;
  });
  return new Response(`AI Moe Atlas — 3D viewer third-party notices\n\nThese notices apply to the viewer code, not to the 3D models or artwork.\n查看器代码的开源声明，不适用于 3D 模型或角色图片。\nビューアーのコードに適用され、3D モデルや画像には適用されません。\n\n${notices.join('\n\n')}`, { headers: { 'Content-Type':'text/plain; charset=utf-8' } });
}
