<script lang="ts">
	import {
		ScaffyModal,
		ScaffyModalHeader,
		ScaffyModalBody,
		ScaffyModalActions,
		ScaffyModalButton,
	} from '$lib/components/ui/scaffy-modal/index.js';

	let {
		onConfirm,
		onCancel,
	}: {
		onConfirm: () => void;
		onCancel: () => void;
	} = $props();
</script>

<ScaffyModal variant="error" ariaLabelledby="delete-title" onDismiss={onCancel}>
	<ScaffyModalHeader icon="⚠" title="Delete this session?" titleId="delete-title" />

	<ScaffyModalBody>
		<p class="scaffy-modal-card__message">
			This cannot be undone. All scaffolds saved in this session will be lost.
		</p>
	</ScaffyModalBody>

	<ScaffyModalActions>
		<ScaffyModalButton variant="secondary" onclick={onCancel}>Cancel</ScaffyModalButton>
		<ScaffyModalButton variant="danger" onclick={onConfirm}>Delete</ScaffyModalButton>
	</ScaffyModalActions>
</ScaffyModal>
