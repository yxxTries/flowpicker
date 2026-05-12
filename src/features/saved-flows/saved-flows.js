// Per-user saved flows. Each flow is a snapshot of selections + a name + savedAt.
// Storage shape: { [userEmail]: [ { id, name, selections, savedAt } ] }
(() => {
  const KEY = 'flowpicker-saved-flows';

  function readAll() {
    try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; }
  }

  function writeAll(all) {
    localStorage.setItem(KEY, JSON.stringify(all));
  }

  function listFor(email) {
    if (!email) return [];
    return readAll()[email] || [];
  }

  function save(email, flow) {
    if (!email) return;
    const all = readAll();
    const list = all[email] || [];
    list.unshift(flow);
    all[email] = list;
    writeAll(all);
  }

  function remove(email, id) {
    const all = readAll();
    const list = (all[email] || []).filter(f => f.id !== id);
    all[email] = list;
    writeAll(all);
  }

  function get(email, id) {
    return (readAll()[email] || []).find(f => f.id === id) || null;
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
