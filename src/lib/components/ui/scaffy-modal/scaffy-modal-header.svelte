<script lang="ts">
	let {
		icon,
		title,
		titleId,
	}: {
		icon: string;
		title: string;
		titleId: string;
	} = $props();
</script>

<div class="scaffy-modal-card__header">
	<div class="scaffy-modal-card__icon" aria-hidden="true">{icon}</div>
	<h2 id={titleId} class="scaffy-modal-card__title">{title}</h2>
</div>
