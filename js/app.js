// Bootstrap + hash router. No build step; pure ES modules.

import { store } from './store.js';
import { loadRules, randomRule } from './rules.js';
import { openMenu } from './ui.js';
import { pick } from './util.js';

import * as home from './views/home.js';
import * as editor from './views/editor.js';
import * as entry from './views/entry.js';
import * as browse from './views/browse.js';
import * as day from './views/day.js';
import * as statspage from './views/statspage.js';
import * as settings from './views/settings.js';
import * as login from './views/login.js';

const app = document.getElementById('app');

function parseHash() {
  let h = location.hash.replace(/^#/, '') || '/';
  const [path, query = ''] = h.split('?');
  const params = Object.fromEntries(new URLSearchParams(query));
  const parts = path.split('/').filter(Boolean); // e.g. ['entry','e_123']
  return { parts, params };
}

async function route() {
  const { parts, params } = parseHash();
  const [a, b, c] = parts;
  let node;

  // Cloud sync configured but not signed in → force the login screen.
  if (store.needsAuth() && !store.isSignedIn()) {
    app.innerHTML = '';
    app.appendChild(await login.render());
    window.scrollTo(0, 0);
    return;
  }

  try {
    if (!a || a === 'home') node = await home.render();
    else if (a === 'new') node = await editor.render({ input: params.input, type: params.type });
    else if (a === 'edit' && b) node = await editor.render({ id: b });
    else if (a === 'entry' && b) node = await entry.render({ id: b });
    else if (a === 'day' && b) node = await day.render({ day: b, type: params.type });
    else if (a === 'memories') node = await browse.render({ kind: 'memory' });
    else if (a === 'lessons') node = await browse.render({ kind: 'lesson' });
    else if (a === 'stats') node = await statspage.render();
    else if (a === 'settings') node = await settings.render();
    else if (a === 'random' && b) { await gotoRandom(b); return; }
    else node = await home.render();
  } catch (err) {
    console.error('Route error:', err);
    node = document.createElement('div');
    node.className = 'view';
    node.innerHTML = `<main class="container"><p class="empty-hint">Something went wrong loading this page.<br><a href="#/home">Go home</a></p></main>`;
  }

  app.innerHTML = '';
  app.appendChild(node);
  window.scrollTo(0, 0);
}

async function gotoRandom(kind) {
  const all = await store.all();
  const filtered = all.filter((e) => e.type === (kind === 'lesson' ? 'lesson' : 'memory'));
  const choice = pick(filtered);
  if (choice) location.hash = `#/entry/${choice.id}`;
  else location.hash = kind === 'lesson' ? '#/lessons' : '#/memories';
}

async function splash() {
  const overlay = document.getElementById('splash');
  const ruleEl = document.getElementById('splash-rule');
  try {
    const rules = await loadRules();
    ruleEl.textContent = randomRule(rules);
  } catch { /* ignore */ }
  requestAnimationFrame(() => overlay.classList.add('show'));
  await new Promise((r) => setTimeout(r, 2200));
  overlay.classList.add('hide');
  setTimeout(() => overlay.remove(), 450);
}

async function boot() {
  await store.init();
  // Re-render on live data pushes from other devices (Firebase only). With local
  // storage we always navigate explicitly, so a change-triggered re-render would
  // just be redundant work right before the hash change.
  if (store.backendName() === 'firebase') {
    store.onChange(() => route());
    // Re-route when the user signs in or out so the login gate updates live.
    store.onAuthChange(() => route());
  }
  window.addEventListener('hashchange', route);

  // Show splash on a fresh load, then route to home.
  await splash();
  if (!location.hash || location.hash === '#/' || location.hash === '#') location.hash = '#/home';
  else route();
}

boot();

// Expose menu for any inline hooks (not strictly needed).
window.__openMenu = openMenu;
