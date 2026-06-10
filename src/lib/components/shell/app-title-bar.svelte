<script lang="ts">
	import AboutDialog from '$lib/components/about/about-dialog.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import CircleHelp from '@lucide/svelte/icons/circle-help';

	let aboutOpen = $state(false);

	const pathname = $derived(page.url.pathname);
	const isHome = $derived(pathname === '/');
	const isHistory = $derived(pathname === '/history');

	function goHome() {
		if (isHome) return;
		goto('/');
	}

	function goHistory() {
		if (isHistory) return;
		goto('/history');
	}
</script>

<header class="flex h-10 shrink-0 items-center justify-between border-b border-home-border px-4">
	<span class="text-sm text-muted-foreground">scaffy</span>

	<div class="flex items-center gap-2">
		<Button
			variant="ghost"
			size="sm"
			disabled={isHome}
			class="text-muted-foreground hover:text-foreground"
			onclick={goHome}
		>
			home
		</Button>
		<Button
			variant="ghost"
			size="sm"
			disabled={isHistory}
			class="text-muted-foreground hover:text-foreground"
			onclick={goHistory}
		>
			history
		</Button>
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
	</div>
</header>
