<script lang="ts">
	import LearningCard from '$lib/components/editor/learning-card.svelte';
	import type { KnowledgeZoneBridge } from '$lib/components/editor/knowledge-zone-bridge.svelte.js';

	let { bridge }: { bridge: KnowledgeZoneBridge } = $props();
</script>

{#if bridge.question}
	<LearningCard
		question={bridge.question}
		chunkIndex={bridge.chunkIndex}
		chunkTotal={bridge.chunkTotal}
		selectedOption={bridge.selectedOption}
		showFeedback={bridge.showFeedback}
		onAnswer={(optionId) => bridge.onAnswer(optionId)}
		onUnderstand={() => bridge.onUnderstand()}
	/>
{/if}
