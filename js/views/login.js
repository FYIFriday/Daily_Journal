// Sign-in screen (email + password). Shown whenever cloud sync is configured but
// no one is signed in. Using the SAME account on every device is what makes the
// journal sync.

import { store, firebaseConfigStore } from '../store.js';
import { el } from '../ui.js';

const FRIENDLY = {
  'auth/invalid-email': 'That email address doesn’t look right.',
  'auth/missing-password': 'Enter a password.',
  'auth/weak-password': 'Password must be at least 6 characters.',
  'auth/email-already-in-use': 'An account already exists for that email — tap Sign in instead.',
  'auth/invalid-credential': 'Email or password is incorrect.',
  'auth/wrong-password': 'Email or password is incorrect.',
  'auth/user-not-found': 'No account yet for that email — tap Create account.',
  'auth/too-many-requests': 'Too many attempts. Wait a minute and try again.',
  'auth/network-request-failed': 'Network problem — check your connection.',
  'auth/operation-not-allowed': 'Email/Password sign-in isn’t enabled in Firebase yet (Authentication → Sign-in method → Email/Password → Enable).',
};

function message(err) {
  return FRIENDLY[err?.code] || err?.message || 'Something went wrong. Try again.';
}

export async function render() {
  const root = el('<div class="view login-view"></div>');
  const main = el(`
    <main class="login-wrap">
      <div class="login-card">
        <div class="login-brand">Daily Journal</div>
        <p class="login-sub">Sign in to sync your memories across your phone and browser. Use the <strong>same email &amp; password on every device.</strong></p>
        <label class="login-label">Email
          <input type="email" class="login-input" data-email autocomplete="username" inputmode="email" placeholder="you@example.com" />
        </label>
        <label class="login-label">Password
          <input type="password" class="login-input" data-pw autocomplete="current-password" placeholder="at least 6 characters" />
        </label>
        <div class="login-actions">
          <button class="btn-primary" data-signin>Sign in</button>
          <button class="btn-ghost" data-create>Create account</button>
        </div>
        <p class="login-msg" data-msg></p>
        <button class="login-local" data-local>Use this device only (no cloud)</button>
      </div>
    </main>`);

  const email = main.querySelector('[data-email]');
  const pw = main.querySelector('[data-pw]');
  const msg = main.querySelector('[data-msg]');
  const signinBtn = main.querySelector('[data-signin]');
  const createBtn = main.querySelector('[data-create]');

  function busy(on) {
    signinBtn.disabled = on; createBtn.disabled = on;
  }

  async function run(action) {
    const e = email.value.trim();
    const p = pw.value;
    if (!e) { msg.textContent = 'Enter your email.'; email.focus(); return; }
    if (!p) { msg.textContent = 'Enter your password.'; pw.focus(); return; }
    msg.className = 'login-msg';
    msg.textContent = action === 'create' ? 'Creating account…' : 'Signing in…';
    busy(true);
    try {
      if (action === 'create') await store.createAccount(e, p);
      else await store.signIn(e, p);
      // The auth listener in app.js re-routes on success; nudge to home too.
      msg.textContent = 'Success — loading your journal…';
      location.hash = '#/home';
    } catch (err) {
      busy(false);
      msg.className = 'login-msg warn';
      msg.textContent = message(err);
    }
  }

  signinBtn.addEventListener('click', () => run('signin'));
  createBtn.addEventListener('click', () => run('create'));
  pw.addEventListener('keydown', (ev) => { if (ev.key === 'Enter') run('signin'); });

  main.querySelector('[data-local]').addEventListener('click', () => {
    if (!confirm('Switch to this-device-only storage? Your journal will stop syncing until you sign in again. (Your cloud data is not deleted.)')) return;
    firebaseConfigStore.set(null);
    location.reload();
  });

  root.appendChild(main);
  setTimeout(() => email.focus(), 60);
  return root;
}
