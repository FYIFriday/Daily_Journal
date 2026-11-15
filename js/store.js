// Storage layer.
//
// The app works with ZERO setup using the browser's localStorage. When you
// paste a Firebase config into Settings, entries sync to Firestore instead so
// your phone and desktop share the same journal.
//
// Public API (all async, all backends):
//   store.init()                    -> sets up the active backend
//   store.all()                     -> Entry[] (newest first)
//   store.get(id)                   -> Entry | null
//   store.add(entry)                -> Entry (with id/createdAt filled)
//   store.update(id, patch)         -> Entry
//   store.addNote(id, text)         -> Entry
//   store.remove(id)                -> void
//   store.onChange(fn)              -> unsubscribe
//   store.backendName()             -> 'local' | 'firebase'
//
// An Entry looks like:
//   { id, type:'memory'|'lesson', headline, body (sanitized HTML),
//     createdAt (ISO), day (YYYY-MM-DD), inputMethod:'voice'|'keyboard',
//     location:{lat,lon,label}|null, weather:{tempC,tempF,code,text}|null,
//     notes:[{id,text,createdAt}], updatedAt }

import { uid, dayKey } from './util.js';

const LS_ENTRIES = 'dj_entries_v1';
const LS_FIREBASE = 'dj_firebase_config_v1';
const LS_SETTINGS = 'dj_settings_v1';

const listeners = new Set();
function emit() { listeners.forEach((fn) => { try { fn(); } catch (e) { console.error(e); } }); }

function normalize(e) {
  return {
    id: e.id || uid(),
    type: e.type === 'lesson' ? 'lesson' : 'memory',
    headline: e.headline || '',
    body: e.body || '',
    createdAt: e.createdAt || new Date().toISOString(),
    day: e.day || dayKey(new Date(e.createdAt || Date.now())),
    inputMethod: e.inputMethod === 'voice' ? 'voice' : 'keyboard',
    location: e.location || null,
    weather: e.weather || null,
    notes: Array.isArray(e.notes) ? e.notes : [],
    updatedAt: e.updatedAt || e.createdAt || new Date().toISOString(),
  };
}

function sortDesc(list) {
  return [...list].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

/* ------------------------- localStorage backend ------------------------- */
const localBackend = {
  name: 'local',
  _read() {
    try { return JSON.parse(localStorage.getItem(LS_ENTRIES) || '[]'); }
    catch { return []; }
  },
  _write(list) { localStorage.setItem(LS_ENTRIES, JSON.stringify(list)); },
  async init() {},
  async all() { return sortDesc(this._read().map(normalize)); },
  async get(id) { return this._read().map(normalize).find((e) => e.id === id) || null; },
  async add(entry) {
    const e = normalize(entry);
    const list = this._read();
    list.push(e);
    this._write(list);
    emit();
    return e;
  },
  async update(id, patch) {
    const list = this._read();
    const i = list.findIndex((e) => e.id === id);
    if (i === -1) throw new Error('Entry not found');
    list[i] = normalize({ ...list[i], ...patch, updatedAt: new Date().toISOString() });
    this._write(list);
    emit();
    return list[i];
  },
  async remove(id) {
    this._write(this._read().filter((e) => e.id !== id));
    emit();
  },
};

/* --------------------------- Firebase backend --------------------------- */
// Loaded lazily via CDN ES modules so there's no build step and no cost when
// unused. Uses anonymous auth + a per-user Firestore collection.
function makeFirebaseBackend(config) {
  let db, col, cache = [], ready;

  async function load() {
    const appMod = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js');
    const authMod = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js');
    const fsMod = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js');
    const app = appMod.initializeApp(config);
    const auth = authMod.getAuth(app);
    db = fsMod.getFirestore(app);

    const uidVal = await new Promise((resolve, reject) => {
      authMod.onAuthStateChanged(auth, (user) => {
        if (user) resolve(user.uid);
      });
      authMod.signInAnonymously(auth).catch(reject);
    });

    col = fsMod.collection(db, 'users', uidVal, 'entries');
    // Live subscription keeps the local cache fresh across devices.
    fsMod.onSnapshot(col, (snap) => {
      cache = sortDesc(snap.docs.map((d) => normalize({ id: d.id, ...d.data() })));
      emit();
    });
    return fsMod;
  }

  return {
    name: 'firebase',
    _fs: null,
    async init() { ready = load(); this._fs = await ready; },
    async all() { return cache; },
    async get(id) {
      const hit = cache.find((e) => e.id === id);
      if (hit) return hit;
      const snap = await this._fs.getDoc(this._fs.doc(col, id));
      return snap.exists() ? normalize({ id: snap.id, ...snap.data() }) : null;
    },
    async add(entry) {
      const e = normalize(entry);
      const { id, ...data } = e;
      await this._fs.setDoc(this._fs.doc(col, id), data);
      return e;
    },
    async update(id, patch) {
      const current = await this.get(id);
      if (!current) throw new Error('Entry not found');
      const next = normalize({ ...current, ...patch, id, updatedAt: new Date().toISOString() });
      const { id: _i, ...data } = next;
      await this._fs.setDoc(this._fs.doc(col, id), data);
      return next;
    },
    async addNote() { throw new Error('handled by store'); },
    async remove(id) { await this._fs.deleteDoc(this._fs.doc(col, id)); },
  };
}

/* ------------------------------- facade -------------------------------- */
export const settings = {
  get() {
    try { return JSON.parse(localStorage.getItem(LS_SETTINGS) || '{}'); }
    catch { return {}; }
  },
  set(patch) {
    const next = { ...this.get(), ...patch };
    localStorage.setItem(LS_SETTINGS, JSON.stringify(next));
    return next;
  },
};

export const firebaseConfigStore = {
  get() {
    try {
      const raw = localStorage.getItem(LS_FIREBASE);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  },
  set(cfg) {
    if (cfg) localStorage.setItem(LS_FIREBASE, JSON.stringify(cfg));
    else localStorage.removeItem(LS_FIREBASE);
  },
};

let backend = localBackend;
let initError = null;

export const store = {
  async init() {
    const cfg = firebaseConfigStore.get();
    if (cfg && cfg.apiKey && cfg.projectId) {
      try {
        const fb = makeFirebaseBackend(cfg);
        await fb.init();
        backend = fb;
      } catch (err) {
        console.error('Firebase init failed, falling back to local storage:', err);
        initError = err;
        backend = localBackend;
      }
    } else {
      backend = localBackend;
    }
  },
  backendName() { return backend.name; },
  initError() { return initError; },
  all() { return backend.all(); },
  get(id) { return backend.get(id); },
  add(entry) { return backend.add(entry); },
  update(id, patch) { return backend.update(id, patch); },
  remove(id) { return backend.remove(id); },
  async addNote(id, text) {
    const entry = await backend.get(id);
    if (!entry) throw new Error('Entry not found');
    const notes = [...(entry.notes || []), { id: uid(), text, createdAt: new Date().toISOString() }];
    return backend.update(id, { notes });
  },
  onChange(fn) { listeners.add(fn); return () => listeners.delete(fn); },
};
