// SQLite-backed product store. Loads vendor/sql-wasm.{js,wasm} + data/flowpicker.db
// at startup, then materializes a synchronous `LAYERS` array of the same shape
// the rest of the app expects. Edit data/flowpicker.db with DB Browser for SQLite
// (or the sqlite3 CLI) and reload — no JS edits needed for product changes.

App.db = (() => {
  let sqlDb = null;
  let layersCache = null;

  async function load() {
    if (layersCache) return layersCache;

    const fallback = cloneStaticLayers();
    if (window.location.protocol === 'file:' && fallback) {
      layersCache = fallback;
      return layersCache;
    }

    if (typeof initSqlJs !== 'function') {
      if (fallback) {
        layersCache = fallback;
        return layersCache;
      }
      throw new Error('sql.js not loaded — check vendor/sql-wasm.js script tag');
    }
    let SQL;
    try {
      SQL = await initSqlJs({ locateFile: f => `vendor/${f}` });
    } catch (err) {
      if (fallback) {
        console.warn('flowpicker: using static product data fallback', err);
        layersCache = fallback;
        return layersCache;
      }
      throw err;
    }

    const resp = await fetch('data/flowpicker.db').catch(err => {
      if (fallback) {
        console.warn('flowpicker: using static product data fallback', err);
        return null;
      }
      throw err;
    });
    if (!resp) {
      layersCache = fallback;
      return layersCache;
    }
    if (!resp.ok) {
      if (fallback) {
        console.warn(`flowpicker: using static product data fallback (${resp.status} ${resp.statusText})`);
        layersCache = fallback;
        return layersCache;
      }
      throw new Error(`failed to fetch flowpicker.db: ${resp.status} ${resp.statusText}`);
    }
    const bytes = new Uint8Array(await resp.arrayBuffer());
    sqlDb = new SQL.Database(bytes);

    layersCache = materializeLayers();
    return layersCache;
  }

  function cloneStaticLayers() {
    if (!Array.isArray(window.FLOWPICKER_LAYERS)) return null;
    return JSON.parse(JSON.stringify(window.FLOWPICKER_LAYERS));
  }

  function materializeLayers() {
    const layerRows = rows(`
      SELECT id, name, optional, position
      FROM layers
      ORDER BY position
    `);

    const chipRows = rows(`
      SELECT layer_id, key
      FROM layer_chip_keys
      ORDER BY layer_id, position
    `);
    const chipsByLayer = new Map();
    for (const r of chipRows) {
      if (!chipsByLayer.has(r.layer_id)) chipsByLayer.set(r.layer_id, []);
      chipsByLayer.get(r.layer_id).push(r.key);
    }

    const optionRows = rows(`
      SELECT layer_id, id, name, position
      FROM options
      ORDER BY layer_id, position
    `);
    const attrRows = rows(`
      SELECT layer_id, option_id, key, value
      FROM option_attrs
    `);
    const attrsByOpt = new Map();
    for (const r of attrRows) {
      const k = `${r.layer_id}${r.option_id}`;
      if (!attrsByOpt.has(k)) attrsByOpt.set(k, {});
      attrsByOpt.get(k)[r.key] = r.value;
    }

    const optionsByLayer = new Map();
    for (const r of optionRows) {
      if (!optionsByLayer.has(r.layer_id)) optionsByLayer.set(r.layer_id, []);
      const attrs = attrsByOpt.get(`${r.layer_id}${r.id}`) || {};
      optionsByLayer.get(r.layer_id).push({ id: r.id, name: r.name, ...attrs });
    }

    return layerRows.map(r => ({
      id: r.id,
      name: r.name,
      optional: r.optional === 1,
      chipKeys: chipsByLayer.get(r.id) || [],
      options: optionsByLayer.get(r.id) || [],
    }));
  }

  function rows(sql, params = []) {
    const stmt = sqlDb.prepare(sql);
    stmt.bind(params);
    const out = [];
    while (stmt.step()) out.push(stmt.getAsObject());
    stmt.free();
    return out;
  }

  return {
    load,
    layers: () => layersCache,
    query: rows,
  };
})();
