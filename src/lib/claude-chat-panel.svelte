<script lang="ts">
	// Smoke-test UI: the browser never talks to Anthropic directly. It only calls our
	// SvelteKit route handler at src/routes/api/generate/+server.ts (POST /api/generate),
	// which holds the API key and forwards the prompt to Claude.

	let prompt = $state(
		'Explain in one short sentence what a Svelte component is, without using angle brackets or semicolons'
	);
	let output = $state('');
	let errorMessage = $state('');
	let loading = $state(false);

	function isKitErrorBody(value: unknown): value is { message: string } {
		return (
			typeof value === 'object' &&
			value !== null &&
			'message' in value &&
			typeof (value as { message: unknown }).message === 'string'
		);
	}

	async function onSubmit(event: SubmitEvent) {
		event.preventDefault();
		errorMessage = '';
		output = '';
		loading = true;
		try {
			// Same-origin request: Vite/SvelteKit serves +server.ts as POST /api/generate.
			// Body matches what +server.ts expects: { prompt: string, model?: string }.
			const res = await fetch('/api/generate', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ prompt: prompt.trim() })
			});

			// Read once as text so we can handle both JSON success and non-JSON error pages.
			const text = await res.text();

			if (!res.ok) {
				// +server.ts uses SvelteKit error(): body is usually { message: string }.
				try {
					const body: unknown = JSON.parse(text);
					errorMessage = isKitErrorBody(body) ? body.message : text || res.statusText;
				} catch {
					errorMessage = text || res.statusText;
				}
				return;
			}

			// Success: +server.ts returns json({ scaffolds }) — pretty-print for the readonly textarea.
			try {
				const data: unknown = JSON.parse(text);
				output = JSON.stringify(data, null, 2);
				if (import.meta.env.DEV) {
					// Same pretty JSON as the textarea — easy to scan or copy from DevTools.
					console.log(
						`[claude-chat-panel] POST /api/generate (${res.status})\n${JSON.stringify(data, null, 2)}`
					);
				}
			} catch {
				output = text;
			}
		} catch (e) {
			// Network failure, CORS misconfig (unlikely here), or other fetch-level errors.
			errorMessage = e instanceof Error ? e.message : 'Request failed';
		} finally {
			loading = false;
		}
	}
</script>

<!-- Submitting the form runs onSubmit above (client only); the Anthropic call happens on the server. -->
<section class="space-y-3" aria-label="Claude API smoke test">
	<h2 class="text-lg font-semibold">API smoke test</h2>
	<form class="space-y-2" onsubmit={onSubmit}>
		<label class="block text-sm font-medium" for="prompt-input">User prompt</label>
		<textarea
			id="prompt-input"
			class="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring min-h-28 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
			bind:value={prompt}
			disabled={loading}
			placeholder="At least 10 characters; avoid &lt;, curly braces, and semicolons (server heuristic)."
		></textarea>
		<button
			type="submit"
			class="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex h-9 items-center justify-center rounded-md px-4 text-sm font-medium disabled:pointer-events-none disabled:opacity-50"
			disabled={loading}
		>
			{loading ? 'Calling API…' : 'Send to /api/generate'}
		</button>
	</form>

	{#if errorMessage}
		<p class="text-destructive text-sm whitespace-pre-wrap" role="alert">{errorMessage}</p>
	{/if}

	<label class="block text-sm font-medium" for="response-output">Response (read-only)</label>
	<textarea
		id="response-output"
		class="border-input bg-muted/30 text-muted-foreground min-h-48 w-full rounded-md border px-3 py-2 font-mono text-xs whitespace-pre-wrap"
		readonly
		bind:value={output}
		placeholder="Successful JSON from the server appears here."
	></textarea>
</section>
