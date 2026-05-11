# Flowpicker

PC Part Picker for AI coding workflows. Pick one tool per layer; the page warns about incompatibilities.

## Run

Products live in a SQLite database (`data/flowpicker.db`) loaded via sql.js (WASM).
Because the page uses `fetch()` for the `.db` and `.wasm` files, you **must** serve
the directory over HTTP — opening `index.html` directly from disk (`file://`) will
not work.

From the project root:

```
npx http-server -p 8000        # or: python -m http.server 8000
```

Then open http://127.0.0.1:8000/index.html.

## Editing products

`data/flowpicker.db` is the source of truth. Edit it with
[DB Browser for SQLite](https://sqlitebrowser.org/) or the `sqlite3` CLI, then
reload the page. Schema:

- `layers(id, name, optional, position)` — one row per layer
- `layer_chip_keys(layer_id, key, position)` — which attrs render as table chips
- `options(layer_id, id, name, position)` — products inside each layer
- `option_attrs(layer_id, option_id, key, value)` — free-form key/value attributes
  (e.g. `contextWindow`, `notes`, `latency`); add new keys here and they appear
  in the option cards automatically (add a label to `data/attribute-labels.js`
  for a prettier display name).

The one-time migration script that built the initial DB is at
`tools/build-db.js` — it's no longer the source of truth and can be ignored
unless you want to nuke the DB and rebuild it.

## Structure

```
flowpicker/
├── index.html                    Page shell; loads CSS + JS in order
├── README.md                     This file
├── data/
│  ├── flowpicker.db              SQLite — layers and products (source of truth)
│  ├── rules.js                   COMPATIBILITY_RULES — predicate + message pairs
│  └── attribute-labels.js        ATTRIBUTE_LABELS — display names for option fields
├── vendor/
│  ├── sql-wasm.js                sql.js loader (pinned, ~50KB)
│  └── sql-wasm.wasm              SQLite WASM runtime (~640KB)
├── tools/
│  └── build-db.js                One-shot script that built flowpicker.db
├── src/
│  ├── db.js                      Loads sql.js + flowpicker.db, materializes LAYERS
│  ├── main.js                    App namespace + async bootstrap on DOMContentLoaded
│  ├── styles/
│  │  ├── tokens.css              :root CSS variables (colors)
│  │  └── base.css                Page shell, typography, chips, buttons
│  └── features/                  Vertical slices — each owns its JS + CSS
│     ├── table/                  The main table on the page
│     ├── warnings/               Retractable compatibility-issue banner
│     ├── modal/                  "Pick a layer" modal with option cards
│     └── filters/                Sidebar inside the modal (compat-only filter)
└── docs/
   └── PLAN.md                    Original implementation plan
```

## Conventions

- **No build**: all files are loaded via `<link>` / `<script>` tags. Order in `index.html` matters — tokens before base, data before features, all features before nothing (main.js bootstraps via `DOMContentLoaded` so it can come first or last).
- **Globals via `App`**: features attach to `window.App.features.<name>` and share state through `App.state`. No ES modules (would require a server for `file://`).
- **Shared DOM refs**: cached once in `App.refs` by `main.js`. Features read from there instead of re-querying.
- **One feature per folder**: adding a feature means adding `src/features/<name>/<name>.js` + `<name>.css`, attaching to `App.features.<name>`, and wiring its script + stylesheet in `index.html`.
- **Data is dumb**: `data/*.js` files declare `const` arrays/objects. No imports, no logic.

## Adding a feature

1. `mkdir src/features/<name>` and add `<name>.js` + `<name>.css`.
2. In the JS, wrap in an IIFE that assigns to `App.features.<name> = (() => { … })()`. Expose at least `init()`; add other methods as needed.
3. Have `main.js` call `App.features.<name>.init()` during bootstrap.
4. Add `<link>` and `<script>` tags to `index.html` in the right order.

## Adding a compatibility rule

Append to `COMPATIBILITY_RULES` in `data/rules.js`:

```js
{
  id: 'unique-id',
  when: s => /* predicate on selections */ ,
  message: s => `Human-readable warning text`,
}
```

`s` is the current `selections` object keyed by layer id (e.g. `s.ide`, `s.llm`). Rules feed both the warning banner and the modal's compat-only filter — they stay in sync automatically.
