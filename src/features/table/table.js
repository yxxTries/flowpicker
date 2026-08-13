App.features.table = (() => {
  // Per-layer renderers for each data column.
  // Each resolver returns a string for the cell, or null/falsy to show '—'.
  //
  // The column set was chosen to match what 2026 comparison articles surface
  // at scan-time (best-for, headline spec, type) without leaving placeholder
  // cells on non-LLM rows (per NN/G lawn-mower scanning research, every "—"
  // cell costs a fixation; LLM-only columns would create scan tax).
  const CELL_RESOLVERS = {
    bestfor: {
      llm:         o => o.bestFor || null,
      ide:         o => o.bestFor || null,
      integration: o => o.bestFor || null,
      context:     o => o.bestFor || null,
      agent:       o => o.bestFor || null,
      others:      o => o.bestFor || null,
    },
    cost: {
      llm:         o => (o.priceInput && o.priceOutput)
                          ? `${o.priceInput} / ${o.priceOutput} per 1M tok`
                          : o.priceTier,
      ide:         o => withUnit(o.pricing),
      integration: o => withUnit(o.pricing),
      context:     o => null,
      agent:       o => withUnit(o.cost),
      others:      o => withUnit(o.pricing),
    },
    // Headline spec — layer-aware pair carrying each layer's most decision-
    // relevant secondary attrs. LLM gets context+SWE-bench (the 2026 headline
    // numbers); every other layer gets the two attrs most-cited in its review
    // articles. No placeholders.
    headlinespec: {
      llm:         o => [o.contextWindow, o.sweBench].filter(Boolean).join(' · '),
      ide:         o => [o.interface, o.aiIntegration].filter(Boolean).join(' · '),
      integration: o => [o.interface, o.compatibility].filter(Boolean).join(' · '),
      context:     o => [o.hosting, o.staleness].filter(Boolean).join(' · '),
      agent:       o => [o.autonomy, o.interface].filter(Boolean).join(' · '),
      others:      o => [o.category, o.interface].filter(Boolean).join(' · '),
    },
    // Type — normalized vocabulary across layers. LLM exposes its hosting
    // model (API / Open weights); other layers expose open-source status.
    // Same column, consistent reading order.
    type: {
      llm:         o => normalizeLlmType(o.hosting),
      ide:         o => normalizeOpenSource(o.openSource),
      integration: o => normalizeOpenSource(o.openSource),
      context:     o => normalizeOpenSource(o.openSource),
      agent:       o => normalizeOpenSource(o.openSource),
      others:      o => normalizeOpenSource(o.openSource),
    },
    setup: {
      llm:         () => null, // LLMs are always API calls; no useful setup metric
      ide:         o => o.setup,
      integration: o => o.setup,
      context:     o => o.setup,
      agent:       o => o.setup,
      others:      o => o.setup,
    },
    website: {
      llm:         o => o.websiteUrl && o.websiteUrl !== '—' ? { url: o.websiteUrl, name: o.name } : null,
      ide:         o => o.websiteUrl && o.websiteUrl !== '—' ? { url: o.websiteUrl, name: o.name } : null,
      integration: o => o.websiteUrl && o.websiteUrl !== '—' ? { url: o.websiteUrl, name: o.name } : null,
      context:     o => o.websiteUrl && o.websiteUrl !== '—' ? { url: o.websiteUrl, name: o.name } : null,
      agent:       o => o.websiteUrl && o.websiteUrl !== '—' ? { url: o.websiteUrl, name: o.name } : null,
      others:      o => o.websiteUrl && o.websiteUrl !== '—' ? { url: o.websiteUrl, name: o.name } : null,
    },
  };

  function normalizeLlmType(hosting) {
    if (!hosting || hosting === '—') return null;
    if (/open[\s-]?weights?/i.test(hosting)) return 'Open weights';
    if (/local/i.test(hosting)) return 'Local';
    if (/closed|api/i.test(hosting)) return 'API';
    return hosting;
  }

  function normalizeOpenSource(v) {
    if (v === 'Yes') return 'Open source';
    if (v === 'No')  return 'Closed';
    return null;
  }

  function withUnit(value) {
    if (!value || value === '—') return null;
    if (value === 'Paid subscription') return 'Paid subscription /mo';
    return value;
  }

  function resolveCell(column, layerId, pick) {
    if (!pick) return null;
    const fn = CELL_RESOLVERS[column]?.[layerId];
    if (!fn) return null;
    const v = fn(pick);
    return (v == null || v === '' || v === '—') ? null : v;
  }

  // Content shown when the info (i) icon next to a layer name is clicked.
  // Fill these in with the copy you want — title + HTML body per layer.
  const LAYER_INFO = {
    ide: {
      title: 'IDE / Editor',
      body: 'Where you actually write and edit code. This is the surface that hosts the AI, including autocomplete, inline chat, and refactors. Pick one that fits how you already work, since everything else in the stack plugs into it.',
    },
    llm: {
      title: 'LLM Provider / Model',
      body: 'The model that generates code, answers questions, and powers the AI features in your editor. Your choice drives quality, speed, context window, and cost. If anything in your stack feels smart, this is the layer doing the thinking.',
    },
    integration: {
      title: 'Integration',
      body: 'The bridge that connects your IDE to the model, such as extensions, CLIs, or chat interfaces. Some IDEs have AI built in and skip this layer. Otherwise you need an integration to send prompts and stream results back into your editor.',
    },
    context: {
      title: 'Context / RAG',
      body: 'How the AI sees your code beyond the file you have open. It indexes your repo, docs, or external knowledge so answers are grounded in your project. Without it, the model only knows what you paste in.',
    },
    agent: {
      title: 'Agent / Orchestration',
      body: 'Lets the AI take multi step actions on its own, including running commands, editing multiple files, calling tools, and iterating until a task is done. Use it when you want the AI to execute work, not just suggest it.',
    },
    others: {
      title: 'Others',
      body: 'Anything else in your stack that does not fit the layers above — version control, deploy, monitoring, testing, and similar tools. This layer is optional; add what is relevant to how you actually ship.',
    },
  };

  let activeLayerInfo = null;

  function closeLayerInfo() {
    if (!activeLayerInfo) return;
    const { overlay, onKey, prevOverflow, triggerBtn } = activeLayerInfo;
    document.removeEventListener('keydown', onKey, true);
    document.body.style.overflow = prevOverflow;
    overlay.remove();
    if (triggerBtn) {
      triggerBtn.setAttribute('aria-expanded', 'false');
      triggerBtn.focus();
    }
    activeLayerInfo = null;
  }

  function openLayerInfo(btn) {
    closeLayerInfo();
    const layerId = btn.dataset.layer;
    const info = LAYER_INFO[layerId] || { title: layerId, body: '' };

    const overlay = document.createElement('div');
    overlay.className = 'browse-detail-overlay';

    const backdrop = document.createElement('div');
    backdrop.className = 'browse-detail-backdrop';
    backdrop.addEventListener('click', closeLayerInfo);
    overlay.appendChild(backdrop);

    const panel = document.createElement('div');
    panel.className = 'browse-detail-panel layer-info-panel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-modal', 'true');
    panel.setAttribute('aria-label', `About ${info.title}`);

    const header = document.createElement('header');
    header.className = 'browse-detail-header';

    const titleWrap = document.createElement('div');
    titleWrap.className = 'browse-detail-title-wrap';
    const title = document.createElement('h2');
    title.className = 'browse-detail-title';
    title.textContent = info.title;
    titleWrap.appendChild(title);
    header.appendChild(titleWrap);

    const actions = document.createElement('div');
    actions.className = 'browse-detail-actions';
    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'browse-detail-close';
    closeBtn.setAttribute('aria-label', 'Close');
    closeBtn.textContent = '×';
    closeBtn.addEventListener('click', closeLayerInfo);
    actions.appendChild(closeBtn);
    header.appendChild(actions);
    panel.appendChild(header);

    const body = document.createElement('div');
    body.className = 'browse-detail-body layer-info-body-panel';
    const p = document.createElement('p');
    p.className = 'layer-info-text';
    p.textContent = info.body;
    body.appendChild(p);

    const cta = document.createElement('a');
    cta.className = 'choose-btn layer-info-cta';
    cta.textContent = `Browse ${info.title} →`;
    cta.href = `browse.html?return=plan#${layerId}`;
    cta.addEventListener('click', () => closeLayerInfo());
    body.appendChild(cta);

    panel.appendChild(body);

    overlay.appendChild(panel);
    document.body.appendChild(overlay);

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKey = (e) => { if (e.key === 'Escape') closeLayerInfo(); };
    document.addEventListener('keydown', onKey, true);

    btn.setAttribute('aria-expanded', 'true');
    closeBtn.focus();

    activeLayerInfo = { overlay, onKey, prevOverflow, triggerBtn: btn };
  }

  function init() {
    const { tbody } = App.refs;
    if (!tbody) return;
    tbody.addEventListener('click', (e) => {
      const btn = e.target.closest('.layer-info-btn');
      if (!btn) return;
      e.stopPropagation();
      openLayerInfo(btn);
    });
  }

  function render() {
    const { tbody } = App.refs;
    tbody.innerHTML = '';
    console.log('[Table] Rendering with selections:', App.state.selections);
    for (const layer of LAYERS) {
      const tr = document.createElement('tr');

      const layerCell = document.createElement('td');
      layerCell.className = 'col-layer';
      layerCell.innerHTML =
        `<span class="layer-name">${layer.name}</span>` +
        `<button type="button" class="layer-info-btn" data-layer="${layer.id}" aria-label="About ${layer.name}" aria-expanded="false">i</button>`;
      tr.appendChild(layerCell);

      const selCell = document.createElement('td');
      selCell.className = 'selection-cell col-selection';
      selCell.appendChild(renderSelection(layer));
      tr.appendChild(selCell);

      const picks = App.state.selections[layer.id] || [];
      const pick = picks[0];

      for (const key of ['bestfor', 'cost', 'headlinespec', 'type', 'setup', 'website']) {
        const td = document.createElement('td');
        td.className = `col-${key}`;
        const val = resolveCell(key, layer.id, pick);
        if (key === 'website') {
          if (val) {
            const a = document.createElement('a');
            a.href = val.url;
            a.textContent = val.name;
            a.target = '_blank';
            a.rel = 'noopener noreferrer';
            a.className = 'website-link';
            td.appendChild(a);
          } else {
            td.classList.add('placeholder-cell');
            td.textContent = '—';
          }
        } else if (val) {
          td.textContent = val;
        } else {
          td.classList.add('placeholder-cell');
          td.textContent = '—';
        }
        tr.appendChild(td);
      }

      tbody.appendChild(tr);
    }
  }

  function renderSelection(layer) {
    const wrap = document.createElement('span');
    wrap.className = 'selection-list';
    const picks = App.state.selections[layer.id] || [];

    if (picks.length === 0) {
      const btn = document.createElement('a');
      btn.className = 'choose-btn';
      btn.textContent = `Choose ${shortLayerName(layer.name)}`;
      btn.href = `browse.html?return=plan#${layer.id}`;
      wrap.appendChild(btn);
      return wrap;
    }

    for (const option of picks) {
      wrap.appendChild(renderPick(layer, option));
    }

    const add = document.createElement('a');
    add.className = 'selection-add';
    add.setAttribute('aria-label', `Add another ${shortLayerName(layer.name)}`);
    add.title = `Add another ${shortLayerName(layer.name)}`;
    add.textContent = '+';
    add.href = `browse.html?return=plan#${layer.id}`;
    wrap.appendChild(add);

    return wrap;
  }

  function renderPick(layer, option) {
    const nameWrap = document.createElement('span');
    nameWrap.className = 'selection-name-wrap';

    const name = document.createElement('button');
    name.type = 'button';
    name.className = 'selection-name';
    name.textContent = option.name;
    name.title = `View details for ${option.name}`;
    name.addEventListener('click', () => {
      if (App.features.browseFilters?.openDetail) {
        App.features.browseFilters.openDetail(option, layer.id);
      }
    });
    nameWrap.appendChild(name);

    const remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'selection-remove';
    remove.setAttribute('aria-label', `Remove ${option.name}`);
    remove.title = `Remove ${option.name}`;
    remove.textContent = '×';
    remove.addEventListener('click', () => {
      const current = App.state.selections[layer.id] || [];
      const next = current.filter(o => o.id !== option.id);
      if (next.length === 0) {
        delete App.state.selections[layer.id];
      } else {
        App.state.selections[layer.id] = next;
      }
      refresh();
    });
    nameWrap.appendChild(remove);

    return nameWrap;
  }

  function shortLayerName(fullName) {
    return fullName.split(/[/(]/)[0].trim();
  }

  return { init, render, shortLayerName, resolveCell };
})();
