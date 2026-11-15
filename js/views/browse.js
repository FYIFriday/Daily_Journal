// "Past memories" / "Past lessons": a scrollable color-coded calendar plus a
// chronological list of entries of that type.

import { store } from '../store.js';
import { topBar, el } from '../ui.js';
import { renderContributions, legend } from '../calendar.js';
import { esc, plainText, shortDate, longDate, wordCount } from '../util.js';

export async function render(params) {
  const kind = params.kind === 'lesson' ? 'lesson' : 'memory';
  const all = await store.all();
  const entries = all.filter((e) => e.type === kind);

  const root = el('<div class="view browse"></div>');
  root.appendChild(topBar({
    title: kind === 'lesson' ? 'Past lessons' : 'Past memories',
    back: '#/home',
  }));
  const main = el('<main class="container"></main>');

  const calCard = el(`<section class="card"><div class="cal-title"><span class="dot dot-${kind}"></span>${entries.length} ${kind === 'lesson' ? 'lessons' : 'memories'}</div></section>`);
  calCard.appendChild(renderContributions(entries, { kind, months: 12 }));
  calCard.appendChild(legend(kind));
  main.appendChild(calCard);

  if (!entries.length) {
    main.appendChild(el(`<p class="empty-hint">No ${kind === 'lesson' ? 'lessons' : 'memories'} yet.</p>`));
  } else {
    const list = el('<section class="entry-list"></section>');
    entries.forEach((e) => {
      const preview = plainText(e.body).slice(0, 110);
      list.appendChild(el(`
        <a class="entry-row" href="#/entry/${e.id}">
          <div class="row-date">${esc(shortDate(e.createdAt))}</div>
          <div class="row-main">
            <div class="row-headline">${esc(e.headline || preview || 'Untitled')}</div>
            <div class="row-preview">${esc(preview)}${preview.length >= 110 ? '…' : ''}</div>
          </div>
          <div class="row-len" title="${wordCount(e.body)} words">${wordCount(e.body)}w</div>
        </a>`));
    });
    main.appendChild(list);
  }

  root.appendChild(main);
  return root;
}
