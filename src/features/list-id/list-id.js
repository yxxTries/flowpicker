// Permanent per-list identity, like PCPartPicker's list URLs.
// A random 8-char slug is generated on first visit and stored in localStorage.
// The URL becomes index.html?list=<slug> — stable even as selections change.
// Loading that URL on the same browser restores the list; on another browser
// the slug is unrecognised and the URL is treated as a fresh start.

App.features.listId = (() => {
  const STORE_KEY = 'flowpicker-list-id';
  const PARAM     = 'list';
  const CHARS     = 'abcdefghjkmnpqrstuvwxyz23456789'; // no 0/o/i/l ambiguity

  function generateSlug() {
    const arr = new Uint8Array(8);
    crypto.getRandomValues(arr);
    return Array.from(arr, b => CHARS[b % CHARS.length]).join('');
  }

  function getOrCreate() {
    let id = localStorage.getItem(STORE_KEY);
    if (!id) {
      id = generateSlug();
      localStorage.setItem(STORE_KEY, id);
    }
    return id;
  }

  function buildListUrl(slug) {
    return `${location.origin}/list/${slug}`;
  }

  function buildNavigationUrl(slug) {
    return `?${PARAM}=${slug}`;
  }

  function applyUrlParam() {
    const params = new URLSearchParams(location.search);
    const incoming = params.get(PARAM);
    if (!incoming) {
      const slug = getOrCreate();
      history.replaceState(null, '', buildNavigationUrl(slug) + location.hash);
      return;
    }

    const stored = localStorage.getItem(STORE_KEY);
    if (incoming === stored) {
      // Same browser — URL already matches local list, nothing to do.
      return;
    }

    // Different slug in URL — this is someone else's shared link or a fresh
    // browser. Assign the incoming slug as this browser's list ID so the URL
    // stays stable and the user can build on top of it.
    localStorage.setItem(STORE_KEY, incoming);
  }

  function init() {
    applyUrlParam();

    const field = document.getElementById('list-url-field');
    const copyBtn = document.getElementById('list-url-copy');
    if (!field || !copyBtn) return;

    const slug = localStorage.getItem(STORE_KEY) || getOrCreate();
    field.value = buildListUrl(slug);
    field.setAttribute('readonly', true);

    field.addEventListener('focus', () => field.select());

    const copyIcon  = document.getElementById('list-copy-icon');
    const checkIcon = document.getElementById('list-check-icon');

    copyBtn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(field.value);
      } catch {
        field.select();
        document.execCommand('copy');
      }
      if (copyIcon)  copyIcon.hidden  = true;
      if (checkIcon) checkIcon.hidden = false;
      copyBtn.classList.add('is-copied');
      setTimeout(() => {
        if (copyIcon)  copyIcon.hidden  = false;
        if (checkIcon) checkIcon.hidden = true;
        copyBtn.classList.remove('is-copied');
      }, 1800);
    });
  }

  return { init, getOrCreate, buildListUrl };
})();
