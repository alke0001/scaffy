/** Legacy bookmark alias — `/sessions` replaced `/history` (ADR-015). */
import { redirect } from '@sveltejs/kit';
import type { PageLoad } from './$types';

export const load: PageLoad = () => {
	redirect(308, '/sessions');
};
