App.features.modal = (() => {
  function init() {
    const { modal } = App.refs;
    modal.addEventListener('click', (e) => {
      if (e.target instanceof HTMLElement && e.target.dataset.close === 'true') close();
    });
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
    back.textContent = '← Close';
    back.addEventListener('click', close);
    wrap.appendChild(back);

    const body = document.createElement('div');
    body.className = 'about-body';
    wrap.appendChild(body);

    modalCards.appendChild(wrap);
  }

  function close() {
    App.refs.modal.hidden = true;
    App.state.activeLayerId = null;
    document.removeEventListener('keydown', onKeydown);
  }

  function onKeydown(e) {
    if (e.key === 'Escape') close();
  }

  return { init, openAboutFor, openConfigureFor, close };
})();
