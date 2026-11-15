// Stats page: calendars, input method, day-of-week, and interesting stats.
// Every section can be "dived into" — tapping reveals DD-Mmm links to the
// underlying entries.

import { store } from '../store.js';
import { topBar, el } from '../ui.js';
import { renderContributions, legend } from '../calendar.js';
import { compute } from '../stats.js';
import { esc, shortDate, parseDayKey, weekdayShort, weekdayName, monthName } from '../util.js';

// A collapsible panel listing entries as DD-Mmm chips.
function diveList(entries, label) {
  if (!entries.length) return el('<div></div>');
  const d = el(`<details class="dive"><summary>${esc(label)} (${entries.length})</summary><div class="chips"></div></details>`);
  const chips = d.querySelector('.chips');
  entries.slice().sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)).forEach((e) => {
    const kind = e.type === 'lesson' ? 'lesson' : 'memory';
    chips.appendChild(el(`<a class="chip chip-${kind}" href="#/entry/${e.id}" title="${esc(e.headline || '')}">${esc(shortDate(e.createdAt))}</a>`));
  });
  return d;
}

export async function render() {
  const entries = await store.all();
  const s = compute(entries);
  const memories = entries.filter((e) => e.type === 'memory');
  const lessons = entries.filter((e) => e.type === 'lesson');

  const root = el('<div class="view stats-view"></div>');
  root.appendChild(topBar({ title: 'Stats', back: '#/home' }));
  const main = el('<main class="container"></main>');

  if (!entries.length) {
    main.appendChild(el('<p class="empty-hint">No data yet — add a few entries and your stats will appear here.</p>'));
    root.appendChild(main);
    return root;
  }

  // --- Headline tiles ---
  const tiles = el(`
    <section class="tiles">
      <div class="tile"><strong>${s.totalEntries}</strong><span>entries</span></div>
      <div class="tile"><strong>${s.currentStreak}</strong><span>day streak</span></div>
      <div class="tile"><strong>${s.longestStreak}</strong><span>longest streak</span></div>
      <div class="tile"><strong>${s.totalWords.toLocaleString()}</strong><span>words written</span></div>
    </section>`);
  main.appendChild(tiles);

  // --- Calendars ---
  const calCard = el(`<section class="card"><h3>Contributions</h3>
    <div class="cal-title"><span class="dot dot-memory"></span>Memories · ${s.memoryCount}</div></section>`);
  calCard.appendChild(renderContributions(memories, { kind: 'memory', months: 12 }));
  calCard.appendChild(el(`<div class="cal-title gap"><span class="dot dot-lesson"></span>Lessons · ${s.lessonCount}</div>`));
  calCard.appendChild(renderContributions(lessons, { kind: 'lesson', months: 12 }));
  calCard.appendChild(legend('memory'));
  main.appendChild(calCard);

  // --- Voice vs keyboard ---
  const total = s.voice + s.keyboard || 1;
  const voicePct = Math.round((s.voice / total) * 100);
  const vk = el(`
    <section class="card">
      <h3>How you capture</h3>
      <div class="splitbar"><div class="split-voice" style="width:${voicePct}%"></div></div>
      <div class="split-legend"><span>🎤 Spoken · ${s.voice} (${voicePct}%)</span><span>⌨️ Typed · ${s.keyboard} (${100 - voicePct}%)</span></div>
    </section>`);
  vk.appendChild(diveList(entries.filter((e) => e.inputMethod === 'voice'), 'Spoken entries'));
  vk.appendChild(diveList(entries.filter((e) => e.inputMethod === 'keyboard'), 'Typed entries'));
  main.appendChild(vk);

  // --- Day of week ---
  const maxDow = Math.max(...s.dow, 1);
  const dowCard = el(`<section class="card"><h3>By day of week</h3><div class="dow-chart"></div></section>`);
  const chart = dowCard.querySelector('.dow-chart');
  s.dow.forEach((count, i) => {
    const bar = el(`
      <div class="dow-col">
        <div class="dow-bar-wrap"><div class="dow-bar" style="height:${Math.round((count / maxDow) * 100)}%"></div></div>
        <div class="dow-count">${count}</div>
        <div class="dow-label">${weekdayShort(i)}</div>
      </div>`);
    chart.appendChild(bar);
  });
  // Dive-in per weekday.
  for (let i = 0; i < 7; i++) {
    const dayEntries = entries.filter((e) => parseDayKey(e.day).getDay() === i);
    if (dayEntries.length) dowCard.appendChild(diveList(dayEntries, weekdayName(i)));
  }
  main.appendChild(dowCard);

  // --- Interesting stat 1: busiest month ---
  if (s.topMonth) {
    const [y, mIdx] = s.topMonth.split('-').map(Number);
    const monthEntries = entries.filter((e) => {
      const d = parseDayKey(e.day);
      return d.getFullYear() === y && d.getMonth() === mIdx;
    });
    const mc = el(`<section class="card"><h3>Busiest month</h3>
      <p class="stat-line"><strong>${monthName(mIdx)} ${y}</strong> — ${s.topMonthCount} entries</p></section>`);
    mc.appendChild(diveList(monthEntries, `${monthName(mIdx)} ${y}`));
    main.appendChild(mc);
  }

  // --- Entries per day (supports multiple entries in one day) ---
  const perDayCard = el(`
    <section class="card">
      <h3>Entries per day</h3>
      <p class="stat-line"><strong>${s.avgPerActiveDay}</strong> entries on an average active day.</p>
      <p class="stat-line"><strong>${s.multiEntryDays}</strong> day${s.multiEntryDays === 1 ? '' : 's'} with more than one entry.</p>
      <p class="stat-line">Most in a single day: <strong>${s.maxPerDay}</strong>${s.busiestDay ? ` on ${esc(shortDate(parseDayKey(s.busiestDay)))}` : ''}.</p>
    </section>`);
  if (s.busiestDay && s.maxPerDay > 1) {
    const busiestEntries = entries.filter((e) => e.day === s.busiestDay);
    perDayCard.appendChild(el(`<a class="btn-ghost sm daylink" href="#/day/${s.busiestDay}">Open that day (${busiestEntries.length}) ›</a>`));
  }
  main.appendChild(perDayCard);

  // --- Interesting stat 2: favourite day + avg memory length ---
  main.appendChild(el(`
    <section class="card">
      <h3>Rhythm</h3>
      <p class="stat-line">You journal most on <strong>${esc(s.favDow)}s</strong>.</p>
      <p class="stat-line">Average memory runs <strong>${s.avgMemory}</strong> words.</p>
      <p class="stat-line">You've captured something on <strong>${s.uniqueDays}</strong> distinct days.</p>
    </section>`));

  // --- Interesting stat 3: longest headline / recent momentum could go here.
  const last30 = entries.filter((e) => (Date.now() - new Date(e.createdAt)) < 30 * 86400000);
  const momentum = el(`
    <section class="card">
      <h3>Last 30 days</h3>
      <p class="stat-line"><strong>${last30.length}</strong> entries · <strong>${new Set(last30.map((e) => e.day)).size}</strong> active days</p>
    </section>`);
  momentum.appendChild(diveList(last30, 'Recent entries'));
  main.appendChild(momentum);

  root.appendChild(main);
  return root;
}
