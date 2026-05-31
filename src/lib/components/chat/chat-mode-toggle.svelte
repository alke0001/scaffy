<script lang="ts">
	import * as ToggleGroup from '$lib/components/ui/toggle-group/index.js';
	import type { ChatMode } from '$lib/chat/message-actions.js';

	let {
		mode = $bindable('learn' as ChatMode)
	}: {
		mode?: ChatMode;
	} = $props();
</script>

<ToggleGroup.Root
	type="single"
	variant="outline"
	class="w-full"
	bind:value={mode}
	aria-label="Chat mode"
>
	<ToggleGroup.Item value="learn" class="flex-1" aria-label="Learn Code mode">
		Learn Code
	</ToggleGroup.Item>
	<ToggleGroup.Item value="ask" class="flex-1" aria-label="Ask mode">Ask</ToggleGroup.Item>
</ToggleGroup.Root>
