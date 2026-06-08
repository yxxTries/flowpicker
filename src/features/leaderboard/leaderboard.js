// Benchmark leaderboard: a sortable, shareable ranking of every LLM Flowpicker
// tracks by SWE-bench / HumanEval / MMLU, plus context window and price.
// A standalone "linkable asset" — the canonical "SWE-bench leaderboard" surface.
//
// Reads the same SQLite-backed product DB as the rest of the app (App.db). The
// active sort column lives in the URL hash (#sort=swe) so a ranked view is
// directly shareable, mirroring the compare page's hash convention.
(() => {
  const HASH_PREFIX = 'sort=';
  const EMPTY = '—';

  // Columns the table can sort by. `parse` turns a stored string ("72%", "200K",
  // "$3") into a comparable number; `dir` is the default sort direction when the
  // column is first selected (benchmarks high-to-low, price low-to-high).
  const COLUMNS = [
    { key: 'rank', label: '#', sortable: false },
    { key: 'name', label: 'Model', sortable: true, dir: 'asc', parse: v => v },
    { key: 'provider', label: 'Provider', sortable: true, dir: 'asc', parse: v => v },
    { key: 'sweBench', label: 'SWE-bench', sortable: true, dir: 'desc', parse: parsePercent },
    { key: 'humanEval', label: 'HumanEval', sortable: true, dir: 'desc', parse: parsePercent },
    { key: 'mmlu', label: 'MMLU', sortable: true, dir: 'desc', parse: parsePercent },
    { key: 'contextWindow', label: 'Context', sortable: true, dir: 'desc', parse: parseContext },
    { key: 'priceTier', label: 'Price', sortable: true, dir: 'asc', parse: parsePriceTier },
  ];

  const PRICE_RANK = { free: 0, budget: 1, mid: 2, premium: 3 };

  let models = [];
  let sortKey = 'sweBench';
  let sortDir = 'desc';

  let elTable, elNote, elCount;

  // -------- value parsing --------
  function parsePercent(v) {
    if (!hasValue(v)) return null;
    const m = String(v).match(/(\d+(?:\.\d+)?)/);
    return m ? parseFloat(m[1]) : null;
  }

  function parseContext(v) {
    if (!hasValue(v)) return null;
    const s = String(v).toUpperCase();
    const m = s.match(/(\d+(?:\.\d+)?)\s*([KM])?/);
    if (!m) return null;
    let n = parseFloat(m[1]);
    if (m[2] === 'M') n *= 1000;
    return n; // normalized to thousands of tokens
  }

  function parsePriceTier(v) {
    if (!hasValue(v)) return null;
    const r = PRICE_RANK[String(v).trim().toLowerCase()];
    return r == null ? null : r;
  }

  function hasValue(v) {
    return v != null && v !== '' && v !== EMPTY;
  }

  // -------- hash --------
  function readHash() {
    const h = (window.location.hash || '').replace(/^#/, '');
    if (!h.startsWith(HASH_PREFIX)) return null;
    const key = decodeURIComponent(h.slice(HASH_PREFIX.length)).trim();
    return COLUMNS.find(c => c.key === key && c.sortable) ? key : null;
  }

  function writeHash() {
    const next = `#${HASH_PREFIX}${encodeURIComponent(sortKey)}`;
    if (window.location.hash !== next) {
      history.replaceState(null, '', window.location.pathname + window.location.search + next);
    }
  }

  // -------- sorting --------
  function sortModels() {
    const col = COLUMNS.find(c => c.key === sortKey) || COLUMNS[3];
    const parse = col.parse || (v => v);
    const factor = sortDir === 'asc' ? 1 : -1;
    models.sort((a, b) => {
      const av = parse(a[sortKey]);
      const bv = parse(b[sortKey]);
      // Missing values always sink to the bottom regardless of direction.
      const aMissing = av == null || av === '';
      const bMissing = bv == null || bv === '';
      if (aMissing && bMissing) return a.name.localeCompare(b.name);
      if (aMissing) return 1;
      if (bMissing) return -1;
      if (typeof av === 'number' && typeof bv === 'number') {
        if (av !== bv) return (av - bv) * factor;
        return a.name.localeCompare(b.name);
      }
      return String(av).localeCompare(String(bv)) * factor;
    });
  }

  function setSort(key) {
    const col = COLUMNS.find(c => c.key === key);
    if (!col || !col.sortable) return;
    if (sortKey === key) {
      sortDir = sortDir === 'asc' ? 'desc' : 'asc';
    } else {
      sortKey = key;
      sortDir = col.dir || 'desc';
    }
    writeHash();
    render();
  }

  // -------- render --------
  function render() {
    sortModels();
    elTable.innerHTML = '';

    const thead = document.createElement('thead');
    const hr = document.createElement('tr');
    for (const col of COLUMNS) {
      const th = document.createElement('th');
      th.scope = 'col';
      th.className = 'lb-th' + (col.sortable ? ' lb-th-sortable' : '');
      if (col.key === 'rank') th.classList.add('lb-th-rank');
      if (col.sortable) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'lb-sort-btn';
        btn.textContent = col.label;
        if (sortKey === col.key) {
          btn.classList.add('is-active');
          const caret = document.createElement('span');
          caret.className = 'lb-caret';
          caret.setAttribute('aria-hidden', 'true');
          caret.textContent = sortDir === 'asc' ? ' ▲' : ' ▼';
          btn.appendChild(caret);
          th.setAttribute('aria-sort', sortDir === 'asc' ? 'ascending' : 'descending');
        }
        btn.addEventListener('click', () => setSort(col.key));
        th.appendChild(btn);
      } else {
        th.textContent = col.label;
      }
      hr.appendChild(th);
    }
    thead.appendChild(hr);
    elTable.appendChild(thead);

    const tbody = document.createElement('tbody');
    models.forEach((m, i) => {
      const tr = document.createElement('tr');
      for (const col of COLUMNS) {
        const td = document.createElement('td');
        td.className = 'lb-td lb-td-' + col.key;
        if (col.key === 'rank') {
          td.textContent = String(i + 1);
          td.classList.add('lb-td-rank');
        } else if (col.key === 'name') {
          td.textContent = m.name;
          td.classList.add('lb-td-name');
        } else {
          const v = m[col.key];
          td.textContent = hasValue(v) ? v : EMPTY;
          if (!hasValue(v)) td.classList.add('lb-cell-empty');
          if (col.key === sortKey) td.classList.add('lb-cell-active');
        }
        tr.appendChild(td);
      }
      tbody.appendChild(tr);
    });
    elTable.appendChild(tbody);

    if (elCount) elCount.textContent = `${models.length} models`;
    if (elNote) {
      const col = COLUMNS.find(c => c.key === sortKey);
      elNote.textContent = `Ranked by ${col ? col.label : sortKey}, ${sortDir === 'asc' ? 'low to high' : 'high to low'}.`;
    }
  }

  async function init() {
    elTable = document.getElementById('lb-table');
    elNote = document.getElementById('lb-note');
    elCount = document.getElementById('lb-count');
    if (!elTable) return;

    let layers;
    try {
      layers = await App.db.load();
    } catch (err) {
      console.error('leaderboard: failed to load product database', err);
      elTable.innerHTML = '<tbody><tr><td class="lb-error">Could not load the model database. Try refreshing.</td></tr></tbody>';
      return;
    }

    const llm = layers.find(l => l.id === 'llm');
    // Keep only models that have at least one benchmark score — a leaderboard
    // of blank rows helps no one.
    models = (llm ? llm.options : []).filter(o =>
      hasValue(o.sweBench) || hasValue(o.humanEval) || hasValue(o.mmlu)
    );

    const hashSort = readHash();
    if (hashSort) {
      sortKey = hashSort;
      sortDir = (COLUMNS.find(c => c.key === hashSort) || {}).dir || 'desc';
    }

    render();
  }

  App.features = App.features || {};
  App.features.leaderboard = { init };
})();
