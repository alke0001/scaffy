<script lang="ts">
	import * as Accordion from '$lib/components/ui/accordion';
	import { MarkdownContent } from '$lib/components/ui/markdown/index.js';
	import {
		ScaffyModal,
		ScaffyModalHeader,
		ScaffyModalBody,
		ScaffyModalActions,
		ScaffyModalButton,
	} from '$lib/components/ui/scaffy-modal/index.js';
	import { language, messages } from '$lib/i18n/index.js';

	import aboutContentEn from './about-content.md?raw';
	import aboutContentDe from './about-content.de.md?raw';
	import { ABOUT_FAQ_IDS } from './about-faq.js';

	let { open = $bindable(false) }: { open?: boolean } = $props();

	const aboutContent = $derived($language === 'de' ? aboutContentDe : aboutContentEn);

	function close() {
		open = false;
	}
</script>

{#if open}
	<ScaffyModal size="lg" ariaLabelledby="about-title" onDismiss={close}>
		<ScaffyModalHeader icon="?" title={$messages['app.about']} titleId="about-title" />

		<ScaffyModalBody scroll>
			<div class="space-y-8 px-1 pr-3 pb-4 text-sm">
				<MarkdownContent content={aboutContent} />

				<section class="space-y-3">
					<h3 class="text-sm font-semibold text-muted-foreground">
						{$messages['about.faqHeading']}
					</h3>

					<Accordion.Root type="single">
						{#each ABOUT_FAQ_IDS as id (id)}
							<Accordion.Item value={id}>
								<Accordion.Trigger>{$messages[`about.faq.${id}.question`]}</Accordion.Trigger>
								<Accordion.Content>{$messages[`about.faq.${id}.answer`]}</Accordion.Content>
							</Accordion.Item>
						{/each}
					</Accordion.Root>
				</section>
			</div>
		</ScaffyModalBody>

		<ScaffyModalActions>
			<ScaffyModalButton variant="primary" onclick={close}
				>{$messages['about.close']}</ScaffyModalButton
			>
		</ScaffyModalActions>
	</ScaffyModal>
{/if}
