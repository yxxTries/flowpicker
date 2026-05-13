import { beforeEach, describe, expect, it } from 'vitest';
import { bootApp, loadScript } from './helpers/loadScript.js';

// auth.js self-initializes by reading currentUser from localStorage when the
// module is first evaluated. To keep tests independent we re-load the script
// in each test after seeding (or clearing) localStorage.
function loadAuthFresh() {
  document.body.innerHTML = `
    <div id="auth-header-slot"></div>
    <div id="auth-modal" class="auth-modal" hidden>
      <div class="auth-modal-backdrop"></div>
      <div class="auth-modal-panel"></div>
    </div>`;
  bootApp();
  loadScript('src/features/auth/auth.js');
}

describe('FlowpickerAuth', () => {
  beforeEach(() => {
    loadAuthFresh();
  });

  it('starts signed out by default', () => {
    expect(window.FlowpickerAuth.isSignedIn()).toBe(false);
    expect(window.FlowpickerAuth.getUser()).toBeNull();
  });

  it('renders a "Sign in" button when no session', () => {
    const slot = document.getElementById('auth-header-slot');
    expect(slot.querySelector('#auth-open-btn')).not.toBeNull();
  });

  it('openSignIn() opens the modal in sign-in view', () => {
    window.FlowpickerAuth.openSignIn();
    const modal = document.getElementById('auth-modal');
    expect(modal.hidden).toBe(false);
    expect(modal.querySelector('#auth-signin-form')).not.toBeNull();
  });

  describe('register flow', () => {
    beforeEach(() => {
      window.FlowpickerAuth.openSignIn();
      // Switch to register view
      document.querySelector('[data-switch="register"]').click();
    });

    it('rejects passwords shorter than 8 characters', () => {
      document.getElementById('auth-email').value = 'new@user.com';
      document.getElementById('auth-password').value = 'short';
      document.getElementById('auth-password2').value = 'short';
      document.getElementById('auth-register-form').dispatchEvent(new Event('submit', { cancelable: true }));
      expect(window.FlowpickerAuth.isSignedIn()).toBe(false);
      const err = document.querySelector('#auth-password').closest('.auth-field').querySelector('.auth-field-error');
      expect(err.textContent).toMatch(/at least 8/);
    });

    it('rejects mismatched password confirmation', () => {
      document.getElementById('auth-email').value = 'new@user.com';
      document.getElementById('auth-password').value = 'longenough';
      document.getElementById('auth-password2').value = 'different1';
      document.getElementById('auth-register-form').dispatchEvent(new Event('submit', { cancelable: true }));
      expect(window.FlowpickerAuth.isSignedIn()).toBe(false);
      const err = document.querySelector('#auth-password2').closest('.auth-field').querySelector('.auth-field-error');
      expect(err.textContent).toMatch(/do not match/);
    });

    it('rejects malformed email', () => {
      document.getElementById('auth-email').value = 'not-an-email';
      document.getElementById('auth-password').value = 'longenough';
      document.getElementById('auth-password2').value = 'longenough';
      document.getElementById('auth-register-form').dispatchEvent(new Event('submit', { cancelable: true }));
      expect(window.FlowpickerAuth.isSignedIn()).toBe(false);
    });

    it('creates a new account, signs in, and persists across reload', () => {
      document.getElementById('auth-name').value = 'Alice';
      document.getElementById('auth-email').value = 'alice@example.com';
      document.getElementById('auth-password').value = 'supersecret';
      document.getElementById('auth-password2').value = 'supersecret';
      document.getElementById('auth-register-form').dispatchEvent(new Event('submit', { cancelable: true }));

      expect(window.FlowpickerAuth.isSignedIn()).toBe(true);
      expect(window.FlowpickerAuth.getUser()).toEqual({ email: 'alice@example.com', name: 'Alice' });

      // Re-loading the script should restore the session from localStorage.
      loadAuthFresh();
      expect(window.FlowpickerAuth.isSignedIn()).toBe(true);
      expect(window.FlowpickerAuth.getUser().email).toBe('alice@example.com');
    });

    it('rejects duplicate email registration', () => {
      // Seed an account via the register flow
      document.getElementById('auth-email').value = 'dupe@example.com';
      document.getElementById('auth-password').value = 'supersecret';
      document.getElementById('auth-password2').value = 'supersecret';
      document.getElementById('auth-register-form').dispatchEvent(new Event('submit', { cancelable: true }));
      expect(window.FlowpickerAuth.isSignedIn()).toBe(true);

      // Sign out, reload, try again with same email
      loadAuthFresh();
      window.FlowpickerAuth.openSignIn();
      document.querySelector('[data-switch="register"]').click();
      document.getElementById('auth-email').value = 'dupe@example.com';
      document.getElementById('auth-password').value = 'supersecret';
      document.getElementById('auth-password2').value = 'supersecret';
      document.getElementById('auth-register-form').dispatchEvent(new Event('submit', { cancelable: true }));

      expect(window.FlowpickerAuth.isSignedIn()).toBe(false);
      const banner = document.querySelector('.auth-banner');
      expect(banner.textContent).toMatch(/already exists/);
    });
  });

  describe('sign-in flow', () => {
    beforeEach(() => {
      // Register an account first
      window.FlowpickerAuth.openSignIn();
      document.querySelector('[data-switch="register"]').click();
      document.getElementById('auth-name').value = 'Bob';
      document.getElementById('auth-email').value = 'bob@example.com';
      document.getElementById('auth-password').value = 'correct-horse';
      document.getElementById('auth-password2').value = 'correct-horse';
      document.getElementById('auth-register-form').dispatchEvent(new Event('submit', { cancelable: true }));
      // Reload so we start signed-out
      loadAuthFresh();
    });

    it('signs in with correct credentials', () => {
      window.FlowpickerAuth.openSignIn();
      document.getElementById('auth-email').value = 'bob@example.com';
      document.getElementById('auth-password').value = 'correct-horse';
      document.getElementById('auth-signin-form').dispatchEvent(new Event('submit', { cancelable: true }));
      expect(window.FlowpickerAuth.isSignedIn()).toBe(true);
    });

    it('rejects wrong password', () => {
      window.FlowpickerAuth.openSignIn();
      document.getElementById('auth-email').value = 'bob@example.com';
      document.getElementById('auth-password').value = 'wrong-password';
      document.getElementById('auth-signin-form').dispatchEvent(new Event('submit', { cancelable: true }));
      expect(window.FlowpickerAuth.isSignedIn()).toBe(false);
      const banner = document.querySelector('.auth-banner');
      expect(banner.textContent).toMatch(/incorrect/i);
    });

    it('rejects unknown email', () => {
      window.FlowpickerAuth.openSignIn();
      document.getElementById('auth-email').value = 'nobody@example.com';
      document.getElementById('auth-password').value = 'whatever123';
      document.getElementById('auth-signin-form').dispatchEvent(new Event('submit', { cancelable: true }));
      expect(window.FlowpickerAuth.isSignedIn()).toBe(false);
    });

    it('signs out and updates the header', () => {
      window.FlowpickerAuth.openSignIn();
      document.getElementById('auth-email').value = 'bob@example.com';
      document.getElementById('auth-password').value = 'correct-horse';
      document.getElementById('auth-signin-form').dispatchEvent(new Event('submit', { cancelable: true }));
      expect(window.FlowpickerAuth.isSignedIn()).toBe(true);

      document.getElementById('auth-signout-btn').click();
      expect(window.FlowpickerAuth.isSignedIn()).toBe(false);
      expect(document.getElementById('auth-open-btn')).not.toBeNull();
    });
  });

  describe('forgot-password view', () => {
    it('always shows the same success banner (no email enumeration)', () => {
      window.FlowpickerAuth.openSignIn();
      document.querySelector('[data-switch="forgot"]').click();
      document.getElementById('auth-email').value = 'random@user.com';
      document.getElementById('auth-forgot-form').dispatchEvent(new Event('submit', { cancelable: true }));
      const banner = document.querySelector('.auth-banner');
      expect(banner.textContent).toMatch(/reset link/i);
      expect(banner.classList.contains('auth-banner--success')).toBe(true);
    });

    it('rejects invalid email format before showing the success banner', () => {
      window.FlowpickerAuth.openSignIn();
      document.querySelector('[data-switch="forgot"]').click();
      document.getElementById('auth-email').value = 'invalid';
      document.getElementById('auth-forgot-form').dispatchEvent(new Event('submit', { cancelable: true }));
      const banner = document.querySelector('.auth-banner');
      expect(banner.textContent).toBe('');
    });
  });

  it('Escape key closes an open modal', () => {
    window.FlowpickerAuth.openSignIn();
    expect(document.getElementById('auth-modal').hidden).toBe(false);
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(document.getElementById('auth-modal').hidden).toBe(true);
  });
});
