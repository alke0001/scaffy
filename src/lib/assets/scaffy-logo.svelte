<script lang="ts">
	let {
		class: className,
		width = 52,
		height = 52,
		interactive = false,
		ariaLabel = 'Zur Startseite',
		onclick,
	}: {
		class?: string;
		width?: number;
		height?: number;
		/** When true, renders as a button with hover affordance (e.g. title bar → home). */
		interactive?: boolean;
		ariaLabel?: string;
		onclick?: () => void;
	} = $props();
</script>

{#snippet mark()}
	<svg
		{width}
		{height}
		viewBox="0 0 100 100"
		fill="none"
		xmlns="http://www.w3.org/2000/svg"
		aria-hidden="true"
		class={interactive ? undefined : className}
	>
		<rect x="14" y="18" width="12" height="12" rx="3" fill="var(--scaffy-logo-teal)" />
		<rect x="28" y="18" width="12" height="12" rx="3" fill="var(--scaffy-logo-green)" />
		<rect x="42" y="18" width="12" height="12" rx="3" fill="var(--scaffy-logo-green)" />
		<rect x="56" y="18" width="12" height="12" rx="3" fill="var(--scaffy-logo-blue)" />
		<rect x="70" y="18" width="12" height="12" rx="3" fill="var(--scaffy-logo-blue)" />
		<rect x="14" y="32" width="12" height="12" rx="3" fill="var(--scaffy-logo-teal)" />
		<rect x="14" y="46" width="12" height="12" rx="3" fill="var(--scaffy-logo-teal)" />
		<rect x="28" y="46" width="12" height="12" rx="3" fill="var(--scaffy-logo-green)" />
		<rect x="42" y="46" width="12" height="12" rx="3" fill="var(--scaffy-logo-green)" />
		<rect x="56" y="46" width="12" height="12" rx="3" fill="var(--scaffy-logo-green)" />
		<rect x="70" y="46" width="12" height="12" rx="3" fill="var(--scaffy-logo-green)" />
		<rect x="70" y="60" width="12" height="12" rx="3" fill="var(--scaffy-logo-green)" />
		<rect x="14" y="74" width="12" height="12" rx="3" fill="var(--scaffy-logo-green)" />
		<rect x="28" y="74" width="12" height="12" rx="3" fill="var(--scaffy-logo-pink)" />
		<rect x="42" y="74" width="12" height="12" rx="3" fill="var(--scaffy-logo-pink)" />
		<rect x="56" y="74" width="12" height="12" rx="3" fill="var(--scaffy-logo-pink)" />
		<rect x="70" y="74" width="12" height="12" rx="3" fill="var(--scaffy-logo-green)" />
		<text x="34" y="27" font-size="8" font-family="monospace" fill="var(--primary-foreground)"
			>&gt;</text
		>
		<text x="32" y="83" font-size="8" font-family="monospace" fill="var(--primary-foreground)"
			>&lt;</text
		>
		<text x="48" y="83" font-size="8" font-family="monospace" fill="var(--primary-foreground)"
			>/</text
		>
	</svg>
{/snippet}

{#if interactive}
	<button
		type="button"
		class="scaffy-logo-link shrink-0 {className ?? ''}"
		{onclick}
		aria-label={ariaLabel}
	>
		<span class="scaffy-logo-link-mark">
			{@render mark()}
		</span>
	</button>
{:else}
	{@render mark()}
{/if}
