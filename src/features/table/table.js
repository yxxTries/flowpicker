App.features.table = (() => {
  // Per-layer renderers for the four right-hand data columns.
  // Each resolver returns text for the cell, or null/falsy to show '—'.
  const CELL_RESOLVERS = {
    cost: {
      llm:         o => (o.priceInput && o.priceOutput)
                          ? `${o.priceInput} / ${o.priceOutput} per 1M tok`
                          : o.priceTier,
      ide:         o => withUnit(o.pricing),
      integration: o => withUnit(o.pricing),
      context:     o => null,
      agent:       o => withUnit(o.cost),
    },
    complexity: {
      llm:         () => 'API call',
      ide:         o => o.setup,
      integration: o => o.setup,
      context:     o => o.setup,
      agent:       o => o.setup,
    },
    source: {
      llm:         o => o.hosting,
      ide:         o => o.openSource === 'Yes' ? 'Open source' : o.openSource === 'No' ? 'Closed' : null,
      integration: o => o.openSource === 'Yes' ? 'Open source' : o.openSource === 'No' ? 'Closed' : null,
      context:     o => o.openSource === 'Yes' ? 'Open source' : o.openSource === 'No' ? 'Closed' : null,
      agent:       o => o.openSource === 'Yes' ? 'Open source' : o.openSource === 'No' ? 'Closed' : null,
    },
    provider: {
      llm:         o => o.provider,
      ide:         o => (o.name || '').split(' ')[0] || null,
      integration: o => (o.name || '').split(' ')[0] || null,
      context:     o => (o.name || '').split(' ')[0] || null,
      agent:       o => (o.name || '').split(' ')[0] || null,
    },
    keyspecs: {
      llm:         o => [o.contextWindow, o.speedTier].filter(Boolean).join(' · '),
      ide:         o => [o.aiIntegration, o.interface].filter(Boolean).join(' · '),
      integration: o => [o.interface, o.compatibility].filter(Boolean).join(' · '),
      context:     o => [o.hosting, o.staleness].filter(Boolean).join(' · '),
      agent:       o => [o.autonomy, o.interface].filter(Boolean).join(' · '),
    },
    website: {
      llm:         o => o.websiteUrl && o.websiteUrl !== '—' ? { url: o.websiteUrl, name: o.name } : null,
      ide:         o => o.websiteUrl && o.websiteUrl !== '—' ? { url: o.websiteUrl, name: o.name } : null,
      integration: o => o.websiteUrl && o.websiteUrl !== '—' ? { url: o.websiteUrl, name: o.name } : null,
      context:     o => o.websiteUrl && o.websiteUrl !== '—' ? { url: o.websiteUrl, name: o.name } : null,
      agent:       o => o.websiteUrl && o.websiteUrl !== '—' ? { url: o.websiteUrl, name: o.name } : null,
    },
  };

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

  function init() {}

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
        (layer.optional ? '<span class="layer-optional">(optional)</span>' : '');
      tr.appendChild(layerCell);

      const selCell = document.createElement('td');
      selCell.className = 'selection-cell col-selection';
      selCell.appendChild(renderSelection(layer));
      tr.appendChild(selCell);

      const picks = App.state.selections[layer.id] || [];
      const pick = picks[0];

      for (const key of ['cost', 'source', 'complexity', 'provider', 'keyspecs', 'website']) {
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
