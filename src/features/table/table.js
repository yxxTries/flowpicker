App.features.table = (() => {
  function init() {}

  function render() {
    const { tbody } = App.refs;
    tbody.innerHTML = '';
    for (const layer of LAYERS) {
      const tr = document.createElement('tr');

      const layerCell = document.createElement('td');
      layerCell.innerHTML =
        `<span class="layer-name">${layer.name}</span>` +
        (layer.optional ? '<span class="layer-optional">(optional)</span>' : '');
      tr.appendChild(layerCell);

      const selCell = document.createElement('td');
      selCell.className = 'selection-cell';
      selCell.appendChild(renderSelection(layer));
      tr.appendChild(selCell);

      const costTd = document.createElement('td');
      costTd.className = 'col-cost';
      const picks = App.state.selections[layer.id] || [];
      if (picks.length > 0) {
        const configureBtn = document.createElement('button');
        configureBtn.type = 'button';
        configureBtn.className = 'configure-btn';
        configureBtn.textContent = 'Configure';
        configureBtn.addEventListener('click', () => App.features.modal.openConfigureFor(layer.id, picks[0]));
        costTd.appendChild(configureBtn);
      } else {
        costTd.classList.add('placeholder-cell');
        costTd.textContent = '—';
      }
      tr.appendChild(costTd);

      for (const key of ['source', 'complexity', 'provider', 'keyspecs']) {
        const td = document.createElement('td');
        td.className = `col-${key} placeholder-cell`;
        td.textContent = '—';
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
      btn.href = `browse.html#${layer.id}`;
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
    add.href = `browse.html#${layer.id}`;
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
    name.title = `About ${option.name}`;
    name.addEventListener('click', () => App.features.modal.openAboutFor(layer.id, option));
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

  return { init, render, shortLayerName };
})();
