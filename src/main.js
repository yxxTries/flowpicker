// Shared app state and feature bootstrap.
// All feature modules attach to App and read/write App.state.

const App = {
  state: {
    selections: {},
    activeLayerId: null,
  },
  refs: {},
  features: {},
};

window.App = App;

// Backed by App.db once load() resolves. Features read `LAYERS` synchronously.
window.LAYERS = [];

document.addEventListener('DOMContentLoaded', async () => {
  App.refs = {
    tbody:           document.getElementById('picker-body'),
    modal:           document.getElementById('picker-modal'),
    modalTitle:      document.getElementById('modal-title'),
    modalCards:      document.getElementById('modal-cards'),
    warningBanner:   document.getElementById('warning-banner'),
    warningHeadline: document.getElementById('warning-headline'),
    warningList:     document.getElementById('warning-list'),
    filterCompat:    document.getElementById('filter-compat'),
    filterStatus:    document.getElementById('filter-status'),
    resetBtn:        document.getElementById('reset-btn'),
  };

  try {
    window.LAYERS = await App.db.load();
  } catch (err) {
    App.refs.tbody.innerHTML =
      `<tr><td colspan="7" class="placeholder-cell">Failed to load product database: ${err.message}. ` +
      `Are you running a local server? See README.</td></tr>`;
    throw err;
  }

  App.features.warnings.init();
  App.features.filters.init();
  App.features.modal.init();
  App.features.table.init();

  App.refs.resetBtn.addEventListener('click', reset);

  refresh();
});

function refresh() {
  const hasAny = Object.keys(App.state.selections).length > 0;
  App.refs.resetBtn.hidden = !hasAny;
  App.features.table.render();
  App.features.warnings.render();
}

function reset() {
  App.state.selections = {};
  refresh();
}

window.refresh = refresh;
