<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { getSessions } from '$lib/session.svelte.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { messages } from '$lib/i18n/index.js';

	/**
	 * Conditional route split: empty state lives here (instant on first visit).
	 * The list UI loads only when sessions exist — promise is cached once, not per render.
	 */
	const sessionCount = $derived(getSessions().length);

	let sessionsPageModulePromise: Promise<
		typeof import('$lib/components/sessions/sessions-page.svelte')
	> | null = null;

	function loadSessionsPage() {
		sessionsPageModulePromise ??= import('$lib/components/sessions/sessions-page.svelte');
		return sessionsPageModulePromise;
	}

	function goHome() {
		goto(resolve('/'));
	}
</script>

{#if sessionCount === 0}
	<main
		class="mx-auto flex h-full min-h-0 w-full max-w-6xl flex-col items-center justify-center gap-4 px-4 py-8 text-center"
	>
		<p class="text-sm text-muted-foreground">{$messages['sessions.noLearningSessions']}</p>
		<Button type="button" variant="outline" onclick={goHome}>
			{$messages['sessions.startFirstLearningSession']}
		</Button>
	</main>
{:else}
	{#await loadSessionsPage()}
		<div
			class="flex h-full min-h-0 flex-1 items-center justify-center px-4 text-sm text-muted-foreground"
			aria-live="polite"
		>
			{$messages['sessions.loadingSessions']}
		</div>
	{:then { default: SessionsPage }}
		<SessionsPage />
	{:catch}
		<div
			class="flex h-full min-h-0 flex-1 flex-col items-center justify-center gap-3 px-4 text-center text-sm"
			role="alert"
		>
			<p class="text-muted-foreground">{$messages['sessions.loadError']}</p>
			<a href={resolve('/')} class="text-primary underline-offset-4 hover:underline"
				>{$messages['sessions.backToHome']}</a
			>
		</div>
	{/await}
{/if}
