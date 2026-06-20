<script lang="ts">
	import './layout.css';
	import AppTitleBar from '$lib/components/shell/app-title-bar.svelte';

	let { children } = $props();
</script>

<svelte:head>
	<title>Scaffy</title>
	<link rel="icon" href="/favicon.svg" type="image/svg+xml" />
</svelte:head>

<div class="flex h-dvh w-full flex-col overflow-hidden">
	<AppTitleBar />
	<div class="min-h-0 flex-1 overflow-hidden">
		{@render children()}
	</div>
</div>
