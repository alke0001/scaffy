<script lang="ts">
	import { portal } from '$lib/actions/portal.js';

	let {
		x,
		y,
		placement = 'above',
	}: {
		x: number;
		y: number;
		placement?: 'above' | 'below';
	} = $props();
</script>

<div
	use:portal
	class="scaffy-readonly-hint"
	class:scaffy-readonly-hint--below={placement === 'below'}
	style:left={`${x}px`}
	style:top={`${y}px`}
	role="status"
>
	<p class="scaffy-readonly-hint__text">
		Du kannst den Code erst bearbeiten, wenn alle Learning Cards abgeschlossen sind. Kopieren ist
		jederzeit möglich.
	</p>
</div>
