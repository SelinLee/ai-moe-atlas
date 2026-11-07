export const byPublicationDate = (a, b) => (b.publicationDate ?? '').localeCompare(a.publicationDate ?? '')
  || a.id.localeCompare(b.id);

export const byCumulativeLikes = (a, b) => (b.likes?.count ?? -1) - (a.likes?.count ?? -1)
  || byPublicationDate(a, b);

export const likesObservedDate = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit',
});
