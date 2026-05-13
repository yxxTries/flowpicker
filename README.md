# Flowpicker

PC Part Picker for AI coding workflows. Pick one tool per layer (IDE, LLM, Integration, Context/RAG, Agent) and the page warns you about incompatibilities, surfaces cost estimates, and explains setup complexity.

## Run

Products live in a SQLite database at `data/flowpicker.db`, loaded in the browser via sql.js (WASM). Because the page uses `fetch()` for the `.db` and `.wasm` files, you must serve the directory over HTTP. Opening `index.html` directly from disk (`file://`) will not work.

From the project root:

```
npx http-server -p 8000        # or: python -m http.server 8000
```

Then open http://127.0.0.1:8000/index.html.

## Editing products

`data/flowpicker.db` is the source of truth. Edit it with [DB Browser for SQLite](https://sqlitebrowser.org/) or the `sqlite3` CLI, then reload the page. Schema:

* `layers(id, name, optional, position)` is one row per layer.
* `layer_chip_keys(layer_id, key, position)` says which attributes render as table chips.
* `options(layer_id, id, name, position)` holds the products inside each layer.
* `option_attrs(layer_id, option_id, key, value)` stores free form key/value attributes (for example `contextWindow`, `notes`, `latency`). Add new keys here and they show up in the option cards automatically. Add a label in `data/attribute-labels.js` for a prettier display name.

The one time migration script that built the initial DB lives at `tools/build-db.js`. If you prefer editing a single JS file and regenerating the database, update the product list there and run:

```
node tools/build-db.js
```

That overwrites `data/flowpicker.db`.

## Structure

```
flowpicker/
├── index.html                    Page shell; loads CSS + JS in order
├── README.md                     This file
├── data/
│  ├── flowpicker.db              SQLite: layers and products (source of truth)
│  ├── rules.js                   COMPATIBILITY_RULES: predicate + message pairs
│  └── attribute-labels.js        ATTRIBUTE_LABELS: display names for option fields
├── vendor/
│  ├── sql-wasm.js                sql.js loader (pinned, ~50KB)
│  └── sql-wasm.wasm              SQLite WASM runtime (~640KB)
├── tools/
│  └── build-db.js                Script that builds flowpicker.db from a JS list
├── src/
│  ├── db.js                      Loads sql.js + flowpicker.db, materializes LAYERS
│  ├── main.js                    App namespace + async bootstrap on DOMContentLoaded
│  ├── styles/
│  │  ├── tokens.css              :root CSS variables (colors)
│  │  └── base.css                Page shell, typography, chips, buttons
│  └── features/                  Vertical slices; each owns its JS + CSS
│     ├── table/                  The main table on the page
│     ├── warnings/               Retractable compatibility banner
│     ├── modal/                  Pick a layer modal with option cards
│     └── browse-filters/         Filters sidebar on the browse page
├── tests/
│  └── unit/                      Unit tests for features and utilities
└── scripts/
   └── seed-templates.js          Template seeding script
```

## Conventions

* **No build step.** All files are loaded via `<link>` and `<script>` tags. Order in `index.html` matters: `sql-wasm.js` before `main.js`, `main.js` (declares `App`) before `db.js` (attaches to `App`), then every feature.
* **Globals via `App`.** Features attach to `window.App.features.<name>` and share state through `App.state`. No ES modules.
* **Shared DOM refs.** Cached once in `App.refs` by `main.js`. Features read from there instead of requerying the DOM.
* **One feature per folder.** Adding a feature means adding `src/features/<name>/<name>.js` plus `<name>.css`, attaching to `App.features.<name>`, and wiring its script and stylesheet in `index.html`.
* **Products from SQLite.** `src/db.js` loads `data/flowpicker.db` and materializes a synchronous `window.LAYERS` array. Features read `LAYERS` as before; the database is just where the data lives.

## Adding a feature

1. Run `mkdir src/features/<name>` and add `<name>.js` plus `<name>.css`.
2. In the JS, wrap the code in an IIFE that assigns to `App.features.<name> = (() => { … })()`. Expose at least `init()`. Add other methods as you need them.
3. Have `main.js` call `App.features.<name>.init()` during bootstrap.
4. Add `<link>` and `<script>` tags to `index.html` in the right order.

## Adding a compatibility rule

Append to `COMPATIBILITY_RULES` in `data/rules.js`:

```js
{
  id: 'unique_id',
  when: s => /* predicate on selections */ ,
  message: s => `Human readable warning text`,
}
```

`s` is the current `selections` object keyed by layer id (for example `s.ide`, `s.llm`). Rules feed both the warning banner and the browse page compatibility filter, so they stay in sync automatically.

## Privacy

Flowpicker has no backend. Saved stacks and your local profile live only inside your browser's `localStorage`. Clearing site data removes them.
