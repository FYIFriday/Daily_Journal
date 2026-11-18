// Settings: cloud sync config, data export/import, status.

import { store, firebaseConfigStore } from '../store.js';
import { topBar, el } from '../ui.js';

export async function render() {
  const root = el('<div class="view settings-view"></div>');
  root.appendChild(topBar({ title: 'Settings', back: '#/home' }));
  const main = el('<main class="container"></main>');

  const backend = store.backendName();
  const cfg = firebaseConfigStore.get();

  // --- Sync status / Firebase config ---
  const sync = el(`
    <section class="card">
      <h3>Cloud sync</h3>
      <p class="stat-line">Status:
        <strong class="${backend === 'firebase' ? 'ok' : 'warn'}">${backend === 'firebase' ? 'Firebase (synced across devices)' : 'On this device only (localStorage)'}</strong>
      </p>
      ${store.initError() ? `<p class="warn sm">Firebase failed to start: ${store.initError().message}. Using local storage.</p>` : ''}
      ${backend === 'firebase' && store.readError() ? `<p class="warn sm">Cloud is connected but access is <strong>denied</strong> (${store.readError().code || 'permissions'}). Publish the Firestore rules from the README, and enable Anonymous sign-in. Until then new entries won’t save.</p>` : ''}
      <p class="muted sm">Paste your Firebase web-app config below to sync your journal between phone and desktop. See the README for the 5-minute setup.</p>
      <textarea class="config-input" rows="8" placeholder='{\n  "apiKey": "…",\n  "authDomain": "…",\n  "projectId": "…",\n  "appId": "…"\n}'>${cfg ? JSON.stringify(cfg, null, 2) : ''}</textarea>
      <div class="btn-row">
        <button class="btn-primary" data-save-cfg>Save &amp; connect</button>
        ${cfg ? '<button class="btn-ghost" data-clear-cfg>Disconnect</button>' : ''}
      </div>
      <p class="cfg-msg" data-cfg-msg></p>
    </section>`);

  const cfgInput = sync.querySelector('.config-input');
  const msg = sync.querySelector('[data-cfg-msg]');
  sync.querySelector('[data-save-cfg]').addEventListener('click', () => {
    const raw = cfgInput.value.trim();
    if (!raw) { msg.textContent = 'Paste a config first.'; return; }
    let parsed;
    try {
      // Accept either pure JSON or a JS `const firebaseConfig = {…}` snippet.
      const jsonLike = raw.replace(/^[\s\S]*?\{/, '{').replace(/\};?[\s\S]*$/, '}')
        .replace(/([{,]\s*)([A-Za-z0-9_]+)\s*:/g, '$1"$2":')
        .replace(/'/g, '"').replace(/,(\s*})/g, '$1');
      parsed = JSON.parse(jsonLike);
    } catch (e) {
      msg.textContent = 'Could not parse that config. Paste the JSON object with apiKey, authDomain, projectId, appId.';
      return;
    }
    if (!parsed.apiKey || !parsed.projectId) {
      msg.textContent = 'Config needs at least apiKey and projectId.';
      return;
    }
    firebaseConfigStore.set(parsed);
    msg.textContent = 'Saved. Reloading to connect…';
    setTimeout(() => location.reload(), 600);
  });
  const clearBtn = sync.querySelector('[data-clear-cfg]');
  if (clearBtn) clearBtn.addEventListener('click', () => {
    if (!confirm('Disconnect cloud sync? Entries already in the cloud stay there; this device will switch back to local storage.')) return;
    firebaseConfigStore.set(null);
    location.reload();
  });
  main.appendChild(sync);

  // --- Recover local entries into the cloud ---
  // When you connect Firebase, the app starts reading the (empty) cloud, so
  // entries saved on this device before connecting seem to vanish. They're still
  // in local storage — this uploads them to the cloud so they reappear.
  const localCount = store.localEntryCount();
  if (backend === 'firebase' && localCount > 0) {
    const recover = el(`
      <section class="card">
        <h3>Recover this device's entries</h3>
        <p class="stat-line">Found <strong>${localCount}</strong> entr${localCount === 1 ? 'y' : 'ies'} saved on this device before cloud sync was connected.</p>
        <p class="muted sm">Upload them to the cloud so they show up again and sync across devices. Safe to run more than once — it won't create duplicates.</p>
        <div class="btn-row"><button class="btn-primary" data-migrate>Upload ${localCount} to cloud</button></div>
        <p class="cfg-msg" data-migrate-msg></p>
      </section>`);
    const mmsg = recover.querySelector('[data-migrate-msg]');
    recover.querySelector('[data-migrate]').addEventListener('click', async (e) => {
      const btn = e.currentTarget;
      btn.disabled = true; mmsg.textContent = 'Uploading…';
      try {
        const n = await store.migrateLocalToCloud();
        mmsg.textContent = `Uploaded ${n}. Your entries are back — opening the home screen…`;
        setTimeout(() => { location.hash = '#/home'; }, 900);
      } catch (err) {
        btn.disabled = false;
        mmsg.textContent = 'Upload failed: ' + err.message + (err.code ? ` (${err.code})` : '') + '. Fix the Firestore rules first.';
      }
    });
    main.appendChild(recover);
  }

  // --- Export / import ---
  const data = el(`
    <section class="card">
      <h3>Backup</h3>
      <p class="muted sm">Export a JSON backup of every entry, or import one on a new device.</p>
      <div class="btn-row">
        <button class="btn-ghost" data-export>Export JSON</button>
        <label class="btn-ghost file-label">Import JSON<input type="file" accept="application/json" hidden data-import></label>
      </div>
      <p class="cfg-msg" data-data-msg></p>
    </section>`);
  const dmsg = data.querySelector('[data-data-msg]');
  data.querySelector('[data-export]').addEventListener('click', async () => {
    const all = await store.all();
    const blob = new Blob([JSON.stringify(all, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `daily-journal-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  });
  data.querySelector('[data-import]').addEventListener('change', async (ev) => {
    const file = ev.target.files[0];
    if (!file) return;
    try {
      const list = JSON.parse(await file.text());
      if (!Array.isArray(list)) throw new Error('Not a journal backup.');
      let n = 0;
      for (const e of list) {
        const existing = await store.get(e.id);
        if (!existing) { await store.add(e); n++; }
      }
      dmsg.textContent = `Imported ${n} new entr${n === 1 ? 'y' : 'ies'}.`;
    } catch (e) {
      dmsg.textContent = 'Import failed: ' + e.message;
    }
  });
  main.appendChild(data);

  // --- Danger zone ---
  const danger = el(`
    <section class="card">
      <h3>Danger zone</h3>
      <button class="btn-danger" data-wipe>Erase all local data</button>
      <p class="muted sm">Removes entries stored in this browser. Cloud data (if connected) is not touched here.</p>
    </section>`);
  danger.querySelector('[data-wipe]').addEventListener('click', () => {
    if (!confirm('Erase all entries stored in THIS browser? This cannot be undone.')) return;
    localStorage.removeItem('dj_entries_v1');
    location.reload();
  });
  main.appendChild(danger);

  root.appendChild(main);
  return root;
}
