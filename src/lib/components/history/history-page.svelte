<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import type { SessionRecord } from '$lib/session.svelte.js';
	import { deleteSession, getSessions, setActiveSessionId } from '$lib/session.svelte.js';
	import { ScrollArea } from '$lib/components/ui/scroll-area/index.js';
	import DeleteConfirmationDialog from '$lib/components/session/delete-confirmation-dialog.svelte';
	import Trash2 from '@lucide/svelte/icons/trash-2';

	let showDeleteConfirm = $state(false);
	let pendingDeleteId = $state<string | null>(null);

	const sortedSessions = $derived(
		[...getSessions()].sort(
			(a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
		),
	);

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

	function goHome() {
		goto(resolve('/'));
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

<ScrollArea orientation="vertical" class="h-full bg-background text-foreground">
	<main class="mx-auto w-full max-w-6xl px-4 py-8">
		<header>
			<h1 class="text-lg font-medium">History</h1>
			<p class="mt-1 text-sm text-muted-foreground">Past learning sessions from this browser.</p>
		</header>

		<ul
			class="mt-6 grid grid-cols-[repeat(auto-fill,minmax(min(100%,280px),1fr))] gap-3"
			role="list"
		>
			{#each sortedSessions as session (session.id)}
				<li class="relative h-full">
					<button
						type="button"
						class="relative z-0 flex h-full w-full flex-col items-start gap-2 rounded-lg border border-border bg-card p-4 pr-10 text-left transition-colors hover:border-primary/50"
						onclick={() => openSession(session.id)}
					>
						<span class="w-full text-sm break-words text-foreground">
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
					</button>

					<button
						type="button"
						class="absolute top-2 right-2 z-10 rounded-full p-1.5 opacity-70 transition hover:bg-foreground/10 hover:opacity-100"
						aria-label="Delete session"
						onclick={(event) => handleDelete(event, session.id)}
					>
						<Trash2 class="size-4" aria-hidden="true" />
					</button>
				</li>
			{/each}

			<li class="h-full">
				<button
					type="button"
					class="flex h-full w-full items-center justify-center rounded-lg border border-dashed border-ring/60 bg-muted p-4 text-sm font-medium text-ring transition-colors hover:border-ring hover:bg-ring/10"
					onclick={goHome}
				>
					Start new session
				</button>
			</li>
		</ul>
	</main>
</ScrollArea>
{#if showDeleteConfirm}
	<DeleteConfirmationDialog onConfirm={confirmDelete} onCancel={cancelDelete} />
{/if}
