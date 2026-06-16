# Dev scaffold fallback (`scaffold-fallback.json`)

Paste a working lesson from localStorage when the API fails.

1. Open DevTools → Application → Local Storage → `scaffy.sessions`
2. Copy the `scaffolds` array from a successful session (must be **3** items)
3. Replace the contents of `src/lib/learn/scaffold-fallback.json`:

```json
{
  "scaffolds": [ ... paste here ... ]
}
```

4. On the session error screen, click **Fallback laden**.
