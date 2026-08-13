// Phases 2 and 3 of the LLM data refresh: apply verified corrections,
// deletions and additions from scripts/model-updates-2026-08.js.
//
// scripts/add-new-products.py can only INSERT — it skips any option that
// already exists, so it cannot fix a wrong price on a row that is already
// there. This script handles all three operations and is safe to re-run.
//
// Run: node scripts/apply-model-updates.js [--dry-run]

const fs = require('fs');
const path = require('path');
const initSqlJs = require('../vendor/sql-wasm.js');
const updates = require('./model-updates-2026-08.js');

const DB = path.join(__dirname, '..', 'data', 'flowpicker.db');
const LAYER = 'llm';
const DRY = process.argv.includes('--dry-run');

function get(db, sql, params = []) {
  const res = db.exec(sql, params);
  return res.length ? res[0].values : [];
}

async function main() {
  const SQL = await initSqlJs();
  const db = new SQL.Database(fs.readFileSync(DB));

  let changes = 0;

  // --- Corrections --------------------------------------------------------
  for (const [id, attrs] of Object.entries(updates.corrections || {})) {
    const exists = get(db, `SELECT 1 FROM options WHERE layer_id=? AND id=?`, [LAYER, id]).length;
    if (!exists) {
      console.warn(`  ! correction skipped, no such option: ${id}`);
      continue;
    }
    for (const [key, value] of Object.entries(attrs)) {
      const rows = get(
        db,
        `SELECT value FROM option_attrs WHERE layer_id=? AND option_id=? AND key=?`,
        [LAYER, id, key]
      );
      const before = rows.length ? rows[0][0] : null;
      if (before === value) continue;
      db.run(
        `INSERT OR REPLACE INTO option_attrs (layer_id, option_id, key, value) VALUES (?,?,?,?)`,
        [LAYER, id, key, value]
      );
      console.log(`  fix  ${id}.${key}: ${JSON.stringify(before)} -> ${JSON.stringify(value)}`);
      changes += 1;
    }
  }

  // --- Deletions ----------------------------------------------------------
  for (const { id, reason } of updates.deletions || []) {
    const exists = get(db, `SELECT 1 FROM options WHERE layer_id=? AND id=?`, [LAYER, id]).length;
    if (!exists) continue;
    db.run(`DELETE FROM option_attrs WHERE layer_id=? AND option_id=?`, [LAYER, id]);
    db.run(`DELETE FROM options WHERE layer_id=? AND id=?`, [LAYER, id]);
    console.log(`  del  ${id}\n         ${reason}`);
    changes += 1;
  }

  // --- Additions ----------------------------------------------------------
  const posRows = get(db, `SELECT COALESCE(MAX(position), -1) FROM options WHERE layer_id=?`, [LAYER]);
  let nextPos = (posRows.length ? posRows[0][0] : -1) + 1;

  for (const { id, name, attrs } of updates.additions || []) {
    const exists = get(db, `SELECT 1 FROM options WHERE layer_id=? AND id=?`, [LAYER, id]).length;
    if (exists) {
      // Already present from an earlier run — reconcile attributes instead of
      // skipping, so re-running picks up edits to the data module.
      let touched = 0;
      for (const [key, value] of Object.entries(attrs)) {
        const rows = get(
          db,
          `SELECT value FROM option_attrs WHERE layer_id=? AND option_id=? AND key=?`,
          [LAYER, id, key]
        );
        if (rows.length && rows[0][0] === value) continue;
        db.run(
          `INSERT OR REPLACE INTO option_attrs (layer_id, option_id, key, value) VALUES (?,?,?,?)`,
          [LAYER, id, key, value]
        );
        touched += 1;
      }
      if (touched) {
        console.log(`  sync ${id} (${touched} attr(s) updated)`);
        changes += touched;
      }
      continue;
    }
    db.run(`INSERT INTO options (layer_id, id, name, position) VALUES (?,?,?,?)`, [
      LAYER, id, name, nextPos,
    ]);
    for (const [key, value] of Object.entries(attrs)) {
      db.run(
        `INSERT OR REPLACE INTO option_attrs (layer_id, option_id, key, value) VALUES (?,?,?,?)`,
        [LAYER, id, key, value]
      );
    }
    console.log(`  add  ${id} — ${name}`);
    nextPos += 1;
    changes += 1;
  }

  const total = get(db, `SELECT COUNT(*) FROM options WHERE layer_id=?`, [LAYER])[0][0];

  if (DRY) {
    console.log(`\n[dry run] ${changes} change(s) not written. llm rows would be ${total}.`);
    return;
  }
  if (!changes) {
    console.log('nothing to apply — database already matches the update module');
    return;
  }

  fs.writeFileSync(DB, Buffer.from(db.export()));
  console.log(`\nwrote ${DB} — ${changes} change(s), ${total} llm models total`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
