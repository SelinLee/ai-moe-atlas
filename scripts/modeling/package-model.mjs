/** Refresh the shipped poster and byte-integrity manifest after a reviewed rebuild. */
import fs from 'node:fs';
import crypto from 'node:crypto';
import sharp from 'sharp';
import path from 'node:path';
const sha256=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const file='content/models/deep-whale-maid.json';
const model=JSON.parse(fs.readFileSync(file,'utf8'));
const modelDirectory=path.posix.dirname(model.src);
const directory=path.join('public',modelDirectory);
const bytes=fs.readFileSync(`public/${model.src}`);
await sharp(`${directory}/poster.png`).webp({quality:88}).toFile(`${directory}/poster.webp`);
model.fileBytes=bytes.length;model.sha256=sha256(bytes);
model.poster=`${modelDirectory}/poster.webp`;
model.posterSha256=sha256(fs.readFileSync(path.join('public',model.poster)));
if(typeof model.buildScript==='string'&&fs.existsSync(model.buildScript)){
  model.buildScriptSha256=sha256(fs.readFileSync(model.buildScript));
}
// The .blend file is packaged separately; do not guess a review/source path or rewrite its hash.
for(const destination of [file,`${directory}/manifest.json`])fs.writeFileSync(destination,JSON.stringify(model,null,2)+'\n');
console.log(`Packaged ${model.id} ${model.version}: ${model.fileBytes} bytes; ${model.sha256}`);
