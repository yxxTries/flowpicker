(() => {
  // Per-layer filter definitions. Each layer maps to an array of filter groups.
  // A group is { key, label, options: [{ value, label }] } and renders as a
  // checkbox group. Fill these in as we agree on filters for each layer.
  const FILTERS_BY_LAYER = {
    ide:         { label: 'IDE / Editor',          groups: [] },
    llm:         { label: 'LLM Provider / Model',  groups: [] },
    integration: { label: 'Integration',           groups: [] },
    context:     { label: 'Context / RAG',         groups: [] },
    agent:       { label: 'Agent / Orchestration', groups: [] },
  };

  // { [layerId]: { [groupKey]: Set<value> } }
  const selections = {};

  function getActiveLayer() {
    const active = document.querySelector('.browse-menu-item.active');
    return active?.dataset.layer || 'ide';
  }

  function render(layerId) {
    const subtitle = document.getElementById('browse-filters-subtitle');
    const body = document.getElementById('browse-filters-body');
    if (!subtitle || !body) return;

    const cfg = FILTERS_BY_LAYER[layerId];
    subtitle.textContent = cfg?.label || '';

    body.innerHTML = '';

    if (!cfg || cfg.groups.length === 0) {
      const empty = document.createElement('p');
      empty.className = 'browse-filters-empty';
      empty.textContent = 'No filters yet.';
      body.appendChild(empty);
      return;
    }

    const layerSel = selections[layerId] ||= {};

    for (const group of cfg.groups) {
      const groupSel = layerSel[group.key] ||= new Set();

      const wrap = document.createElement('div');
      wrap.className = 'browse-filters-group';

      const heading = document.createElement('h3');
      heading.className = 'browse-filters-group-title';
      heading.textContent = group.label;
      wrap.appendChild(heading);

      for (const opt of group.options) {
        const row = document.createElement('label');
        row.className = 'browse-filters-row';

        const cb = document.createElement('input');
        cb.type = 'checkbox';
        cb.value = opt.value;
        cb.checked = groupSel.has(opt.value);
        cb.addEventListener('change', () => {
          if (cb.checked) groupSel.add(opt.value);
          else groupSel.delete(opt.value);
        });

        const text = document.createElement('span');
        text.textContent = opt.label;

        row.appendChild(cb);
        row.appendChild(text);
        wrap.appendChild(row);
      }

      body.appendChild(wrap);
    }
  }

  function init() {
    const menu = document.querySelector('.browse-menu');
    if (!menu) return;

    menu.addEventListener('click', (e) => {
      const btn = e.target.closest('.browse-menu-item');
      if (!btn) return;

      for (const item of menu.querySelectorAll('.browse-menu-item')) {
        item.classList.toggle('active', item === btn);
      }

      render(btn.dataset.layer);
    });

    render(getActiveLayer());
  }

  document.addEventListener('DOMContentLoaded', init);
})();
