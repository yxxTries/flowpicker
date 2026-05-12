// Cross-page persistence for App.state.selections.
// Plan and Browse both include this so adding from Browse shows up in Plan.
(() => {
  const KEY = 'flowpicker-selections';

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return {};
      const parsed = JSON.parse(raw);
      return (parsed && typeof parsed === 'object') ? parsed : {};
    } catch {
      return {};
    }
  }

  function save(selections) {
    try {
      localStorage.setItem(KEY, JSON.stringify(selections || {}));
    } catch {}
  }

  function add(layerId, option) {
    const state = load();
    const current = state[layerId] || [];
    if (current.some(o => o.id === option.id)) return state;
    state[layerId] = [...current, option];
    save(state);
    return state;
  }

  function remove(layerId, optionId) {
    const state = load();
    const current = state[layerId] || [];
    const next = current.filter(o => o.id !== optionId);
    if (next.length === 0) delete state[layerId];
    else state[layerId] = next;
    save(state);
    return state;
  }

  window.SelectionsStore = { load, save, add, remove, KEY };
})();
