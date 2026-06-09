/** Home-screen example chips — full prompts for scaffold API; labels are short chip text. */
export type ExamplePrompt = {
	label: string;
	prompt: string;
};

/** Stages 1–3 from docs/run-test-prompts-profile-card.md; stage 4 is a simple Svelte 5 intro exercise. */
export const HOME_EXAMPLE_PROMPTS: readonly ExamplePrompt[] = [
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
] as const;
