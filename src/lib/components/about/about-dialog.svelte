<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog';
	import * as Accordion from '$lib/components/ui/accordion';
</script>

<Dialog.Content class="max-h-[80vh] w-[90vw] max-w-5xl overflow-y-auto">
	<Dialog.Header>
		<Dialog.Title>About Scaffy</Dialog.Title>
	</Dialog.Header>

	<div class="space-y-8 text-sm">
		<section class="space-y-3">
			<h3 class="text-base font-semibold">What is Scaffy?</h3>

			<p>
				Scaffy is a learning tool for building real UI code step by step. You describe what you want
				in plain language; Scaffy breaks the solution into small chunks and shows them in a code
				editor one piece at a time.
			</p>

			<p>
				Unlike tools that dump a full solution at once, Scaffy adds deliberate friction: before each
				new chunk appears, you answer a short concept question. That pause is intentional — it turns
				passive copying into active understanding.
			</p>

			<p>
				Scaffy is built for people learning framework-based UI development, especially Svelte 5.
				Step content in a session is generated in German (course language); the app chrome stays in
				English.
			</p>
		</section>

		<section class="space-y-3">
			<h3 class="text-base font-semibold">How it works</h3>

			<ul class="list-disc space-y-2 pl-5">
				<li>
					<strong>Home</strong> — Describe your goal in plain language (no raw code tokens). Start a session.
				</li>

				<li>
					<strong>Session</strong> — Code appears in the Monaco editor as teaching steps. A knowledge
					check blocks the next step until you answer correctly.
				</li>

				<li>
					<strong>Wrong answer?</strong> — You get a short explanation and can try again until the concept
					clicks.
				</li>

				<li>
					<strong>Ask panel</strong> — Use the chat on the right for a Socratic tutor that explains concepts
					without dumping a complete solution.
				</li>

				<li>
					<strong>History</strong> — Past sessions are stored in this browser and can be resumed later.
				</li>
			</ul>
		</section>

		<section class="space-y-3">
			<h3 class="text-base font-semibold">Learn vs Ask</h3>

			<div class="overflow-x-auto rounded-md border">
				<table class="w-full text-left text-sm">
					<thead class="border-b">
						<tr>
							<th class="p-3"></th>
							<th class="p-3">Learn (home → session)</th>
							<th class="p-3">Ask (session chat)</th>
						</tr>
					</thead>

					<tbody>
						<tr class="border-b">
							<td class="p-3 font-medium">When</td>
							<td class="p-3"> Starting a new lesson from your prompt </td>
							<td class="p-3"> While you work through a session </td>
						</tr>

						<tr class="border-b">
							<td class="p-3 font-medium">What you get</td>
							<td class="p-3"> Structured steps + multiple-choice checks </td>
							<td class="p-3"> Streaming tutor replies and concept explanations </td>
						</tr>

						<tr>
							<td class="p-3 font-medium">Goal</td>
							<td class="p-3"> Walk through the full build in order </td>
							<td class="p-3"> Unblock one specific doubt </td>
						</tr>
					</tbody>
				</table>
			</div>
		</section>

		<section class="space-y-3">
			<h3 class="text-base font-semibold">FAQ</h3>

			<Accordion.Root type="single">
				<Accordion.Item value="chatgpt">
					<Accordion.Trigger>How is Scaffy different from ChatGPT or Copilot?</Accordion.Trigger>
					<Accordion.Content>
						Those tools optimize for speed: one prompt, one complete answer. Scaffy optimizes for
						learning: code is revealed in steps, and you must understand each concept before moving
						on. The chat tutor supports the lesson instead of replacing it.
					</Accordion.Content>
				</Accordion.Item>

				<Accordion.Item value="prompt">
					<Accordion.Trigger>
						Why can't I paste code in my prompt on the home screen?
					</Accordion.Trigger>
					<Accordion.Content>
						The home prompt is for intent in plain language. Describe what you want to build and let
						Scaffy handle the implementation during the lesson.
					</Accordion.Content>
				</Accordion.Item>

				<Accordion.Item value="locked">
					<Accordion.Trigger>Why is the next code chunk locked?</Accordion.Trigger>
					<Accordion.Content>
						Each scaffold ends with a knowledge check. The next chunk unlocks only after you answer
						correctly. The friction is intentional and encourages active learning.
					</Accordion.Content>
				</Accordion.Item>

				<Accordion.Item value="wrong">
					<Accordion.Trigger>What happens if I answer a question wrong?</Accordion.Trigger>
					<Accordion.Content>
						Scaffy shows a short explanation connected to that question. Read it, acknowledge it,
						and try again. The goal is understanding, not grading.
					</Accordion.Content>
				</Accordion.Item>

				<Accordion.Item value="scaffolds">
					<Accordion.Trigger>What are scaffolds?</Accordion.Trigger>
					<Accordion.Content>
						A scaffold is one teaching step: a code snippet plus a knowledge check about the concept
						used in that snippet. Several scaffolds together form a complete feature or component.
					</Accordion.Content>
				</Accordion.Item>

				<Accordion.Item value="storage">
					<Accordion.Trigger>Where are my sessions stored?</Accordion.Trigger>
					<Accordion.Content>
						Sessions are stored in localStorage inside your browser. Clearing browser data or
						switching devices will not carry them over.
					</Accordion.Content>
				</Accordion.Item>

				<Accordion.Item value="apikey">
					<Accordion.Trigger>Do I need my own API key?</Accordion.Trigger>
					<Accordion.Content>
						No. Scaffy communicates with AI through the application's server. API keys remain on the
						server and are never exposed to the browser.
					</Accordion.Content>
				</Accordion.Item>

				<Accordion.Item value="frameworks">
					<Accordion.Trigger>Which frameworks does Scaffy support?</Accordion.Trigger>
					<Accordion.Content>
						Scaffy currently focuses on Svelte 5. Examples, scaffolds, and tutoring are optimized
						for the Svelte 5 component model.
					</Accordion.Content>
				</Accordion.Item>
			</Accordion.Root>
		</section>
	</div>
</Dialog.Content>
