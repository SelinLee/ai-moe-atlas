// Discovery records stay outside the published artwork and export pipelines.
const date = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value));
const timestamp = value => typeof value === 'string' && !Number.isNaN(Date.parse(value)) && value.includes('T');
const text = value => typeof value === 'string' && !!value.trim();
const https = value => { try { const url = new URL(value); return url.protocol === 'https:' && !url.username && !url.password; } catch { return false; } };
const localized = value => ['zh', 'en', 'ja'].every(lang => text(value?.[lang]));
const productEntities = { ChatGPT:'chatgpt', Claude:'claude', 'Claude Desktop':'claude', 'Claude Code':'claude', Gemini:'gemini', Grok:'grok', 'Microsoft Copilot':'copilot' };

function assertVerification(source) {
  const v = source.verification?.current;
  if (!timestamp(v?.attemptedAt) || !text(v.method) || !https(v.finalUrl) || !Number.isInteger(v.httpStatus) || !localized(v.limitations)) throw new Error('Missing candidate verification provenance');
  if (v.result === 'verified-metadata') {
    if (!timestamp(v.verifiedAt) || v.verifiedAt !== v.attemptedAt || v.httpStatus !== 200 || v.finalUrl !== source.url) throw new Error('Candidate metadata verification requires a successful original page');
  } else if (['redirected', 'blocked', 'partial-render'].includes(v.result)) {
    if (v.verifiedAt !== null) throw new Error('Unavailable candidate source cannot claim current verification');
  } else throw new Error('Unknown candidate verification result');
  const historical = source.verification.historical;
  if (historical && (!historical.dateRange?.every(date) || historical.dateRange.length !== 2 || historical.dateRange[0] > historical.dateRange[1] || !text(historical.basis))) throw new Error('Invalid historical verification range');
}

export function assertCandidateReport(report, { entities, characters = [], sources = [], reviews = [] }) {
  if (report.schemaVersion !== 1 || report.automaticPublication !== false || !text(report.platform) || !text(report.query) || !timestamp(report.searchedAt) || !Array.isArray(report.candidates)) throw new Error('Invalid discovery report');
  if (report.metadataVersion !== undefined && report.metadataVersion !== 1) throw new Error('Unknown candidate metadata version');
  const ids = new Set(), urls = new Set();
  const addURL = url => { if (!https(url) || urls.has(url)) throw new Error('Duplicate or invalid candidate source URL'); urls.add(url); };
  for (const c of report.candidates) {
    if (!text(c.title) || (!text(c.publisher) && c.publisher !== null) || !['unreviewed', 'pending-review'].includes(c.status) || c.permissions !== 'unknown') throw new Error('Candidate requires source metadata and unconfirmed permissions');
    addURL(c.url);
    // Keep compatibility with the existing discovery script's minimal records.
    if (report.metadataVersion !== 1 && c.status === 'unreviewed') continue;
    if (report.metadataVersion !== 1 || report.reviewScope !== 'source-metadata-only' || !localized(report.datePolicy)) throw new Error('Rich candidates need an explicit metadata-only review scope');
    if (!/^[a-z0-9-]+$/.test(c.id ?? '') || ids.has(c.id)) throw new Error('Duplicate or invalid candidate ID');
    ids.add(c.id);
    if (c.status !== 'pending-review' || c.usage !== 'source-only' || c.downloadable !== false || c.preview !== null || !Array.isArray(c.assets) || c.assets.length || c.studioExport !== false || ['files', 'imageUrl', 'thumbnail', 'packUrl'].some(key => key in c)) throw new Error('Unknown-rights candidate must remain source-only without assets or exports');
    if (!date(c.publicationDate) || !['visible-page-date', 'historical-user-provided'].includes(c.publicationDateBasis) || c.publicationTimeZone !== null || (c.observedDatetime !== null && !timestamp(c.observedDatetime))) throw new Error('Invalid candidate publication date provenance');
    if (!text(c.publisher) || !text(c.publisherDisplayName) || c.originalCreator !== null || !c.attribution?.length || !c.attribution.every(a => text(a.name) && a.role === 'publisher' && https(a.url))) throw new Error('Keep publisher attribution separate from unverified artwork authorship');
    if (!localized(c.note) || !localized(c.reviewReasons) || !localized(c.license?.note) || c.license.status !== 'unknown' || c.license.evidenceUrl !== null) throw new Error('Candidate needs localized pending reasons and unknown license evidence');
    if (!['source-group', 'generator-variants', 'cross-brand-matrix'].includes(c.grouping) || (c.characterCount !== null && (!Number.isInteger(c.characterCount) || c.characterCount < 1))) throw new Error('Invalid source grouping');
    if (!Array.isArray(c.relatedSources) || !Array.isArray(c.generatorVariants) || !c.products?.length) throw new Error('Missing source group relationships');
    assertVerification(c);
    const sourceURLs = [c.url];
    for (const source of c.relatedSources) {
      addURL(source.url); sourceURLs.push(source.url);
      if (!text(source.title) || !text(source.publisher) || !['generator-variant', 'official-corroboration'].includes(source.role) || (source.publicationDate !== null && !date(source.publicationDate)) || source.publicationTimeZone !== null || (source.observedDatetime !== null && !timestamp(source.observedDatetime))) throw new Error('Invalid related candidate source');
      assertVerification(source);
    }
    if (!Array.isArray(c.license.checkedUrls) || c.license.checkedUrls.length !== sourceURLs.length || new Set(c.license.checkedUrls).size !== sourceURLs.length || !sourceURLs.every(url => c.license.checkedUrls.includes(url))) throw new Error('Candidate license check must cover the source group');
    for (const product of c.products) {
      if (!text(product.product) || !Array.isArray(product.characterNames) || !product.characterNames.every(text) || typeof product.official !== 'boolean') throw new Error('Invalid candidate product metadata');
      if (product.entityId !== null && !entities.some(e => e.id === product.entityId)) throw new Error('Candidate cannot add an unknown entity or baseline');
      if (product.product in productEntities && product.entityId !== productEntities[product.product]) throw new Error('Candidate product belongs to a different AI family');
      if (['Copilot', 'GitHub Copilot', 'Perplexity', 'Genspark'].includes(product.product) && product.entityId !== null) throw new Error('Unresolved or absent product must not be assigned to an existing entity');
      if (product.product === 'Copilot' && product.provider !== null) throw new Error('Ambiguous Copilot provider must remain unresolved');
      if (product.entityId !== null && product.provider !== entities.find(e => e.id === product.entityId).provider) throw new Error('Candidate provider mismatch');
      if (product.official && !sourceURLs.includes(product.identityEvidenceUrl)) throw new Error('Official identity requires a linked source, not an image license');
    }
    if (!c.generatorVariants.every(v => text(v.generator) && sourceURLs.includes(v.sourceUrl))) throw new Error('Generator variants must reference their source group');
    if ([...characters, ...sources].some(record => record.id === c.id || sourceURLs.includes(record.source) || sourceURLs.includes(record.originalPublication) || sourceURLs.includes(record.pageUrl)) || reviews.some(r => r.characterId === c.id)) throw new Error('Pending candidate leaked into the published artwork pipeline');
  }
  return report.candidates.length;
}
