<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import type { SessionRecord } from '$lib/session.svelte.js';
	import { deleteSession, getSessions, setActiveSessionId } from '$lib/session.svelte.js';
	import { ScrollArea } from '$lib/components/ui/scroll-area/index.js';
	import DeleteConfirmationDialog from '$lib/components/session/delete-confirmation-dialog.svelte';
	import { cn } from '$lib/utils.js';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import { messages } from '$lib/i18n/index.js';

	const sessionCard =
		'rounded-lg border border-border bg-card transition-[colors,transform,box-shadow] duration-150 hover:border-primary/50 active:translate-y-px active:bg-muted/40 active:shadow-[inset_0_2px_6px_rgba(0,0,0,0.18)] focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2';

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
		if (session.completed) return $messages['session.status.completed'];
		if (session.status === 'loading') return $messages['session.status.loading'];
		if (session.status === 'error') return $messages['session.status.error'];
		return $messages['session.status.inProgress'];
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
			<h1 class="text-lg font-medium">{$messages['sessions.title']}</h1>
			<p class="mt-1 text-sm text-muted-foreground">{$messages['sessions.subtitle']}</p>
		</header>

		<ul
			class="mt-6 grid grid-cols-[repeat(auto-fill,minmax(min(100%,240px),1fr))] gap-3"
			role="list"
		>
			{#each sortedSessions as session, index (session.id)}
				{@const isLatest = index === 0}
				<li class="relative h-full">
					<button
						type="button"
						class={cn(
							'relative z-0 flex h-full w-full flex-col items-start gap-2 p-4 pr-10 text-left',
							isLatest && 'scaffy-dashed-ring-surface scaffy-dashed-ring-surface--hover',
							!isLatest && sessionCard,
						)}
						onclick={() => openSession(session.id)}
					>
						{#if isLatest}
							<span class="text-xs font-medium text-ring">
								{$messages['sessions.latestSession']}
							</span>
						{/if}

						<span class="w-full text-sm wrap-break-word text-foreground">
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
						class="absolute top-2 right-2 z-10 rounded-full p-1.5 opacity-70 transition hover:bg-foreground/10 hover:opacity-100 active:translate-y-px active:opacity-100"
						aria-label={$messages['session.deleteSession']}
						onclick={(event) => handleDelete(event, session.id)}
					>
						<Trash2 class="size-4" aria-hidden="true" />
					</button>
				</li>
			{/each}

			<li class="h-full">
				<button
					type="button"
					class="scaffy-dashed-ring-surface scaffy-dashed-ring-surface--hover flex h-full w-full items-center justify-center p-4 text-sm font-medium text-ring"
					onclick={goHome}
				>
					{$messages['session.startNewSession']}
				</button>
			</li>
		</ul>
	</main>
</ScrollArea>
{#if showDeleteConfirm}
	<DeleteConfirmationDialog onConfirm={confirmDelete} onCancel={cancelDelete} />
{/if}
