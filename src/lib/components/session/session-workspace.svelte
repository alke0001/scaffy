<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import ChatPanel from '$lib/components/chat/chat-panel.svelte';
	import MonacoEditor from '$lib/components/editor/monaco-editor.svelte';
	import SessionTabs from '$lib/components/session/session-tabs.svelte';
	import * as Resizable from '$lib/components/ui/resizable/index.js';
	import { ScrollArea } from '$lib/components/ui/scroll-area/index.js';
	import { getActiveSessionId, getSessions, setActiveSessionId } from '$lib/session.svelte.js';

	interface Props {
		sessionId: string;
	}

	let { sessionId }: Props = $props();

	$effect(() => {
		const sessions = getSessions();
		if (sessions.some((session) => session.id === sessionId)) {
			setActiveSessionId(sessionId);
		}
	});

	function selectSession(id: string) {
		if (id === sessionId) return;
		goto(resolve('/session/[id]', { id }));
	}

	function handleDeleteSession(deletedId: string) {
		const sessions = getSessions();
		if (sessions.length === 0) {
			goto(resolve('/'));
			return;
		}

		if (deletedId === sessionId) {
			const nextId = getActiveSessionId() ?? sessions[0]?.id;
			if (nextId) goto(resolve('/session/[id]', { id: nextId }));
		}
	}
</script>

<div class="flex h-full w-full flex-col overflow-hidden bg-background">
	<main class="min-h-0 flex-1">
		<div class="hidden h-full md:block">
			<Resizable.PaneGroup direction="horizontal" class="h-full">
				<Resizable.Pane defaultSize={60} minSize={25} class="min-h-0">
					<ScrollArea orientation="vertical" class="h-full bg-background p-2">
						<SessionTabs onSelectSession={selectSession} onDeleteSession={handleDeleteSession} />
						<MonacoEditor />
					</ScrollArea>
				</Resizable.Pane>
				<Resizable.Handle />
				<Resizable.Pane defaultSize={40} minSize={20} class="min-h-0">
					<div class="flex h-full min-h-0 flex-col overflow-hidden bg-background p-2">
						<ChatPanel mode="ask" />
					</div>
				</Resizable.Pane>
			</Resizable.PaneGroup>
		</div>

		<div class="flex h-full flex-col md:hidden">
			<section class="min-h-0 flex-3 overflow-hidden p-2">
				<SessionTabs onSelectSession={selectSession} onDeleteSession={handleDeleteSession} />
				<MonacoEditor />
			</section>
			<div class="flex min-h-0 flex-2 flex-col overflow-hidden border-t border-scaffy-divider p-2">
				<ChatPanel mode="ask" />
			</div>
		</div>
	</main>
</div>
