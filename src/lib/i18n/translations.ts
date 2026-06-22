export type LanguageCode = 'en' | 'de';

export const DEFAULT_LANGUAGE: LanguageCode = 'en';

export const AVAILABLE_LANGUAGES = [
	{ code: 'en', label: 'Eng', name: 'English' },
	{ code: 'de', label: 'Deu', name: 'Deutsch' },
] as const;

export const TRANSLATIONS: Record<LanguageCode, Record<string, string>> = {
	en: {
		'app.title': 'scaffy',
		'app.about': 'About Scaffy',
		'app.aboutAriaLabel': 'About Scaffy',
		'app.mySessions': 'My Sessions',
		'app.session': 'Session',
		'app.languageLabel': 'Language',

		'about.faqHeading': 'FAQ',
		'about.close': 'Close',

		'about.faq.chatgpt.question': 'How is Scaffy different from ChatGPT or Copilot?',
		'about.faq.chatgpt.answer':
			'Those tools optimize for speed: one prompt, one complete answer. Scaffy optimizes for learning: code is revealed in steps, and you must understand each concept before moving on. The chat tutor supports the lesson instead of replacing it.',
		'about.faq.prompt.question': "Why can't I paste code in my prompt on the home screen?",
		'about.faq.prompt.answer':
			'The home prompt is for intent in plain language. Describe what you want to build and let Scaffy handle the implementation during the lesson.',
		'about.faq.locked.question': 'Why is the next code chunk locked?',
		'about.faq.locked.answer':
			'Each scaffold ends with a Learning Card (multiple-choice gate). The next chunk unlocks only after you answer correctly. The friction is intentional and encourages active learning.',
		'about.faq.wrong.question': 'What happens if I answer a question wrong?',
		'about.faq.wrong.answer':
			'Scaffy shows a short explanation connected to that question. Read it, acknowledge it, and try again. The goal is understanding, not grading.',
		'about.faq.scaffolds.question': 'What are scaffolds?',
		'about.faq.scaffolds.answer':
			'A scaffold is one teaching step: a code snippet plus a Learning Card about the concept used in that snippet. Several scaffolds together form a complete feature or component.',
		'about.faq.storage.question': 'Where are my sessions stored?',
		'about.faq.storage.answer':
			'Sessions are stored in localStorage inside your browser. Clearing browser data or switching devices will not carry them over.',
		'about.faq.apikey.question': 'Do I need my own API key?',
		'about.faq.apikey.answer':
			"No. Scaffy communicates with AI through the application's server. API keys remain on the server and are never exposed to the browser.",
		'about.faq.frameworks.question': 'Which frameworks does Scaffy support?',
		'about.faq.frameworks.answer':
			'Scaffy currently focuses on Svelte 5. Examples, scaffolds, and tutoring are optimized for the Svelte 5 component model.',

		'sessions.noLearningSessions': 'No learning sessions yet.',
		'sessions.startFirstLearningSession': 'Start your first learning session',
		'sessions.loadingSessions': 'Loading sessions…',
		'sessions.loadError': 'Could not load the sessions page.',
		'sessions.backToHome': 'Back to home',
		'sessions.title': 'Learning overview',
		'sessions.subtitle': 'Pick up where you left off anytime.',
		'sessions.latestSession': 'continue with latest learning session',

		'session.noSessions': 'No sessions yet. Create one using learn mode.',
		'session.newSession': 'New session',
		'session.closeSession': 'Close session',
		'session.deleteSession': 'Delete session',
		'session.incompleteSession': 'Incomplete session',
		'session.deleteConfirmTitle': 'Delete this session?',
		'session.deleteConfirmMessage':
			'This cannot be undone. All scaffolds saved in this session will be lost.',
		'session.deleteCancel': 'Cancel',
		'session.deleteConfirm': 'Delete',
		'session.status.completed': 'Completed',
		'session.status.loading': 'Loading',
		'session.status.error': 'Error',
		'session.status.inProgress': 'In progress',
		'session.startNewSession': 'Start new session',
		'home.heroDescription':
			'Learn to build code, not just have it built for you. Type what you want — Scaffy walks you through it, chunk by chunk.',
		'home.newLearningSession': 'New learning session',
		'home.describePrompt': 'Describe what you want to build in plain language.',
		'home.starting': 'Starting…',
		'home.startSession': 'start session',
		'home.savedSession': 'saved session',
		'home.savedSessions': 'saved sessions',
		'home.continueIn': 'continue in',
		'home.myLearningSessions': 'My learning sessions →',
		'home.tryOneOfThese': 'Try one of these',

		'chat.askPlaceholder': 'Ask scaffy a question about the code (min. 10 characters)',
		'chat.askMinLengthTooltip':
			'Enter at least 10 characters to ask Scaffy a question. We skip very short prompts to avoid unnecessary AI calls and reduce environmental impact.',
		'chat.learnPlaceholder':
			'e.g. A login form with email validation and a forgot-password link\n(min. 10 characters)',

		'editor.retry': 'Try again',
		'editor.loadFallback': 'Load fallback',
	},
	de: {
		'app.title': 'scaffy',
		'app.about': 'Über Scaffy',
		'app.aboutAriaLabel': 'Über Scaffy',
		'app.mySessions': 'Meine Sessions',
		'app.session': 'Session',
		'app.languageLabel': 'Sprache',

		'about.faqHeading': 'FAQ',
		'about.close': 'Schließen',

		'about.faq.chatgpt.question': 'Wie unterscheidet sich Scaffy von ChatGPT oder Copilot?',
		'about.faq.chatgpt.answer':
			'Diese Tools sind auf Geschwindigkeit ausgelegt: ein Prompt, eine vollständige Antwort. Scaffy ist auf Lernen ausgelegt: Code wird Schritt für Schritt offengelegt, und du musst jedes Konzept verstehen, bevor es weitergeht. Der Chat-Tutor unterstützt die Lektion, anstatt sie zu ersetzen.',
		'about.faq.prompt.question':
			'Warum kann ich auf der Startseite keinen Code in meinen Prompt einfügen?',
		'about.faq.prompt.answer':
			'Der Prompt auf der Startseite ist für deine Absicht in einfacher Sprache gedacht. Beschreibe, was du bauen möchtest, und überlasse Scaffy die Umsetzung während der Lektion.',
		'about.faq.locked.question': 'Warum ist der nächste Code-Abschnitt gesperrt?',
		'about.faq.locked.answer':
			'Jedes Scaffold endet mit einer Learning Card (Multiple-Choice-Sperre). Der nächste Abschnitt wird erst freigeschaltet, wenn du richtig antwortest. Die Reibung ist beabsichtigt und fördert aktives Lernen.',
		'about.faq.wrong.question': 'Was passiert, wenn ich eine Frage falsch beantworte?',
		'about.faq.wrong.answer':
			'Scaffy zeigt eine kurze Erklärung zu dieser Frage. Lies sie, bestätige sie und versuche es erneut. Das Ziel ist Verständnis, keine Benotung.',
		'about.faq.scaffolds.question': 'Was sind Scaffolds?',
		'about.faq.scaffolds.answer':
			'Ein Scaffold ist ein Lernschritt: ein Code-Snippet plus eine Learning Card zum Konzept, das in diesem Snippet verwendet wird. Mehrere Scaffolds ergeben zusammen ein vollständiges Feature oder eine Komponente.',
		'about.faq.storage.question': 'Wo werden meine Sessions gespeichert?',
		'about.faq.storage.answer':
			'Sessions werden im localStorage deines Browsers gespeichert. Beim Löschen der Browserdaten oder beim Wechsel des Geräts werden sie nicht übernommen.',
		'about.faq.apikey.question': 'Brauche ich einen eigenen API-Schlüssel?',
		'about.faq.apikey.answer':
			'Nein. Scaffy kommuniziert mit der KI über den Server der Anwendung. API-Schlüssel bleiben auf dem Server und werden niemals im Browser offengelegt.',
		'about.faq.frameworks.question': 'Welche Frameworks unterstützt Scaffy?',
		'about.faq.frameworks.answer':
			'Scaffy konzentriert sich derzeit auf Svelte 5. Beispiele, Scaffolds und Tutoring sind auf das Komponentenmodell von Svelte 5 optimiert.',

		'sessions.noLearningSessions': 'Noch keine Lernsitzungen vorhanden.',
		'sessions.startFirstLearningSession': 'Starte deine erste Lernsitzung',
		'sessions.loadingSessions': 'Sitzungen werden geladen…',
		'sessions.loadError': 'Die Sitzungsseite konnte nicht geladen werden.',
		'sessions.backToHome': 'Zurück zur Startseite',
		'sessions.title': 'Lernübersicht',
		'sessions.subtitle': 'Setze genau dort fort, wo du aufgehört hast.',
		'sessions.latestSession': 'mit der neuesten Lernsitzung fortfahren',

		'session.noSessions': 'Noch keine Session vorhanden. Erzeuge eine neue Session im Lernmodus.',
		'session.newSession': 'Neue Session',
		'session.closeSession': 'Session schließen',
		'session.deleteSession': 'Session löschen',
		'session.incompleteSession': 'Unvollständige Session',
		'session.deleteConfirmTitle': 'Lösche diese Session?',
		'session.deleteConfirmMessage':
			'Das kann nicht rückgängig gemacht werden. Alle in dieser Session gespeicherten Scaffolds gehen verloren.',
		'session.deleteCancel': 'Abbrechen',
		'session.deleteConfirm': 'Löschen',
		'session.status.completed': 'Abgeschlossen',
		'session.status.loading': 'Wird geladen',
		'session.status.error': 'Fehler',
		'session.status.inProgress': 'In Arbeit',
		'session.startNewSession': 'Neue Session starten',
		'home.heroDescription':
			'Lerne, Code zu bauen, statt ihn dir nur bauen zu lassen. Schreibe, was du möchtest – Scaffy führt dich Abschnitt für Abschnitt hindurch.',
		'home.newLearningSession': 'Neue Lernsitzung',
		'home.describePrompt': 'Beschreibe auf einfache Weise, was du bauen möchtest.',
		'home.starting': 'Starte…',
		'home.startSession': 'Sitzung starten',
		'home.savedSession': 'gespeicherte Session',
		'home.savedSessions': 'gespeicherte Sessions',
		'home.continueIn': 'weiter in',
		'home.myLearningSessions': 'Meine Lernsitzungen →',
		'home.tryOneOfThese': 'Probiere eines davon',

		'chat.askPlaceholder': 'Stelle Scaffy eine Frage zum Code (mind. 10 Zeichen)',
		'chat.askMinLengthTooltip':
			'Gib mindestens 10 Zeichen ein, um Scaffy eine Frage zu stellen. Sehr kurze Eingaben überspringen wir, um unnötige KI-Aufrufe zu vermeiden und die Umweltbelastung zu reduzieren.',
		'chat.learnPlaceholder':
			'z. B. Ein Login-Formular mit E-Mail-Validierung und einem Link zum Passwort-Zurücksetzen\n(mind. 10 Zeichen)',

		'editor.retry': 'Erneut versuchen',
		'editor.loadFallback': 'Fallback laden',
	},
};
