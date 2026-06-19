<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { getSessions } from '$lib/session.svelte.js';
	import { Button } from '$lib/components/ui/button/index.js';

	/**
	 * Conditional route split: empty state lives here (instant on first visit).
	 * The list UI (cards, delete dialog, ScrollArea) loads only when sessions exist.
	 */
	const sessionCount = $derived(getSessions().length);

	function goHome() {
		goto(resolve('/'));
	}
</script>

{#if sessionCount === 0}
	<main
		class="mx-auto flex h-full min-h-0 w-full max-w-6xl flex-col items-center justify-center gap-4 px-4 py-8 text-center"
	>
		<p class="text-sm text-muted-foreground">No learning sessions yet.</p>
		<Button type="button" variant="outline" onclick={goHome}>
			Start your first learning session
		</Button>
	</main>
{:else}
	{#await import('$lib/components/sessions/sessions-page.svelte')}
		<div
			class="flex h-full min-h-0 flex-1 items-center justify-center px-4 text-sm text-muted-foreground"
			aria-live="polite"
		>
			Loading sessions…
		</div>
	{:then { default: SessionsPage }}
		<SessionsPage />
	{:catch}
		<div
			class="flex h-full min-h-0 flex-1 flex-col items-center justify-center gap-3 px-4 text-center text-sm"
			role="alert"
		>
			<p class="text-muted-foreground">Could not load the sessions page.</p>
			<a href={resolve('/')} class="text-primary underline-offset-4 hover:underline">Back to home</a
			>
		</div>
	{/await}
{/if}
