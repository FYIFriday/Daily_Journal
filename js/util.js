// Small shared helpers. No dependencies.

// A local YYYY-MM-DD key (respects the user's timezone, not UTC).
export function dayKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function parseDayKey(key) {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const WEEKDAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const WEEKDAYS_SHORT = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

// "14 Nov" style short label used for links throughout the app.
export function shortDate(input) {
  const d = typeof input === 'string' ? new Date(input) : input;
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

export function longDate(input) {
  const d = typeof input === 'string' ? new Date(input) : input;
  return `${WEEKDAYS[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

export function timeLabel(input) {
  const d = typeof input === 'string' ? new Date(input) : input;
  let h = d.getHours();
  const m = String(d.getMinutes()).padStart(2, '0');
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${m} ${ampm}`;
}

export function monthName(i) { return MONTHS[i]; }
export function weekdayName(i) { return WEEKDAYS[i]; }
export function weekdayShort(i) { return WEEKDAYS_SHORT[i]; }

// Escape text for safe insertion into HTML.
export function esc(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Strip HTML tags to get a plain-text length / preview of a rich body.
export function plainText(html = '') {
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return (tmp.textContent || tmp.innerText || '').trim();
}

export function wordCount(html = '') {
  const t = plainText(html);
  if (!t) return 0;
  return t.split(/\s+/).filter(Boolean).length;
}

export function uid() {
  return 'e_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
}

export function pick(arr) {
  if (!arr || !arr.length) return null;
  return arr[Math.floor(Math.random() * arr.length)];
}

// Sanitize a rich-text fragment to the small allow-list we support.
export function sanitizeRich(html = '') {
  const allowed = new Set(['B','STRONG','I','EM','U','BR','DIV','P','SPAN']);
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  const walk = (node) => {
    [...node.childNodes].forEach((child) => {
      if (child.nodeType === Node.ELEMENT_NODE) {
        if (!allowed.has(child.tagName)) {
          // Replace disallowed element with its text content.
          const text = document.createTextNode(child.textContent);
          node.replaceChild(text, child);
          return;
        }
        // Drop all attributes (style/onclick/etc.) for safety.
        [...child.attributes].forEach((a) => child.removeAttribute(a.name));
        walk(child);
      } else if (child.nodeType === Node.COMMENT_NODE) {
        node.removeChild(child);
      }
    });
  };
  walk(tmp);
  return tmp.innerHTML;
}

export function debounce(fn, ms = 300) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}
