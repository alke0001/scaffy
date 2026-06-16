/**
 * Explanation body without the leading confirmation sentence (scaffold API contract).
 * Falls back to the full string when stripping would leave nothing.
 */
export function getExplanationBody(explanation: string): string {
	const stripped = explanation
		.replace(/^Die korrekte Antwort ist Option [a-z]:\s*.+?\.\s*/i, '')
		.trim();
	return stripped.length > 0 ? stripped : explanation;
}
