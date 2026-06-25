import type { LanguageCode } from '$lib/i18n/index.js';

/** Home-screen example chips — full prompts for scaffold API; labels are short chip text. */
export type ExamplePrompt = {
	label: string;
	prompt: string;
};

/** Stages 1–3 from docs/run-test-prompts-profile-card.md; stage 4 is a simple Svelte 5 intro exercise. */
export const HOME_EXAMPLE_PROMPTS: Record<LanguageCode, readonly ExamplePrompt[]> = {
	en: [
		{
			label: 'Profile card with social links...',
			prompt:
				'please make me a profile card with name, image and a description. you should also be able to add social links at the bottom',
		},
		{
			label: 'ProfileCard with props and slots...',
			prompt:
				'I need a ProfileCard component in Svelte. It should take name, image and description as props. Below it there should be room for social links (instagram, github etc.) that the user of the component can add themselves.',
		},
		{
			label: 'Svelte 5 ProfileCard task...',
			prompt:
				'Build a ProfileCard component: props are name, image, description. Bonus: slot/children area for additional content such as social links. Framework: Svelte 5.',
		},
		{
			label: 'Simple click counter with runes...',
			prompt:
				'Build me a simple Svelte 5 component with a button that increments a counter on every click. Show me step by step how to hold the counter state with runes in a single component.',
		},
	],
	de: [
		{
			label: 'Profilcard mit Social Links...',
			prompt:
				'mach mir bitte eine profilcard mit name, bild und ne beschreibung. man soll auch noch social links unten reinpacken können',
		},
		{
			label: 'ProfileCard mit Props und Slots...',
			prompt:
				'Ich brauche eine ProfileCard Komponente in Svelte. Sie soll name, image und description als props bekommen. Unten drunter soll noch Platz für Social Links sein (instagram, github etc.) die der Nutzer der Komponente selber reinpacken kann.',
		},
		{
			label: 'Svelte 5 ProfileCard Aufgabe...',
			prompt:
				'ProfileCard Komponente bauen: Props sind name, image, description. Bonus: Slot/Children-Bereich für zusätzlichen Inhalt wie Social-Links. Framework: Svelte 5.',
		},
		{
			label: 'Einfacher Klick-Zähler mit Runes...',
			prompt:
				'Baue mir eine einfache Svelte 5 Komponente mit einem Button der bei jedem Klick einen Zähler hochzählt. Zeig mir Schritt für Schritt wie ich den Zählerstand mit Runes in einer einzigen Komponente halte.',
		},
	],
} as const;
