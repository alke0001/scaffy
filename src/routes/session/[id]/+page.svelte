<script lang="ts">
	import { page } from '$app/state';
	import SessionWorkspace from '$lib/components/session/session-workspace.svelte';
</script>

{#if page.params.id}
	<SessionWorkspace sessionId={page.params.id} />
{/if}
