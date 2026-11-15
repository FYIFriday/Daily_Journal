// New-entry form, also reused for editing an existing entry.

import { store } from '../store.js';
import { icons, topBar, go, el } from '../ui.js';
import { longDate, timeLabel, sanitizeRich, esc } from '../util.js';
import { fetchContext, weatherEmoji } from '../weather.js';
import { speechSupported, isIOS, startDictation } from '../speech.js';

export async function render(params) {
  const editing = !!params.id;
  const existing = editing ? await store.get(params.id) : null;
  if (editing && !existing) { go('#/home'); return el('<div></div>'); }

  // State for a new entry.
  let type = existing?.type || (params.type === 'lesson' ? 'lesson' : 'memory');
  let inputMethod = existing?.inputMethod || (params.input === 'voice' ? 'voice' : 'keyboard');
  let location = existing?.location || null;
  let weather = existing?.weather || null;
  const createdAt = existing?.createdAt || new Date().toISOString();

  const root = el('<div class="view editor"></div>');
  root.appendChild(topBar({
    title: editing ? 'Edit entry' : 'New entry',
    back: editing ? `#/entry/${existing.id}` : '#/home',
    showMenu: false,
    rightHtml: `<button class="btn-primary sm" data-save>Save</button>`,
  }));

  const main = el('<main class="container editor-body"></main>');

  // --- Type toggle (discrete) ---
  const toggle = el(`
    <div class="type-toggle" role="tablist" aria-label="Entry type">
      <button role="tab" data-type="memory" class="${type === 'memory' ? 'on' : ''}">Memory</button>
      <button role="tab" data-type="lesson" class="${type === 'lesson' ? 'on' : ''}">Lesson</button>
    </div>`);
  toggle.addEventListener('click', (e) => {
    const b = e.target.closest('[data-type]');
    if (!b) return;
    type = b.dataset.type;
    toggle.querySelectorAll('button').forEach((x) => x.classList.toggle('on', x.dataset.type === type));
    root.dataset.type = type;
  });
  root.dataset.type = type;
  main.appendChild(toggle);

  // --- Auto meta label: date · time · location · weather ---
  const meta = el(`
    <div class="entry-meta" aria-label="Entry context">
      <span class="meta-date">${esc(longDate(createdAt))} · ${esc(timeLabel(createdAt))}</span>
      <span class="meta-env" data-env>${renderEnv(location, weather)}</span>
    </div>`);
  main.appendChild(meta);

  // --- Headline ---
  const headline = el(`<input class="headline-input" type="text" maxlength="120"
    placeholder="${type === 'lesson' ? 'The lesson, in a line…' : 'Headline — the memory in a few words…'}"
    value="${esc(existing?.headline || '')}" />`);
  main.appendChild(headline);

  // --- Formatting toolbar ---
  const toolbar = el(`
    <div class="format-bar" role="toolbar" aria-label="Formatting">
      <button data-cmd="bold" aria-label="Bold">${icons.bold}</button>
      <button data-cmd="italic" aria-label="Italic">${icons.italic}</button>
      <button data-cmd="underline" aria-label="Underline">${icons.underline}</button>
      <span class="fb-hint">Emoji: use your keyboard 🙂</span>
    </div>`);
  main.appendChild(toolbar);

  // --- Body (rich text) ---
  const body = el(`<div class="body-input" contenteditable="true" role="textbox" aria-multiline="true"
    data-placeholder="Write the ${type}…">${existing ? sanitizeRich(existing.body) : ''}</div>`);
  main.appendChild(body);

  toolbar.addEventListener('mousedown', (e) => e.preventDefault()); // keep selection
  toolbar.addEventListener('click', (e) => {
    const b = e.target.closest('[data-cmd]');
    if (!b) return;
    body.focus();
    document.execCommand(b.dataset.cmd, false);
  });

  // --- Voice control ---
  const voiceRow = el(`<div class="voice-row"></div>`);
  main.appendChild(voiceRow);
  setupVoice(voiceRow, body, inputMethod, (m) => { inputMethod = m; });

  root.appendChild(main);

  // --- Save handler ---
  root.querySelector('[data-save]').addEventListener('click', async () => {
    const payload = {
      type,
      headline: headline.value.trim(),
      body: sanitizeRich(body.innerHTML),
      inputMethod,
      location,
      weather,
    };
    if (!payload.headline && !payload.body.trim()) {
      headline.focus();
      headline.classList.add('shake');
      setTimeout(() => headline.classList.remove('shake'), 500);
      return;
    }
    try {
      if (editing) {
        await store.update(existing.id, payload);
        go(`#/entry/${existing.id}`);
      } else {
        const saved = await store.add({ ...payload, createdAt });
        go(`#/entry/${saved.id}`);
      }
    } catch (err) {
      alert('Could not save: ' + err.message);
    }
  });

  // --- Fetch weather/location for NEW entries (best-effort, subtle) ---
  if (!editing) {
    const envEl = meta.querySelector('[data-env]');
    envEl.innerHTML = `<span class="env-loading">locating…</span>`;
    fetchContext().then((ctx) => {
      if (ctx) {
        location = ctx.location;
        weather = ctx.weather;
      }
      envEl.innerHTML = renderEnv(location, weather);
    }).catch(() => { envEl.innerHTML = ''; });
  }

  // Autofocus for a smooth start.
  setTimeout(() => {
    if (inputMethod === 'keyboard' && !editing) headline.focus();
  }, 60);

  return root;
}

function renderEnv(location, weather) {
  const parts = [];
  if (location?.label) parts.push(`<span class="env-loc">📍 ${esc(location.label)}</span>`);
  if (weather) parts.push(`<span class="env-wx">${weatherEmoji(weather.code)} ${weather.tempC}°C</span>`);
  return parts.join('');
}

function setupVoice(row, body, initialMethod, setMethod) {
  if (isIOS() || !speechSupported()) {
    // iOS / unsupported: native keyboard dictation is the path.
    row.innerHTML = `
      <button class="voice-btn" data-ios-mic>${icons.mic}<span>Dictate</span></button>
      <p class="voice-hint">On iPhone, tap here then press the <strong>🎤 on your keyboard</strong> to speak your entry.</p>`;
    row.querySelector('[data-ios-mic]').addEventListener('click', () => {
      setMethod('voice');
      placeCaretAtEnd(body);
      body.focus();
    });
    return;
  }

  // Supported: live transcription into the body.
  row.innerHTML = `<button class="voice-btn" data-mic>${icons.mic}<span>Start dictation</span></button>
    <span class="voice-interim" data-interim></span>`;
  const btn = row.querySelector('[data-mic]');
  const interimEl = row.querySelector('[data-interim]');
  let stop = null;

  btn.addEventListener('click', () => {
    if (stop) { stop(); return; }
    setMethod('voice');
    btn.classList.add('recording');
    btn.querySelector('span').textContent = 'Stop';
    stop = startDictation({
      onText: (t) => {
        placeCaretAtEnd(body);
        document.execCommand('insertText', false, (body.textContent && !/\s$/.test(body.textContent) ? ' ' : '') + t.trim() + ' ');
        interimEl.textContent = '';
      },
      onInterim: (t) => { interimEl.textContent = t; },
      onEnd: () => reset(),
      onError: () => { reset(); },
    });
  });

  function reset() {
    stop = null;
    btn.classList.remove('recording');
    btn.querySelector('span').textContent = 'Start dictation';
    interimEl.textContent = '';
  }
}

function placeCaretAtEnd(elm) {
  elm.focus();
  const range = document.createRange();
  range.selectNodeContents(elm);
  range.collapse(false);
  const sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(range);
}
