export type AboutFaqItem = {
	id: string;
	question: string;
	answer: string;
};

export const ABOUT_FAQ: AboutFaqItem[] = [
	{
		id: 'chatgpt',
		question: 'How is Scaffy different from ChatGPT or Copilot?',
		answer:
			'Those tools optimize for speed: one prompt, one complete answer. Scaffy optimizes for learning: code is revealed in steps, and you must understand each concept before moving on. The chat tutor supports the lesson instead of replacing it.',
	},
	{
		id: 'prompt',
		question: "Why can't I paste code in my prompt on the home screen?",
		answer:
			'The home prompt is for intent in plain language. Describe what you want to build and let Scaffy handle the implementation during the lesson.',
	},
	{
		id: 'locked',
		question: 'Why is the next code chunk locked?',
		answer:
			'Each scaffold ends with a Learning Card (multiple-choice gate). The next chunk unlocks only after you answer correctly. The friction is intentional and encourages active learning.',
	},
	{
		id: 'wrong',
		question: 'What happens if I answer a question wrong?',
		answer:
			'Scaffy shows a short explanation connected to that question. Read it, acknowledge it, and try again. The goal is understanding, not grading.',
	},
	{
		id: 'scaffolds',
		question: 'What are scaffolds?',
		answer:
			'A scaffold is one teaching step: a code snippet plus a Learning Card about the concept used in that snippet. Several scaffolds together form a complete feature or component.',
	},
	{
		id: 'storage',
		question: 'Where are my sessions stored?',
		answer:
			'Sessions are stored in localStorage inside your browser. Clearing browser data or switching devices will not carry them over.',
	},
	{
		id: 'apikey',
		question: 'Do I need my own API key?',
		answer:
			"No. Scaffy communicates with AI through the application's server. API keys remain on the server and are never exposed to the browser.",
	},
	{
		id: 'frameworks',
		question: 'Which frameworks does Scaffy support?',
		answer:
			'Scaffy currently focuses on Svelte 5. Examples, scaffolds, and tutoring are optimized for the Svelte 5 component model.',
	},
];
