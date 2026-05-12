(() => {
  const HANDOFF_KEY = 'flowpicker-browse-menu-shown-at';

  function init() {
    const link = document.getElementById('browse-link');
    const menu = document.querySelector('.browse-menu-preview');
    if (!link || !menu) return;

    let hideTimer = null;
    let shownAt = 0;

    function show() {
      clearTimeout(hideTimer);
      if (!menu.hidden) return;
      menu.hidden = false;
      menu.setAttribute('aria-hidden', 'false');
      shownAt = Date.now();
      // Restart CSS animations by reflowing.
      menu.style.animation = 'none';
      void menu.offsetWidth;
      menu.style.animation = '';
      for (const item of menu.querySelectorAll('.browse-menu-item')) {
        item.style.animation = 'none';
        void item.offsetWidth;
        item.style.animation = '';
      }
    }

    function scheduleHide() {
      clearTimeout(hideTimer);
      hideTimer = setTimeout(() => {
        menu.hidden = true;
        menu.setAttribute('aria-hidden', 'true');
      }, 120);
    }

    link.addEventListener('mouseenter', show);
    link.addEventListener('focus', show);
    link.addEventListener('mouseleave', scheduleHide);
    link.addEventListener('blur', scheduleHide);

    menu.addEventListener('mouseenter', () => clearTimeout(hideTimer));
    menu.addEventListener('mouseleave', scheduleHide);

    // Hand off the in-flight animation timestamp to browse.html so it can pick
    // up where Plan left off without restart/flash.
    link.addEventListener('click', (e) => {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
      if (!menu.hidden && shownAt) {
        try { sessionStorage.setItem(HANDOFF_KEY, String(shownAt)); } catch {}
      }
    });
  }

  document.addEventListener('DOMContentLoaded', init);
})();
