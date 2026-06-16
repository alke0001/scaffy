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
	<ScaffyModalHeader icon="⚠" title="Session wirklich löschen?" titleId="delete-title" />

	<ScaffyModalBody>
		<p class="scaffy-modal-card__message">
			Diese Aktion kann nicht rückgängig gemacht werden. Alle gespeicherten Scaffolds dieser Session
			gehen verloren.
		</p>
	</ScaffyModalBody>

	<ScaffyModalActions>
		<ScaffyModalButton variant="secondary" onclick={onCancel}>Abbrechen</ScaffyModalButton>
		<ScaffyModalButton variant="danger" onclick={onConfirm}>Löschen</ScaffyModalButton>
	</ScaffyModalActions>
</ScaffyModal>
