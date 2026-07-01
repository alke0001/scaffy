/** Dev-only console tracing for scaffold / session / Monaco flows. */
export function devLog(scope: string, event: string, detail?: Record<string, unknown>): void {
	if (!import.meta.env.DEV) return;
	const label = `[scaffy:${scope}] ${event}`;
	if (detail !== undefined) {
		console.info(label, detail);
	} else {
		console.info(label);
	}
}
