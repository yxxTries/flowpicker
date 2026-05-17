# Flowpicker

**Flowpicker is a tool picker for AI workflows.** Build a stack one layer at a time — IDE, LLM, integration, context/RAG, agent, plus version control, monitoring, security — and the page tells you what fits together, what costs what, and where the gotchas are.

Live at **[flowpicker.xyz](https://flowpicker.xyz)**.

## What you can do with it

- **Plan a stack.** Pick one product per layer on the home page. Compatibility warnings, monthly cost estimates, and setup-effort notes update as you go.
- **Browse the catalog.** Filter every product by cost, OS, hosting, context window, open-source vs. closed, and more.
- **Compare side by side.** Pick any products (cross-layer is fine) and see pricing, benchmarks, context, and capabilities in a generated table. Share the URL.
- **Use templates.** Start from a pre-built stack (e.g. "Solo dev on a budget", "Enterprise with on-prem LLM") and tweak.
- **Save and share.** Saved stacks live in your browser; share links round-trip the full stack through the URL hash.

## Tech stack

- **No framework, no build step.** Plain HTML, CSS, and ES2020 JavaScript loaded with `<script>` tags. Features attach to a `window.App` namespace.
- **SQLite in the browser.** All ~140 products live in `data/flowpicker.db`, loaded client-side via **sql.js** (WASM). Editing products = editing rows in the DB.
- **No backend for the app itself.** Saved stacks, dark-mode preference, comparisons — all in `localStorage`. The optional `server.js` (Node + `better-sqlite3`) powers an experimental templates API but the static site works without it.
- **Tests.** Unit tests with **Vitest** + **jsdom**; E2E with **Playwright**.
- **Hosting.** Static-hosted (currently GitHub Pages via `CNAME`).

## Run locally

The page uses `fetch()` to load the SQLite database and WASM runtime, so you must serve over HTTP — opening `index.html` from disk won't work.

```bash
npm install
npm run serve        # http-server on http://127.0.0.1:8000
# or
python -m http.server 8000
```

Then open <http://127.0.0.1:8000/index.html>.

### Other scripts

```bash
npm test             # vitest run (unit)
npm run test:e2e     # playwright
npm run server       # optional Node API for templates
npm run dev          # both: static server + API server
```

## Editing products

`data/flowpicker.db` is the source of truth. Open it with [DB Browser for SQLite](https://sqlitebrowser.org/) or the `sqlite3` CLI, edit, save, reload the page.

Schema:

| Table | Purpose |
|---|---|
| `layers(id, name, optional, position)` | One row per layer (IDE, LLM, etc.) |
| `options(layer_id, id, name, position)` | Products inside each layer |
| `option_attrs(layer_id, option_id, key, value)` | Free-form attributes (`contextWindow`, `pricing`, `sweBench`, …) |
| `layer_chip_keys(layer_id, key, position)` | Which attributes render as chips on cards |

New attribute keys appear on cards automatically. Add a display label in `data/attribute-labels.js` for prettier rendering, and (optionally) group it in `ATTRIBUTE_GROUPS` so it shows up in the Compare page.

If you'd rather edit a single JS file, update `tools/build-db.js` and regenerate:

```bash
node tools/build-db.js
```

## Project layout

```
flowpicker/
├── index.html              Plan page (stack builder)
├── browse.html             Catalog with filters
├── compare.html            Dynamic side-by-side comparator
├── templates.html          Pre-built starter stacks
├── saved.html              User's saved stacks
├── best/, compare/         SEO landing pages
├── data/
│   ├── flowpicker.db       SQLite — products (source of truth)
│   ├── rules.js            Compatibility predicates + messages
│   ├── attribute-labels.js Display labels + comparison groups
│   └── templates.db        Templates DB (used by server.js)
├── vendor/
│   ├── sql-wasm.js         sql.js loader (~50 KB)
│   └── sql-wasm.wasm       SQLite WASM runtime (~640 KB)
├── src/
│   ├── db.js               Loads sql.js + flowpicker.db → LAYERS array
│   ├── main.js             App namespace + bootstrap
│   ├── styles/             tokens.css (CSS vars) + base.css
│   └── features/           One folder per feature (JS + CSS)
│       ├── table/          Main stack table
│       ├── warnings/       Compatibility banner
│       ├── modal/          Layer-picker modal
│       ├── browse-filters/ Browse-page filters + detail panel
│       ├── compare/        Compare-page picker + table
│       ├── templates/      Template gallery
│       ├── saved-flows/    Save/load stacks
│       ├── export/         Share-link encoder/decoder
│       ├── stack-analysis/ Cost + setup-effort summary
│       └── …
├── tools/build-db.js       Rebuilds flowpicker.db from JS
├── tests/unit/             Vitest specs
├── server.js               Optional Node API (templates)
└── package.json
```

## Conventions

- **No build step.** Order in HTML matters: `sql-wasm.js` → `attribute-labels.js` → `db.js` → `selections-store.js` → feature scripts.
- **Globals via `App`.** Features attach to `window.App.features.<name>` and read shared state from `App.state`. No ES modules.
- **One feature per folder.** Adding a feature = create `src/features/<name>/<name>.{js,css}`, expose `App.features.<name>.init()`, wire script + stylesheet tags in the relevant HTML pages.
- **Products from SQLite.** `src/db.js` materializes the SQLite tables into a `LAYERS` array; features read from there.

## Adding a compatibility rule

Append to `COMPATIBILITY_RULES` in `data/rules.js`:

```js
{
  id: 'unique_id',
  when: s => /* predicate on selections */,
  message: s => `Human-readable warning text`,
}
```

`s` is the selections object keyed by layer id (`s.ide`, `s.llm`, …). Rules feed both the warning banner and the browse page's compatibility filter, so they stay in sync.

## Privacy

Flowpicker has no user backend. Saved stacks, the compare set, and dark-mode preference all live in your browser's `localStorage`. Clearing site data removes them.

## License

See [LICENSE](LICENSE).
