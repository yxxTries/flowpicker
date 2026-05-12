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
    resetBtn:        document.getElementById('reset-btn'),
    exportToolbar:   document.getElementById('export-toolbar'),
    shareBtn:        document.getElementById('share-btn'),
    exportBtn:       document.getElementById('export-btn'),
    exportMenu:      document.getElementById('export-menu'),
    exportToast:     document.getElementById('export-toast'),
    stackAnalysis:   document.getElementById('stack-analysis'),
  };

  try {
    window.LAYERS = await App.db.load();
  } catch (err) {
    App.refs.tbody.innerHTML =
      `<tr><td colspan="8" class="placeholder-cell">Failed to load product database: ${err.message}. ` +
      `Are you running a local server? See README.</td></tr>`;
    throw err;
  }

  // Pick up any selections added from the Browse page (or prior Plan session).
  if (window.SelectionsStore) {
    App.state.selections = window.SelectionsStore.load();
  }

  // Shared-link import overrides whatever was in localStorage.
  const importedFromHash = App.features.export.applyHashImport();

  App.features.darkmode.init();
  App.features.warnings.init();
  App.features.modal.init();
  App.features.table.init();
  App.features.export.init();
  App.features.stackAnalysis.init();
  App.features.listId.init();

  App.refs.resetBtn.addEventListener('click', reset);

  refresh();

  if (importedFromHash) {
    const notice = App.features.export.consumeImportNotice();
    if (notice) console.info(`[flowpicker] ${notice}`);
  }
});

function refresh() {
  const hasAny = Object.keys(App.state.selections).length > 0;
  App.refs.resetBtn.hidden = !hasAny;
  if (window.SelectionsStore) window.SelectionsStore.save(App.state.selections);
  App.features.table.render();
  App.features.warnings.render();
  if (App.features.export && App.features.export.refresh) App.features.export.refresh();
  if (App.features.stackAnalysis && App.features.stackAnalysis.render) App.features.stackAnalysis.render();
}

function reset() {
  App.state.selections = {};
  refresh();
}

window.refresh = refresh;
