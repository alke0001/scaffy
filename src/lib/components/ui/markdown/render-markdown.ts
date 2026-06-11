import DOMPurify from 'dompurify';
import { marked } from 'marked';

marked.setOptions({
	gfm: true,
	breaks: true,
});

/**
 * Parse Markdown and sanitize HTML for {@html} in client components.
 * Client-only: imports DOMPurify (browser). Do not call from server routes.
 */
export function renderMarkdown(source: string): string {
	if (!source) return '';

	const raw = marked.parse(source, { async: false });
	if (typeof raw !== 'string') return '';

	const withScrollablePre = raw.replaceAll('<pre>', '<pre class="native-scroll-x">');
	const withScrollableTable = withScrollablePre
		.replaceAll('<table>', '<div class="overflow-x-auto rounded-md border"><table>')
		.replaceAll('</table>', '</table></div>');

	return DOMPurify.sanitize(withScrollableTable, { USE_PROFILES: { html: true } });
}
