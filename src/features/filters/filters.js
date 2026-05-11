App.features.filters = (() => {
  function init() {
    App.refs.filterCompat.addEventListener('change', () => {
      App.features.modal.renderCards();
    });
  }

  function compatOnly() {
    return App.refs.filterCompat.checked;
  }

  function setStatus(isCompatOnly, hiddenCount) {
    App.refs.filterStatus.textContent =
      isCompatOnly && hiddenCount > 0
        ? `${hiddenCount} option${hiddenCount === 1 ? '' : 's'} hidden as incompatible.`
        : '';
  }

  return { init, compatOnly, setStatus };
})();
