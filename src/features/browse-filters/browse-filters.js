(() => {
  // Per-layer filter definitions. Each group renders as a checkbox group;
  // selecting nothing means "show all". Filter values are matched against the
  // option attribute named by `key`. For comma-joined attributes (e.g. `os`,
  // `compatibility`), an option matches if any selected value appears in its
  // string.
  const FILTERS_BY_LAYER = {
    ide: {
      label: 'IDE / Editor',
      groups: [
        {
          key: 'os',
          label: 'OS support',
          match: 'contains',
          options: [
            { value: 'macOS',   label: 'macOS' },
            { value: 'Windows', label: 'Windows' },
            { value: 'Linux',   label: 'Linux' },
          ],
        },
        {
          key: 'pricing',
          label: 'Pricing',
          match: 'equals',
          options: [
            { value: 'Free',     label: 'Free' },
            { value: 'Freemium', label: 'Freemium' },
            { value: 'Paid',     label: 'Paid' },
          ],
        },
        {
          key: 'aiIntegration',
          label: 'AI integration',
          match: 'equals',
          options: [
            { value: 'AI-native',         label: 'AI-native' },
            { value: 'AI via extension',  label: 'AI via extension' },
          ],
        },
        {
          key: 'interface',
          label: 'Interface',
          match: 'equals',
          options: [
            { value: 'GUI',          label: 'GUI' },
            { value: 'Terminal/TUI', label: 'Terminal/TUI' },
          ],
        },
      ],
    },
    llm: {
      label: 'LLM Provider / Model',
      groups: [
        {
          key: 'provider',
          label: 'Provider',
          match: 'equals',
          options: [
            { value: 'Anthropic', label: 'Anthropic' },
            { value: 'OpenAI',    label: 'OpenAI' },
            { value: 'Google',    label: 'Google' },
            { value: 'Meta',      label: 'Meta' },
            { value: 'DeepSeek',  label: 'DeepSeek' },
          ],
        },
        {
          key: 'hosting',
          label: 'Hosting',
          match: 'equals',
          options: [
            { value: 'Closed/API',    label: 'Closed / API' },
            { value: 'Open-weights',  label: 'Open-weights' },
          ],
        },
        {
          key: 'priceTier',
          label: 'Price tier',
          match: 'equals',
          options: [
            { value: 'Free',    label: 'Free' },
            { value: 'Budget',  label: 'Budget' },
            { value: 'Mid',     label: 'Mid' },
            { value: 'Premium', label: 'Premium' },
          ],
        },
        {
          key: 'contextTier',
          label: 'Context window',
          match: 'equals',
          options: [
            { value: '<32K',       label: '<32K' },
            { value: '32K-128K',   label: '32K–128K' },
            { value: '128K-500K',  label: '128K–500K' },
            { value: '500K+',      label: '500K+' },
          ],
        },
        {
          key: 'modality',
          label: 'Modality',
          match: 'equals',
          options: [
            { value: 'Text-only',                   label: 'Text-only' },
            { value: 'Multimodal (vision)',         label: 'Vision' },
            { value: 'Multimodal (vision + audio)', label: 'Vision + audio' },
          ],
        },
        {
          key: 'speedTier',
          label: 'Speed',
          match: 'equals',
          options: [
            { value: 'Fast',           label: 'Fast' },
            { value: 'Standard',       label: 'Standard' },
            { value: 'Slow/Reasoning', label: 'Slow / Reasoning' },
          ],
        },
      ],
    },
    integration: {
      label: 'Integration',
      groups: [
        {
          key: 'compatibility',
          label: 'Compatible IDE',
          match: 'contains',
          options: [
            { value: 'VS Code',   label: 'VS Code' },
            { value: 'JetBrains', label: 'JetBrains' },
            { value: 'Neovim',    label: 'Neovim' },
            { value: 'Cursor',    label: 'Cursor' },
            { value: 'terminal',  label: 'Terminal' },
            { value: 'Anywhere',  label: 'Anywhere' },
          ],
        },
        {
          key: 'pricing',
          label: 'Pricing',
          match: 'equals',
          options: [
            { value: 'Free',              label: 'Free' },
            { value: 'Freemium',          label: 'Freemium' },
            { value: 'Paid subscription', label: 'Paid subscription' },
            { value: 'BYO API key',       label: 'BYO API key' },
          ],
        },
        {
          key: 'openSource',
          label: 'Open source',
          match: 'equals',
          options: [
            { value: 'Yes', label: 'Yes' },
            { value: 'No',  label: 'No' },
          ],
        },
        {
          key: 'interface',
          label: 'Interface',
          match: 'equals',
          options: [
            { value: 'In-editor',    label: 'In-editor' },
            { value: 'Terminal/CLI', label: 'Terminal / CLI' },
            { value: 'API/SDK',      label: 'API / SDK' },
          ],
        },
      ],
    },
    context: {
      label: 'Context / RAG',
      groups: [
        {
          key: 'hosting',
          label: 'Hosting',
          match: 'equals',
          options: [
            { value: 'Cloud', label: 'Cloud' },
            { value: 'Local', label: 'Local' },
          ],
        },
        {
          key: 'setup',
          label: 'Setup effort',
          match: 'equals',
          options: [
            { value: 'Zero',   label: 'Zero' },
            { value: 'Low',    label: 'Low' },
            { value: 'Medium', label: 'Medium' },
            { value: 'High',   label: 'High' },
          ],
        },
        {
          key: 'staleness',
          label: 'Freshness',
          match: 'equals',
          options: [
            { value: 'auto',   label: 'Auto' },
            { value: 'manual', label: 'Manual' },
            { value: 'N/A',    label: 'N/A' },
          ],
        },
        {
          key: 'openSource',
          label: 'Open source',
          match: 'equals',
          options: [
            { value: 'Yes', label: 'Yes' },
            { value: 'No',  label: 'No' },
            { value: 'N/A', label: 'N/A' },
          ],
        },
      ],
    },
    agent: {
      label: 'Agent / Orchestration',
      groups: [
        {
          key: 'autonomy',
          label: 'Autonomy',
          match: 'equals',
          options: [
            { value: 'None',            label: 'None' },
            { value: 'Assist',          label: 'Assist' },
            { value: 'Semi-autonomous', label: 'Semi-autonomous' },
            { value: 'Autonomous',      label: 'Autonomous' },
          ],
        },
        {
          key: 'interface',
          label: 'Interface',
          match: 'equals',
          options: [
            { value: 'In-editor',      label: 'In-editor' },
            { value: 'Terminal/CLI',   label: 'Terminal / CLI' },
            { value: 'Framework/SDK',  label: 'Framework / SDK' },
          ],
        },
        {
          key: 'openSource',
          label: 'Open source',
          match: 'equals',
          options: [
            { value: 'Yes', label: 'Yes' },
            { value: 'No',  label: 'No' },
            { value: 'N/A', label: 'N/A' },
          ],
        },
        {
          key: 'cost',
          label: 'Cost model',
          match: 'equals',
          options: [
            { value: 'Free',              label: 'Free' },
            { value: 'BYO API key',       label: 'BYO API key' },
            { value: 'Paid subscription', label: 'Paid subscription' },
            { value: 'N/A',               label: 'N/A' },
          ],
        },
      ],
    },
  };

  // Ordered tiers used by sort options. Values not in the list sort last.
  const TIER_ORDER = {
    pricing:     ['Free', 'Freemium', 'Paid', 'Paid subscription', 'BYO API key'],
    priceTier:   ['Free', 'Budget', 'Mid', 'Premium'],
    contextTier: ['<32K', '32K-128K', '128K-500K', '500K+'],
    speedTier:   ['Fast', 'Standard', 'Slow/Reasoning'],
    setup:       ['Zero', 'Low', 'Medium', 'High'],
    autonomy:    ['None', 'Assist', 'Semi-autonomous', 'Autonomous'],
    cost:        ['Free', 'BYO API key', 'Paid subscription', 'N/A'],
  };

  const SORTS_COMMON = [
    { value: 'default', label: 'Default' },
    { value: 'name-asc',  label: 'Name (A → Z)' },
    { value: 'name-desc', label: 'Name (Z → A)' },
    { value: 'released:desc', label: 'Release date (newest first)' },
    { value: 'released:asc',  label: 'Release date (oldest first)' },
  ];

  const MONTHS = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];
  function releasedKey(value) {
    if (value == null) return null;
    const s = String(value).trim();
    if (!s || s === '—') return null;
    const yearMatch = s.match(/(19|20)\d{2}/);
    if (!yearMatch) return null;
    const year = parseInt(yearMatch[0], 10);
    const monthMatch = s.toLowerCase().match(/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/);
    const month = monthMatch ? MONTHS.indexOf(monthMatch[1]) : 0;
    return year * 12 + month;
  }

  const SORTS_BY_LAYER = {
    ide: [
      ...SORTS_COMMON,
      { value: 'tier:pricing:asc',  label: 'Price (low → high)' },
      { value: 'tier:pricing:desc', label: 'Price (high → low)' },
    ],
    llm: [
      ...SORTS_COMMON,
      { value: 'tier:priceTier:asc',    label: 'Price (low → high)' },
      { value: 'tier:priceTier:desc',   label: 'Price (high → low)' },
      { value: 'tier:contextTier:asc',  label: 'Context (small → large)' },
      { value: 'tier:contextTier:desc', label: 'Context (large → small)' },
      { value: 'tier:speedTier:asc',    label: 'Speed (fast → slow)' },
    ],
    integration: [
      ...SORTS_COMMON,
      { value: 'tier:pricing:asc',  label: 'Price (low → high)' },
      { value: 'tier:pricing:desc', label: 'Price (high → low)' },
    ],
    context: [
      ...SORTS_COMMON,
      { value: 'tier:setup:asc',  label: 'Setup effort (low → high)' },
      { value: 'tier:setup:desc', label: 'Setup effort (high → low)' },
    ],
    agent: [
      ...SORTS_COMMON,
      { value: 'tier:autonomy:asc',  label: 'Autonomy (low → high)' },
      { value: 'tier:autonomy:desc', label: 'Autonomy (high → low)' },
      { value: 'tier:cost:asc',      label: 'Cost (low → high)' },
    ],
  };

  // { [layerId]: { [groupKey]: Set<value> } }
  const selections = {};
  // { [layerId]: sortValue }
  const sortBy = {};
  // { [layerId]: pageNumber } — 1-indexed
  const currentPage = {};
  const PAGE_SIZE = 24;

  // Expose to window for search functionality
  window.FILTERS_BY_LAYER = FILTERS_BY_LAYER;
  window.selections = selections;
  window.currentPage = currentPage;

  function getActiveLayer() {
    const active = document.querySelector('.browse-menu-item.active');
    return active?.dataset.layer || 'ide';
  }

  function shouldReturnToPlan() {
    try {
      const params = new URLSearchParams(window.location.search);
      return params.get('return') === 'plan';
    } catch {
      return false;
    }
  }

  function returnToPlan() {
    window.location.href = 'index.html';
  }

  function optionMatches(option, group, selected) {
    if (selected.size === 0) return true;
    const raw = option[group.key];
    if (raw == null || raw === '—') return false;
    if (group.match === 'contains') {
      for (const v of selected) {
        if (String(raw).toLowerCase().includes(v.toLowerCase())) return true;
      }
      return false;
    }
    return selected.has(String(raw));
  }

  function filterOptions(layerId, options) {
    const cfg = FILTERS_BY_LAYER[layerId];
    if (!cfg || cfg.groups.length === 0) return options;
    const layerSel = selections[layerId];
    if (!layerSel) return options;

    return options.filter(opt => {
      for (const group of cfg.groups) {
        const sel = layerSel[group.key];
        if (!sel || sel.size === 0) continue;
        if (!optionMatches(opt, group, sel)) return false;
      }
      return true;
    });
  }

  function tierIndex(key, value) {
    const order = TIER_ORDER[key];
    if (!order) return Number.MAX_SAFE_INTEGER;
    const i = order.indexOf(String(value));
    return i === -1 ? Number.MAX_SAFE_INTEGER : i;
  }

  // Parse a price string like '$15' or '$0.27' into a number; returns -1 for free/unknown.
  function parsePriceValue(str) {
    if (!str || typeof str !== 'string') return -1;
    const m = str.match(/\$([\d.]+)/);
    return m ? parseFloat(m[1]) : -1;
  }

  function sortOptions(layerId, options) {
    const mode = sortBy[layerId] || 'default';
    if (mode === 'default') return options;
    const arr = options.slice();
    if (mode === 'name-asc') {
      arr.sort((a, b) => String(a.name).localeCompare(String(b.name)));
    } else if (mode === 'name-desc') {
      arr.sort((a, b) => String(b.name).localeCompare(String(a.name)));
    } else if (mode.startsWith('released:')) {
      const dir = mode.split(':')[1];
      arr.sort((a, b) => {
        const ka = releasedKey(a.released);
        const kb = releasedKey(b.released);
        if (ka == null && kb == null) return String(a.name).localeCompare(String(b.name));
        if (ka == null) return 1;
        if (kb == null) return -1;
        const diff = ka - kb;
        if (diff !== 0) return dir === 'desc' ? -diff : diff;
        return String(a.name).localeCompare(String(b.name));
      });
    } else if (mode.startsWith('tier:')) {
      const [, key, dir] = mode.split(':');
      arr.sort((a, b) => {
        const aIdx = tierIndex(key, a[key]);
        const bIdx = tierIndex(key, b[key]);
        // Items with no tier always sort last regardless of direction.
        const aUnknown = aIdx === Number.MAX_SAFE_INTEGER;
        const bUnknown = bIdx === Number.MAX_SAFE_INTEGER;
        if (aUnknown !== bUnknown) return aUnknown ? 1 : -1;
        const diff = aIdx - bIdx;
        if (diff !== 0) return dir === 'desc' ? -diff : diff;
        // Within the same tier, break ties by actual output price (most expensive first for desc).
        if (key === 'priceTier') {
          const aPrice = parsePriceValue(a.priceOutput);
          const bPrice = parsePriceValue(b.priceOutput);
          if (aPrice !== bPrice) return dir === 'desc' ? bPrice - aPrice : aPrice - bPrice;
        }
        return String(a.name).localeCompare(String(b.name));
      });
    }
    return arr;
  }

  function applySearchFilter(options) {
    const searchInput = document.getElementById('browse-search-input');
    const query = searchInput?.value || '';
    if (!query.trim()) return options;
    const q = query.toLowerCase().trim();
    return options.filter(opt => {
      if (String(opt.name).toLowerCase().includes(q)) return true;
      if (String(opt.provider || '').toLowerCase().includes(q)) return true;
      if (String(opt.bestFor || '').toLowerCase().includes(q)) return true;
      if (String(opt.capabilities || '').toLowerCase().includes(q)) return true;
      return false;
    });
  }

  function renderCards(layerId) {
    const container = document.getElementById('browse-cards');
    const status = document.getElementById('browse-results-status');
    if (!container) return;

    const layer = (window.LAYERS || []).find(l => l.id === layerId);
    if (!layer) {
      container.innerHTML = '';
      if (status) status.textContent = '';
      renderPagination(layerId, 0, 0);
      return;
    }

    const all = layer.options;
    let filtered = filterOptions(layerId, all);
    filtered = applySearchFilter(filtered);
    const visible = sortOptions(layerId, filtered);

    const totalPages = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
    const page = Math.min(Math.max(1, currentPage[layerId] || 1), totalPages);
    currentPage[layerId] = page;
    const start = (page - 1) * PAGE_SIZE;
    const pageItems = visible.slice(start, start + PAGE_SIZE);

    container.innerHTML = '';
    if (visible.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'card-grid-empty';
      const searchInput = document.getElementById('browse-search-input');
      const hasSearch = searchInput?.value?.trim();
      empty.textContent = hasSearch ? 'No matches. Try adjusting your search.' : 'No matches. Try clearing some filters.';
      container.appendChild(empty);
    } else {
      for (const option of pageItems) {
        container.appendChild(buildCard(option, layerId));
      }
    }

    if (status) {
      const hidden = all.length - visible.length;
      const rangeEnd = start + pageItems.length;
      const base = visible.length > PAGE_SIZE
        ? `Showing ${start + 1}–${rangeEnd} of ${visible.length}`
        : `Showing ${visible.length} of ${all.length}`;
      status.textContent = hidden > 0 && visible.length <= PAGE_SIZE
        ? `${base} (${hidden} filtered out)`
        : base;
    }

    renderPagination(layerId, page, totalPages);
  }

  function renderPagination(layerId, page, totalPages) {
    let container = document.getElementById('browse-pagination');
    if (!container) {
      container = document.createElement('nav');
      container.id = 'browse-pagination';
      container.className = 'browse-pagination';
      container.setAttribute('aria-label', 'Pagination');
      const results = document.querySelector('.browse-results');
      if (results) results.appendChild(container);
    }

    container.innerHTML = '';
    if (totalPages <= 1) {
      container.hidden = true;
      return;
    }
    container.hidden = false;

    const mkBtn = (label, targetPage, opts = {}) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'browse-pagination-btn';
      if (opts.active) btn.classList.add('is-active');
      if (opts.disabled) btn.disabled = true;
      btn.textContent = label;
      if (opts.ariaLabel) btn.setAttribute('aria-label', opts.ariaLabel);
      if (!opts.disabled && !opts.active) {
        btn.addEventListener('click', () => {
          currentPage[layerId] = targetPage;
          renderCards(layerId);
          const results = document.querySelector('.browse-results');
          if (results) results.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
      }
      return btn;
    };

    container.appendChild(mkBtn('‹ Prev', page - 1, { disabled: page === 1, ariaLabel: 'Previous page' }));

    // Compact page numbers: show first, last, current ± 1, with ellipses
    const pageNums = compactPageRange(page, totalPages);
    for (const p of pageNums) {
      if (p === '…') {
        const dots = document.createElement('span');
        dots.className = 'browse-pagination-dots';
        dots.textContent = '…';
        container.appendChild(dots);
      } else {
        container.appendChild(mkBtn(String(p), p, {
          active: p === page,
          ariaLabel: `Page ${p}`,
        }));
      }
    }

    container.appendChild(mkBtn('Next ›', page + 1, { disabled: page === totalPages, ariaLabel: 'Next page' }));
  }

  function compactPageRange(current, total) {
    const result = [];
    const window = 1; // pages on each side of current
    const pages = new Set([1, total, current, current - window, current + window]);
    const sorted = [...pages].filter(p => p >= 1 && p <= total).sort((a, b) => a - b);
    let prev = 0;
    for (const p of sorted) {
      if (p - prev > 1) result.push('…');
      result.push(p);
      prev = p;
    }
    return result;
  }

  function buildCard(option, layerId) {
    const card = document.createElement('div');
    card.className = 'option-card browse-card';
    card.tabIndex = 0;
    card.setAttribute('role', 'button');
    card.setAttribute('aria-label', `View details for ${option.name}`);
    card.addEventListener('click', (e) => {
      if (e.target.closest('.browse-add')) return;
      openDetail(option, layerId);
    });
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        if (e.target !== card) return;
        e.preventDefault();
        openDetail(option, layerId);
      }
    });

    const addBtn = document.createElement('button');
    addBtn.type = 'button';
    addBtn.className = 'browse-add';
    const setState = (added) => {
      if (added) {
        addBtn.textContent = '✓';
        addBtn.classList.add('is-added');
        addBtn.setAttribute('aria-label', `Remove ${option.name} from Plan`);
        addBtn.title = `Remove ${option.name} from Plan`;
      } else {
        addBtn.textContent = '+';
        addBtn.classList.remove('is-added');
        addBtn.setAttribute('aria-label', `Add ${option.name} to Plan`);
        addBtn.title = `Add ${option.name} to Plan`;
      }
    };
    const inPlan = (window.SelectionsStore?.load()?.[layerId] || []).some(o => o.id === option.id);
    setState(inPlan);
    addBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (!window.SelectionsStore) return;
      const nowIn = (window.SelectionsStore.load()?.[layerId] || []).some(o => o.id === option.id);
      if (nowIn) {
        window.SelectionsStore.remove(layerId, option.id);
        setState(false);
      } else {
        window.SelectionsStore.add(layerId, option);
        setState(true);
        if (shouldReturnToPlan()) {
          returnToPlan();
          return;
        }
      }
    });
    card.appendChild(addBtn);

    const title = document.createElement('h3');
    title.textContent = option.name;
    card.appendChild(title);

    const labels = (typeof ATTRIBUTE_LABELS !== 'undefined') ? ATTRIBUTE_LABELS : {};
    const cardKeys = CARD_KEYS_BY_LAYER[layerId];
    const entries = cardKeys
      ? cardKeys.map(k => [k, option[k]])
      : Object.entries(option).filter(([k]) => k !== 'id' && k !== 'name');

    const dl = document.createElement('dl');
    for (const [key, value] of entries) {
      if (!value || value === '—') continue;
      const dt = document.createElement('dt');
      dt.textContent = labels[key] || key;
      const dd = document.createElement('dd');
      dd.textContent = value;
      dl.appendChild(dt);
      dl.appendChild(dd);
    }
    card.appendChild(dl);
    return card;
  }

  const CARD_KEYS_BY_LAYER = {
    llm: ['provider', 'priceTier', 'contextWindow', 'speedTier'],
    ide: ['os', 'pricing', 'aiIntegration', 'notes'],
    integration: ['compatibility', 'pricing', 'openSource', 'interface'],
    context: ['hosting', 'staleness', 'setup', 'indexLimit'],
    agent: ['notes', 'autonomy', 'interface', 'cost'],
  };

  function hasVal(v) {
    return v != null && v !== '' && v !== '—';
  }

  function renderLlmDetail(body, option) {
    const sidebar = document.createElement('aside');
    sidebar.className = 'browse-detail-sidebar';

    const sidebarStats = [
      {
        label: 'Price · per M tokens',
        render: () => {
          if (!hasVal(option.priceInput) && !hasVal(option.priceOutput)) return null;
          const wrap = document.createElement('div');
          wrap.className = 'detail-price';
          const main = document.createElement('div');
          main.className = 'detail-price-main';
          main.textContent = `${option.priceInput || '—'} in  ·  ${option.priceOutput || '—'} out`;
          wrap.appendChild(main);
          if (hasVal(option.priceCache)) {
            const cache = document.createElement('div');
            cache.className = 'detail-price-sub';
            cache.textContent = `${option.priceCache} cached`;
            wrap.appendChild(cache);
          }
          if (hasVal(option.priceTier)) {
            const tier = document.createElement('div');
            tier.className = 'detail-price-tier';
            tier.textContent = `${option.priceTier} tier`;
            wrap.appendChild(tier);
          }
          return wrap;
        },
      },
      {
        label: 'Context',
        render: () => {
          if (!hasVal(option.contextWindow) && !hasVal(option.maxOutput)) return null;
          const wrap = document.createElement('div');
          const ctx = document.createElement('div');
          ctx.className = 'detail-stat-big';
          ctx.textContent = option.contextWindow || '—';
          wrap.appendChild(ctx);
          if (hasVal(option.maxOutput)) {
            const out = document.createElement('div');
            out.className = 'detail-stat-sub';
            out.textContent = `${option.maxOutput} max output`;
            wrap.appendChild(out);
          }
          return wrap;
        },
      },
      {
        label: 'Speed',
        render: () => {
          if (!hasVal(option.speedTier)) return null;
          const wrap = document.createElement('div');
          const big = document.createElement('div');
          big.className = 'detail-stat-big';
          big.textContent = option.speedTier;
          wrap.appendChild(big);
          if (hasVal(option.latency)) {
            const sub = document.createElement('div');
            sub.className = 'detail-stat-sub';
            sub.textContent = `${option.latency} latency`;
            wrap.appendChild(sub);
          }
          return wrap;
        },
      },
      {
        label: 'Hosting',
        render: () => {
          if (!hasVal(option.hosting)) return null;
          const wrap = document.createElement('div');
          wrap.className = 'detail-stat-text';
          wrap.textContent = option.hosting;
          return wrap;
        },
      },
      {
        label: 'Model ID',
        render: () => {
          if (!hasVal(option.modelId)) return null;
          const wrap = document.createElement('div');
          wrap.className = 'detail-model-id';
          const code = document.createElement('code');
          code.textContent = option.modelId;
          wrap.appendChild(code);
          const copy = document.createElement('button');
          copy.type = 'button';
          copy.className = 'detail-copy';
          copy.textContent = 'copy';
          copy.addEventListener('click', async () => {
            try {
              await navigator.clipboard.writeText(option.modelId);
              copy.textContent = 'copied';
              setTimeout(() => { copy.textContent = 'copy'; }, 1200);
            } catch {}
          });
          wrap.appendChild(copy);
          return wrap;
        },
      },
    ];

    for (const stat of sidebarStats) {
      const content = stat.render();
      if (!content) continue;
      const block = document.createElement('div');
      block.className = 'detail-sidebar-block';
      const label = document.createElement('div');
      label.className = 'detail-sidebar-label';
      label.textContent = stat.label;
      block.appendChild(label);
      block.appendChild(content);
      sidebar.appendChild(block);
    }

    const main = document.createElement('div');
    main.className = 'browse-detail-main';

    if (hasVal(option.bestFor)) {
      main.appendChild(buildSection('Best for', (sec) => {
        const p = document.createElement('p');
        p.className = 'detail-prose';
        p.textContent = option.bestFor;
        sec.appendChild(p);
      }));
    }

    if (hasVal(option.capabilities) || hasVal(option.modality)) {
      main.appendChild(buildSection('Capabilities', (sec) => {
        const list = document.createElement('ul');
        list.className = 'detail-caps';
        const caps = [];
        if (hasVal(option.modality)) caps.push(option.modality);
        if (hasVal(option.capabilities)) {
          for (const c of String(option.capabilities).split(',')) {
            const t = c.trim();
            if (t) caps.push(t);
          }
        }
        for (const c of caps) {
          const li = document.createElement('li');
          li.textContent = c;
          list.appendChild(li);
        }
        sec.appendChild(list);
      }));
    }

    const benchmarks = [
      { key: 'sweBench',  label: 'SWE-bench' },
      { key: 'humanEval', label: 'HumanEval' },
      { key: 'mmlu',      label: 'MMLU' },
    ].filter(b => hasVal(option[b.key]));

    if (benchmarks.length > 0) {
      main.appendChild(buildSection('Benchmarks', (sec) => {
        const table = document.createElement('div');
        table.className = 'detail-benchmarks';
        for (const b of benchmarks) {
          const raw = String(option[b.key]);
          const pct = parseFloat(raw);
          const row = document.createElement('div');
          row.className = 'detail-bench-row';
          const name = document.createElement('span');
          name.className = 'detail-bench-name';
          name.textContent = b.label;
          row.appendChild(name);
          const bar = document.createElement('span');
          bar.className = 'detail-bench-bar';
          const fill = document.createElement('span');
          fill.className = 'detail-bench-fill';
          fill.style.width = Number.isFinite(pct) ? `${Math.max(0, Math.min(100, pct))}%` : '0%';
          bar.appendChild(fill);
          row.appendChild(bar);
          const val = document.createElement('span');
          val.className = 'detail-bench-val';
          val.textContent = raw;
          row.appendChild(val);
          table.appendChild(row);
        }
        sec.appendChild(table);
        if (hasVal(option.benchmark)) {
          const note = document.createElement('p');
          note.className = 'detail-bench-note';
          note.textContent = option.benchmark;
          sec.appendChild(note);
        }
      }));
    }

    const metaRows = [
      { label: 'Knowledge cutoff', value: option.knowledgeCutoff },
      { label: 'Released',         value: option.released },
    ].filter(r => hasVal(r.value));

    if (metaRows.length > 0) {
      main.appendChild(buildSection('Details', (sec) => {
        const dl = document.createElement('dl');
        dl.className = 'detail-meta';
        for (const r of metaRows) {
          const dt = document.createElement('dt');
          dt.textContent = r.label;
          const dd = document.createElement('dd');
          dd.textContent = r.value;
          dl.appendChild(dt);
          dl.appendChild(dd);
        }
        sec.appendChild(dl);
      }));
    }

    const footerLinks = [
      { url: option.websiteUrl, label: 'Website →' },
      { url: option.docsUrl,    label: 'Docs →' },
    ].filter(l => hasVal(l.url));

    if (footerLinks.length > 0) {
      const footer = document.createElement('div');
      footer.className = 'detail-footer';
      for (const l of footerLinks) {
        const link = document.createElement('a');
        link.className = 'detail-link';
        link.href = l.url;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.textContent = l.label;
        footer.appendChild(link);
      }
      main.appendChild(footer);
    }

    body.appendChild(sidebar);
    body.appendChild(main);
  }

  function sidebarStat(label, value) {
    const block = document.createElement('div');
    block.className = 'detail-sidebar-block';
    const lbl = document.createElement('div');
    lbl.className = 'detail-sidebar-label';
    lbl.textContent = label;
    block.appendChild(lbl);
    const val = document.createElement('div');
    val.className = 'detail-stat-text';
    val.textContent = value;
    block.appendChild(val);
    return block;
  }

  function commonDetailSections(body, option) {
    if (hasVal(option.bestFor)) {
      body.appendChild(buildSection('Best for', (sec) => {
        const p = document.createElement('p');
        p.className = 'detail-prose';
        p.textContent = option.bestFor;
        sec.appendChild(p);
      }));
    }

    if (hasVal(option.capabilities)) {
      body.appendChild(buildSection('Capabilities', (sec) => {
        const list = document.createElement('ul');
        list.className = 'detail-caps';
        for (const c of String(option.capabilities).split(',')) {
          const t = c.trim();
          if (!t) continue;
          const li = document.createElement('li');
          li.textContent = t;
          list.appendChild(li);
        }
        sec.appendChild(list);
      }));
    }

    const metaRows = [
      { label: 'Released', value: option.released },
    ].filter(r => hasVal(r.value));

    if (metaRows.length > 0) {
      body.appendChild(buildSection('Details', (sec) => {
        const dl = document.createElement('dl');
        dl.className = 'detail-meta';
        for (const r of metaRows) {
          const dt = document.createElement('dt');
          dt.textContent = r.label;
          const dd = document.createElement('dd');
          dd.textContent = r.value;
          dl.appendChild(dt);
          dl.appendChild(dd);
        }
        sec.appendChild(dl);
      }));
    }

    const footerLinks = [
      { url: option.websiteUrl, label: 'Website →' },
      { url: option.docsUrl,    label: 'Docs →' },
    ].filter(l => hasVal(l.url));

    if (footerLinks.length > 0) {
      const footer = document.createElement('div');
      footer.className = 'detail-footer';
      for (const l of footerLinks) {
        const link = document.createElement('a');
        link.className = 'detail-link';
        link.href = l.url;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.textContent = l.label;
        footer.appendChild(link);
      }
      body.appendChild(footer);
    }
  }

  function renderIdeDetail(body, option) {
    const sidebar = document.createElement('aside');
    sidebar.className = 'browse-detail-sidebar';
    const stats = [
      ['OS', option.os],
      ['Pricing', option.pricing],
      ['AI Integration', option.aiIntegration],
      ['Interface', option.interface],
      ['Extensibility', option.extensibility],
      ['Collaboration', option.collaboration],
      ['Notes', option.notes],
    ];
    for (const [label, value] of stats) {
      if (!hasVal(value)) continue;
      sidebar.appendChild(sidebarStat(label, value));
    }

    const main = document.createElement('div');
    main.className = 'browse-detail-main';
    commonDetailSections(main, option);

    if (hasVal(option.languages)) {
      main.insertBefore(buildSection('Languages', (sec) => {
        const list = document.createElement('ul');
        list.className = 'detail-caps';
        for (const c of String(option.languages).split(',')) {
          const t = c.trim();
          if (!t) continue;
          const li = document.createElement('li');
          li.textContent = t;
          list.appendChild(li);
        }
        sec.appendChild(list);
      }), main.lastChild);
    }

    body.appendChild(sidebar);
    body.appendChild(main);
  }

  function renderIntegrationDetail(body, option) {
    const sidebar = document.createElement('aside');
    sidebar.className = 'browse-detail-sidebar';
    const stats = [
      ['Compatibility', option.compatibility],
      ['Pricing', option.pricing],
      ['Open Source', option.openSource],
      ['Interface', option.interface],
      ['Model Choice', option.modelChoice],
      ['Context Handling', option.contextHandling],
      ['Privacy', option.privacy],
    ];
    for (const [label, value] of stats) {
      if (!hasVal(value)) continue;
      sidebar.appendChild(sidebarStat(label, value));
    }

    const main = document.createElement('div');
    main.className = 'browse-detail-main';
    commonDetailSections(main, option);

    body.appendChild(sidebar);
    body.appendChild(main);
  }

  function renderContextDetail(body, option) {
    const sidebar = document.createElement('aside');
    sidebar.className = 'browse-detail-sidebar';
    const stats = [
      ['Index Limit', option.indexLimit],
      ['Hosting', option.hosting],
      ['Staleness', option.staleness],
      ['Setup', option.setup],
      ['Open Source', option.openSource],
      ['Index Type', option.indexType],
      ['Update Mode', option.updateMode],
      ['Privacy', option.privacy],
    ];
    for (const [label, value] of stats) {
      if (!hasVal(value)) continue;
      sidebar.appendChild(sidebarStat(label, value));
    }

    const main = document.createElement('div');
    main.className = 'browse-detail-main';
    commonDetailSections(main, option);

    body.appendChild(sidebar);
    body.appendChild(main);
  }

  function renderAgentDetail(body, option) {
    const sidebar = document.createElement('aside');
    sidebar.className = 'browse-detail-sidebar';
    const stats = [
      ['Notes', option.notes],
      ['Autonomy', option.autonomy],
      ['Interface', option.interface],
      ['Open Source', option.openSource],
      ['Cost Model', option.cost],
      ['Model Choice', option.modelChoice],
      ['Guardrails', option.guardrails],
    ];
    for (const [label, value] of stats) {
      if (!hasVal(value)) continue;
      sidebar.appendChild(sidebarStat(label, value));
    }

    const main = document.createElement('div');
    main.className = 'browse-detail-main';
    commonDetailSections(main, option);

    body.appendChild(sidebar);
    body.appendChild(main);
  }

  function buildSection(title, fill) {
    const sec = document.createElement('section');
    sec.className = 'detail-section';
    const h = document.createElement('h3');
    h.className = 'detail-section-title';
    h.textContent = title;
    sec.appendChild(h);
    fill(sec);
    return sec;
  }

  let activeDetail = null;

  function closeDetail() {
    if (!activeDetail) return;
    const { overlay, onKey, prevOverflow } = activeDetail;
    document.removeEventListener('keydown', onKey, true);
    document.body.style.overflow = prevOverflow;
    overlay.remove();
    activeDetail = null;
  }

  function openDetail(option, layerId) {
    closeDetail();

    const overlay = document.createElement('div');
    overlay.className = 'browse-detail-overlay';

    const backdrop = document.createElement('div');
    backdrop.className = 'browse-detail-backdrop';
    backdrop.addEventListener('click', closeDetail);
    overlay.appendChild(backdrop);

    const panel = document.createElement('div');
    panel.className = 'browse-detail-panel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-modal', 'true');
    panel.setAttribute('aria-label', `${option.name} details`);

    const header = document.createElement('header');
    header.className = 'browse-detail-header';

    const titleWrap = document.createElement('div');
    titleWrap.className = 'browse-detail-title-wrap';

    const title = document.createElement('h2');
    title.className = 'browse-detail-title';
    title.textContent = option.name;
    titleWrap.appendChild(title);

    if (option.provider) {
      const sub = document.createElement('span');
      sub.className = 'browse-detail-subtitle';
      sub.textContent = option.provider;
      titleWrap.appendChild(sub);
    }
    header.appendChild(titleWrap);

    const actions = document.createElement('div');
    actions.className = 'browse-detail-actions';

    const addBtn = document.createElement('button');
    addBtn.type = 'button';
    addBtn.className = 'browse-detail-add';
    const setDetailState = (added) => {
      if (added) {
        addBtn.textContent = 'Remove from plan';
        addBtn.classList.add('is-added');
      } else {
        addBtn.textContent = 'Add to plan';
        addBtn.classList.remove('is-added');
      }
    };
    const alreadyInPlan = (window.SelectionsStore?.load()?.[layerId] || []).some(o => o.id === option.id);
    setDetailState(alreadyInPlan);
    addBtn.addEventListener('click', () => {
      if (!window.SelectionsStore) return;
      const nowIn = (window.SelectionsStore.load()?.[layerId] || []).some(o => o.id === option.id);
      if (nowIn) {
        const updated = window.SelectionsStore.remove(layerId, option.id);
        setDetailState(false);
        if (typeof App !== 'undefined' && App.state) {
          App.state.selections = updated;
          if (typeof window.refresh === 'function') window.refresh();
        }
      } else {
        window.SelectionsStore.add(layerId, option);
        setDetailState(true);
        if (shouldReturnToPlan()) {
          returnToPlan();
          return;
        }
      }
    });
    actions.appendChild(addBtn);

    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'browse-detail-close';
    closeBtn.setAttribute('aria-label', 'Close');
    closeBtn.textContent = '×';
    closeBtn.addEventListener('click', closeDetail);
    actions.appendChild(closeBtn);

    header.appendChild(actions);

    panel.appendChild(header);

    const body = document.createElement('div');
    body.className = 'browse-detail-body';

    if (layerId === 'llm') {
      renderLlmDetail(body, option);
    } else if (layerId === 'ide') {
      renderIdeDetail(body, option);
    } else if (layerId === 'integration') {
      renderIntegrationDetail(body, option);
    } else if (layerId === 'context') {
      renderContextDetail(body, option);
    } else if (layerId === 'agent') {
      renderAgentDetail(body, option);
    }

    panel.appendChild(body);

    overlay.appendChild(panel);
    document.body.appendChild(overlay);

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKey = (e) => {
      if (e.key === 'Escape') closeDetail();
    };
    document.addEventListener('keydown', onKey, true);

    closeBtn.focus();

    activeDetail = { overlay, onKey, prevOverflow };
  }

  function renderFilters(layerId) {
    const body = document.getElementById('browse-filters-body');
    if (!body) return;

    const cfg = FILTERS_BY_LAYER[layerId];

    body.innerHTML = '';

    if (!cfg || cfg.groups.length === 0) {
      const empty = document.createElement('p');
      empty.className = 'browse-filters-empty';
      empty.textContent = 'No filters for this category.';
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
          currentPage[layerId] = 1;
          renderCards(layerId);
          updateMobileFilterBadge(layerId);
        });

        const tick = document.createElement('span');
        tick.className = 'browse-tick';
        tick.setAttribute('aria-hidden', 'true');

        const text = document.createElement('span');
        text.textContent = opt.label;

        row.appendChild(cb);
        row.appendChild(tick);
        row.appendChild(text);
        wrap.appendChild(row);
      }

      body.appendChild(wrap);
    }
  }

  function renderSort(layerId) {
    const body = document.getElementById('browse-sort-body');
    if (!body) return;

    body.innerHTML = '';
    const opts = SORTS_BY_LAYER[layerId] || SORTS_COMMON;
    const current = sortBy[layerId] || 'default';
    const groupName = `browse-sort-${layerId}`;

    const wrap = document.createElement('div');
    wrap.className = 'browse-filters-group';

    for (const opt of opts) {
      const row = document.createElement('label');
      row.className = 'browse-sort-row';

      const rb = document.createElement('input');
      rb.type = 'radio';
      rb.name = groupName;
      rb.value = opt.value;
      rb.checked = current === opt.value;
      rb.addEventListener('change', () => {
        if (rb.checked) {
          sortBy[layerId] = opt.value;
          currentPage[layerId] = 1;
          renderCards(layerId);
        }
      });

      const tick = document.createElement('span');
      tick.className = 'browse-tick';
      tick.setAttribute('aria-hidden', 'true');

      const text = document.createElement('span');
      text.textContent = opt.label;

      row.appendChild(rb);
      row.appendChild(tick);
      row.appendChild(text);
      wrap.appendChild(row);
    }

    body.appendChild(wrap);
  }

  let activeTab = 'filters';

  function setActiveTab(tab) {
    activeTab = tab;
    const filtersBody = document.getElementById('browse-filters-body');
    const sortBody = document.getElementById('browse-sort-body');
    const tabs = document.querySelectorAll('.browse-filters-tab');
    tabs.forEach(t => {
      const isActive = t.dataset.tab === tab;
      t.classList.toggle('active', isActive);
      t.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });
    if (filtersBody) filtersBody.hidden = tab !== 'filters';
    if (sortBody) sortBody.hidden = tab !== 'sort';
  }

  function countActiveFilters(layerId) {
    const layerSel = selections[layerId];
    if (!layerSel) return 0;
    let n = 0;
    for (const key of Object.keys(layerSel)) {
      const set = layerSel[key];
      if (set && set.size) n += set.size;
    }
    return n;
  }

  function updateMobileFilterBadge(layerId) {
    const badge = document.getElementById('browse-mobile-filters-badge');
    if (!badge) return;
    const n = countActiveFilters(layerId);
    if (n > 0) {
      badge.textContent = String(n);
      badge.hidden = false;
    } else {
      badge.hidden = true;
    }
  }

  function openDrawer(tab) {
    const panel = document.getElementById('browse-filters');
    const backdrop = document.getElementById('browse-drawer-backdrop');
    const footer = document.getElementById('browse-drawer-footer');
    const close = document.getElementById('browse-drawer-close');
    if (!panel) return;
    if (tab) setActiveTab(tab);
    panel.classList.add('is-open');
    if (backdrop) {
      backdrop.hidden = false;
      requestAnimationFrame(() => backdrop.classList.add('is-open'));
    }
    if (footer) footer.hidden = false;
    if (close) close.hidden = false;
    document.body.classList.add('browse-drawer-open');
    const filtersBtn = document.getElementById('browse-mobile-filters-btn');
    const sortBtn = document.getElementById('browse-mobile-sort-btn');
    if (filtersBtn) filtersBtn.setAttribute('aria-expanded', tab === 'filters' ? 'true' : 'false');
    if (sortBtn) sortBtn.setAttribute('aria-expanded', tab === 'sort' ? 'true' : 'false');
  }

  function closeDrawer() {
    const panel = document.getElementById('browse-filters');
    const backdrop = document.getElementById('browse-drawer-backdrop');
    if (!panel) return;
    panel.classList.remove('is-open');
    if (backdrop) {
      backdrop.classList.remove('is-open');
      setTimeout(() => { backdrop.hidden = true; }, 220);
    }
    document.body.classList.remove('browse-drawer-open');
    const filtersBtn = document.getElementById('browse-mobile-filters-btn');
    const sortBtn = document.getElementById('browse-mobile-sort-btn');
    if (filtersBtn) filtersBtn.setAttribute('aria-expanded', 'false');
    if (sortBtn) sortBtn.setAttribute('aria-expanded', 'false');
  }

  function clearActiveLayerFilters() {
    const layerId = getActiveLayer();
    const layerSel = selections[layerId];
    if (layerSel) {
      for (const key of Object.keys(layerSel)) {
        const set = layerSel[key];
        if (set && set.clear) set.clear();
      }
    }
    sortBy[layerId] = 'default';
    currentPage[layerId] = 1;
    render(layerId);
    updateMobileFilterBadge(layerId);
  }

  function render(layerId) {
    renderFilters(layerId);
    renderSort(layerId);
    renderCards(layerId);
  }

  function activateLayerFromHash(menu) {
    const hash = (window.location.hash || '').replace(/^#/, '');
    if (!hash) return;
    const target = menu.querySelector(`.browse-menu-item[data-layer="${hash}"]`);
    if (!target) return;
    for (const item of menu.querySelectorAll('.browse-menu-item')) {
      item.classList.toggle('active', item === target);
    }
  }

  function scrollActiveChipIntoView(menu, behavior = 'smooth') {
    // Only meaningful when the pill is actually scrollable (mobile).
    if (menu.scrollWidth <= menu.clientWidth + 1) return;
    const active = menu.querySelector('.browse-menu-item.active');
    if (!active) return;
    const target = active.offsetLeft - (menu.clientWidth - active.offsetWidth) / 2;
    const max = menu.scrollWidth - menu.clientWidth;
    menu.scrollTo({
      left: Math.max(0, Math.min(max, target)),
      behavior,
    });
  }

  async function init() {
    const menu = document.querySelector('.browse-menu');
    if (!menu) return;

    activateLayerFromHash(menu);

    menu.addEventListener('click', (e) => {
      const btn = e.target.closest('.browse-menu-item');
      if (!btn) return;
      for (const item of menu.querySelectorAll('.browse-menu-item')) {
        item.classList.toggle('active', item === btn);
      }
      currentPage[btn.dataset.layer] = 1;
      render(btn.dataset.layer);
      updateMobileFilterBadge(btn.dataset.layer);
      scrollActiveChipIntoView(menu);
    });

    window.addEventListener('hashchange', () => {
      activateLayerFromHash(menu);
      const layerId = getActiveLayer();
      render(layerId);
      updateMobileFilterBadge(layerId);
      scrollActiveChipIntoView(menu);
    });

    // Land with the active chip already centered (no animation on first paint).
    requestAnimationFrame(() => scrollActiveChipIntoView(menu, 'auto'));

    const tabs = document.querySelector('.browse-filters-tabs');
    if (tabs) {
      tabs.addEventListener('click', (e) => {
        const btn = e.target.closest('.browse-filters-tab');
        if (!btn) return;
        setActiveTab(btn.dataset.tab);
      });
    }

    const searchInput = document.getElementById('browse-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', () => {
        currentPage[getActiveLayer()] = 1;
        renderCards(getActiveLayer());
      });
    }

    const filtersBtn = document.getElementById('browse-mobile-filters-btn');
    const sortBtn = document.getElementById('browse-mobile-sort-btn');
    const closeBtn = document.getElementById('browse-drawer-close');
    const backdrop = document.getElementById('browse-drawer-backdrop');
    const clearBtn = document.getElementById('browse-drawer-clear');
    const applyBtn = document.getElementById('browse-drawer-apply');
    if (filtersBtn) filtersBtn.addEventListener('click', () => openDrawer('filters'));
    if (sortBtn) sortBtn.addEventListener('click', () => openDrawer('sort'));
    if (closeBtn) closeBtn.addEventListener('click', closeDrawer);
    if (backdrop) backdrop.addEventListener('click', closeDrawer);
    if (clearBtn) clearBtn.addEventListener('click', clearActiveLayerFilters);
    if (applyBtn) applyBtn.addEventListener('click', closeDrawer);
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        const panel = document.getElementById('browse-filters');
        if (panel && panel.classList.contains('is-open')) closeDrawer();
      }
    });

    // Render filter UI immediately so the sidebar isn't blank while DB loads.
    const initialLayer = getActiveLayer();
    renderFilters(initialLayer);
    renderSort(initialLayer);
    updateMobileFilterBadge(initialLayer);

    if (window.App?.db?.load) {
      try {
        window.LAYERS = await window.App.db.load();
      } catch (err) {
        const status = document.getElementById('browse-results-status');
        if (status) status.textContent = `Failed to load database: ${err.message}`;
        return;
      }
    }
    renderCards(getActiveLayer());
  }

  document.addEventListener('DOMContentLoaded', init);

  // Export openDetail so it can be called from the plan page (index.html) when
  // a user clicks on a selected product to view its full details.
  if (!window.App) window.App = {};
  if (!window.App.features) window.App.features = {};
  window.App.features.browseFilters = { openDetail };
})();
