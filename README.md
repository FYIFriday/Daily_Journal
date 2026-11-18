# Daily Journal

A tiny, phone-first journal for capturing **one daily memory** (and optionally a
**daily lesson**). Pure static site — no build step — so it runs on GitHub Pages
as-is. Entries are stored on your device by default, and sync across devices once
you connect Firebase.

## What it does

- **Load screen** — on open, shows one random rule from `my_personal_rules.txt`
  for ~2.2s, then drops you on the home screen.
- **Home** — a New Entry panel (🎤 speak / ABC type), a tappable stats panel with
  GitHub-style contribution calendars (memories in green, lessons in violet), and
  a random throwback card at the bottom.
- **New entry** — memory by default, a discrete toggle switches to lesson.
  Auto date·time·location label, best-effort weather, headline + rich body
  (bold / italic / underline / emoji), and an optional **photo** (camera or
  library on phone). Saving a new entry returns you to the home screen.
- **Photos** — images are downscaled to ~1024px JPEG before saving so they stay
  small (local storage is capped at ~5MB; Firestore docs at ~1MB). For large
  photo libraries, connect Firebase sync.
- **Existing entries** — re-read, **add date-stamped notes**, and edit the entry
  or a note via the ✏️ pencil (edits are not timestamped; new notes always are).
- **Stats** — calendars, spoken-vs-typed, day-of-week, busiest month, streaks,
  and **entries-per-day** (average per active day, days with more than one entry,
  most in a single day). Every section can be "dived into" to tap **DD Mmm** links
  to the entries.
- **Menu** — past memories, random memory, past lessons, random lesson, home,
  settings.

## Run locally

Because it uses ES modules and `fetch`, open it through a local server (not
`file://`):

```bash
cd Daily_Journal
python3 -m http.server 8000
# visit http://localhost:8000
```

## Publish on GitHub Pages

1. Push this repo to GitHub.
2. Repo **Settings → Pages → Build and deployment → Source: Deploy from a branch**.
3. Branch: `main`, folder: `/ (root)`. Save.
4. Your journal is live at `https://<user>.github.io/Daily_Journal/`.
   Add it to your iPhone Home Screen (Share → Add to Home Screen) for an app feel.

## Voice-to-text on iPhone (important)

iOS Safari has **no reliable programmatic speech recognition**, so true one-tap
live transcription isn't possible there. Instead, the 🎤 button focuses the
editor and you tap the **microphone on the iOS keyboard** to dictate. On Android
Chrome / desktop Chrome the mic button *does* live-transcribe automatically.

## Cloud sync (phone ⇄ desktop) — 5-minute Firebase setup

The app works immediately on local storage. To share entries across devices you
sign in with **one email + password account**, and use that *same account* on
every device — that shared login is what makes the journal sync.

1. Go to <https://console.firebase.google.com> and **Add project** (free Spark plan).
2. In the project, **Build → Firestore Database → Create database** (production
   mode is fine; the rules below lock it to your account).
3. **Build → Authentication → Get started → Sign-in method → Email/Password →
   Enable** (just the first toggle; "Email link" isn't needed).
4. **Project settings (gear) → Your apps → Web (`</>`)** → register an app. Copy
   **only** the `firebaseConfig` object (ignore the `npm install` line — this app
   loads Firebase from a CDN, no install needed).
5. In the journal, open **☰ Menu → Settings → Cloud sync**, paste the config, and
   tap **Save & connect**. Do this on each device with the *same* config.
6. A sign-in screen appears. On the first device tap **Create account** (any email
   + a password of 6+ characters). On every other device, enter the **same email
   and password** and tap **Sign in**. That's it — entries now sync both ways.

> Moving entries you saved *before* signing in: they're still in that device's
> local storage. After signing in, open **Settings → "Recover this device's
> entries" → Upload to cloud** and they'll upload to your account and sync.

### Recommended Firestore security rules

In **Firestore → Rules**, use:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{uid}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }
  }
}
```

Click **Publish**. This keeps each account's entries private to that account —
only someone signed in as you can read them.

> The `/{document=**}` recursive wildcard matters: Firestore rules do **not**
> cascade into subcollections automatically. Matching only `/users/{uid}` (or
> `/users/{uid}/entries/{doc}` without the wildcard) is the usual cause of a
> "Missing or insufficient permissions" error when saving. Also make sure
> **Authentication → Sign-in method → Email/Password** is **enabled**, and that
> you're not sitting on expired "test mode" rules (those deny everything after
> 30 days).

> Note: the Firebase web config isn't a secret (it's safe in client code), but the
> rules above are what actually protect your data.

## Data & backup

- **Settings → Backup** exports a JSON of all entries and imports one on a new
  device. Always keep a backup before clearing browser data.
- Local entries live in `localStorage`; clearing site data erases them (cloud
  copies, if connected, remain).
- **iOS warning:** Safari deletes a web app's local storage after ~7 days of not
  opening it. **Until you connect Firebase, your entries are not safe** — the
  home screen shows a warning banner whenever storage is local-only. Set up cloud
  sync (above) and/or export a backup regularly.

## Tech

Vanilla JS ES modules, hash routing, `localStorage` + Firestore adapter,
Open-Meteo (weather, no key), BigDataCloud (reverse geocode, no key). No bundler,
no dependencies to install.
