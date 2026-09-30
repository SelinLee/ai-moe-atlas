import { repo } from './repo.mjs';
import { purposes } from './usage-policy.mjs';

// GitHub issue forms only accept a small set of field types, so the browser
// composes a prefilled query string instead of inventing unlisted fields.
// Values are always user-typed text; nothing is derived from private state.
export const issueURL = (template, fields) =>
  `${repo}/issues/new?template=${template}.yml&${new URLSearchParams(Object.entries(fields).filter(([, v]) => v.trim()))}`;

// Templates and the fields each form owns; unknown keys are dropped so a stale
// link can never inject extra issue content.
export const forms = {
  lead: { template: 'source', fields: ['ai', 'source', 'creator', 'chain', 'rights', 'notes'], required: ['source', 'ai'] },
  correction: { template: 'correction', fields: ['entry', 'details'], required: ['entry', 'details'] },
  rights: { template: 'rights', fields: ['entry', 'role', 'scope', 'decision', 'evidence', 'contact'], required: ['entry', 'role', 'decision', 'evidence'] },
};

export const collectFields = (form, values) => {
  const { fields } = forms[form];
  return Object.fromEntries(fields.filter(f => (values[f] ?? '').trim()).map(f => [f, values[f].trim()]));
};

export const usePurposes = purposes;
