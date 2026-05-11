# Flowpicker — MVP Plan

## Context

Flowpicker is a "PC Part Picker for AI coding workflows." The user picks a specific tool for each of five layers in an AI-assisted coding stack, and the page shows their assembled workflow with key attributes (cost, context window, etc.) visible inline. The five layers are:

1. **IDE / Editor** — VS Code, Neovim, Cursor, Zed, JetBrains
2. **LLM Provider / Model** — Claude, GPT-4o, Gemini, Llama 3 (Ollama/Groq), Deepseek
3. **Integration Layer** — Copilot, Continue.dev, Codeium, Cursor built-in, Aider, direct API
4. **Context / RAG Layer** — none, repo-level indexing, Greptile, local ChromaDB
5. **Agent / Orchestration Layer** (optional) — Aider architect mode, SWE-agent, Claude Code, LangGraph

This first iteration is intentionally minimal: a single static page, no build step, no backend. The shape needs to be right (5 layers, modal-based picker, inline attributes) so later features (compatibility warnings, total cost summary, share links, filters) plug in cleanly.

## Stack

- Plain HTML + CSS + JS, no framework, no build.
- Data hardcoded as a JS object in a single `data.js` file.
- Workspace: `c:\Users\amils\OneDrive\Desktop\flowpicker` (currently empty).

## Files to create

```
flowpicker/
├── index.html      Page shell, the 5-row table, modal markup
├── styles.css      Table, card grid, modal styling
├── app.js          Render rows, open modal, handle selection, render attributes
└── data.js         The five layers and their options + attributes
```

## Data shape (`data.js`)

A single exported object keyed by layer id. Each option carries the attributes relevant to its layer — different layers have different attribute keys, and the modal renders whichever keys are present.

```js
const LAYERS = [
  {
    id: 'ide',
    name: 'IDE / Editor',
    optional: false,
    options: [
      { id: 'vscode',   name: 'VS Code',  cost: 'Free',    notes: 'Largest extension ecosystem' },
      { id: 'cursor',   name: 'Cursor',   cost: '$20/mo',  notes: 'Best built-in inline AI' },
      { id: 'zed',      name: 'Zed',      cost: 'Free',    notes: 'Fastest, Rust-native' },
      { id: 'neovim',   name: 'Neovim',   cost: 'Free',    notes: 'Terminal-native, keyboard-first' },
      { id: 'jetbrains',name: 'JetBrains',cost: 'Paid',    notes: 'Deep language tooling' },
    ],
  },
  {
    id: 'llm',
    name: 'LLM Provider / Model',
    optional: false,
    options: [
      { id: 'claude-sonnet', name: 'Claude Sonnet 4.6', contextWindow: '200K', costPerM: '$3 / $15', benchmark: 'SWE-bench: high', latency: 'medium' },
      { id: 'claude-opus',   name: 'Claude Opus 4.7',   contextWindow: '200K', costPerM: '$15 / $75', benchmark: 'SWE-bench: top',  latency: 'medium' },
      { id: 'gpt4o',         name: 'GPT-4o',            contextWindow: '128K', costPerM: '$2.5 / $10',benchmark: 'HumanEval: high', latency: 'fast' },
      { id: 'gemini',        name: 'Gemini 2.x',        contextWindow: '1M+',  costPerM: 'varies',    benchmark: 'mid-high',        latency: 'fast' },
      { id: 'llama3',        name: 'Llama 3 (Ollama/Groq)', contextWindow: '8K-128K', costPerM: 'Free (local)', benchmark: 'mid',  latency: 'local-bound' },
      { id: 'deepseek',      name: 'Deepseek',          contextWindow: '128K', costPerM: 'cheap',     benchmark: 'high (coding)',   latency: 'medium' },
    ],
  },
  {
    id: 'integration',
    name: 'Integration Layer',
    optional: false,
    options: [
      { id: 'copilot',     name: 'GitHub Copilot',    cost: '$10/mo', compatibility: 'VS Code, JetBrains, Neovim' },
      { id: 'continue',    name: 'Continue.dev',      cost: 'Free',   compatibility: 'VS Code, JetBrains' },
      { id: 'codeium',     name: 'Codeium',           cost: 'Free',   compatibility: 'VS Code, JetBrains, Vim' },
      { id: 'cursor-built',name: "Cursor built-in",   cost: 'Bundled',compatibility: 'Cursor only' },
      { id: 'aider',       name: 'Aider (terminal)',  cost: 'Free',   compatibility: 'Any editor (terminal)' },
      { id: 'direct-api',  name: 'Direct API / custom',cost: 'Free',  compatibility: 'Anywhere you wire it' },
    ],
  },
  {
    id: 'context',
    name: 'Context / RAG Layer',
    optional: false,
    options: [
      { id: 'none',        name: 'None (vanilla)',     indexLimit: '—',         hosting: '—',     staleness: '—' },
      { id: 'cursor-cb',   name: '@codebase (Cursor)', indexLimit: 'Large',     hosting: 'Cloud', staleness: 'auto' },
      { id: 'continue-idx',name: 'Continue codebase indexing', indexLimit: 'Repo-size', hosting: 'Local', staleness: 'manual reindex' },
      { id: 'greptile',    name: 'Greptile',           indexLimit: 'Large',     hosting: 'Cloud', staleness: 'auto' },
      { id: 'chromadb',    name: 'Local ChromaDB',     indexLimit: 'You manage',hosting: 'Local', staleness: 'manual' },
    ],
  },
  {
    id: 'agent',
    name: 'Agent / Orchestration Layer',
    optional: true,
    options: [
      { id: 'none',         name: 'None',              notes: 'Autocomplete / chat only' },
      { id: 'aider-arch',   name: 'Aider (architect)', notes: 'Plan-then-edit loop' },
      { id: 'swe-agent',    name: 'SWE-agent',         notes: 'Issue-resolution agent' },
      { id: 'claude-code',  name: 'Claude Code',       notes: 'CLI agent, full repo access' },
      { id: 'langgraph',    name: 'Custom LangGraph',  notes: 'DIY pipelines' },
    ],
  },
];
```

## Page layout (`index.html`)

- `<h1>Flowpicker</h1>` and a one-line tagline.
- A `<table>` with two columns: **Layer** and **Selection**.
- One row per layer (5 rows). Selection cell starts with a "Choose …" button; once chosen, it shows the selected item's name plus 1–3 attribute chips inline ("$20/mo", "200K context", etc.) and a small "Change" link.
- A hidden modal `<div id="picker-modal">` that `app.js` populates with the current layer's option cards.

## Interaction (`app.js`)

1. On load: read `LAYERS`, render one row per layer into `<tbody>`. Maintain a `selections` object keyed by layer id.
2. Click "Choose" (or "Change") on a row → open modal, populate with cards for that layer's options. Each card shows the option name + all its attribute keys/values (whatever fields exist on it).
3. Click a card → store selection in `selections[layerId]`, close modal, re-render that row to show the chosen name + inline attribute chips.
4. Esc / backdrop click closes the modal.
5. No persistence yet — refresh resets. (LocalStorage is a one-liner to add later; flagging in the plan, not building.)

## Styling (`styles.css`)

- Plain, readable: system font stack, max-width ~860px, generous row padding.
- Modal: fixed overlay, centered card grid (CSS grid, `repeat(auto-fill, minmax(220px, 1fr))`).
- Attribute chips inline: small rounded pill, muted background.
- Optional layer row visually marked (e.g., `(optional)` next to layer name).

## Inline attribute display (the "chips")

When a layer has many attributes (LLM has 4), show only the 2–3 most scannable on the row: e.g., context window and cost for LLM; cost and compatibility for Integration. Full attribute set is visible in the modal's cards.

```
| Layer            | Selection                                              |
|------------------|--------------------------------------------------------|
| IDE / Editor     | VS Code  [Free]  [Largest ext ecosystem]      Change   |
| LLM Provider     | Claude Sonnet 4.6  [200K]  [$3 / $15]         Change   |
| Integration      | Continue.dev  [Free]  [VS Code, JetBrains]    Change   |
| Context / RAG    | @codebase (Cursor)  [Cloud]  [auto]           Change   |
| Agent (optional) | Choose Agent                                           |
```

## What is explicitly NOT in this iteration

- No compatibility warnings between selections (e.g., "Cursor built-in only works with Cursor IDE").
- No total-cost rollup.
- No share/permalink, no localStorage persistence.
- No filtering, sorting, or search within the modal.
- No backend, no auth, no build tooling.

These are the natural next steps; the data shape and layer structure are designed to make them additive.

## Verification

1. Open `index.html` directly in a browser (file://) — no server needed.
2. Confirm all 5 rows render with a "Choose …" button.
3. Click each row, verify the modal opens with that layer's options as cards showing all attribute fields.
4. Pick an option in each layer; verify the row updates with the name + chips and "Change" link.
5. Click "Change" — modal reopens for that layer; pick a different option; row updates.
6. Press Esc and click the backdrop — modal closes without changing selection.
7. Skip the Agent row (optional) and confirm the page is in a valid state with 4 of 5 selected.
