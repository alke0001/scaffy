<script lang="ts">
	import { deleteSession, getActiveSessionId, getSessions } from '$lib/session.svelte.js';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';

	interface Props {
		onSelectSession: (id: string) => void;
		onDeleteSession?: (id: string) => void;
	}

	let { onSelectSession, onDeleteSession }: Props = $props();

	const sessions = $derived(getSessions());
	const activeSessionId = $derived(getActiveSessionId());
	const pathname = $derived(page.url.pathname);
	const isHome = $derived(pathname === '/');

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
		deleteSession(id);
		onDeleteSession?.(id);
	}
</script>
<!-- class="session-tabs mb-2 flex min-h-12 items-center gap-2 overflow-x-auto px-2 text-sm" SO war die klasse vom Button vorher. Weiß net ob änderungen sinnvoll. So verändert sich die tab größe halt nimmer. Find ich persönlich besser-->
<div class="session-tabs mb-2 flex flex-nowrap items-center gap-2 overflow-x-auto px-2 text-sm">
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
			<!-- class="flex items-center px-3 py-1 focus:outline-none" SO war die klasse vom Button vorher. Weiß net ob änderungen sinnvoll. So verändert sich die tab größe halt nimmer. Find ich persönlich besser-->
				<button
					type="button"
					class="flex-none w-40 flex items-center px-3 py-1 truncate focus:outline-none"
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
	<button
		class="flex-none w-10 h-10 flex items-center justify-center shrink-0 ml-2"
		onclick={goHome}
		disabled={isHome}
		aria-label="New session"
	>
		+
	</button>
</div>
