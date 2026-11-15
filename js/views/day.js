// A single day's entries, reached by tapping a calendar cell.

import { store } from '../store.js';
import { topBar, el } from '../ui.js';
import { longDate, shortDate, esc, plainText } from '../util.js';
import { parseDayKey } from '../calendar.js';

export async function render(params) {
  const dayStr = params.day;
  const all = await store.all();
  let entries = all.filter((e) => e.day === dayStr);
  if (params.type) entries = entries.filter((e) => e.type === params.type);

  const root = el('<div class="view day-view"></div>');
  const dateLabel = dayStr ? longDate(parseDayKey(dayStr)) : '';
  root.appendChild(topBar({ title: shortDate(parseDayKey(dayStr)), back: 'history' }));

  const main = el(`<main class="container"><h2 class="day-title">${esc(dateLabel)}</h2></main>`);
  if (!entries.length) {
    main.appendChild(el('<p class="empty-hint">No entries this day.</p>'));
  } else {
    const list = el('<section class="entry-list"></section>');
    entries.forEach((e) => {
      const kind = e.type === 'lesson' ? 'lesson' : 'memory';
      const preview = plainText(e.body).slice(0, 110);
      list.appendChild(el(`
        <a class="entry-row" href="#/entry/${e.id}">
          <div class="row-kind"><span class="dot dot-${kind}"></span></div>
          <div class="row-main">
            <div class="row-headline">${esc(e.headline || preview || 'Untitled')}</div>
            <div class="row-preview">${esc(preview)}${preview.length >= 110 ? '…' : ''}</div>
          </div>
        </a>`));
    });
    main.appendChild(list);
  }
  root.appendChild(main);
  return root;
}
