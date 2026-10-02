import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { characters } from './data';
import { modelIssues } from './model-policy.mjs';
import { modelFileIssues, modelManifestPath } from './model-integrity.mjs';
export type Localized = { zh: string; en: string; ja: string };
export type CharacterModel = {
  id: string; characterId: string; version: string; status: 'ready' | 'preview';
  src: string; poster: string; title: Localized; description: Localized;
  license: string; licenseUrl: string; sourceUrl: string; rightsReviewed: true;
  attribution: { name: string; url: string; role: string | Localized }[];
  changes: Localized; reviewedAt: string; fileBytes: number; sha256: string; notice?: string; publicManifest?: string;
};
const directory = resolve('content/models');
// Optional collection: an absent model manifest never becomes a pretend preview.
export const characterModels: CharacterModel[] = existsSync(directory) ? readdirSync(directory).filter(file => file.endsWith('.json')).flatMap(file => {
  let model: CharacterModel;
  try { model = JSON.parse(readFileSync(resolve(directory, file), 'utf8')); }
  catch { console.warn(`[3D] Ignoring unreadable manifest: ${file}`); return []; }
  const issues = modelIssues(model);
  if (!characters.some(character => character.id === model.characterId)) issues.push('unknown character');
  if (!issues.length) {
    issues.push(...modelFileIssues(model));
  }
  if (issues.length) { console.warn(`[3D] Unpublished ${file}: ${issues.join(', ')}`); return []; }
  const publicManifest = modelManifestPath(model);
  if (existsSync(resolve('public', publicManifest))) model.publicManifest = publicManifest;
  return [model];
}) : [];
export const characterModel = (characterId: string) => characterModels.find(model => model.characterId === characterId);
