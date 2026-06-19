import type { KnowledgeCheck } from '$lib/types/scaffold.js';

/**
 * Per-editor bridge between Monaco viewZone host and LearningCard UI.
 * Not a global store — one instance per `monaco-editor.svelte`.
 * Ephemeral: reset when the active scaffold step changes.
 */
export class KnowledgeZoneBridge {
	question = $state<KnowledgeCheck | null>(null);
	chunkIndex = $state(0);
	chunkTotal = $state(0);
	selectedOption = $state<string | null>(null);
	showFeedback = $state(false);
	onAnswer = $state<(optionId: string) => void>(() => {});
	onUnderstand = $state<() => void>(() => {});

	reset() {
		this.question = null;
		this.selectedOption = null;
		this.showFeedback = false;
	}
}
