<script lang="ts">
	import { deleteSession, getActiveSessionId, getSessions } from '$lib/session.svelte.js';
	import { cn } from '$lib/utils.js';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { messages } from '$lib/i18n/index.js';
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

<div class={cn('session-tabs-shell mb-2 shrink-0', className)}>
	<div class="session-tabs-viewport">
		<div class="session-tabs-row flex w-max flex-nowrap items-center gap-2 px-2 text-sm">
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
									title={$messages['session.incompleteSession']}
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
					{$messages['session.noSessions']}
				</div>
			{/if}
			<button
				class="ml-2 flex h-10 w-10 flex-none shrink-0 items-center justify-center"
				onclick={goHome}
				disabled={isHome}
				aria-label={$messages['session.newSession']}
			>
				+
			</button>
		</div>
	</div>
</div>

{#if showDeleteConfirm}
	<DeleteConfirmationDialog onConfirm={confirmDelete} onCancel={cancelDelete} />
{/if}

<style>
	.session-tabs-shell {
		--session-tabs-row-height: 3rem;
		--session-tabs-scrollbar-gutter: calc(
			var(--scaffy-scrollbar-size) + 2 * var(--scaffy-scrollbar-inset)
		);
		width: 100%;
	}

	/*
	 * Two bands: tabs (top) + scrollbar lane (bottom). Height is fixed so the editor never jumps.
	 * Scrollbar track is always reserved when content overflows (thin / webkit height), thumb fades on hover.
	 */
	.session-tabs-viewport {
		height: calc(var(--session-tabs-row-height) + var(--session-tabs-scrollbar-gutter));
		overflow-x: auto;
		overflow-y: hidden;
		scrollbar-width: thin;
		scrollbar-color: transparent transparent;
	}

	.session-tabs-viewport:hover {
		scrollbar-color: color-mix(
				in oklch,
				var(--muted-foreground) calc(var(--scaffy-scrollbar-visible-opacity) * 100%),
				transparent
			)
			transparent;
	}

	.session-tabs-viewport::-webkit-scrollbar {
		height: var(--session-tabs-scrollbar-gutter);
	}

	.session-tabs-viewport::-webkit-scrollbar-track {
		background: transparent;
		margin-inline: var(--scaffy-scrollbar-inset);
	}

	.session-tabs-viewport::-webkit-scrollbar-thumb {
		background-color: color-mix(
			in oklch,
			var(--muted-foreground) calc(var(--scaffy-scrollbar-visible-opacity) * 100%),
			transparent
		);
		border: var(--scaffy-scrollbar-inset) solid transparent;
		background-clip: padding-box;
		border-radius: 9999px;
		opacity: 0;
		transition:
			opacity var(--scaffy-scrollbar-fade-out-duration) var(--scaffy-scrollbar-fade-out-ease),
			background-color var(--scaffy-scrollbar-fade-out-duration)
				var(--scaffy-scrollbar-fade-out-ease);
	}

	.session-tabs-viewport:hover::-webkit-scrollbar-thumb {
		opacity: 1;
		transition-duration: var(--scaffy-scrollbar-fade-in-duration);
		transition-timing-function: var(--scaffy-scrollbar-fade-in-ease);
	}

	.session-tabs-row {
		height: var(--session-tabs-row-height);
	}
</style>
