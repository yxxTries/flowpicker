// Local saved flows, scoped per signed-in user.
// Storage shape: { "email@x.com": [ { id, name, selections, savedAt }, ... ] }
(() => {
  const KEY = 'flowpicker-saved-flows';
  const LEGACY_BUCKET = '__local__';

  function readDB() {
    try {
      const val = JSON.parse(localStorage.getItem(KEY));
      if (Array.isArray(val)) {
        const migrated = { [LEGACY_BUCKET]: val };
        writeDB(migrated);
        return migrated;
      }
      if (val && typeof val === 'object') return val;
      return {};
    } catch { return {}; }
  }

  function writeDB(db) {
    localStorage.setItem(KEY, JSON.stringify(db));
  }

  function listFor(email) {
    if (!email) return [];
    const db = readDB();
    return db[email] || [];
  }

  function save(email, flow) {
    if (!email) return;
    const db = readDB();
    const list = db[email] || [];
    list.unshift(flow);
    db[email] = list;
    writeDB(db);
  }

  function remove(email, id) {
    if (!email) return;
    const db = readDB();
    if (!db[email]) return;
    db[email] = db[email].filter(f => f.id !== id);
    writeDB(db);
  }

  function get(email, id) {
    if (!email) return null;
    const db = readDB();
    return (db[email] || []).find(f => f.id === id) || null;
  }

  function defaultName(selections) {
    const layers = Object.keys(selections || {});
    if (layers.length === 0) return 'Empty stack';
    const picks = layers
      .flatMap(l => (selections[l] || []).map(o => o.name || o.id))
      .filter(Boolean);
    if (picks.length === 0) return 'Empty stack';
    const head = picks.slice(0, 3).join(' + ');
    return picks.length > 3 ? `${head} +${picks.length - 3} more` : head;
  }

  window.SavedFlows = { listFor, save, remove, get, defaultName };
})();
