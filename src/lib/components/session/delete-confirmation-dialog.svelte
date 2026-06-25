<script lang="ts">
	import {
		ScaffyModal,
		ScaffyModalHeader,
		ScaffyModalBody,
		ScaffyModalActions,
		ScaffyModalButton,
	} from '$lib/components/ui/scaffy-modal/index.js';
	import { messages } from '$lib/i18n/index.js';

	let {
		onConfirm,
		onCancel,
	}: {
		onConfirm: () => void;
		onCancel: () => void;
	} = $props();
</script>

<ScaffyModal variant="error" ariaLabelledby="delete-title" onDismiss={onCancel}>
	<ScaffyModalHeader
		icon="⚠"
		title={$messages['session.deleteConfirmTitle']}
		titleId="delete-title"
	/>

	<ScaffyModalBody>
		<p class="scaffy-modal-card__message">
			{$messages['session.deleteConfirmMessage']}
		</p>
	</ScaffyModalBody>

	<ScaffyModalActions>
		<ScaffyModalButton variant="secondary" onclick={onCancel}
			>{$messages['session.deleteCancel']}</ScaffyModalButton
		>
		<ScaffyModalButton variant="danger" onclick={onConfirm}
			>{$messages['session.deleteConfirm']}</ScaffyModalButton
		>
	</ScaffyModalActions>
</ScaffyModal>
