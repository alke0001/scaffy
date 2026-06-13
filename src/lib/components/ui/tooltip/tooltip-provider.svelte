<script lang="ts">
	import { Tooltip as TooltipPrimitive } from 'bits-ui';

	let {
		delayDuration = 650,
		skipDelayDuration = 120,
		...restProps
	}: TooltipPrimitive.ProviderProps = $props();
</script>

<TooltipPrimitive.Provider {delayDuration} {skipDelayDuration} {...restProps} />
