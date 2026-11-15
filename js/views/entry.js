// Read view for a single entry: context label, body, notes, add-note, edit.

import { store } from '../store.js';
import { icons, topBar, go, el } from '../ui.js';
import { longDate, timeLabel, sanitizeRich, esc } from '../util.js';
import { weatherEmoji } from '../weather.js';

export async function render(params) {
  const entry = await store.get(params.id);
  const root = el('<div class="view entry-view"></div>');
  if (!entry) {
    root.appendChild(topBar({ title: 'Not found', back: '#/home', showMenu: false }));
    root.appendChild(el('<main class="container"><p class="empty-hint">That entry no longer exists.</p></main>'));
    return root;
  }

  const kind = entry.type === 'lesson' ? 'lesson' : 'memory';
  root.appendChild(topBar({
    title: kind === 'lesson' ? 'Lesson' : 'Memory',
    back: 'history',
    showMenu: false,
    rightHtml: `<button class="iconbtn" data-edit aria-label="Edit entry">${icons.pencil}</button>`,
  }));
  root.querySelector('[data-edit]').addEventListener('click', () => go(`#/edit/${entry.id}`));

  const env = [];
  if (entry.location?.label) env.push(`📍 ${esc(entry.location.label)}`);
  if (entry.weather) env.push(`${weatherEmoji(entry.weather.code)} ${entry.weather.tempC}°C`);

  const main = el(`
    <main class="container entry-read">
      <div class="er-kind"><span class="dot dot-${kind}"></span>${kind === 'lesson' ? 'Lesson' : 'Memory'} · ${esc(entry.inputMethod === 'voice' ? 'spoken' : 'typed')}</div>
      <h2 class="er-headline">${esc(entry.headline || 'Untitled')}</h2>
      <div class="er-meta">${esc(longDate(entry.createdAt))} · ${esc(timeLabel(entry.createdAt))}${env.length ? ' · ' + env.join(' · ') : ''}</div>
      ${entry.image ? `<img class="er-image" src="${entry.image}" alt="Entry photo"/>` : ''}
      <article class="er-body">${sanitizeRich(entry.body) || '<em class="muted">No body.</em>'}</article>
    </main>`);

  // --- Notes (always timestamped) ---
  const notesWrap = el('<section class="notes"></section>');
  const notesList = el('<div class="notes-list"></div>');
  renderNotes(notesList, entry);
  notesWrap.appendChild(el(`<h3 class="notes-title">Notes ${entry.notes.length ? `<span class="count">${entry.notes.length}</span>` : ''}</h3>`));
  notesWrap.appendChild(notesList);

  const addRow = el(`
    <div class="note-add">
      <textarea class="note-input" rows="2" placeholder="Add a note to this ${kind}… (auto date-stamped)"></textarea>
      <button class="btn-primary sm" data-addnote>Add note</button>
    </div>`);
  const ta = addRow.querySelector('.note-input');
  addRow.querySelector('[data-addnote]').addEventListener('click', async () => {
    const text = ta.value.trim();
    if (!text) return;
    const updated = await store.addNote(entry.id, text);
    entry.notes = updated.notes;
    ta.value = '';
    renderNotes(notesList, entry);
    notesWrap.querySelector('.notes-title').innerHTML = `Notes <span class="count">${entry.notes.length}</span>`;
  });
  notesWrap.appendChild(addRow);
  main.appendChild(notesWrap);

  root.appendChild(main);
  return root;
}

function renderNotes(listEl, entry) {
  listEl.innerHTML = '';
  if (!entry.notes.length) {
    listEl.appendChild(el('<p class="muted sm">No notes yet.</p>'));
    return;
  }
  entry.notes
    .slice()
    .sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1))
    .forEach((n) => {
      const note = el(`
        <div class="note">
          <div class="note-stamp">${esc(longDate(n.createdAt))} · ${esc(timeLabel(n.createdAt))}
            <button class="iconbtn tiny" data-editnote aria-label="Edit note">${icons.pencil}</button>
          </div>
          <div class="note-text">${esc(n.text).replace(/\n/g, '<br>')}</div>
        </div>`);
      // Inline edit: swaps the text for a textarea; edits are NOT re-stamped.
      note.querySelector('[data-editnote]').addEventListener('click', () => {
        const textDiv = note.querySelector('.note-text');
        if (note.querySelector('.note-edit')) return;
        const ta = el(`<textarea class="note-input note-edit" rows="2"></textarea>`);
        ta.value = n.text;
        const actions = el(`<div class="note-edit-actions"><button class="btn-primary sm" data-save>Save</button><button class="btn-ghost sm" data-cancel>Cancel</button></div>`);
        textDiv.replaceWith(ta);
        ta.after(actions);
        ta.focus();
        actions.querySelector('[data-cancel]').addEventListener('click', () => renderNotes(listEl, entry));
        actions.querySelector('[data-save]').addEventListener('click', async () => {
          n.text = ta.value.trim();
          const notes = entry.notes.map((x) => (x.id === n.id ? { ...x, text: n.text } : x));
          const updated = await store.update(entry.id, { notes });
          entry.notes = updated.notes;
          renderNotes(listEl, entry);
        });
      });
      listEl.appendChild(note);
    });
}
