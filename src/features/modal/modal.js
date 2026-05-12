App.features.modal = (() => {
  function init() {
    const { modal } = App.refs;
    modal.addEventListener('click', (e) => {
      if (e.target instanceof HTMLElement && e.target.dataset.close === 'true') close();
    });
  }

  function open(layerId) {
    const layer = LAYERS.find(l => l.id === layerId);
    if (!layer) return;
    App.state.activeLayerId = layerId;
    App.refs.modalTitle.textContent = `Pick a ${App.features.table.shortLayerName(layer.name)}`;
    const panel = App.refs.modal.querySelector('.modal-panel');
    delete panel.dataset.view;
    renderCards();
    App.refs.modal.hidden = false;
    document.addEventListener('keydown', onKeydown);
  }

  function openAboutFor(layerId, option) {
    App.state.activeLayerId = layerId;
    App.refs.modal.hidden = false;
    document.addEventListener('keydown', onKeydown);
    openAbout(option);
  }

  function openConfigureFor(layerId, option) {
    App.state.activeLayerId = layerId;
    App.refs.modal.hidden = false;
    document.addEventListener('keydown', onKeydown);

    const { modal, modalTitle, modalCards } = App.refs;
    modalTitle.textContent = `Configure ${option.name}`;

    const panel = modal.querySelector('.modal-panel');
    panel.dataset.view = 'configure';

    modalCards.innerHTML = '';
    const wrap = document.createElement('div');
    wrap.className = 'configure-view';
    modalCards.appendChild(wrap);
  }

  function renderCards() {
    const layerId = App.state.activeLayerId;
    if (!layerId) return;
    const layer = LAYERS.find(l => l.id === layerId);
    if (!layer) return;

    const chosenIds = new Set((App.state.selections[layerId] || []).map(o => o.id));
    const compatOnly = App.features.filters.compatOnly();

    const visible = [];
    let hidden = 0;
    for (const option of layer.options) {
      const conflict = App.features.warnings.wouldConflict(layerId, option);
      if (compatOnly && conflict && !chosenIds.has(option.id)) {
        hidden++;
        continue;
      }
      visible.push({ option, conflict });
    }

    const { modalCards } = App.refs;
    modalCards.innerHTML = '';
    if (visible.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'card-grid-empty';
      empty.textContent = 'No compatible options. Uncheck "Compatible only" to see all.';
      modalCards.appendChild(empty);
    } else {
      for (const { option, conflict } of visible) {
        modalCards.appendChild(buildOptionCard(option, chosenIds.has(option.id), conflict));
      }
    }

    App.features.filters.setStatus(compatOnly, hidden);
  }

  function buildOptionCard(option, isSelected, hasConflict) {
    const card = document.createElement('div');
    card.className =
      'option-card' +
      (isSelected ? ' is-selected' : '') +
      (hasConflict ? ' is-conflict' : '');
    card.tabIndex = 0;
    card.setAttribute('role', 'button');

    const info = document.createElement('button');
    info.type = 'button';
    info.className = 'option-info';
    info.setAttribute('aria-label', `About ${option.name}`);
    info.textContent = 'i';
    info.addEventListener('click', (e) => {
      e.stopPropagation();
      openAbout(option);
    });
    card.appendChild(info);

    if (hasConflict) {
      const badge = document.createElement('span');
      badge.className = 'conflict-badge';
      badge.textContent = 'Incompatible';
      card.appendChild(badge);
    }

    const title = document.createElement('h3');
    title.textContent = option.name;
    card.appendChild(title);

    const dl = document.createElement('dl');
    for (const [key, value] of Object.entries(option)) {
      if (key === 'id' || key === 'name') continue;
      if (!value) continue;
      const dt = document.createElement('dt');
      dt.textContent = ATTRIBUTE_LABELS[key] || key;
      const dd = document.createElement('dd');
      dd.textContent = value;
      dl.appendChild(dt);
      dl.appendChild(dd);
    }
    card.appendChild(dl);

    card.addEventListener('click', () => selectOption(option));
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        selectOption(option);
      }
    });
    return card;
  }

  function openAbout(option) {
    const { modal, modalTitle, modalCards } = App.refs;
    modalTitle.textContent = option.name;

    const panel = modal.querySelector('.modal-panel');
    panel.dataset.view = 'about';

    modalCards.innerHTML = '';
    const wrap = document.createElement('div');
    wrap.className = 'about-view';

    const back = document.createElement('button');
    back.type = 'button';
    back.className = 'about-back';
    back.textContent = '← Back';
    back.addEventListener('click', closeAbout);
    wrap.appendChild(back);

    const body = document.createElement('div');
    body.className = 'about-body';
    wrap.appendChild(body);

    modalCards.appendChild(wrap);
  }

  function closeAbout() {
    const { modal } = App.refs;
    const panel = modal.querySelector('.modal-panel');
    delete panel.dataset.view;
    const layer = LAYERS.find(l => l.id === App.state.activeLayerId);
    if (layer) {
      App.refs.modalTitle.textContent = `Pick a ${App.features.table.shortLayerName(layer.name)}`;
    }
    renderCards();
  }

  function selectOption(option) {
    const layerId = App.state.activeLayerId;
    if (!layerId) return;
    const current = App.state.selections[layerId] || [];
    const exists = current.some(o => o.id === option.id);
    if (exists) {
      const next = current.filter(o => o.id !== option.id);
      if (next.length === 0) delete App.state.selections[layerId];
      else App.state.selections[layerId] = next;
    } else {
      App.state.selections[layerId] = [option];
    }
    close();
    refresh();
  }

  function close() {
    App.refs.modal.hidden = true;
    App.state.activeLayerId = null;
    document.removeEventListener('keydown', onKeydown);
  }

  function onKeydown(e) {
    if (e.key === 'Escape') close();
  }

  return { init, open, openAboutFor, openConfigureFor, close, renderCards };
})();
