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
    image: e.image || null,
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
  _write(list) {
    try {
      localStorage.setItem(LS_ENTRIES, JSON.stringify(list));
    } catch (e) {
      // Quota exceeded (likely too many/large photos). The previous value is
      // left untouched, so no entries are lost — surface a clear message.
      if (e && (e.name === 'QuotaExceededError' || e.code === 22)) {
        throw new Error('This device’s storage is full — connect Firebase sync or remove a photo to save. Nothing was lost.');
      }
      throw e;
    }
  },
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
// unused. Uses EMAIL/PASSWORD auth so the SAME account on phone + browser shares
// one Firestore collection (true cross-device sync). Each account's entries live
// under users/{uid}/entries and are private to that account.
function makeFirebaseBackend(config) {
  let db, col, fsMod, authMod, auth;
  let user = null, cache = [], snapshotError = null, unsub = null;
  const authListeners = new Set();
  const notifyAuth = () => authListeners.forEach((fn) => { try { fn(); } catch (e) { console.error(e); } });

  function requireUser() {
    if (!user) throw new Error('Please sign in to sync your journal.');
  }

  // (Re)bind the live subscription to the signed-in user's collection.
  function bindCollection() {
    if (unsub) { unsub(); unsub = null; }
    cache = []; snapshotError = null;
    if (!user) { emit(); return; }
    col = fsMod.collection(db, 'users', user.uid, 'entries');
    unsub = fsMod.onSnapshot(col, (snap) => {
      snapshotError = null;
      cache = sortDesc(snap.docs.map((d) => normalize({ id: d.id, ...d.data() })));
      emit();
    }, (err) => {
      // Most often "Missing or insufficient permissions" → Firestore rules.
      snapshotError = err;
      console.error('Firestore read denied:', err);
      emit();
    });
  }

  async function init() {
    const appMod = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js');
    authMod = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js');
    fsMod = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js');
    const app = appMod.initializeApp(config);
    auth = authMod.getAuth(app);
    db = fsMod.getFirestore(app);
    // Resolve once the persisted session (if any) is restored; thereafter the
    // same listener reacts to every sign-in / sign-out.
    await new Promise((resolve) => {
      authMod.onAuthStateChanged(auth, (u) => {
        user = u || null;
        bindCollection();
        notifyAuth();
        resolve();
      });
    });
  }

  return {
    name: 'firebase',
    init,
    readError() { return snapshotError; },
    isSignedIn() { return !!user; },
    currentEmail() { return user?.email || null; },
    onAuthChange(fn) { authListeners.add(fn); return () => authListeners.delete(fn); },
    async signIn(email, password) { await authMod.signInWithEmailAndPassword(auth, email.trim(), password); },
    async createAccount(email, password) { await authMod.createUserWithEmailAndPassword(auth, email.trim(), password); },
    async signOutUser() { await authMod.signOut(auth); },
    async all() { return cache; },
    async get(id) {
      requireUser();
      const hit = cache.find((e) => e.id === id);
      if (hit) return hit;
      const snap = await fsMod.getDoc(fsMod.doc(col, id));
      return snap.exists() ? normalize({ id: snap.id, ...snap.data() }) : null;
    },
    async add(entry) {
      requireUser();
      const e = normalize(entry);
      const { id, ...data } = e;
      await fsMod.setDoc(fsMod.doc(col, id), data);
      return e;
    },
    async update(id, patch) {
      requireUser();
      const current = await this.get(id);
      if (!current) throw new Error('Entry not found');
      const next = normalize({ ...current, ...patch, id, updatedAt: new Date().toISOString() });
      const { id: _i, ...data } = next;
      await fsMod.setDoc(fsMod.doc(col, id), data);
      return next;
    },
    async addNote() { throw new Error('handled by store'); },
    async remove(id) { requireUser(); await fsMod.deleteDoc(fsMod.doc(col, id)); },
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
  // Read error from the live cloud subscription (usually a rules problem).
  readError() { return backend.readError ? backend.readError() : null; },
  // Auth (email/password). On the local backend there's no sign-in, so treat as
  // "always signed in" to keep the router simple.
  needsAuth() { return backend.name === 'firebase'; },
  isSignedIn() { return backend.isSignedIn ? backend.isSignedIn() : true; },
  currentEmail() { return backend.currentEmail ? backend.currentEmail() : null; },
  onAuthChange(fn) { return backend.onAuthChange ? backend.onAuthChange(fn) : () => {}; },
  signIn(email, password) { return backend.signIn(email, password); },
  createAccount(email, password) { return backend.createAccount(email, password); },
  signOut() { return backend.signOutUser ? backend.signOutUser() : Promise.resolve(); },
  // Entries still sitting in this device's localStorage, regardless of the
  // active backend — used to recover/migrate after connecting the cloud.
  localEntries() {
    try { return JSON.parse(localStorage.getItem(LS_ENTRIES) || '[]'); }
    catch { return []; }
  },
  localEntryCount() { return this.localEntries().length; },
  // Upload this device's local entries to the cloud. Idempotent: each entry is
  // written under its existing id, so re-running overwrites rather than dupes.
  async migrateLocalToCloud() {
    if (backend.name !== 'firebase') throw new Error('Connect cloud sync first.');
    const raw = this.localEntries();
    let n = 0;
    for (const e of raw) { await backend.add(normalize(e)); n++; }
    return n;
  },
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
