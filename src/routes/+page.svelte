<script lang="ts">
	import AboutDialog from '$lib/components/about/about-dialog.svelte';
	import ChatPanel from '$lib/components/chat/chat-panel.svelte';
	import AppTitleBar from '$lib/components/shell/app-title-bar.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import * as Resizable from '$lib/components/ui/resizable/index.js';
	import CircleHelp from '@lucide/svelte/icons/circle-help';
	import MonacoEditor from '$lib/components/editor/monaco-editor.svelte';
	import {
		deleteSession,
		getActiveSessionId,
		getSessions,
		setActiveSessionId,
	} from '$lib/session.svelte.js';

let aboutOpen = $state(false);
const sessions = $derived(getSessions());
const activeSessionId = $derived(getActiveSessionId());

function selectSession(id: string) {
	setActiveSessionId(id);
}

function deleteSessionTab(event: MouseEvent, id: string) {
	event.stopPropagation();
	deleteSession(id);
}

function truncatePrompt(prompt: string) {
	return prompt.length > 28 ? `${prompt.slice(0, 28)}…` : prompt;
}
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
											onclick={() => selectSession(session.id)}
										>
											{truncatePrompt(session.prompt)}

											{#if session.completed}
												<span class="ml-2 inline-flex h-5 items-center rounded-full bg-emerald-500 px-2 text-[0.65rem] font-semibold text-slate-950">
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
											onclick={(event) => deleteSessionTab(event, session.id)}
										>
											×
										</button>
									</div>
								{/each}
							{:else}
								<div class="rounded-2xl border border-dashed border-slate-600 bg-slate-950/70 px-3 py-2 text-slate-400">
									Noch keine Session vorhanden. Erzeuge eine neue Session über den Lernmodus.
								</div>
							{/if}
						</div>
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
				<div class="session-tabs mb-2 flex min-h-12 items-center gap-2 overflow-x-auto px-2 text-sm">
					{#if sessions.length > 0}
						{#each sessions as session (session.id)}
							<div class="session-pill flex items-center gap-2 rounded-full border px-1 py-1">
								<button
									type="button"
									class="min-w-0 flex-1 rounded-full px-3 py-1 text-left transition focus:outline-none focus:ring-2 focus:ring-indigo-500"
									class:bg-indigo-600={session.id === activeSessionId}
									class:text-white={session.id === activeSessionId}
									class:border-transparent={session.id === activeSessionId}
									class:bg-slate-900={session.id !== activeSessionId}
									class:text-slate-200={session.id !== activeSessionId && session.completed}
									class:border-slate-700={session.id !== activeSessionId && session.completed}
									class:bg-slate-950={session.id !== activeSessionId && !session.completed}
									class:text-orange-300={session.id !== activeSessionId && !session.completed}
									class:border-orange-500={session.id !== activeSessionId && !session.completed}
									onclick={() => selectSession(session.id)}
								>
									{truncatePrompt(session.prompt)}
									{#if session.completed}
										<span class="ml-2 inline-flex h-5 items-center rounded-full bg-emerald-500 px-2 text-[0.65rem] font-semibold text-slate-950">✓</span>
									{:else}
										<span class="ml-2 inline-block h-2 w-2 rounded-full bg-orange-400" title="Unvollständige Session"></span>
									{/if}
									{#if session.status === 'loading'}<span class="ml-2 text-slate-400">(Lädt)</span>{/if}
									{#if session.status === 'error'}<span class="ml-2 text-rose-400">(Fehler)</span>{/if}
								</button>
								<button
									type="button"
									class="session-close rounded-full px-2 text-sm text-slate-400 transition hover:bg-slate-800 hover:text-white"
									aria-label="Session schließen"
									onclick={(event) => deleteSessionTab(event, session.id)}
								>
									×
								</button>
							</div>
						{/each}
					{:else}
						<div class="rounded-2xl border border-dashed border-slate-600 bg-slate-950/70 px-3 py-2 text-slate-400">
							Noch keine Session vorhanden. Erzeuge eine neue Session über den Lernmodus.
						</div>
					{/if}
				</div>
				<MonacoEditor />
			</section>
			<section class="min-h-0 flex-2 overflow-auto border-t border-border p-2">
				<ChatPanel />
			</section>
		</div>
	</main>
</div>
