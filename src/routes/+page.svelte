<script lang="ts">
	import AboutDialog from '$lib/components/about/about-dialog.svelte';
	import ChatPanel from '$lib/components/chat/chat-panel.svelte';
	import AppTitleBar from '$lib/components/shell/app-title-bar.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import * as Resizable from '$lib/components/ui/resizable/index.js';
	import CircleHelp from '@lucide/svelte/icons/circle-help';
	import MonacoEditor from '$lib/components/editor/monaco-editor.svelte';

	let aboutOpen = $state(false);
</script>

<div class="flex h-dvh w-full flex-col overflow-hidden bg-background">
	<AppTitleBar>
		{#snippet title()}
			<h1 class="font-bold">Scaffy</h1>
		{/snippet}
		{#snippet actions()}
			<Dialog.Root bind:open={aboutOpen}>
				<Dialog.Trigger>
					{#snippet child({ props })}
						<Button
							variant="ghost"
							size="icon-sm"
							{...props}
							aria-label="About Scaffy"
							class="text-muted-foreground hover:text-foreground"
						>
							<CircleHelp />
						</Button>
					{/snippet}
				</Dialog.Trigger>
				<AboutDialog />
			</Dialog.Root>
		{/snippet}
	</AppTitleBar>

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
