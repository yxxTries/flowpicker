(() => {
  const HANDOFF_KEY = 'flowpicker-browse-menu-shown-at';

  function init() {
    const link = document.getElementById('browse-link');
    const menu = document.querySelector('.browse-menu-preview');
    if (!link || !menu) return;

    // Touch devices synthesize a hover on the first tap, which made the
    // preview pill appear instead of navigating — requiring a second tap.
    // On coarse pointers, skip the hover preview entirely and let the
    // anchor's native click navigate immediately.
    const isTouch = window.matchMedia('(hover: none), (pointer: coarse)').matches;
    if (isTouch) return;

    const header = link.closest('.site-header');
    const items = [...menu.querySelectorAll('.browse-menu-item')];
    let hideTimer = null;
    let shownAt = 0;
    let reopenBlocked = false;

    // The dropdown is positioned against the header (its containing block),
    // so line it up with the Browse link and pull it back in if it would
    // run past the header's right edge.
    function position() {
      if (!header) return;
      const headerRect = header.getBoundingClientRect();
      const linkRect = link.getBoundingClientRect();
      const overflow = linkRect.left - headerRect.left + menu.offsetWidth - headerRect.width;
      const left = Math.max(0, linkRect.left - headerRect.left - Math.max(0, overflow));
      menu.style.setProperty('--browse-menu-anchor-left', `${Math.round(left)}px`);
    }

    function show() {
      clearTimeout(hideTimer);
      if (!menu.hidden) return;
      menu.hidden = false;
      menu.setAttribute('aria-hidden', 'false');
      position();
      shownAt = Date.now();
      // Restart CSS animations by reflowing.
      menu.style.animation = 'none';
      void menu.offsetWidth;
      menu.style.animation = '';
    }

    function hide() {
      clearTimeout(hideTimer);
      menu.hidden = true;
      menu.setAttribute('aria-hidden', 'true');
    }

    // Closing with the keyboard puts focus back on the link, and the link's
    // focus handler would immediately reopen the dropdown. Suppress that one
    // synchronous focus event.
    function closeAndRefocusLink() {
      hide();
      reopenBlocked = true;
      link.focus();
      reopenBlocked = false;
    }

    function scheduleHide() {
      clearTimeout(hideTimer);
      hideTimer = setTimeout(() => {
        // Keyboard users step from the link into the list; don't yank the
        // dropdown out from under the element that now has focus.
        if (menu.contains(document.activeElement)) return;
        hide();
      }, 120);
    }

    link.addEventListener('mouseenter', show);
    link.addEventListener('focus', () => {
      if (!reopenBlocked) show();
    });
    link.addEventListener('mouseleave', scheduleHide);
    link.addEventListener('blur', scheduleHide);

    menu.addEventListener('mouseenter', () => clearTimeout(hideTimer));
    menu.addEventListener('mouseleave', scheduleHide);
    menu.addEventListener('focusin', () => clearTimeout(hideTimer));
    menu.addEventListener('focusout', scheduleHide);

    // Each row opens the Browse page with that layer selected. Deriving the
    // URL from the link keeps it correct on pages nested in subdirectories.
    menu.addEventListener('click', (e) => {
      const btn = e.target.closest('.browse-menu-item');
      if (!btn) return;
      window.location.href = btn.dataset.layer ? `${link.href}#${btn.dataset.layer}` : link.href;
    });

    // The dropdown sits after the whole nav in the DOM, so Tab would walk
    // past the other nav links before reaching it. Leave tab order alone and
    // step through the rows with the arrow keys instead — the rows keep
    // tabindex="-1" and are focused programmatically.
    function focusItem(index) {
      const item = items[(index + items.length) % items.length];
      item?.focus();
    }

    link.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        show();
        focusItem(0);
      } else if (e.key === 'Escape') {
        hide();
      }
    });

    menu.addEventListener('keydown', (e) => {
      const index = items.indexOf(document.activeElement);
      if (e.key === 'ArrowDown' && index !== -1) {
        e.preventDefault();
        focusItem(index + 1);
      } else if (e.key === 'ArrowUp' && index !== -1) {
        e.preventDefault();
        focusItem(index - 1);
      } else if (e.key === 'Escape' || e.key === 'Tab') {
        // Tab leaves the menu the way it would have gone from the link, so
        // the rest of the nav keeps its natural order.
        if (e.key === 'Escape') e.preventDefault();
        closeAndRefocusLink();
      }
    });

    window.addEventListener('resize', () => {
      if (!menu.hidden) position();
    });

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
