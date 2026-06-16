import type { Scaffold } from '$lib/types/scaffold.js';

/** Fisher-Yates shuffle of knowledge-check options; remaps ids to a–d and correctOptionId. */
export function shuffleScaffoldOptions(scaffolds: Scaffold[]): Scaffold[] {
	return scaffolds.map((scaffold) => {
		const kc = scaffold.knowledgeCheck;
		if (!kc?.options?.length) return scaffold;

		const options = [...kc.options];
		const correctOption = options.find((option) => option.id === kc.correctOptionId);
		if (!correctOption) return scaffold;

		for (let i = options.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[options[i], options[j]] = [options[j], options[i]];
		}

		const ids = ['a', 'b', 'c', 'd', 'e', 'f'];
		const remappedOptions = options.map((option, index) => ({
			...option,
			id: ids[index] ?? option.id,
		}));

		const newCorrectOption = remappedOptions.find((option) => option.text === correctOption.text);

		return {
			...scaffold,
			knowledgeCheck: {
				...kc,
				options: remappedOptions,
				correctOptionId: newCorrectOption?.id ?? kc.correctOptionId,
			},
		};
	});
}
