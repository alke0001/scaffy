<script lang="ts">
	import ChatPanel from '$lib/components/chat/chat-panel.svelte';
	import * as Resizable from '$lib/components/ui/resizable/index.js';
	import MonacoEditor from '$lib/components/editor/monaco-editor.svelte';
	import { tick } from 'svelte';

	let promptPrefilled = $state(false);

	$effect(() => {
		if (promptPrefilled) return;
		const state = history.state as { prompt?: string } | undefined;
		if (!state?.prompt) return;

		void (async () => {
			await tick();
			const el = document.getElementById('chat-prompt') as HTMLTextAreaElement | null;
			if (!el || el.value.trim().length > 0) return;
			el.value = state.prompt!;
			el.dispatchEvent(new Event('input', { bubbles: true }));
			promptPrefilled = true;
		})();
	});
</script>

<div class="flex h-full w-full flex-col overflow-hidden bg-background">
	<main class="min-h-0 flex-1">
		<div class="hidden h-full md:block">
			<Resizable.PaneGroup direction="horizontal" class="h-full">
				<Resizable.Pane defaultSize={60} minSize={25} class="min-h-0">
					<div class="h-full overflow-auto bg-background p-2">
						<MonacoEditor />
					</div>
				</Resizable.Pane>
				<Resizable.Handle class="cursor-col-resize hover:bg-border/80" />
				<Resizable.Pane defaultSize={40} minSize={20} class="min-h-0">
					<div class="flex h-full min-h-0 flex-col overflow-hidden bg-background">
						<div class="min-h-0 flex-1 overflow-auto p-2">
							<ChatPanel />
						</div>
					</div>
				</Resizable.Pane>
			</Resizable.PaneGroup>
		</div>

		<div class="flex h-full flex-col md:hidden">
			<section class="min-h-0 flex-3 overflow-hidden p-2">
				<MonacoEditor />
			</section>
			<section class="min-h-0 flex-[2] overflow-auto border-t border-border p-2">
				<ChatPanel />
			</section>
		</div>
	</main>
</div>
