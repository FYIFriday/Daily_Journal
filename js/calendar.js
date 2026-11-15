// GitHub-contributions-style calendar.
// Columns are weeks (Sun–Sat rows); color intensity grows with entry length.

import { dayKey, parseDayKey, wordCount, monthName, weekdayShort } from './util.js';

// Map a day's total word count to an intensity level 0–4.
function levelFor(words) {
  if (words <= 0) return 0;
  if (words <= 20) return 1;
  if (words <= 60) return 2;
  if (words <= 120) return 3;
  return 4;
}

// entries: already filtered to one type. months: how many months back to show.
// kind: 'memory' | 'lesson' (drives the color class).
export function renderContributions(entries, { months = 12, kind = 'memory' } = {}) {
  // Aggregate word counts per day.
  const byDay = new Map();
  for (const e of entries) {
    const w = wordCount(e.body) + wordCount(e.headline);
    byDay.set(e.day, (byDay.get(e.day) || 0) + w);
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(today);
  start.setMonth(start.getMonth() - months);
  // Snap start back to the preceding Sunday so columns align.
  start.setDate(start.getDate() - start.getDay());

  const wrap = document.createElement('div');
  wrap.className = 'cal-wrap';
  wrap.innerHTML = `<div class="cal-scroll" role="group" aria-label="Contributions calendar"></div>`;
  const scroll = wrap.querySelector('.cal-scroll');

  // Weekday labels column.
  const dayLabels = document.createElement('div');
  dayLabels.className = 'cal-daylabels';
  [1, 3, 5].forEach((i) => {
    const s = document.createElement('span');
    s.style.gridRow = i + 1;
    s.textContent = weekdayShort(i);
    dayLabels.appendChild(s);
  });

  const grid = document.createElement('div');
  grid.className = `cal-grid cal-${kind}`;

  const months_seen = [];
  let col = 0;
  const cursor = new Date(start);
  let lastMonth = -1;

  while (cursor <= today) {
    const weekday = cursor.getDay();
    if (weekday === 0) col++;
    const key = dayKey(cursor);
    const words = byDay.get(key) || 0;
    const lvl = levelFor(words);
    const inRange = cursor <= today;

    const cell = document.createElement(words > 0 ? 'a' : 'div');
    cell.className = `cal-cell lvl-${lvl}`;
    cell.style.gridColumn = col + 1;
    cell.style.gridRow = weekday + 1;
    cell.dataset.day = key;
    if (words > 0) {
      cell.href = `#/day/${key}?type=${kind}`;
      cell.setAttribute('aria-label', `${key}: ${words} words`);
      cell.title = `${key} · ${words} words`;
    }
    if (!inRange) cell.classList.add('future');
    grid.appendChild(cell);

    // Track month label positions.
    if (cursor.getMonth() !== lastMonth && cursor.getDate() <= 7) {
      months_seen.push({ col: col + 1, label: monthName(cursor.getMonth()) });
      lastMonth = cursor.getMonth();
    }
    cursor.setDate(cursor.getDate() + 1);
  }

  // Month labels row.
  const monthRow = document.createElement('div');
  monthRow.className = 'cal-months';
  months_seen.forEach((m) => {
    const s = document.createElement('span');
    s.style.gridColumn = m.col;
    s.textContent = m.label;
    monthRow.appendChild(s);
  });

  const body = document.createElement('div');
  body.className = 'cal-body';
  body.appendChild(dayLabels);
  const right = document.createElement('div');
  right.className = 'cal-right';
  right.appendChild(monthRow);
  right.appendChild(grid);
  body.appendChild(right);
  scroll.appendChild(body);

  // Auto-scroll to the most recent weeks (right edge) on mobile.
  requestAnimationFrame(() => { scroll.scrollLeft = scroll.scrollWidth; });

  return wrap;
}

export function legend(kind = 'memory') {
  const el = document.createElement('div');
  el.className = `cal-legend cal-${kind}`;
  el.innerHTML = `<span>Less</span>` +
    [0, 1, 2, 3, 4].map((l) => `<i class="cal-cell lvl-${l}"></i>`).join('') +
    `<span>More</span>`;
  return el;
}

export { parseDayKey };
