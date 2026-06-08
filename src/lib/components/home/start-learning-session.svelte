<script lang="ts">
	import { goto } from '$app/navigation';
	import ChatPanel from '$lib/components/chat/chat-panel.svelte';
	import { ChipGrid } from '$lib/components/ui/chip/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import scaffyLogo from '$lib/assets/scaffy-logo.svg';
	import CornerDownLeft from '@lucide/svelte/icons/corner-down-left';
	import { onMount } from 'svelte';

	const EXAMPLE_PROMPTS = [
		'FastAPI endpoint with JWT auth',
		'React hook for debounced search',
		'Postgres query: top 5 per category',
		'Three.js scene with orbit controls',
	] as const;

	const PROMPT_INPUT_ID = 'chat-prompt';
	const MIN_PROMPT_LENGTH = 10;

	let promptLength = $state(0);

	const canStart = $derived(promptLength >= MIN_PROMPT_LENGTH);

	function readPromptFromDom(): string {
		const el = document.getElementById(PROMPT_INPUT_ID) as HTMLTextAreaElement | null;
		return el?.value.trim() ?? '';
	}

	function syncPromptLength() {
		promptLength = readPromptFromDom().length;
	}

	function fillPrompt(text: string) {
		const el = document.getElementById(PROMPT_INPUT_ID) as HTMLTextAreaElement | null;
		if (!el) return;
		el.value = text;
		el.dispatchEvent(new Event('input', { bubbles: true }));
		syncPromptLength();
		el.focus();
	}

	function startSession() {
		const prompt = readPromptFromDom();
		if (prompt.length < MIN_PROMPT_LENGTH) return;
		const id = crypto.randomUUID();
		goto(`/session/${id}`, { state: { prompt } });
	}

	onMount(() => {
		syncPromptLength();
		const el = document.getElementById(PROMPT_INPUT_ID);
		el?.addEventListener('input', syncPromptLength);
		return () => el?.removeEventListener('input', syncPromptLength);
	});
</script>

<div class="flex h-full flex-col overflow-auto bg-home-bg text-foreground">
	<main class="flex flex-1 flex-col items-center px-4 py-10 sm:py-16">
		<header class="mb-10 flex flex-col items-center gap-4 text-center">
			<div class="flex items-center gap-3">
				<img src={scaffyLogo} alt="" width="52" height="52" class="shrink-0" />
				<span class="text-3xl tracking-tight text-foreground lowercase">scaffy</span>
			</div>
			<p class="max-w-md text-sm leading-relaxed text-muted-foreground">
				Learn to build code, not just have it built for you. Type what you want — Scaffy walks you
				through it, chunk by chunk.
			</p>
		</header>

		<div class="mb-4 w-full max-w-2xl">
			<!-- shadcn Card: shared surface styling (radius, ring, bg) for the prompt shell; home tokens override defaults -->
			<Card.Root
				class="gap-0 border-home-border bg-home-card py-0 shadow-none ring-1 ring-home-border"
			>
				<!-- Card.Content: consistent padding wrapper; ChatPanel stays domain-only inside -->
				<Card.Content class="p-4 sm:p-5">
					<p
						class="mb-3 text-xs font-medium tracking-widest text-home-label uppercase"
					>
						Your prompt
					</p>
					<div class="home-chat-panel__body min-h-[220px]">
						<ChatPanel />
					</div>
				</Card.Content>
			</Card.Root>

			<div class="mt-4 flex justify-end">
				<Button
					type="button"
					variant="outline"
					disabled={!canStart}
					class="rounded-full border-home-accent text-home-accent hover:bg-home-accent/10 hover:text-home-accent disabled:border-home-accent-muted disabled:text-home-accent-muted disabled:opacity-100"
					onclick={startSession}
				>
					start session
					<CornerDownLeft class="size-4" aria-hidden="true" />
				</Button>
			</div>

			<p class="mt-3 text-center text-xs text-muted-foreground">
				<span class="text-home-rule-highlight">rule:</span>
				prompt must be plain language —
				<span class="text-home-rule-highlight">no &lt;, {'{'}, ; tokens</span>
			</p>
		</div>

		<section aria-labelledby="example-prompts-heading" class="mt-8 w-full max-w-2xl">
			<h2
				id="example-prompts-heading"
				class="mb-3 text-center text-xs font-medium tracking-widest text-home-label uppercase"
			>
				Try one of these
			</h2>
			<ChipGrid items={EXAMPLE_PROMPTS} onSelect={fillPrompt} />
		</section>
	</main>
</div>

<style>
	/* Hide message list and built-in submit on home — external start button handles navigation */
	.home-chat-panel__body :global(section[aria-label='Chat panel']) {
		gap: 0;
		height: auto;
		min-height: 0;
	}

	.home-chat-panel__body :global(section[aria-label='Chat panel'] > :nth-child(2)) {
		display: none;
	}

	.home-chat-panel__body :global(form button[type='submit']) {
		display: none;
	}

	.home-chat-panel__body :global(form) {
		border-top: none;
		padding-top: 0;
	}

	.home-chat-panel__body :global(textarea#chat-prompt) {
		min-height: 140px;
		border-color: var(--home-border);
		background: var(--home-bg);
	}
</style>
