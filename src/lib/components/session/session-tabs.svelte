<script lang="ts">
	import { deleteSession, getActiveSessionId, getSessions } from '$lib/session.svelte.js';
	import { cn } from '$lib/utils.js';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import DeleteConfirmationDialog from './delete-confirmation-dialog.svelte';

	interface Props {
		onSelectSession: (id: string) => void;
		onDeleteSession?: (id: string) => void;
		class?: string;
	}

	let { onSelectSession, onDeleteSession, class: className }: Props = $props();

	const sessions = $derived(getSessions());
	const activeSessionId = $derived(getActiveSessionId());
	const pathname = $derived(page.url.pathname);
	const isHome = $derived(pathname === '/');

	let showDeleteConfirm = $state(false);
	let pendingDeleteId = $state<string | null>(null);

	function goHome() {
		if (isHome) return;
		goto(resolve('/'));
	}

	function truncatePrompt(prompt: string) {
		return prompt.length > 28 ? `${prompt.slice(0, 28)}…` : prompt;
	}

	function handleSelect(id: string) {
		onSelectSession(id);
	}

	function handleDelete(event: MouseEvent, id: string) {
		event.stopPropagation();
		pendingDeleteId = id;
		showDeleteConfirm = true;
	}

	function confirmDelete() {
		if (pendingDeleteId) {
			deleteSession(pendingDeleteId);
			onDeleteSession?.(pendingDeleteId);
		}
		showDeleteConfirm = false;
		pendingDeleteId = null;
	}

	function cancelDelete() {
		showDeleteConfirm = false;
		pendingDeleteId = null;
	}
</script>

<!-- class="session-tabs mb-2 flex min-h-12 items-center gap-2 overflow-x-auto px-2 text-sm" SO war die klasse vom Button vorher. Weiß net ob änderungen sinnvoll. So verändert sich die tab größe halt nimmer. Find ich persönlich besser-->
<div
	class={cn(
		'session-tabs native-scroll-x mb-2 flex flex-nowrap items-center gap-2 px-2 text-sm',
		className,
	)}
>
	{#if sessions.length > 0}
		{#each sessions as session (session.id)}
			<div
				class={cn(
					'session-pill flex items-center gap-2 rounded-full border px-1 py-1 transition',
					session.id === activeSessionId && 'border-transparent bg-ring text-background',
					session.id !== activeSessionId &&
						session.completed &&
						'border-border bg-card text-foreground',
					session.id !== activeSessionId &&
						!session.completed &&
						'border-scaffy-amber/80 bg-card text-scaffy-amber',
				)}
			>
				<!-- class="flex items-center px-3 py-1 focus:outline-none" SO war die klasse vom Button vorher. Weiß net ob änderungen sinnvoll. So verändert sich die tab größe halt nimmer. Find ich persönlich besser-->
				<button
					type="button"
					class="flex w-40 flex-none items-center truncate px-3 py-1 focus:outline-none"
					onclick={() => handleSelect(session.id)}
				>
					{truncatePrompt(session.prompt)}

					{#if session.completed}
						<span
							class="ml-2 inline-flex h-5 items-center rounded-full bg-primary px-2 text-[0.65rem] font-semibold text-primary-foreground"
						>
							✓
						</span>
					{:else}
						<span
							class="ml-2 inline-block h-2 w-2 rounded-full bg-scaffy-amber"
							title="Incomplete session"
						></span>
					{/if}

					{#if session.status === 'loading'}
						<span class="ml-2 text-muted-foreground">(Loading)</span>
					{/if}

					{#if session.status === 'error'}
						<span class="ml-2 text-destructive">(Error)</span>
					{/if}
				</button>

				<button
					type="button"
					class="session-close rounded-full px-2 text-sm opacity-70 transition hover:bg-foreground/10 hover:opacity-100"
					aria-label="Close session"
					onclick={(event) => handleDelete(event, session.id)}
				>
					×
				</button>
			</div>
		{/each}
	{:else}
		<div
			class="rounded-2xl border border-dashed border-border bg-background/70 px-3 py-2 text-muted-foreground"
		>
			No sessions yet. Start one from home.
		</div>
	{/if}
	<button
		class="ml-2 flex h-10 w-10 flex-none shrink-0 items-center justify-center"
		onclick={goHome}
		disabled={isHome}
		aria-label="New session"
	>
		+
	</button>
</div>

{#if showDeleteConfirm}
	<DeleteConfirmationDialog onConfirm={confirmDelete} onCancel={cancelDelete} />
{/if}
