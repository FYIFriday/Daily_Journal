// Derived statistics over the entry list.

import { wordCount, dayKey, parseDayKey, weekdayName } from './util.js';

export function compute(entries) {
  const memories = entries.filter((e) => e.type === 'memory');
  const lessons = entries.filter((e) => e.type === 'lesson');

  const totalWords = entries.reduce((s, e) => s + wordCount(e.body) + wordCount(e.headline), 0);
  const voice = entries.filter((e) => e.inputMethod === 'voice').length;
  const keyboard = entries.length - voice;

  // Streaks are based on days with ANY entry.
  const days = new Set(entries.map((e) => e.day));
  const { current, longest } = streaks(days);

  // Day-of-week distribution.
  const dow = Array(7).fill(0);
  entries.forEach((e) => { dow[parseDayKey(e.day).getDay()]++; });
  const favDowIdx = dow.indexOf(Math.max(...dow));

  // Average memory length (words).
  const avgMemory = memories.length
    ? Math.round(memories.reduce((s, e) => s + wordCount(e.body), 0) / memories.length)
    : 0;

  // Most active month (label like "Nov 2026").
  const monthCounts = new Map();
  entries.forEach((e) => {
    const d = parseDayKey(e.day);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    monthCounts.set(key, (monthCounts.get(key) || 0) + 1);
  });
  let topMonth = null, topMonthCount = 0;
  for (const [k, c] of monthCounts) if (c > topMonthCount) { topMonth = k; topMonthCount = c; }

  return {
    totalEntries: entries.length,
    memoryCount: memories.length,
    lessonCount: lessons.length,
    totalWords,
    voice, keyboard,
    currentStreak: current,
    longestStreak: longest,
    dow,
    favDow: entries.length ? weekdayName(favDowIdx) : '—',
    avgMemory,
    topMonth, topMonthCount,
    uniqueDays: days.size,
  };
}

function streaks(daySet) {
  if (!daySet.size) return { current: 0, longest: 0 };
  const sorted = [...daySet].sort();
  let longest = 1, run = 1;
  for (let i = 1; i < sorted.length; i++) {
    const prev = parseDayKey(sorted[i - 1]);
    const cur = parseDayKey(sorted[i]);
    const diff = Math.round((cur - prev) / 86400000);
    if (diff === 1) { run++; longest = Math.max(longest, run); }
    else if (diff > 1) run = 1;
  }
  // Current streak counts back from today (or yesterday).
  let current = 0;
  const cursor = new Date(); cursor.setHours(0, 0, 0, 0);
  if (!daySet.has(dayKey(cursor))) cursor.setDate(cursor.getDate() - 1);
  while (daySet.has(dayKey(cursor))) { current++; cursor.setDate(cursor.getDate() - 1); }
  return { current, longest };
}
