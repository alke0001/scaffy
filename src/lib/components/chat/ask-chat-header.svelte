<script lang="ts">
	import ScaffyLogo from '$lib/assets/scaffy-logo.svelte';
	import { messages } from '$lib/i18n';
</script>

<header class="ask-chat-header shrink-0 px-1 pt-1 pb-3">
	<div class="flex items-start gap-3">
		<ScaffyLogo width={28} height={28} class="mt-0.5 shrink-0" />
		<div class="min-w-0">
			<h2 class="font-mono text-sm font-bold tracking-tight text-foreground">
				{$messages['tutor.title']}
			</h2>

			<p class="text-xs leading-relaxed text-muted-foreground">
				{$messages['tutor.subtitle']}
			</p>
		</div>
	</div>
</header>
