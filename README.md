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

The app works immediately on local storage. To share entries across devices:

1. Go to <https://console.firebase.google.com> and **Add project** (free Spark plan).
2. In the project, **Build → Firestore Database → Create database** (start in
   production mode is fine; rules below lock it to each anonymous user).
3. **Build → Authentication → Get started → Sign-in method → Anonymous → Enable**.
4. **Project settings (gear) → Your apps → Web (`</>`)** → register an app. Copy
   the `firebaseConfig` object it shows you.
5. In the journal, open **☰ Menu → Settings → Cloud sync**, paste the config,
   and tap **Save & connect**. Do this on each device with the *same* config.

### Recommended Firestore security rules

In **Firestore → Rules**, use:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{uid}/entries/{doc} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }
  }
}
```

This keeps each anonymous user's entries private to that signed-in session.

> Note: the Firebase web config isn't a secret (it's safe in client code), but the
> rules above are what actually protect your data.

## Data & backup

- **Settings → Backup** exports a JSON of all entries and imports one on a new
  device. Always keep a backup before clearing browser data.
- Local entries live in `localStorage`; clearing site data erases them (cloud
  copies, if connected, remain).

## Tech

Vanilla JS ES modules, hash routing, `localStorage` + Firestore adapter,
Open-Meteo (weather, no key), BigDataCloud (reverse geocode, no key). No bundler,
no dependencies to install.
