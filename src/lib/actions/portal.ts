import type { Action } from 'svelte/action';

/** Move a node to another DOM target (default `document.body`) for top-level stacking. */
export const portal: Action<HTMLElement, string | HTMLElement | undefined> = (
	node,
	target = 'body',
) => {
	const targetEl =
		typeof target === 'string'
			? (document.querySelector(target) ?? document.body)
			: (target ?? document.body);
	targetEl.appendChild(node);

	return {
		destroy() {
			node.remove();
		},
	};
};
