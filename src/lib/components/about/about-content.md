### What is Scaffy?

Scaffy is a learning tool for building real UI code step by step. You describe what you want in plain language; Scaffy breaks the solution into small chunks and shows them in a code editor one piece at a time.

Unlike tools that dump a full solution at once, Scaffy adds deliberate friction: before each new chunk appears, you answer a short concept question. That pause is intentional — it turns passive copying into active understanding.

Scaffy is built for people learning framework-based UI development, especially Svelte 5. Step content in a session is generated in German (course language); the app chrome stays in English.

### How it works

- **Home** — Describe your goal in plain language (no raw code tokens). Start a session.
- **Session** — Code appears in the Monaco editor as teaching steps. A knowledge check blocks the next step until you answer correctly.
- **Wrong answer?** — You get a short explanation and can try again until the concept clicks.
- **Ask panel** — Use the chat on the right for a Socratic tutor that explains concepts without dumping a complete solution.
- **History** — Past sessions are stored in this browser and can be resumed later.

### Learn vs Ask

|                  | Learn (home → session)                    | Ask (session chat)                               |
| ---------------- | ----------------------------------------- | ------------------------------------------------ |
| **When**         | Starting a new lesson from your prompt    | While you work through a session                 |
| **What you get** | Structured steps + multiple-choice checks | Streaming tutor replies and concept explanations |
| **Goal**         | Walk through the full build in order      | Unblock one specific doubt                       |
