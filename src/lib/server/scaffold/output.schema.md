# Scaffold API structured output (`output.schema.json`)

Maintainer reference for the JSON Schema file next to this document. That file is sent to the Anthropic Messages API as `output_config.format.schema` (with `type: "json_schema"`). It is **not** loaded into the model as user-visible prompt text.

## Root object

| Field       | Required | Who uses it                         | Purpose                                                                                                                                                                  |
| ----------- | -------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `scaffolds` | yes      | Server validates; SPA drives the UI | Ordered teaching steps: each scaffold has a `codeSnippet` and a `knowledgeCheck` the learner must pass (or acknowledge) before the client reveals the snippet in Monaco. |

**Invariants**

- Exactly one top-level property besides implicit schema metadata: `scaffolds`.
- No extra top-level keys (`additionalProperties: false`).
- At most **five** scaffolds per response (enforced in `validateStructuredOutput`, not in the wire schema—Anthropic’s JSON Schema subset can reject some `maxItems` uses); the model must fold any further work into the last scaffold’s `codeSnippet` (see system prompt).

## `scaffolds[]` (scaffold)

Each element is one pedagogical step in sequence.

| Field            | Required | Who uses it                   | Purpose                                                                                                                                                                                    |
| ---------------- | -------- | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `codeSnippet`    | yes      | Monaco (later); preview panel | Source text for this step. Use an **empty string** when the UI should show the knowledge check first and only type code after the learner passes the gate (or acknowledges the explainer). |
| `knowledgeCheck` | yes      | Svelte question UI in Monaco  | Multiple-choice gate for this step.                                                                                                                                                        |
| `targetPath`     | no       | Monaco model / tabs           | Suggested virtual path (for example `ProfileCard.svelte`). Omit when a single buffer is enough.                                                                                            |
| `language`       | no       | Monaco language id            | Hint for syntax highlighting (for example `svelte`, `typescript`). Client may default to `svelte`.                                                                                         |

**Invariants**

- `codeSnippet` is always a JSON string (may be empty).
- Optional fields, when present, must be strings.

## `knowledgeCheck`

| Field             | Required | Who uses it        | Purpose                                                                                                                                            |
| ----------------- | -------- | ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `question`        | yes      | Question component | Full question wording.                                                                                                                             |
| `options`         | yes      | Question component | Answer lines the learner can pick.                                                                                                                 |
| `correctOptionId` | yes      | Server + client    | Must match exactly one `options[].id` after trimming (enforced again in server-side validation).                                                   |
| `explanation`     | yes      | Question component | Shown after a wrong pick. Must name the correct option and **why** it is correct so the learner can continue with “I understood” without guessing. |

## `options[]` (option)

| Field  | Required | Purpose                                                     |
| ------ | -------- | ----------------------------------------------------------- |
| `id`   | yes      | Stable value for forms and state (for example `a`, `b`, …). |
| `text` | yes      | Human-readable label for that option.                       |

## Why server-side rules still exist

Anthropic structured outputs only support a **subset** of JSON Schema. In particular, array `minItems` is limited on the API side, so this wire schema cannot express “at least four options”. The server therefore applies extra checks (for example **2–6** options, non-empty trimmed text, unique `id`s, `correctOptionId` present in `options`). See `validateStructuredOutput` in [`output-schema.ts`](output-schema.ts).

## Stop reasons (runtime, not in schema)

Per Anthropic docs, `stop_reason` values such as `refusal` or `max_tokens` can yield text that does **not** satisfy the schema. The scaffold route must inspect `stop_reason` and fail with a clear HTTP error instead of trusting the payload alone.

## Relation to `system-prompt.md`

The system prompt teaches **pedagogy** (how many scaffolds, how hard questions should be, language, no markdown fences inside `codeSnippet`, etc.). The JSON schema teaches **shape**. Do not paste the full schema into the system prompt; reference “output shape is enforced by the API schema”.
