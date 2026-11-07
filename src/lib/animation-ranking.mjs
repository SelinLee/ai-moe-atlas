const comparePublicationDays = (a, b) => (b.publicationDate ?? '').localeCompare(a.publicationDate ?? '');

export const byPublicationDate = (a, b) => comparePublicationDays(a, b) || a.id.localeCompare(b.id);

export const byPublicationTime = (a, b) => comparePublicationDays(a, b)
  || (b.publishedAt ?? '').localeCompare(a.publishedAt ?? '')
  || a.id.localeCompare(b.id);

export const byCumulativeLikes = (a, b) => (b.likes?.count ?? -1) - (a.likes?.count ?? -1)
  || byPublicationDate(a, b);

export const likesObservedDate = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit',
});

export const publicationTime = new Intl.DateTimeFormat('sv-SE', {
  timeZone: 'Asia/Shanghai', dateStyle: 'short', timeStyle: 'medium', hourCycle: 'h23',
});
