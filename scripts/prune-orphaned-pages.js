// Removes generated pages whose option no longer exists in the database.
//
// The page builders in tools/ are write-only: they regenerate a page for every
// current option but never delete the page of an option that was removed or
// renamed. The orphan drops out of sitemap.xml yet stays live on the site, so
// a retired model keeps serving a page that says it is available.
//
// Run after `npm run build`:
//   node scripts/prune-orphaned-pages.js [--dry-run]
//
// compare/ is left alone — those are hand-authored topical pages, not
// per-option generated ones.

const fs = require('fs');
const path = require('path');
const initSqlJs = require('../vendor/sql-wasm.js');

const ROOT = path.join(__dirname, '..');
const DB = path.join(ROOT, 'data', 'flowpicker.db');
const DRY = process.argv.includes('--dry-run');

const slug = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

// tools/ holds one directory per layer plus `lib`, which is source code.
const NOT_A_LAYER = new Set(['lib', 'agent-pages']);

function rm(target) {
  if (DRY) return;
  fs.rmSync(target, { recursive: true, force: true });
}

async function main() {
  const SQL = await initSqlJs();
  const db = new SQL.Database(fs.readFileSync(DB));

  const rows = db.exec(`SELECT layer_id, id FROM options`)[0].values;
  const byLayer = new Map();
  const allSlugs = new Set();
  for (const [layerId, id] of rows) {
    const s = slug(id);
    if (!byLayer.has(layerId)) byLayer.set(layerId, new Set());
    byLayer.get(layerId).add(s);
    allSlugs.add(s);
  }

  const removed = [];

  // --- tools/<layer>/<option>/ -------------------------------------------
  const toolsDir = path.join(ROOT, 'tools');
  for (const layer of fs.readdirSync(toolsDir, { withFileTypes: true })) {
    if (!layer.isDirectory() || NOT_A_LAYER.has(layer.name)) continue;
    const valid = byLayer.get(layer.name);
    if (!valid) continue; // directory that doesn't map to a layer — leave it
    const layerDir = path.join(toolsDir, layer.name);
    for (const entry of fs.readdirSync(layerDir, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      if (valid.has(entry.name)) continue;
      rm(path.join(layerDir, entry.name));
      removed.push(`tools/${layer.name}/${entry.name}/`);
    }
  }

  // --- alternatives/<option>-alternatives.html ---------------------------
  // --- pricing/<option>-pricing.html -------------------------------------
  for (const [dir, suffix] of [['alternatives', '-alternatives.html'], ['pricing', '-pricing.html']]) {
    const full = path.join(ROOT, dir);
    if (!fs.existsSync(full)) continue;
    for (const file of fs.readdirSync(full)) {
      if (!file.endsWith(suffix)) continue;
      const optSlug = file.slice(0, -suffix.length);
      if (allSlugs.has(optSlug)) continue;
      rm(path.join(full, file));
      removed.push(`${dir}/${file}`);
    }
  }

  // --- vs/<a>-vs-<b>/ -----------------------------------------------------
  const vsDir = path.join(ROOT, 'vs');
  if (fs.existsSync(vsDir)) {
    for (const entry of fs.readdirSync(vsDir, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const sep = entry.name.indexOf('-vs-');
      if (sep === -1) continue;
      const left = entry.name.slice(0, sep);
      const right = entry.name.slice(sep + 4);
      if (allSlugs.has(left) && allSlugs.has(right)) continue;
      rm(path.join(vsDir, entry.name));
      removed.push(`vs/${entry.name}/`);
    }
  }

  if (!removed.length) {
    console.log('no orphaned pages');
    return;
  }
  for (const r of removed) console.log(`  ${DRY ? 'would remove' : 'removed'} ${r}`);
  console.log(`\n${removed.length} orphaned page(s)${DRY ? ' would be' : ''} removed`);
  if (!DRY) console.log('re-run `npm run build:sitemap` if the sitemap was generated before this prune');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
