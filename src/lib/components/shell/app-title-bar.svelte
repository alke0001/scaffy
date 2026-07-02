<script lang="ts">
	import AboutDialog from '$lib/components/about/about-dialog.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import {
		ScaffyDropdown,
		ScaffyDropdownItem,
		toolbarActionButtonClass,
	} from '$lib/components/ui/scaffy-dropdown/index.js';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import CircleHelp from '@lucide/svelte/icons/circle-help';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import ScaffyLogo from '$lib/assets/scaffy-logo.svelte';
	import { getSessionById } from '$lib/global-state/session.svelte.js';
	import { cn } from '$lib/utils.js';
	import { language, AVAILABLE_LANGUAGES, messages, type LanguageCode } from '$lib/i18n/index.js';

	let aboutOpen = $state(false);

	const pathname = $derived(page.url.pathname);
	const sessionId = $derived(typeof page.params.id === 'string' ? page.params.id : undefined);

	const isHome = $derived(pathname === '/');
	const isSessions = $derived(pathname === '/sessions');
	const isSession = $derived(Boolean(sessionId && pathname.startsWith('/session/')));

	const currentLanguage = $derived(
		AVAILABLE_LANGUAGES.find((lang) => lang.code === $language) ?? AVAILABLE_LANGUAGES[0],
	);

	const sessionPromptLabel = $derived.by(() => {
		if (!sessionId) return $messages['app.session'];
		const session = getSessionById(sessionId);
		if (!session) return $messages['app.session'];
		return session.prompt;
	});

	const navItemClass = 'shrink-0 text-sm';
	const navActiveClass = 'border-b-2 border-ring pb-0.5 text-foreground';
	const navLinkClass =
		'text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2';

	function goHome(event: MouseEvent) {
		event.preventDefault();
		goto(resolve('/'));
	}

	function goSessions(event: MouseEvent) {
		event.preventDefault();
		goto(resolve('/sessions'));
	}

	function setLanguage(code: LanguageCode) {
		language.set(code);
	}
</script>

<header
	class="flex shrink-0 items-center justify-between gap-4 border-b border-scaffy-divider px-4 py-2.5"
>
	<nav class="flex min-w-0 flex-1 items-center gap-3" aria-label="App">
		<ScaffyLogo interactive onclick={() => goto(resolve('/'))} />

		<a
			href={resolve('/')}
			class={cn(navItemClass, isHome ? navActiveClass : navLinkClass)}
			aria-current={isHome ? 'page' : undefined}
			onclick={goHome}
		>
			Scaffy
		</a>

		<span class="h-5 shrink-0 border-l border-scaffy-divider" aria-hidden="true"></span>

		{#if isSessions}
			<span class={cn(navItemClass, navActiveClass)} aria-current="page"
				>{$messages['app.mySessions']}</span
			>
		{:else}
			<a href={resolve('/sessions')} class={cn(navItemClass, navLinkClass)} onclick={goSessions}>
				{$messages['app.mySessions']}
			</a>
		{/if}

		{#if isSession}
			<ChevronRight class="size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
			<span
				class={cn(
					'max-w-[min(26rem,calc(100vw-17rem))] min-w-0 truncate text-sm sm:max-w-md md:max-w-lg',
					navActiveClass,
				)}
				aria-current="page"
				title={sessionPromptLabel}
			>
				{sessionPromptLabel}
			</span>
		{/if}
	</nav>

	<div class="flex shrink-0 items-center gap-2">
		<ScaffyDropdown label={currentLanguage.name} menuAriaLabel={$messages['app.languageLabel']}>
			{#snippet menu({ close })}
				{#each AVAILABLE_LANGUAGES as lang (lang.code)}
					<ScaffyDropdownItem
						selected={lang.code === $language}
						onclick={() => {
							setLanguage(lang.code);
							close();
						}}
					>
						{lang.name}
					</ScaffyDropdownItem>
				{/each}
			{/snippet}
		</ScaffyDropdown>

		<Button
			type="button"
			variant="ghost"
			size="toolbar"
			class={toolbarActionButtonClass}
			aria-label={$messages['app.aboutAriaLabel']}
			onclick={() => (aboutOpen = true)}
		>
			<CircleHelp />
		</Button>
		<AboutDialog bind:open={aboutOpen} />
	</div>
</header>
