<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import ChatPanel from '$lib/components/chat/chat-panel.svelte';
	import { HOME_EXAMPLE_PROMPTS } from '$lib/components/home/example-prompts.js';
	import { requestScaffold } from '$lib/learn/request-scaffold.js';
	import { ChipGrid } from '$lib/components/ui/chip/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import scaffyLogo from '$lib/assets/scaffy-logo.svg';
	import CornerDownLeft from '@lucide/svelte/icons/corner-down-left';
	import { onMount } from 'svelte';

	const PROMPT_INPUT_ID = 'chat-prompt';
	const MIN_PROMPT_LENGTH = 10;

	let promptLength = $state(0);
	let isStarting = $state(false);

	const canStart = $derived(promptLength >= MIN_PROMPT_LENGTH && !isStarting);

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

	async function startSession() {
		const prompt = readPromptFromDom();
		if (prompt.length < MIN_PROMPT_LENGTH || isStarting) return;

		isStarting = true;
		const id = crypto.randomUUID();

		void requestScaffold(prompt, id);
		await goto(resolve('/session/[id]', { id }));
		isStarting = false;
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
			<Card.Root
				class="gap-0 border-home-border bg-home-card py-0 shadow-none ring-1 ring-home-border"
			>
				<Card.Content class="p-4 sm:p-5">
					<p class="mb-3 text-xs font-medium tracking-widest text-home-label uppercase">
						Your prompt
					</p>
					<p class="mb-4 text-center text-sm text-muted-foreground">
						Describe what you want to build in plain language.
					</p>
					<div class="home-chat-panel__body">
						<ChatPanel mode="learn" promptOnly />
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
					{isStarting ? 'Starting…' : 'start session'}
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
			<ChipGrid items={HOME_EXAMPLE_PROMPTS} onSelect={fillPrompt} />
		</section>
	</main>
</div>

<style>
	.home-chat-panel__body :global(textarea#chat-prompt) {
		border-color: var(--home-border);
		background: var(--home-bg);
	}
</style>
