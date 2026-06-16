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
	import aboutContent from './about-content.md?raw';
	import { ABOUT_FAQ } from './about-faq.js';

	let { open = $bindable(false) }: { open?: boolean } = $props();

	function close() {
		open = false;
	}
</script>

{#if open}
	<ScaffyModal size="lg" ariaLabelledby="about-title" onDismiss={close}>
		<ScaffyModalHeader icon="?" title="About Scaffy" titleId="about-title" />

		<ScaffyModalBody scroll>
			<div class="space-y-8 px-1 pr-3 pb-4 text-sm">
				<MarkdownContent content={aboutContent} />

				<section class="space-y-3">
					<h3 class="text-sm font-semibold text-muted-foreground">FAQ</h3>

					<Accordion.Root type="single">
						{#each ABOUT_FAQ as item (item.id)}
							<Accordion.Item value={item.id}>
								<Accordion.Trigger>{item.question}</Accordion.Trigger>
								<Accordion.Content>{item.answer}</Accordion.Content>
							</Accordion.Item>
						{/each}
					</Accordion.Root>
				</section>
			</div>
		</ScaffyModalBody>

		<ScaffyModalActions>
			<ScaffyModalButton variant="primary" onclick={close}>Close</ScaffyModalButton>
		</ScaffyModalActions>
	</ScaffyModal>
{/if}
