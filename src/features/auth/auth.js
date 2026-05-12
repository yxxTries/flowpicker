(() => {
  const STORAGE_KEY = 'flowpicker-auth-user';

  // ── Persistence (localStorage stand-in for real backend) ──────────────────
  const DB_KEY = 'flowpicker-auth-db';

  function readDB() {
    try { return JSON.parse(localStorage.getItem(DB_KEY)) || {}; } catch { return {}; }
  }

  function writeDB(db) {
    localStorage.setItem(DB_KEY, JSON.stringify(db));
  }

  function getSession() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || null; } catch { return null; }
  }

  function saveSession(user) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  }

  function clearSession() {
    localStorage.removeItem(STORAGE_KEY);
  }

  // ── State ─────────────────────────────────────────────────────────────────
  let currentUser = getSession();
  let currentView = 'signin'; // 'signin' | 'register' | 'forgot'

  // ── DOM helpers ───────────────────────────────────────────────────────────
  function qs(sel, root) { return (root || document).querySelector(sel); }

  function showBanner(panel, type, msg) {
    const el = qs('.auth-banner', panel);
    if (!el) return;
    el.textContent = msg;
    el.className = `auth-banner auth-banner--${type} visible`;
  }

  function clearBanner(panel) {
    const el = qs('.auth-banner', panel);
    if (el) { el.textContent = ''; el.className = 'auth-banner'; }
  }

  function fieldError(input, msg) {
    input.classList.toggle('is-error', !!msg);
    const errEl = input.closest('.auth-field')?.querySelector('.auth-field-error');
    if (errEl) {
      errEl.textContent = msg || '';
      errEl.classList.toggle('visible', !!msg);
    }
  }

  function clearFieldErrors(panel) {
    panel.querySelectorAll('.auth-input').forEach(i => fieldError(i, ''));
  }

  // ── Render header button ──────────────────────────────────────────────────
  function renderHeaderBtn() {
    const container = qs('#auth-header-slot');
    if (!container) return;

    if (!currentUser) {
      container.innerHTML = `<button type="button" class="auth-btn" id="auth-open-btn">Sign in</button>`;
      qs('#auth-open-btn').addEventListener('click', () => openModal('signin'));
    } else {
      const initials = currentUser.name
        ? currentUser.name.split(' ').map(w => w[0]).slice(0, 2).join('')
        : currentUser.email[0];

      container.innerHTML = `
        <div class="auth-user-wrap">
          <button type="button" class="auth-avatar-btn" id="auth-avatar-btn" aria-haspopup="true" aria-expanded="false">
            <span class="auth-avatar" aria-hidden="true">${initials}</span>
            <span>${currentUser.name || currentUser.email.split('@')[0]}</span>
          </button>
          <div class="auth-dropdown" id="auth-dropdown" hidden>
            <div class="auth-dropdown-email">${currentUser.email}</div>
            <button type="button" class="auth-dropdown-item" id="auth-signout-btn">
              <span aria-hidden="true">↩</span> Sign out
            </button>
          </div>
        </div>`;

      qs('#auth-avatar-btn').addEventListener('click', toggleDropdown);
      qs('#auth-signout-btn').addEventListener('click', signOut);
      document.addEventListener('click', closeDropdownOutside, { capture: true });
    }
  }

  function toggleDropdown() {
    const dd = qs('#auth-dropdown');
    const btn = qs('#auth-avatar-btn');
    if (!dd) return;
    const open = !dd.hidden;
    dd.hidden = open;
    btn.setAttribute('aria-expanded', String(!open));
  }

  function closeDropdownOutside(e) {
    const wrap = qs('.auth-user-wrap');
    if (wrap && !wrap.contains(e.target)) {
      const dd = qs('#auth-dropdown');
      if (dd) dd.hidden = true;
      const btn = qs('#auth-avatar-btn');
      if (btn) btn.setAttribute('aria-expanded', 'false');
    }
  }

  // ── Modal ─────────────────────────────────────────────────────────────────
  function openModal(view) {
    currentView = view;
    renderModal();
    const modal = qs('#auth-modal');
    modal.hidden = false;
    modal.querySelector('.auth-input')?.focus();
  }

  function closeModal() {
    const modal = qs('#auth-modal');
    if (modal) modal.hidden = true;
  }

  function renderModal() {
    const modal = qs('#auth-modal');
    if (!modal) return;

    if (currentView === 'signin') renderSignIn(modal);
    else if (currentView === 'register') renderRegister(modal);
    else if (currentView === 'forgot') renderForgot(modal);
  }

  function renderSignIn(modal) {
    modal.querySelector('.auth-modal-panel').innerHTML = `
      <button type="button" class="auth-modal-close" aria-label="Close">×</button>
      <div>
        <h2 class="auth-modal-title">Welcome back</h2>
        <p class="auth-modal-subtitle">Sign in to your Flowpicker account</p>
      </div>
      <div class="auth-banner" role="alert"></div>
      <form class="auth-form" id="auth-signin-form" novalidate>
        <div class="auth-field">
          <label class="auth-label" for="auth-email">Email</label>
          <input class="auth-input" id="auth-email" type="email" autocomplete="email" placeholder="you@example.com" required />
          <span class="auth-field-error"></span>
        </div>
        <div class="auth-field">
          <label class="auth-label" for="auth-password">Password</label>
          <input class="auth-input" id="auth-password" type="password" autocomplete="current-password" placeholder="••••••••" required />
          <span class="auth-field-error"></span>
        </div>
        <button type="submit" class="auth-submit">Sign in</button>
      </form>
      <div class="auth-footer">
        <span class="auth-switch">No account? <button type="button" class="auth-link" data-switch="register">Create one</button></span>
        <button type="button" class="auth-link" data-switch="forgot">Forgot password?</button>
      </div>`;

    bindCloseBtn(modal);
    bindSwitchLinks(modal);
    qs('#auth-signin-form', modal).addEventListener('submit', handleSignIn);
  }

  function renderRegister(modal) {
    modal.querySelector('.auth-modal-panel').innerHTML = `
      <button type="button" class="auth-modal-close" aria-label="Close">×</button>
      <div>
        <h2 class="auth-modal-title">Create account</h2>
        <p class="auth-modal-subtitle">Join Flowpicker to save and share stacks</p>
      </div>
      <div class="auth-banner" role="alert"></div>
      <form class="auth-form" id="auth-register-form" novalidate>
        <div class="auth-field">
          <label class="auth-label" for="auth-name">Name</label>
          <input class="auth-input" id="auth-name" type="text" autocomplete="name" placeholder="Your name" />
          <span class="auth-field-error"></span>
        </div>
        <div class="auth-field">
          <label class="auth-label" for="auth-email">Email</label>
          <input class="auth-input" id="auth-email" type="email" autocomplete="email" placeholder="you@example.com" required />
          <span class="auth-field-error"></span>
        </div>
        <div class="auth-field">
          <label class="auth-label" for="auth-password">Password</label>
          <input class="auth-input" id="auth-password" type="password" autocomplete="new-password" placeholder="At least 8 characters" required />
          <span class="auth-field-error"></span>
        </div>
        <div class="auth-field">
          <label class="auth-label" for="auth-password2">Confirm password</label>
          <input class="auth-input" id="auth-password2" type="password" autocomplete="new-password" placeholder="••••••••" required />
          <span class="auth-field-error"></span>
        </div>
        <button type="submit" class="auth-submit">Create account</button>
      </form>
      <div class="auth-footer">
        <span class="auth-switch">Already have an account? <button type="button" class="auth-link" data-switch="signin">Sign in</button></span>
      </div>`;

    bindCloseBtn(modal);
    bindSwitchLinks(modal);
    qs('#auth-register-form', modal).addEventListener('submit', handleRegister);
  }

  function renderForgot(modal) {
    modal.querySelector('.auth-modal-panel').innerHTML = `
      <button type="button" class="auth-modal-close" aria-label="Close">×</button>
      <div>
        <h2 class="auth-modal-title">Reset password</h2>
        <p class="auth-modal-subtitle">Enter your email and we'll send a reset link</p>
      </div>
      <div class="auth-banner" role="alert"></div>
      <form class="auth-form" id="auth-forgot-form" novalidate>
        <div class="auth-field">
          <label class="auth-label" for="auth-email">Email</label>
          <input class="auth-input" id="auth-email" type="email" autocomplete="email" placeholder="you@example.com" required />
          <span class="auth-field-error"></span>
        </div>
        <button type="submit" class="auth-submit">Send reset link</button>
      </form>
      <div class="auth-footer">
        <button type="button" class="auth-link" data-switch="signin">← Back to sign in</button>
      </div>`;

    bindCloseBtn(modal);
    bindSwitchLinks(modal);
    qs('#auth-forgot-form', modal).addEventListener('submit', handleForgot);
  }

  function bindCloseBtn(modal) {
    qs('.auth-modal-close', modal).addEventListener('click', closeModal);
    qs('.auth-modal-backdrop').addEventListener('click', closeModal);
  }

  function bindSwitchLinks(modal) {
    modal.querySelectorAll('[data-switch]').forEach(btn => {
      btn.addEventListener('click', () => {
        currentView = btn.dataset.switch;
        renderModal();
        modal.querySelector('.auth-input')?.focus();
      });
    });
  }

  // ── Handlers ──────────────────────────────────────────────────────────────
  function handleSignIn(e) {
    e.preventDefault();
    const panel = e.target.closest('.auth-modal-panel');
    clearBanner(panel);
    clearFieldErrors(panel);

    const email = qs('#auth-email', panel).value.trim().toLowerCase();
    const password = qs('#auth-password', panel).value;
    let valid = true;

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      fieldError(qs('#auth-email', panel), 'Enter a valid email address.');
      valid = false;
    }
    if (!password) {
      fieldError(qs('#auth-password', panel), 'Enter your password.');
      valid = false;
    }
    if (!valid) return;

    const db = readDB();
    const record = db[email];

    if (!record || record.password !== hashish(password)) {
      showBanner(panel, 'error', 'Incorrect email or password.');
      return;
    }

    currentUser = { email, name: record.name };
    saveSession(currentUser);
    closeModal();
    renderHeaderBtn();
  }

  function handleRegister(e) {
    e.preventDefault();
    const panel = e.target.closest('.auth-modal-panel');
    clearBanner(panel);
    clearFieldErrors(panel);

    const name = qs('#auth-name', panel).value.trim();
    const email = qs('#auth-email', panel).value.trim().toLowerCase();
    const password = qs('#auth-password', panel).value;
    const password2 = qs('#auth-password2', panel).value;
    let valid = true;

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      fieldError(qs('#auth-email', panel), 'Enter a valid email address.');
      valid = false;
    }
    if (password.length < 8) {
      fieldError(qs('#auth-password', panel), 'Password must be at least 8 characters.');
      valid = false;
    }
    if (password !== password2) {
      fieldError(qs('#auth-password2', panel), 'Passwords do not match.');
      valid = false;
    }
    if (!valid) return;

    const db = readDB();
    if (db[email]) {
      showBanner(panel, 'error', 'An account with this email already exists.');
      return;
    }

    db[email] = { name, password: hashish(password) };
    writeDB(db);

    currentUser = { email, name };
    saveSession(currentUser);
    closeModal();
    renderHeaderBtn();
  }

  function handleForgot(e) {
    e.preventDefault();
    const panel = e.target.closest('.auth-modal-panel');
    clearBanner(panel);
    clearFieldErrors(panel);

    const email = qs('#auth-email', panel).value.trim().toLowerCase();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      fieldError(qs('#auth-email', panel), 'Enter a valid email address.');
      return;
    }

    // Not wired to a real backend — always show success to avoid email enumeration
    showBanner(panel, 'success', 'If that email exists, a reset link is on its way.');
    qs('#auth-forgot-form', panel).querySelector('.auth-submit').disabled = true;
  }

  function signOut() {
    currentUser = null;
    clearSession();
    renderHeaderBtn();
    const dd = qs('#auth-dropdown');
    if (dd) dd.hidden = true;
    document.removeEventListener('click', closeDropdownOutside, { capture: true });
  }

  // Very lightweight obfuscation — NOT cryptographic, just avoids plaintext in localStorage.
  // A real app would use bcrypt on the server.
  function hashish(str) {
    let h = 0x811c9dc5;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = (h * 0x01000193) >>> 0;
    }
    return h.toString(16);
  }

  // ── Init ──────────────────────────────────────────────────────────────────
  function init() {
    renderHeaderBtn();

    // Keyboard: Escape closes modal
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') closeModal();
    });
  }

  if (typeof App !== 'undefined') {
    App.features.auth = { init };
  } else {
    document.addEventListener('DOMContentLoaded', init);
  }
})();
