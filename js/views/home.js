// Homepage: New Entry panel, stats/calendars panel, random throwback card.

import { store } from '../store.js';
import { icons, topBar, go, el } from '../ui.js';
import { renderContributions } from '../calendar.js';
import { pick, esc, plainText, shortDate } from '../util.js';

export async function render() {
  const entries = await store.all();
  const memories = entries.filter((e) => e.type === 'memory');
  const lessons = entries.filter((e) => e.type === 'lesson');

  const root = el('<div class="view home"></div>');
  root.appendChild(topBar({ showMenu: true, title: 'Daily Journal', rightHtml: `<span class="iconbtn-spacer"></span>` }));

  const main = el('<main class="container"></main>');

  // --- Backup warning: local-only storage can be wiped by the browser ---
  if (store.backendName() === 'local') {
    const failed = store.initError();
    const banner = el(`
      <a class="backup-warn" href="#/settings">
        <span class="bw-ico">⚠️</span>
        <span class="bw-text">
          <strong>${failed ? 'Cloud sync isn’t connecting' : 'Your journal isn’t backed up'}</strong>
          ${failed
            ? 'It fell back to this device only. Tap to fix your Firebase settings.'
            : 'Entries are saved only on this device and can be erased by your browser (iOS clears it after ~7 days unused). Tap to turn on cloud sync.'}
        </span>
      </a>`);
    main.appendChild(banner);
  }

  // --- New Entry panel (unlabeled) ---
  const panel = el(`
    <section class="new-entry-panel" aria-label="New entry">
      <button class="ne-btn" data-new="voice" aria-label="New entry with voice">
        <span class="ne-ico">${icons.mic}</span>
        <span class="ne-cap">Speak</span>
      </button>
      <button class="ne-btn" data-new="keyboard" aria-label="New entry with keyboard">
        <span class="ne-ico abc">${icons.abc}</span>
        <span class="ne-cap">Type</span>
      </button>
    </section>`);
  panel.addEventListener('click', (e) => {
    const b = e.target.closest('[data-new]');
    if (b) go(`#/new?input=${b.dataset.new}`);
  });
  main.appendChild(panel);

  // --- Stats panel (tappable -> full stats page) ---
  const statsPanel = el(`
    <section class="stats-panel" role="button" tabindex="0" aria-label="Open stats">
      <div class="sp-head">
        <div class="sp-metrics">
          <div class="metric"><strong>${memories.length}</strong><span>memories</span></div>
          <div class="metric"><strong>${lessons.length}</strong><span>lessons</span></div>
          <div class="metric"><strong>${new Set(entries.map((e) => e.day)).size}</strong><span>days</span></div>
        </div>
        <span class="sp-chev">Stats ›</span>
      </div>
      <div class="cal-block">
        <div class="cal-title"><span class="dot dot-memory"></span>Memories</div>
      </div>
      <div class="cal-block">
        <div class="cal-title"><span class="dot dot-lesson"></span>Lessons</div>
      </div>
    </section>`);
  const blocks = statsPanel.querySelectorAll('.cal-block');
  blocks[0].appendChild(renderContributions(memories, { kind: 'memory', months: 12 }));
  blocks[1].appendChild(renderContributions(lessons, { kind: 'lesson', months: 12 }));
  const openStats = () => go('#/stats');
  statsPanel.addEventListener('click', (e) => {
    // Don't hijack taps on a calendar cell link.
    if (e.target.closest('a.cal-cell')) return;
    openStats();
  });
  statsPanel.addEventListener('keydown', (e) => { if (e.key === 'Enter') openStats(); });
  main.appendChild(statsPanel);

  // --- Random throwback card ---
  const throwback = pick(entries);
  if (throwback) {
    const kind = throwback.type === 'lesson' ? 'lesson' : 'memory';
    const card = el(`
      <a class="throwback" href="#/entry/${throwback.id}">
        <div class="tb-label"><span class="dot dot-${kind}"></span>${kind === 'lesson' ? 'A past lesson' : 'A memory resurfaces'} · ${esc(shortDate(throwback.createdAt))}</div>
        <div class="tb-headline">${esc(throwback.headline || plainText(throwback.body).slice(0, 80) || 'Untitled')}</div>
      </a>`);
    main.appendChild(card);
  } else {
    main.appendChild(el(`
      <div class="empty-hint">
        <p>No entries yet.</p>
        <p>Tap <strong>Speak</strong> or <strong>Type</strong> above to capture today's memory.</p>
      </div>`));
  }

  root.appendChild(main);
  return root;
}
