import type { APIRoute } from 'astro';
import { locales, type Locale } from '../../../lib/i18n';
import { directoryIndex } from '../../../lib/directory';
export function getStaticPaths() { return locales.map(lang => ({params: {lang}})); }
export const GET: APIRoute = ({params}) => Response.json(directoryIndex(params.lang as Locale));
