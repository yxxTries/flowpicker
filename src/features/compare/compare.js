// Dynamic compare page: pick any products, render a side-by-side table from
// the SQLite-backed product database. State lives in the URL hash so links
// are shareable; localStorage mirrors it for refreshes.
(() => {
  const STORAGE_KEY = 'flowpicker.compare';
  const HASH_PREFIX = 'cmp=';
  const MAX_DESKTOP = 4;
  const MAX_MOBILE = 3;
  const MOBILE_BREAKPOINT = 720;
  const EMPTY = '—';

  const LAYER_BADGES = {
    ide: 'IDE',
    llm: 'LLM',
    integration: 'Integration',
    context: 'Context/RAG',
    agent: 'Agent',
    others: 'Other',
  };

  // Each entry: { layerId, id, name, ...attrs }
  let allProducts = [];
  // Currently picked products (array of same shape as allProducts entries)
  let picked = [];
  let layersByName = {};
  let hideIdenticalRows = false;
  let suppressHashEvent = false;

  // Attribute groups that start collapsed — the secondary detail most users
  // don't need at a glance. They expand on click via the group header. The
  // first three groups (Overview, Pricing, Performance) always stay open.
  const COLLAPSED_BY_DEFAULT = new Set(['capabilities', 'platform', 'meta']);
  const collapsedGroups = new Set(COLLAPSED_BY_DEFAULT);

  // -------- DOM refs (resolved at init) --------
  let elPicker, elSearch, elLayerFilter, elResults, elChips, elTable, elEmpty, elToggleIdentical, elCount, elClear;

  function maxCols() {
    return window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT}px)`).matches ? MAX_MOBILE : MAX_DESKTOP;
  }

  // -------- Hash + storage --------
  function readHash() {
    const h = window.location.hash || '';
    if (!h.startsWith('#')) return [];
    const body = h.slice(1);
    if (!body.startsWith(HASH_PREFIX)) return [];
    const raw = decodeURIComponent(body.slice(HASH_PREFIX.length));
    return raw.split(',').map(s => s.trim()).filter(Boolean).map(parsePair).filter(Boolean);
  }

  function parsePair(s) {
    const idx = s.indexOf(':');
    if (idx < 0) return null;
    return { layerId: s.slice(0, idx), id: s.slice(idx + 1) };
  }

  function writeHash() {
    suppressHashEvent = true;
    const value = picked.map(p => `${p.layerId}:${p.id}`).join(',');
    const next = value ? `#${HASH_PREFIX}${encodeURIComponent(value)}` : '#';
    if (window.location.hash !== next) {
      history.replaceState(null, '', window.location.pathname + window.location.search + (value ? next : ''));
    }
    setTimeout(() => { suppressHashEvent = false; }, 0);
  }

  function readStorage() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.filter(p => p && p.layerId && p.id) : [];
    } catch {
      return [];
    }
  }

  function writeStorage() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(picked.map(p => ({ layerId: p.layerId, id: p.id }))));
    } catch {}
  }

  // -------- Product resolution --------
  function resolve({ layerId, id }) {
    return allProducts.find(p => p.layerId === layerId && p.id === id) || null;
  }

  function flattenProducts(layers) {
    const out = [];
    for (const layer of layers) {
      for (const opt of layer.options) {
        out.push({ ...opt, layerId: layer.id });
      }
    }
    return out;
  }

  // -------- Picker rendering --------
  function renderLayerFilter() {
    elLayerFilter.innerHTML = '';
    const all = document.createElement('option');
    all.value = '';
    all.textContent = 'All layers';
    elLayerFilter.appendChild(all);
    for (const [layerId, label] of Object.entries(LAYER_BADGES)) {
      const opt = document.createElement('option');
      opt.value = layerId;
      opt.textContent = label;
      elLayerFilter.appendChild(opt);
    }
  }

  function matchesSearch(product, q) {
    if (!q) return true;
    const haystack = [product.name, product.provider, product.bestFor, product.capabilities, product.category]
      .filter(Boolean).join(' ').toLowerCase();
    return haystack.includes(q);
  }

  function renderResults() {
    const q = (elSearch.value || '').trim().toLowerCase();
    const layerFilter = elLayerFilter.value;
    const reached = picked.length >= maxCols();

    // Once the user has started comparing (2+ picks) and isn't actively
    // searching/filtering, collapse the results list — it takes a lot of
    // vertical space and the cards are mostly disabled-grey at that point.
    // Typing in the search or changing the layer filter re-expands it.
    const isBrowsing = !q && !layerFilter;
    const shouldCollapse = picked.length >= 2 && isBrowsing;
    elResults.hidden = shouldCollapse;
    if (shouldCollapse) {
      elResults.innerHTML = '';
      return;
    }

    const matches = allProducts.filter(p => {
      if (layerFilter && p.layerId !== layerFilter) return false;
      return matchesSearch(p, q);
    }).slice(0, 30);

    elResults.innerHTML = '';
    if (matches.length === 0) {
      const empty = document.createElement('p');
      empty.className = 'cmp-results-empty';
      empty.textContent = q ? `No products match "${q}".` : 'No products available.';
      elResults.appendChild(empty);
      return;
    }

    for (const product of matches) {
      const isPicked = picked.some(p => p.layerId === product.layerId && p.id === product.id);
      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'cmp-result' + (isPicked ? ' is-picked' : '');
      card.disabled = !isPicked && reached;
      card.setAttribute('aria-pressed', isPicked ? 'true' : 'false');

      const badge = document.createElement('span');
      badge.className = `cmp-result-badge cmp-badge-${product.layerId}`;
      badge.textContent = LAYER_BADGES[product.layerId] || product.layerId;
      card.appendChild(badge);

      const name = document.createElement('span');
      name.className = 'cmp-result-name';
      name.textContent = product.name;
      card.appendChild(name);

      const action = document.createElement('span');
      action.className = 'cmp-result-action';
      action.textContent = isPicked ? '✓' : (reached ? '·' : '+');
      action.setAttribute('aria-hidden', 'true');
      card.appendChild(action);

      card.addEventListener('click', () => {
        if (isPicked) removeProduct(product.layerId, product.id);
        else addProduct(product);
      });
      elResults.appendChild(card);
    }
  }

  function renderChips() {
    elChips.innerHTML = '';
    if (picked.length === 0) {
      const hint = document.createElement('span');
      hint.className = 'cmp-chips-hint';
      hint.textContent = 'No products picked yet — search and click a result to add it.';
      elChips.appendChild(hint);
    } else {
      for (const product of picked) {
        const chip = document.createElement('span');
        chip.className = 'cmp-chip';
        const label = document.createElement('span');
        label.className = 'cmp-chip-label';
        label.textContent = product.name;
        chip.appendChild(label);
        const badge = document.createElement('span');
        badge.className = `cmp-chip-badge cmp-badge-${product.layerId}`;
        badge.textContent = LAYER_BADGES[product.layerId] || product.layerId;
        chip.appendChild(badge);
        const x = document.createElement('button');
        x.type = 'button';
        x.className = 'cmp-chip-remove';
        x.setAttribute('aria-label', `Remove ${product.name}`);
        x.textContent = '×';
        x.addEventListener('click', () => removeProduct(product.layerId, product.id));
        chip.appendChild(x);
        elChips.appendChild(chip);
      }
    }
    elCount.textContent = `${picked.length} / ${maxCols()} picked`;
    if (elClear) elClear.hidden = picked.length === 0;
  }

  // -------- Table rendering --------
  function hasValue(v) {
    return v != null && v !== '' && v !== EMPTY;
  }

  function isUrlKey(k) {
    return k === 'docsUrl' || k === 'websiteUrl';
  }

  function cellNode(key, value) {
    const td = document.createElement('td');
    if (!hasValue(value)) {
      td.textContent = EMPTY;
      td.classList.add('cmp-cell-empty');
      return td;
    }
    if (isUrlKey(key)) {
      const a = document.createElement('a');
      a.href = value;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.textContent = key === 'docsUrl' ? 'Docs ↗' : 'Website ↗';
      td.appendChild(a);
    } else {
      td.textContent = value;
    }
    return td;
  }

  function rowIsIdentical(values) {
    const present = values.filter(hasValue);
    if (present.length < 2) return false;
    const first = String(present[0]).trim();
    return present.every(v => String(v).trim() === first) && present.length === values.length;
  }

  function modeValue(values) {
    const counts = new Map();
    let bestVal = null;
    let bestCount = 0;
    for (const v of values) {
      if (!hasValue(v)) continue;
      const k = String(v).trim();
      const c = (counts.get(k) || 0) + 1;
      counts.set(k, c);
      if (c > bestCount) { bestCount = c; bestVal = k; }
    }
    return bestVal;
  }

  function renderTable() {
    elTable.innerHTML = '';

    if (picked.length < 2) {
      // At 0 picks the picker's own chips-hint ("No products picked yet…")
      // already prompts the user — showing a second empty-state card below
      // is redundant noise. Only render the empty card at exactly 1 pick,
      // when its "Pick 1 more product" message is doing real work.
      elTable.hidden = true;
      if (picked.length === 1) {
        elEmpty.hidden = false;
        elEmpty.querySelector('.cmp-empty-title').textContent = 'Pick 1 more product to start comparing.';
      } else {
        elEmpty.hidden = true;
      }
      return;
    }
    elEmpty.hidden = true;
    elTable.hidden = false;

    const labels = (typeof ATTRIBUTE_LABELS !== 'undefined') ? ATTRIBUTE_LABELS : {};
    const groups = (typeof ATTRIBUTE_GROUPS !== 'undefined') ? ATTRIBUTE_GROUPS : [];

    // Header row
    const thead = document.createElement('thead');
    const headRow = document.createElement('tr');
    const corner = document.createElement('th');
    corner.scope = 'col';
    corner.className = 'cmp-th-corner';
    corner.textContent = 'Attribute';
    headRow.appendChild(corner);
    for (const product of picked) {
      const th = document.createElement('th');
      th.scope = 'col';
      th.className = 'cmp-th-product';

      const top = document.createElement('div');
      top.className = 'cmp-th-top';
      const badge = document.createElement('span');
      badge.className = `cmp-chip-badge cmp-badge-${product.layerId}`;
      badge.textContent = LAYER_BADGES[product.layerId] || product.layerId;
      top.appendChild(badge);
      const close = document.createElement('button');
      close.type = 'button';
      close.className = 'cmp-th-close';
      close.setAttribute('aria-label', `Remove ${product.name} from comparison`);
      close.textContent = '×';
      close.addEventListener('click', () => removeProduct(product.layerId, product.id));
      top.appendChild(close);
      th.appendChild(top);

      const name = document.createElement('div');
      name.className = 'cmp-th-name';
      name.textContent = product.name;
      th.appendChild(name);

      const actions = document.createElement('div');
      actions.className = 'cmp-th-actions';
      const planBtn = document.createElement('button');
      planBtn.type = 'button';
      planBtn.className = 'cmp-th-add';
      const inPlan = (window.SelectionsStore?.load()?.[product.layerId] || []).some(o => o.id === product.id);
      const setPlanState = (added) => {
        planBtn.textContent = added ? '✓ In Plan' : '+ Add to Plan';
        planBtn.classList.toggle('is-added', added);
      };
      setPlanState(inPlan);
      planBtn.addEventListener('click', () => {
        if (!window.SelectionsStore) return;
        const has = (window.SelectionsStore.load()?.[product.layerId] || []).some(o => o.id === product.id);
        if (has) {
          window.SelectionsStore.remove(product.layerId, product.id);
          setPlanState(false);
        } else {
          const { layerId, ...rest } = product;
          window.SelectionsStore.add(product.layerId, rest);
          setPlanState(true);
        }
      });
      actions.appendChild(planBtn);
      th.appendChild(actions);

      headRow.appendChild(th);
    }
    thead.appendChild(headRow);
    elTable.appendChild(thead);

    // Body: grouped rows
    const tbody = document.createElement('tbody');
    let anyRow = false;
    for (const group of groups) {
      const rowsForGroup = [];
      for (const key of group.keys) {
        const values = picked.map(p => p[key]);
        if (!values.some(hasValue)) continue;
        if (hideIdenticalRows && rowIsIdentical(values)) continue;
        rowsForGroup.push({ key, values });
      }
      if (rowsForGroup.length === 0) continue;
      anyRow = true;

      const isCollapsed = collapsedGroups.has(group.id);

      const groupRow = document.createElement('tr');
      groupRow.className = 'cmp-row-group' + (isCollapsed ? ' is-collapsed' : '');
      const groupCell = document.createElement('th');
      groupCell.scope = 'colgroup';
      groupCell.colSpan = picked.length + 1;

      // Clickable header that toggles the group open/closed.
      const toggle = document.createElement('button');
      toggle.type = 'button';
      toggle.className = 'cmp-group-toggle';
      toggle.setAttribute('aria-expanded', String(!isCollapsed));

      const caret = document.createElement('span');
      caret.className = 'cmp-group-caret';
      caret.setAttribute('aria-hidden', 'true');
      caret.textContent = '▸';
      toggle.appendChild(caret);

      const groupLabel = document.createElement('span');
      groupLabel.className = 'cmp-group-label';
      groupLabel.textContent = group.label;
      toggle.appendChild(groupLabel);

      const groupCountEl = document.createElement('span');
      groupCountEl.className = 'cmp-group-count';
      groupCountEl.textContent = `${rowsForGroup.length} row${rowsForGroup.length === 1 ? '' : 's'}`;
      toggle.appendChild(groupCountEl);

      toggle.addEventListener('click', () => {
        if (collapsedGroups.has(group.id)) collapsedGroups.delete(group.id);
        else collapsedGroups.add(group.id);
        renderTable();
      });

      groupCell.appendChild(toggle);
      groupRow.appendChild(groupCell);
      tbody.appendChild(groupRow);

      if (isCollapsed) continue;

      for (const { key, values } of rowsForGroup) {
        const tr = document.createElement('tr');
        const th = document.createElement('th');
        th.scope = 'row';
        th.className = 'cmp-th-row';
        th.textContent = labels[key] || key;
        tr.appendChild(th);

        const mode = modeValue(values);
        for (const v of values) {
          const td = cellNode(key, v);
          if (hasValue(v) && mode != null && String(v).trim() !== mode) {
            td.classList.add('cmp-cell-diff');
          }
          tr.appendChild(td);
        }
        tbody.appendChild(tr);
      }
    }

    if (!anyRow) {
      const tr = document.createElement('tr');
      const td = document.createElement('td');
      td.colSpan = picked.length + 1;
      td.className = 'cmp-row-noattrs';
      td.textContent = hideIdenticalRows
        ? 'All attributes are identical across the selected products. Toggle "Hide identical rows" off to see them.'
        : 'No comparable attributes for the selected products.';
      tr.appendChild(td);
      tbody.appendChild(tr);
    }
    elTable.appendChild(tbody);
  }

  // -------- Mutations --------
  function addProduct(product) {
    if (picked.some(p => p.layerId === product.layerId && p.id === product.id)) return;
    if (picked.length >= maxCols()) return;
    picked.push(product);
    persist();
    renderAll();
  }

  function removeProduct(layerId, id) {
    const before = picked.length;
    picked = picked.filter(p => !(p.layerId === layerId && p.id === id));
    if (picked.length === before) return;
    persist();
    renderAll();
  }

  function setPicked(refs) {
    const resolved = refs.map(resolve).filter(Boolean).slice(0, maxCols());
    picked = resolved;
    persist();
    renderAll();
  }

  function persist() {
    writeHash();
    writeStorage();
  }

  function renderAll() {
    renderChips();
    renderResults();
    renderTable();
  }

  // -------- Featured comparisons --------
  function bindFeaturedCards() {
    document.querySelectorAll('[data-cmp-preset]').forEach(card => {
      card.addEventListener('click', (e) => {
        const preset = card.getAttribute('data-cmp-preset');
        if (!preset) return;
        e.preventDefault();
        const refs = preset.split(',').map(s => s.trim()).filter(Boolean).map(parsePair).filter(Boolean);
        setPicked(refs);
        const target = document.getElementById('cmp-app');
        if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });
  }

  // -------- Init --------
  async function init() {
    elPicker = document.getElementById('cmp-picker');
    elSearch = document.getElementById('cmp-search');
    elLayerFilter = document.getElementById('cmp-layer-filter');
    elResults = document.getElementById('cmp-results');
    elChips = document.getElementById('cmp-chips');
    elTable = document.getElementById('cmp-table');
    elEmpty = document.getElementById('cmp-empty');
    elToggleIdentical = document.getElementById('cmp-toggle-identical');
    elCount = document.getElementById('cmp-count');
    elClear = document.getElementById('cmp-clear');

    if (!elPicker || !elTable) return;

    renderLayerFilter();

    elSearch.addEventListener('input', renderResults);
    elLayerFilter.addEventListener('change', renderResults);
    elToggleIdentical.addEventListener('change', () => {
      hideIdenticalRows = elToggleIdentical.checked;
      renderTable();
    });
    if (elClear) {
      elClear.addEventListener('click', () => {
        if (picked.length === 0) return;
        picked = [];
        persist();
        renderAll();
      });
    }

    window.addEventListener('hashchange', () => {
      if (suppressHashEvent) return;
      const refs = readHash();
      if (refs.length > 0) setPicked(refs);
    });
    window.addEventListener('resize', () => {
      if (picked.length > maxCols()) {
        picked = picked.slice(0, maxCols());
        persist();
      }
      renderAll();
    });

    try {
      const layers = await App.db.load();
      layersByName = Object.fromEntries(layers.map(l => [l.id, l]));
      allProducts = flattenProducts(layers);
    } catch (err) {
      console.error('compare: failed to load product database', err);
      const errBanner = document.createElement('p');
      errBanner.className = 'cmp-error';
      errBanner.textContent = 'Could not load the product database. Try refreshing the page.';
      elPicker.parentNode.insertBefore(errBanner, elPicker);
      return;
    }

    // Initial state: hash > storage > empty
    let initialRefs = readHash();
    if (initialRefs.length === 0) initialRefs = readStorage();
    if (initialRefs.length > 0) setPicked(initialRefs);
    else renderAll();

    bindFeaturedCards();
  }

  App.features = App.features || {};
  App.features.compare = { init };
})();
