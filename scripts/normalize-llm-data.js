// Phase 1 of the LLM data refresh: structural normalization only.
//
// This script fixes defects that need no external research — provider-name
// fragmentation and option-id convention drift. It does NOT touch prices,
// dates, or context windows; those are corrected in update-llm-data.js once
// the values have been verified against primary sources.
//
// Safe to re-run: every step is idempotent.
//
// Run: node scripts/normalize-llm-data.js

const fs = require('fs');
const path = require('path');
const initSqlJs = require('../vendor/sql-wasm.js');

const DB = path.join(__dirname, '..', 'data', 'flowpicker.db');

// Same slug function the page generators use (tools/build-static-pages.js).
// Renaming an id to its own slug is URL-neutral: /tools/llm/<slug(id)>/ is
// unchanged, so no indexed page moves.
const slug = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

// Each real company appeared under two spellings, which split it into two
// providers everywhere the site groups or filters by provider.
const PROVIDER_CANONICAL = {
  'MoonshotAI': 'Moonshot AI',
  'Z.ai (Tsinghua)': 'Z.ai',
  'Zhipu AI': 'Z.ai',
};

async function main() {
  const SQL = await initSqlJs();
  const db = new SQL.Database(fs.readFileSync(DB));

  let changed = 0;

  // --- 1. Canonicalize provider names -------------------------------------
  for (const [from, to] of Object.entries(PROVIDER_CANONICAL)) {
    const rows = db.exec(
      `SELECT option_id FROM option_attrs WHERE layer_id='llm' AND key='provider' AND value=?`,
      [from]
    );
    const ids = rows.length ? rows[0].values.flat() : [];
    if (!ids.length) continue;
    db.run(
      `UPDATE option_attrs SET value=? WHERE layer_id='llm' AND key='provider' AND value=?`,
      [to, from]
    );
    console.log(`provider: "${from}" -> "${to}"  (${ids.length} row(s): ${ids.join(', ')})`);
    changed += ids.length;
  }

  // --- 2. Normalize option ids to the slug form ---------------------------
  // Dots in ids ("glm-5.1") disagreed with the dashed convention used by most
  // rows ("gpt-5-1"). The generators already slugify, so this only aligns the
  // stored key with the URL that was always being produced.
  const idRows = db.exec(`SELECT id FROM options WHERE layer_id='llm'`);
  const ids = idRows.length ? idRows[0].values.flat() : [];
  const renames = ids.filter((id) => slug(id) !== id).map((id) => [id, slug(id)]);

  const taken = new Set(ids);
  for (const [from, to] of renames) {
    if (taken.has(to)) {
      throw new Error(`refusing to rename ${from} -> ${to}: id already exists`);
    }
  }

  for (const [from, to] of renames) {
    db.run(`UPDATE options SET id=? WHERE layer_id='llm' AND id=?`, [to, from]);
    db.run(`UPDATE option_attrs SET option_id=? WHERE layer_id='llm' AND option_id=?`, [to, from]);
    console.log(`id: ${from} -> ${to}`);
    changed += 1;
  }

  if (!changed) {
    console.log('nothing to normalize — database is already clean');
    return;
  }

  fs.writeFileSync(DB, Buffer.from(db.export()));
  console.log(`\nwrote ${DB} (${changed} change(s))`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
