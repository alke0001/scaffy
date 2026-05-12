<script lang="ts">
	import ClaudeChatPanel from '$lib/claude-chat-panel.svelte';
	import MonacoEditorPlaceholder from '$lib/monaco-editor-placeholder.svelte';

	const tabOrder = ['editor', 'chat'] as const;
	type WorkspaceTab = (typeof tabOrder)[number];

	let activeTab = $state<WorkspaceTab>('editor');
	let editorTabButton: HTMLButtonElement | undefined = $state();
	let chatTabButton: HTMLButtonElement | undefined = $state();

	function selectTab(tab: WorkspaceTab) {
		activeTab = tab;
	}

	function focusTab(tab: WorkspaceTab) {
		activeTab = tab;
		queueMicrotask(() => {
			(tab === 'editor' ? editorTabButton : chatTabButton)?.focus();
		});
	}

	function onTablistKeydown(event: KeyboardEvent) {
		const i = tabOrder.indexOf(activeTab);
		if (event.key === 'ArrowRight') {
			event.preventDefault();
			focusTab(tabOrder[(i + 1) % tabOrder.length]);
		} else if (event.key === 'ArrowLeft') {
			event.preventDefault();
			focusTab(tabOrder[(i - 1 + tabOrder.length) % tabOrder.length]);
		} else if (event.key === 'Home') {
			event.preventDefault();
			focusTab('editor');
		} else if (event.key === 'End') {
			event.preventDefault();
			focusTab('chat');
		}
	}
</script>

<h1>Welcome to scaffy</h1>
<p>
	Visit <a href="https://github.com/alke0001/scaffy">scaffy GitHub</a> to read more about this project
</p>

<div class="mt-8 max-w-3xl">
	<div
		role="tablist"
		aria-label="Workspace"
		tabindex="-1"
		class="border-input bg-muted/40 flex gap-1 rounded-t-md border border-b-0 p-1"
		onkeydown={onTablistKeydown}
	>
		<button
			bind:this={editorTabButton}
			id="tab-monaco-editor"
			type="button"
			role="tab"
			aria-selected={activeTab === 'editor'}
			aria-controls="panel-monaco-editor"
			tabindex={activeTab === 'editor' ? 0 : -1}
			class="ring-offset-background focus-visible:ring-ring rounded-md px-3 py-2 text-sm font-medium focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none {activeTab ===
			'editor'
				? 'bg-background text-foreground shadow-sm'
				: 'text-muted-foreground hover:text-foreground'}"
			onclick={() => selectTab('editor')}
		>
			Monaco Editor
		</button>
		<button
			bind:this={chatTabButton}
			id="tab-claude-chat"
			type="button"
			role="tab"
			aria-selected={activeTab === 'chat'}
			aria-controls="panel-claude-chat"
			tabindex={activeTab === 'chat' ? 0 : -1}
			class="ring-offset-background focus-visible:ring-ring rounded-md px-3 py-2 text-sm font-medium focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none {activeTab ===
			'chat'
				? 'bg-background text-foreground shadow-sm'
				: 'text-muted-foreground hover:text-foreground'}"
			onclick={() => selectTab('chat')}
		>
			Claude Chat
		</button>
	</div>

	<div
		class="border-input bg-background space-y-3 rounded-b-md border p-4"
		role="tabpanel"
		id="panel-monaco-editor"
		aria-labelledby="tab-monaco-editor"
		hidden={activeTab !== 'editor'}
	>
		<MonacoEditorPlaceholder />
	</div>

	<div
		class="border-input bg-background space-y-3 rounded-b-md border p-4"
		role="tabpanel"
		id="panel-claude-chat"
		aria-labelledby="tab-claude-chat"
		hidden={activeTab !== 'chat'}
	>
		<ClaudeChatPanel />
	</div>
</div>
