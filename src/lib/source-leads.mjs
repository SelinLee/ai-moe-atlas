export function unlistedSourceLeads(records, leads) {
  const urls = new Set(records.filter(record => record.category === 'sources').map(record => record.url));
  return leads.filter(lead => !urls.has(lead.url));
}
