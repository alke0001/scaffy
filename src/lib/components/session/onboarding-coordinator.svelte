<script lang="ts">
	import { browser } from '$app/environment';
	import { OnboardingSpotlight } from '$lib/components/ui/onboarding-spotlight/index.js';
	import { getSessionById } from '$lib/global-state/session.svelte.js';
	import {
		completeOnboarding,
		hasCompletedOnboarding,
	} from '$lib/global-state/onboarding.svelte.js';
	import { messages } from '$lib/i18n/index.js';

	interface Props {
		sessionId: string;
		chatPaneEl: HTMLElement | null;
		onActiveChange?: (active: boolean) => void;
	}

	let { sessionId, chatPaneEl, onActiveChange }: Props = $props();

	const session = $derived(getSessionById(sessionId));
	const open = $derived(
		browser && Boolean(session) && !hasCompletedOnboarding() && !session!.lessonStarted,
	);

	$effect(() => {
		onActiveChange?.(open);
		if (session?.lessonStarted && !hasCompletedOnboarding()) {
			completeOnboarding();
		}
	});
</script>

<OnboardingSpotlight
	{open}
	target={chatPaneEl}
	title={$messages['onboarding.title']}
	body={$messages['onboarding.body']}
	primaryLabel={$messages['onboarding.acknowledge']}
	placement="auto"
	onPrimary={completeOnboarding}
/>
