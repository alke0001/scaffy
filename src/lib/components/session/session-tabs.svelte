<script lang="ts">
	import {
		deleteSession,
		getActiveSessionId,
		getSessions,
	} from '$lib/session.svelte.js';

	interface Props {
		onSelectSession: (id: string) => void;
		onDeleteSession?: (id: string) => void;
	}

	let { onSelectSession, onDeleteSession }: Props = $props();

	const sessions = $derived(getSessions());
	const activeSessionId = $derived(getActiveSessionId());

	function truncatePrompt(prompt: string) {
		return prompt.length > 28 ? `${prompt.slice(0, 28)}…` : prompt;
	}

	function handleSelect(id: string) {
		onSelectSession(id);
	}

	function handleDelete(event: MouseEvent, id: string) {
		event.stopPropagation();
		deleteSession(id);
		onDeleteSession?.(id);
	}
</script>

<div class="session-tabs mb-2 flex min-h-12 items-center gap-2 overflow-x-auto px-2 text-sm">
	{#if sessions.length > 0}
		{#each sessions as session (session.id)}
			<div
				class="session-pill flex items-center gap-2 rounded-full border px-1 py-1 transition"
				class:bg-indigo-600={session.id === activeSessionId}
				class:text-white={session.id === activeSessionId}
				class:border-transparent={session.id === activeSessionId}
				class:bg-slate-900={session.id !== activeSessionId && session.completed}
				class:text-slate-200={session.id !== activeSessionId && session.completed}
				class:border-slate-700={session.id !== activeSessionId && session.completed}
				class:bg-slate-950={session.id !== activeSessionId && !session.completed}
				class:text-orange-300={session.id !== activeSessionId && !session.completed}
				class:border-orange-500={session.id !== activeSessionId && !session.completed}
			>
				<button
					type="button"
					class="flex items-center px-3 py-1 focus:outline-none"
					onclick={() => handleSelect(session.id)}
				>
					{truncatePrompt(session.prompt)}

					{#if session.completed}
						<span
							class="ml-2 inline-flex h-5 items-center rounded-full bg-emerald-500 px-2 text-[0.65rem] font-semibold text-slate-950"
						>
							✓
						</span>
					{:else}
						<span
							class="ml-2 inline-block h-2 w-2 rounded-full bg-orange-400"
							title="Unvollständige Session"
						></span>
					{/if}

					{#if session.status === 'loading'}
						<span class="ml-2 text-slate-400">(Lädt)</span>
					{/if}

					{#if session.status === 'error'}
						<span class="ml-2 text-rose-400">(Fehler)</span>
					{/if}
				</button>

				<button
					type="button"
					class="session-close rounded-full px-2 text-sm opacity-70 transition hover:bg-black/10 hover:opacity-100"
					aria-label="Session schließen"
					onclick={(event) => handleDelete(event, session.id)}
				>
					×
				</button>
			</div>
		{/each}
	{:else}
		<div
			class="rounded-2xl border border-dashed border-slate-600 bg-slate-950/70 px-3 py-2 text-slate-400"
		>
			Noch keine Session vorhanden. Erzeuge eine neue Session über den Lernmodus.
		</div>
	{/if}
</div>
