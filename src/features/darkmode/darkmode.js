(() => {
  const STORAGE_KEY = 'flowpicker-dark-mode';

  function loadPreference() {
    const saved = localStorage.getItem(STORAGE_KEY);
    const isDark = saved !== null ? saved === 'true' : true;
    applyDarkMode(isDark);
  }

  function toggleDarkMode() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    applyDarkMode(!isDark);
    localStorage.setItem(STORAGE_KEY, !isDark);
  }

  function applyDarkMode(isDark) {
    if (isDark) {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
    // Drop the first-paint inline background hint from the <head> bootstrap
    // so the stylesheet's var(--bg) takes over and toggles work cleanly.
    document.documentElement.style.backgroundColor = '';
  }

  function init() {
    const toggle = document.getElementById('dark-mode-toggle');
    if (!toggle) return;
    loadPreference();
    toggle.addEventListener('click', toggleDarkMode);
  }

  // Register with App if available, otherwise self-init on DOMContentLoaded.
  if (typeof App !== 'undefined') {
    App.features.darkmode = { init };
  } else {
    document.addEventListener('DOMContentLoaded', init);
  }
})();
