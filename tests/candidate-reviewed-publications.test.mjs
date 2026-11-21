import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { assertCandidateReport } from '../scripts/lib/candidates.mjs';
import { allowsUse, purposes } from '../src/lib/usage-policy.mjs';
const json = async path => JSON.parse(await readFile(new URL(`../${path}`, import.meta.url), 'utf8'));
const report = await json('content/candidates/manual-2026-10-11.json');
const context = {
  entities: await json('content/entities.json'), characters: await json('content/characters.json'),
  reviews: await json('content/reviews/artwork-uses.json'),
  sources: await Promise.all((await readdir(new URL('../content/sources/', import.meta.url))).filter(f => f.endsWith('.json')).map(f => json(`content/sources/${f}`)))
};
const group = report => report.candidates.find(c => c.id === 'github-ai-school-op-cast');
const invalid = mutate => {
  const copy = structuredClone(report), scope = structuredClone(context);
  mutate(group(copy), scope);
  assert.throws(() => assertCandidateReport(copy, scope));
};

test('an independently reviewed group member leaves the remaining group source-only', () => {
  assert.equal(assertCandidateReport(report, context), 12);
  const c = group(report);
  for (const purpose of purposes) assert.equal(allowsUse(context.reviews, c.id, purpose), false);
  assert.equal(c.license.status, 'unknown');
  for (const key of ['downloadable', 'studioExport']) invalid(c => { c[key] = true; });
  invalid(c => { delete c.reviewedPublications; });
});

test('group-page reuse requires the exact independent artwork and review evidence', () => {
  invalid(c => { c.reviewedPublications = []; });
  invalid(c => { c.reviewedPublications.push(c.reviewedPublications[0]); });
  invalid(c => { c.reviewedPublications[0].characterId = 'zipzippipe-chatgpt'; });
  invalid(c => { c.reviewedPublications[0].originalPublication = c.url; });
  invalid(c => { c.reviewedPublications[0].originalPublication = 'https://example.com/other.png'; });
  invalid((c, scope) => { scope.sources = scope.sources.filter(s => s.id !== 'school-op-copilot'); });
  invalid((c, scope) => { scope.sources.find(s => s.id === 'school-op-copilot').rights.scope = 'software'; });
  invalid((c, scope) => { scope.reviews.find(r => r.characterId === 'school-op-copilot').evidence = []; });
  invalid((c, scope) => { scope.reviews.find(r => r.characterId === 'school-op-copilot').artworks = []; });
});

test('reviewed group members cannot exempt candidate IDs or other leaked sources', () => {
  invalid(c => { c.reviewedPublications[0].characterId = c.id; });
  invalid((c, scope) => { scope.characters.push({ id: c.id }); });
  invalid((c, scope) => { scope.reviews.push({ characterId: c.id }); });
  invalid((c, scope) => { scope.characters.push({ id: 'unreviewed-copy', source: c.url }); });
  invalid((c, scope) => { scope.characters.find(r => r.id === 'school-op-copilot').originalPublication = c.url; });
});
