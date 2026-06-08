<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import AppTitleBar from '$lib/components/shell/app-title-bar.svelte';

	let { children } = $props();
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

<div class="flex h-dvh w-full flex-col overflow-hidden">
	<AppTitleBar />
	<div class="min-h-0 flex-1 overflow-hidden">
		{@render children()}
	</div>
</div>
