// Loads the personal rules shown on the splash/load screen.
// Source of truth is my_personal_rules.txt at the site root, so you can edit
// rules there without touching code. Falls back to an embedded copy if the
// file can't be fetched (e.g. opened directly from file://).

const FALLBACK = [
  'One saved memory or moment a day = a day spent well. No saved memories = a day lost that still cost its full price in time',
  'Never complain about the same thing twice. When you complain about it a second time, you owe it an action.',
  'Anticipation is free happiness, plan things for the future that you will enjoy',
  'Let people make three mistakes. An error is human. Two is something worth watching. Three is a pattern and a decision that was made. Believe the actions, not the words.',
  'Build quietly. Let the results do the announcing.',
  'Let people be wrong about you.',
  'When you want to talk about yourself in conversation, ask one more question instead.',
  'Criticism is only data when it’s from someone ahead of you on the same road.',
  'Your first thought is not your fault. Judge yourself by your second thought, not the first.',
  'Have a short pen-in-hand sprint session for any problem that makes you worry. What is the problem? What can you do about it? When will I do it?',
  'Once a season, find somewhere quiet to sit and ask yourself, “What do I really want to be doing? What have I drifted into over time?”',
  'Say the true thing kindly today. Carrying it is costing you. Say what happened, say how it landed, say what you need.',
  'Count your Saturdays. No one has ever earned one back.',
];

let cache = null;

export async function loadRules() {
  if (cache) return cache;
  try {
    const res = await fetch('my_personal_rules.txt', { cache: 'no-store' });
    if (res.ok) {
      const text = await res.text();
      const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
      if (lines.length) { cache = lines; return cache; }
    }
  } catch { /* ignore, use fallback */ }
  cache = FALLBACK;
  return cache;
}

export function randomRule(rules) {
  return rules[Math.floor(Math.random() * rules.length)];
}
