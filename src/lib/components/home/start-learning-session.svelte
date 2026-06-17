<script lang="ts">
	import { goto } from '$app/navigation';

	import { resolve } from '$app/paths';

	import ChatPanel from '$lib/components/chat/chat-panel.svelte';

	import { HOME_EXAMPLE_PROMPTS } from '$lib/components/home/example-prompts.js';

	import { startLearnSession } from '$lib/learn/request-scaffold.js';

	import { ChipGrid } from '$lib/components/ui/chip/index.js';

	import { Button } from '$lib/components/ui/button/index.js';

	import { ScrollArea } from '$lib/components/ui/scroll-area/index.js';

	import * as Card from '$lib/components/ui/card/index.js';

	import ScaffyLogo from '$lib/assets/scaffy-logo.svelte';

	import CornerDownLeft from '@lucide/svelte/icons/corner-down-left';

	import { getSessions } from '$lib/session.svelte.js';

	const MIN_PROMPT_LENGTH = 10;

	let prompt = $state('');

	let isStarting = $state(false);

	const canStart = $derived(prompt.trim().length >= MIN_PROMPT_LENGTH && !isStarting);

	const sessionCount = $derived(getSessions().length);

	const hasSessions = $derived(sessionCount > 0);

	function goToSessions() {
		if (!hasSessions) return;
		goto(resolve('/sessions'));
	}

	function fillPrompt(text: string) {
		prompt = text;
	}

	async function startSession() {
		const trimmed = prompt.trim();

		if (trimmed.length < MIN_PROMPT_LENGTH || isStarting) return;

		isStarting = true;

		try {
			const sessionId = crypto.randomUUID();

			startLearnSession(trimmed, sessionId);

			await goto(resolve('/session/[id]', { id: sessionId }));
		} finally {
			isStarting = false;
		}
	}
</script>

<ScrollArea orientation="vertical" class="h-full bg-background text-foreground">
	<main class="flex flex-1 flex-col items-center px-4 py-10 sm:py-16">
		<header class="mb-10 flex flex-col items-center gap-4 text-center">
			<div class="flex items-center gap-3">
				<ScaffyLogo width={52} height={52} class="shrink-0" />

				<span class="text-3xl tracking-tight text-foreground lowercase">scaffy</span>
			</div>

			<p class="max-w-md text-sm leading-relaxed text-muted-foreground">
				Learn to build code, not just have it built for you. Type what you want — Scaffy walks you
				through it, chunk by chunk.
			</p>
		</header>

		<div class="mb-4 w-full max-w-2xl">
			<Card.Root class="gap-0 border-border bg-card py-0 shadow-none ring-1 ring-border">
				<Card.Content class="p-4 sm:p-5">
					<p class="mb-3 text-xs font-medium tracking-widest text-muted-foreground uppercase">
						Your prompt
					</p>

					<p class="mb-4 text-center text-sm text-muted-foreground">
						Describe what you want to build in plain language.
					</p>

					<ChatPanel mode="learn" promptOnly bind:prompt />
				</Card.Content>
			</Card.Root>

			<div class="mt-4 flex justify-end">
				<Button
					type="button"
					variant="outline"
					disabled={!canStart}
					class="rounded-full border-primary text-primary hover:bg-primary/10 hover:text-primary disabled:border-border disabled:text-muted-foreground disabled:opacity-100"
					onclick={startSession}
				>
					{isStarting ? 'Starting…' : 'start session'}

					<CornerDownLeft class="size-4" aria-hidden="true" />
				</Button>
			</div>

			<p class="mt-3 text-center text-xs text-muted-foreground">
				<span class="text-scaffy-magenta">rule:</span>

				prompt must be plain language —

				<span class="text-scaffy-magenta">no &lt;, {'{'}, ; tokens</span>
			</p>
		</div>

		<section aria-labelledby="example-prompts-heading" class="mt-8 w-full max-w-2xl">
			<h2
				id="example-prompts-heading"
				class="mb-3 text-center text-xs font-medium tracking-widest text-muted-foreground uppercase"
			>
				Try one of these
			</h2>

			<ChipGrid items={HOME_EXAMPLE_PROMPTS} onSelect={fillPrompt} />
		</section>

		<p class="mt-8 max-w-2xl text-center font-mono text-sm" aria-disabled={!hasSessions}>
			<span class="font-semibold text-scaffy-amber"
				>{sessionCount} saved session{sessionCount === 1 ? '' : 's'}</span
			>
			<span class="text-muted-foreground"> – continue and review in </span>
			{#if hasSessions}
				<button
					type="button"
					class="font-semibold text-foreground underline decoration-dotted underline-offset-4 hover:text-ring"
					onclick={goToSessions}
				>
					My learning sessions →
				</button>
			{:else}
				<span class="text-muted-foreground">My learning sessions →</span>
			{/if}
		</p>
	</main>
</ScrollArea>
