// Local saved flows. Each flow is a snapshot of selections + a name + savedAt.
// Storage shape: [ { id, name, selections, savedAt } ]
(() => {
  const KEY = 'flowpicker-saved-flows';

  function readAll() {
    try {
      const val = JSON.parse(localStorage.getItem(KEY));
      // Migrate old email-keyed format if needed
      if (val && !Array.isArray(val)) {
        const merged = Object.values(val).flat();
        writeAll(merged);
        return merged;
      }
      return val || [];
    } catch { return []; }
  }

  function writeAll(list) {
    localStorage.setItem(KEY, JSON.stringify(list));
  }

  function listFor() {
    return readAll();
  }

  function save(_ignored, flow) {
    const list = readAll();
    list.unshift(flow);
    writeAll(list);
  }

  function remove(_ignored, id) {
    const list = readAll().filter(f => f.id !== id);
    writeAll(list);
  }

  function get(_ignored, id) {
    return readAll().find(f => f.id === id) || null;
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
