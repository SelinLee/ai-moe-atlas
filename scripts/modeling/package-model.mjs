/** Refresh the shipped poster and byte-integrity manifest after a reviewed rebuild. */
import fs from 'node:fs';
import crypto from 'node:crypto';
import sharp from 'sharp';
const file='content/models/deep-whale-maid.json';
const model=JSON.parse(fs.readFileSync(file,'utf8'));
const directory='public/models/deep-whale-maid/v0.1.0';
const bytes=fs.readFileSync(`public/${model.src}`);
await sharp(`${directory}/poster.png`).webp({quality:88}).toFile(`${directory}/poster.webp`);
model.fileBytes=bytes.length;model.sha256=crypto.createHash('sha256').update(bytes).digest('hex');
model.poster='models/deep-whale-maid/v0.1.0/poster.webp';
for(const destination of [file,`${directory}/manifest.json`])fs.writeFileSync(destination,JSON.stringify(model,null,2)+'\n');
console.log(`Packaged ${model.id} ${model.version}: ${model.fileBytes} bytes; ${model.sha256}`);
