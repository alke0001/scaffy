<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import type { SessionRecord } from '$lib/session.svelte.js';
	import { getSessions, setActiveSessionId } from '$lib/session.svelte.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { ScrollArea } from '$lib/components/ui/scroll-area/index.js';
	import DeleteConfirmationDialog from '$lib/components/session/delete-confirmation-dialog.svelte';
	import { deleteSession } from '$lib/session.svelte.js';

	let showDeleteConfirm = $state(false);
	let pendingDeleteId = $state<string | null>(null);
	const sessions = $derived(getSessions());

	function formatDate(iso: string) {
		const date = new Date(iso);
		if (Number.isNaN(date.getTime())) return '';
		return date.toLocaleString(undefined, {
			dateStyle: 'medium',
			timeStyle: 'short',
		});
	}

	function statusLabel(session: SessionRecord) {
		if (session.completed) return 'Completed';
		if (session.status === 'loading') return 'Loading';
		if (session.status === 'error') return 'Error';
		return 'In progress';
	}

	function openSession(id: string) {
		setActiveSessionId(id);
		goto(resolve('/session/[id]', { id }));
	}
	function handleDelete(event: MouseEvent, id: string) {
	event.stopPropagation();
	pendingDeleteId = id;
	showDeleteConfirm = true;
	}

	function confirmDelete() {
		if (pendingDeleteId) {
			deleteSession(pendingDeleteId);
		}

		showDeleteConfirm = false;
		pendingDeleteId = null;
	}

	function cancelDelete() {
		showDeleteConfirm = false;
		pendingDeleteId = null;
	}
</script>

<ScrollArea orientation="vertical" class="h-full bg-background px-4 py-8 text-foreground">
	<header class="mx-auto w-full max-w-2xl">
		<h1 class="text-lg font-medium">History</h1>
		<p class="mt-1 text-sm text-muted-foreground">Past learning sessions from this browser.</p>
	</header>

	{#if sessions.length === 0}
		<div class="mx-auto mt-12 w-full max-w-2xl text-center">
			<p class="text-sm text-muted-foreground">No sessions yet. Start one from home.</p>
		</div>
	{:else}
		<ul class="mx-auto mt-6 flex w-full max-w-2xl flex-col gap-2" role="list">
			{#each sessions as session (session.id)}
				<li>
					<div
						class="flex items-start gap-2 rounded-lg border border-border bg-card px-4 py-3"
					>
						<Button
							type="button"
							variant="ghost"
							class="h-auto flex-1 flex-col items-start gap-1 border-0 bg-transparent p-0 text-left font-normal shadow-none hover:bg-transparent"
							onclick={() => openSession(session.id)}
						>
							<span class="w-full whitespace-normal break-words text-sm text-foreground">
								{session.prompt}
							</span>

							<span class="flex w-full flex-wrap items-center gap-2 text-xs text-muted-foreground">
								<time datetime={session.createdAt}>
									{formatDate(session.createdAt)}
								</time>

								<span aria-hidden="true">·</span>

								<span
									class:text-primary={session.completed}
									class:text-scaffy-amber={!session.completed && session.status !== 'error'}
									class:text-destructive={session.status === 'error'}
								>
									{statusLabel(session)}
								</span>
							</span>
						</Button>

						<button
							type="button"
							class="rounded-full px-2 text-sm opacity-70 transition hover:bg-foreground/10 hover:opacity-100"
							aria-label="Delete session"
							onclick={(event) => handleDelete(event, session.id)}
						>
							×
						</button>
					</div>
				</li>
			{/each}
		</ul>
	{/if}
</ScrollArea>
{#if showDeleteConfirm}
	<DeleteConfirmationDialog
		onConfirm={confirmDelete}
		onCancel={cancelDelete}
	/>
{/if}
