<script lang="ts">
	import AboutDialog from '$lib/components/about/about-dialog.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import CircleHelp from '@lucide/svelte/icons/circle-help';
	import ScaffyLogo from '$lib/assets/scaffy-logo.svelte';

	let aboutOpen = $state(false);

	const pathname = $derived(page.url.pathname);
	const isHome = $derived(pathname === '/');
	const isSessions = $derived(pathname === '/sessions');

	function goHome() {
		if (isHome) return;
		goto(resolve('/'));
	}

	function goSessions() {
		if (isSessions) return;
		goto(resolve('/sessions'));
	}
</script>

<header
	class="flex shrink-0 items-center justify-between border-b border-scaffy-divider px-4 py-2.5"
>
	<div class="flex items-center gap-3">
		<ScaffyLogo interactive onclick={goHome} />
		<span class="text-3xl tracking-tight text-foreground lowercase">scaffy</span>
	</div>

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
			disabled={isSessions}
			class="text-muted-foreground hover:text-foreground"
			onclick={goSessions}
		>
			My learning sessions
		</Button>
		<Button
			variant="ghost"
			size="icon-sm"
			aria-label="About Scaffy"
			class="text-muted-foreground hover:text-foreground"
			onclick={() => (aboutOpen = true)}
		>
			<CircleHelp />
		</Button>
		<AboutDialog bind:open={aboutOpen} />
	</div>
</header>
