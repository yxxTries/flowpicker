// One-shot script to generate data/flowpicker.db from the legacy LAYERS array.
// Run once: `node tools/build-db.js`. After that, edit flowpicker.db directly
// with DB Browser for SQLite or the sqlite3 CLI — this script is for the
// initial migration only.

const fs = require('fs');
const path = require('path');
const initSqlJs = require('../vendor/sql-wasm.js');

const LAYERS = [
  {
    id: 'ide',
    name: 'IDE / Editor',
    optional: false,
    chipKeys: ['notes'],
    options: [
      { id: 'vscode',    name: 'VS Code',   notes: 'Largest extension ecosystem' },
      { id: 'cursor',    name: 'Cursor',    notes: 'Best built-in inline AI' },
      { id: 'zed',       name: 'Zed',       notes: 'Fastest, Rust-native' },
      { id: 'neovim',    name: 'Neovim',    notes: 'Terminal-native, keyboard-first' },
      { id: 'jetbrains', name: 'JetBrains', notes: 'Deep language tooling' },
    ],
  },
  {
    id: 'llm',
    name: 'LLM Provider / Model',
    optional: false,
    chipKeys: ['contextWindow'],
    options: [
      { id: 'claude-sonnet', name: 'Claude Sonnet 4.6',     contextWindow: '200K',    benchmark: 'SWE-bench: high', latency: 'medium' },
      { id: 'claude-opus',   name: 'Claude Opus 4.7',       contextWindow: '200K',    benchmark: 'SWE-bench: top',  latency: 'medium' },
      { id: 'gpt4o',         name: 'GPT-4o',                contextWindow: '128K',    benchmark: 'HumanEval: high', latency: 'fast' },
      { id: 'gemini',        name: 'Gemini 2.x',            contextWindow: '1M+',     benchmark: 'mid-high',        latency: 'fast' },
      { id: 'llama3',        name: 'Llama 3 (Ollama/Groq)', contextWindow: '8K-128K', benchmark: 'mid',             latency: 'local-bound' },
      { id: 'deepseek',      name: 'Deepseek',              contextWindow: '128K',    benchmark: 'high (coding)',   latency: 'medium' },
    ],
  },
  {
    id: 'integration',
    name: 'Integration Layer',
    optional: false,
    chipKeys: ['compatibility'],
    options: [
      { id: 'copilot',      name: 'GitHub Copilot',      compatibility: 'VS Code, JetBrains, Neovim' },
      { id: 'continue',     name: 'Continue.dev',        compatibility: 'VS Code, JetBrains' },
      { id: 'codeium',      name: 'Codeium',             compatibility: 'VS Code, JetBrains, Vim' },
      { id: 'cursor-built', name: 'Cursor built-in',     compatibility: 'Cursor only' },
      { id: 'aider',        name: 'Aider (terminal)',    compatibility: 'Any editor (terminal)' },
      { id: 'direct-api',   name: 'Direct API / custom', compatibility: 'Anywhere you wire it' },
    ],
  },
  {
    id: 'context',
    name: 'Context / RAG Layer',
    optional: false,
    chipKeys: ['hosting', 'staleness'],
    options: [
      { id: 'none',         name: 'None (vanilla)',             indexLimit: '—',     hosting: '—', staleness: '—' },
      { id: 'cursor-cb',    name: '@codebase (Cursor)',         indexLimit: 'Large',      hosting: 'Cloud',  staleness: 'auto' },
      { id: 'continue-idx', name: 'Continue codebase indexing', indexLimit: 'Repo-size',  hosting: 'Local',  staleness: 'manual reindex' },
      { id: 'greptile',     name: 'Greptile',                   indexLimit: 'Large',      hosting: 'Cloud',  staleness: 'auto' },
      { id: 'chromadb',     name: 'Local ChromaDB',             indexLimit: 'You manage', hosting: 'Local',  staleness: 'manual' },
    ],
  },
  {
    id: 'agent',
    name: 'Agent / Orchestration Layer',
    optional: true,
    chipKeys: ['notes'],
    options: [
      { id: 'none',        name: 'None',              notes: 'Autocomplete / chat only' },
      { id: 'aider-arch',  name: 'Aider (architect)', notes: 'Plan-then-edit loop' },
      { id: 'swe-agent',   name: 'SWE-agent',         notes: 'Issue-resolution agent' },
      { id: 'claude-code', name: 'Claude Code',       notes: 'CLI agent, full repo access' },
      { id: 'langgraph',   name: 'Custom LangGraph',  notes: 'DIY pipelines' },
    ],
  },
];

(async () => {
  const wasmBinary = fs.readFileSync(path.join(__dirname, '..', 'vendor', 'sql-wasm.wasm'));
  const SQL = await initSqlJs({ wasmBinary });
  const db = new SQL.Database();

  db.run(`
    CREATE TABLE layers (
      id        TEXT PRIMARY KEY,
      name      TEXT NOT NULL,
      optional  INTEGER NOT NULL DEFAULT 0,
      position  INTEGER NOT NULL
    );

    CREATE TABLE layer_chip_keys (
      layer_id  TEXT NOT NULL REFERENCES layers(id),
      key       TEXT NOT NULL,
      position  INTEGER NOT NULL,
      PRIMARY KEY (layer_id, key)
    );

    CREATE TABLE options (
      layer_id  TEXT NOT NULL REFERENCES layers(id),
      id        TEXT NOT NULL,
      name      TEXT NOT NULL,
      position  INTEGER NOT NULL,
      PRIMARY KEY (layer_id, id)
    );

    CREATE TABLE option_attrs (
      layer_id   TEXT NOT NULL,
      option_id  TEXT NOT NULL,
      key        TEXT NOT NULL,
      value      TEXT,
      PRIMARY KEY (layer_id, option_id, key),
      FOREIGN KEY (layer_id, option_id) REFERENCES options(layer_id, id)
    );

    CREATE INDEX idx_options_layer ON options(layer_id, position);
    CREATE INDEX idx_option_attrs_option ON option_attrs(layer_id, option_id);
  `);

  const insLayer = db.prepare('INSERT INTO layers (id, name, optional, position) VALUES (?, ?, ?, ?)');
  const insChip  = db.prepare('INSERT INTO layer_chip_keys (layer_id, key, position) VALUES (?, ?, ?)');
  const insOpt   = db.prepare('INSERT INTO options (layer_id, id, name, position) VALUES (?, ?, ?, ?)');
  const insAttr  = db.prepare('INSERT INTO option_attrs (layer_id, option_id, key, value) VALUES (?, ?, ?, ?)');

  LAYERS.forEach((layer, layerPos) => {
    insLayer.run([layer.id, layer.name, layer.optional ? 1 : 0, layerPos]);
    (layer.chipKeys || []).forEach((key, i) => insChip.run([layer.id, key, i]));
    layer.options.forEach((opt, optPos) => {
      insOpt.run([layer.id, opt.id, opt.name, optPos]);
      for (const [key, value] of Object.entries(opt)) {
        if (key === 'id' || key === 'name') continue;
        insAttr.run([layer.id, opt.id, key, value == null ? null : String(value)]);
      }
    });
  });

  insLayer.free(); insChip.free(); insOpt.free(); insAttr.free();

  const bytes = db.export();
  const outPath = path.join(__dirname, '..', 'data', 'flowpicker.db');
  fs.writeFileSync(outPath, Buffer.from(bytes));
  console.log(`Wrote ${outPath} (${bytes.length} bytes)`);
  db.close();
})().catch(err => {
  console.error(err);
  process.exit(1);
});
