<script lang="ts">
	import { page } from '$app/state';
	import { getSessionById } from '$lib/session.svelte.js';
	import * as Breadcrumb from '$lib/components/ui/breadcrumb/index.js';
	import { resolve } from '$app/paths';

	const pathname = $derived(page.url.pathname);
	const sessionId = $derived(typeof page.params.id === 'string' ? page.params.id : undefined);

	const isHome = $derived(pathname === '/');
	const isSessions = $derived(pathname === '/sessions');
	const isSession = $derived(Boolean(sessionId && pathname.startsWith('/session/')));

	const sessionPromptLabel = $derived.by(() => {
		if (!sessionId) return 'Session';
		const session = getSessionById(sessionId);
		if (!session) return 'Session';
		return truncateLabel(session.prompt, 20);
	});

	function truncateLabel(text: string, max: number) {
		return text.length > max ? `${text.slice(0, max)}…` : text;
	}
</script>

<span class="font-mono text-sm text-muted-foreground" aria-hidden="true">›</span>

<Breadcrumb.Root class="min-w-0">
	<Breadcrumb.List class="font-mono">
		{#if isHome}
			<Breadcrumb.Item>
				<Breadcrumb.Page class="text-ring">Start new learning session</Breadcrumb.Page>
			</Breadcrumb.Item>
		{:else if isSessions}
			<Breadcrumb.Item>
				<Breadcrumb.Page class="text-ring">My learning sessions</Breadcrumb.Page>
			</Breadcrumb.Item>
		{:else if isSession}
			<Breadcrumb.Item>
				<Breadcrumb.Link href={resolve('/sessions')} class="text-muted-foreground">
					My learning sessions
				</Breadcrumb.Link>
			</Breadcrumb.Item>
			<Breadcrumb.Separator />
			<Breadcrumb.Item class="max-w-[12rem] min-w-0 sm:max-w-md">
				<Breadcrumb.Page class="truncate text-ring">{sessionPromptLabel}</Breadcrumb.Page>
			</Breadcrumb.Item>
		{/if}
	</Breadcrumb.List>
</Breadcrumb.Root>
