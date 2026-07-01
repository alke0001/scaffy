<script lang="ts">
	import { portal } from '$lib/actions/portal.js';
	import { Button } from '$lib/components/ui/button/index.js';

	export type OnboardingSpotlightPlacement = 'top' | 'bottom' | 'left' | 'right' | 'auto';

	interface Props {
		open: boolean;
		target: HTMLElement | null;
		title: string;
		body: string;
		primaryLabel: string;
		primaryDisabled?: boolean;
		primaryEmphasis?: boolean;
		placement?: OnboardingSpotlightPlacement;
		onPrimary: () => void;
	}

	let {
		open,
		target,
		title,
		body,
		primaryLabel,
		primaryDisabled = false,
		primaryEmphasis = false,
		placement = 'auto',
		onPrimary,
	}: Props = $props();

	const CARD_WIDTH_PX = 320;
	const CARD_GAP_PX = 16;
	const VIEWPORT_PAD_PX = 12;

	let targetRect = $state<DOMRect | null>(null);
	let primaryButton = $state<HTMLButtonElement | null>(null);

	function measureTarget() {
		if (!open || !target) {
			targetRect = null;
			return;
		}
		targetRect = target.getBoundingClientRect();
	}

	function resolvedPlacement(): Exclude<OnboardingSpotlightPlacement, 'auto'> {
		if (!targetRect) return 'bottom';
		if (placement !== 'auto') return placement;

		const spaceBelow = window.innerHeight - targetRect.bottom;
		const spaceAbove = targetRect.top;
		if (spaceBelow >= 180) return 'bottom';
		if (spaceAbove >= 180) return 'top';
		if (targetRect.left >= CARD_WIDTH_PX + CARD_GAP_PX * 2) return 'left';
		return 'right';
	}

	const cardPosition = $derived.by(() => {
		if (!targetRect) return { top: VIEWPORT_PAD_PX, left: VIEWPORT_PAD_PX };

		const side = resolvedPlacement();
		const maxLeft = Math.max(
			VIEWPORT_PAD_PX,
			Math.min(targetRect.left, window.innerWidth - CARD_WIDTH_PX - VIEWPORT_PAD_PX),
		);

		switch (side) {
			case 'top':
				return {
					top: Math.max(VIEWPORT_PAD_PX, targetRect.top - CARD_GAP_PX - 160),
					left: maxLeft,
				};
			case 'left':
				return {
					top: Math.max(VIEWPORT_PAD_PX, targetRect.top),
					left: Math.max(VIEWPORT_PAD_PX, targetRect.left - CARD_WIDTH_PX - CARD_GAP_PX),
				};
			case 'right':
				return {
					top: Math.max(VIEWPORT_PAD_PX, targetRect.top),
					left: Math.min(
						window.innerWidth - CARD_WIDTH_PX - VIEWPORT_PAD_PX,
						targetRect.right + CARD_GAP_PX,
					),
				};
			case 'bottom':
			default:
				return {
					top: Math.min(
						window.innerHeight - 180 - VIEWPORT_PAD_PX,
						targetRect.bottom + CARD_GAP_PX,
					),
					left: maxLeft,
				};
		}
	});

	const highlightStyle = $derived.by(() => {
		if (!targetRect) return '';
		return [
			`left:${targetRect.left}px`,
			`top:${targetRect.top}px`,
			`width:${Math.max(targetRect.width, 1)}px`,
			`height:${Math.max(targetRect.height, 1)}px`,
		].join(';');
	});

	$effect(() => {
		if (!open || !target) {
			targetRect = null;
			return;
		}

		measureTarget();
		const observer = new ResizeObserver(measureTarget);
		observer.observe(target);

		const onViewportChange = () => measureTarget();
		window.addEventListener('resize', onViewportChange);
		window.addEventListener('scroll', onViewportChange, true);

		return () => {
			observer.disconnect();
			window.removeEventListener('resize', onViewportChange);
			window.removeEventListener('scroll', onViewportChange, true);
		};
	});

	$effect(() => {
		if (!open) return;
		queueMicrotask(() => primaryButton?.focus());
	});
</script>

{#if open && target && targetRect}
	<div use:portal class="fixed inset-0 z-[120]" role="presentation" aria-hidden="true">
		<div
			class="pointer-events-none absolute rounded-md ring-2 ring-primary/80"
			style="{highlightStyle}; box-shadow: 0 0 0 9999px rgb(0 0 0 / 0.62)"
		></div>
	</div>

	<div
		use:portal
		class="fixed z-[121] w-80 max-w-[calc(100vw-1.5rem)] rounded-lg border border-border bg-popover p-4 text-popover-foreground shadow-lg"
		role="dialog"
		aria-modal="true"
		aria-labelledby="onboarding-spotlight-title"
		style:top="{cardPosition.top}px"
		style:left="{cardPosition.left}px"
	>
		<h2 id="onboarding-spotlight-title" class="text-base font-semibold">{title}</h2>
		<p class="mt-2 text-sm text-muted-foreground">{body}</p>
		<div class="mt-4 flex justify-end">
			<Button
				bind:ref={primaryButton}
				type="button"
				disabled={primaryDisabled}
				class={primaryEmphasis && !primaryDisabled
					? 'bg-emerald-600 text-white hover:bg-emerald-600/90'
					: undefined}
				onclick={onPrimary}
			>
				{primaryLabel}
			</Button>
		</div>
	</div>
{/if}
