<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog';
	import * as Accordion from '$lib/components/ui/accordion';
	import { ScrollArea } from '$lib/components/ui/scroll-area/index.js';
	import { MarkdownContent } from '$lib/components/ui/markdown/index.js';
	import aboutContent from './about-content.md?raw';
	import { ABOUT_FAQ } from './about-faq.js';
</script>

<Dialog.Content
	class="grid max-h-[85vh] w-[92vw] grid-rows-[auto_minmax(0,1fr)] gap-0 overflow-hidden p-0 sm:max-w-7xl"
>
	<Dialog.Header class="border-b border-border px-6 pt-6 pb-5">
		<Dialog.Title class="text-2xl font-semibold tracking-tight">About Scaffy</Dialog.Title>
	</Dialog.Header>

	<ScrollArea orientation="vertical" class="h-full min-h-0">
		<div class="space-y-8 px-6 pt-6 pb-6 text-sm">
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
	</ScrollArea>
</Dialog.Content>
