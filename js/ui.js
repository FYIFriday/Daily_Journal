// Shared UI pieces: icons, the top bar, and the slide-in menu drawer.

export const icons = {
  mic: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/></svg>`,
  abc: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 16V9l2.5-3L8 9v7"/><path d="M3 13h5"/><path d="M12 6v10h2.3a2.3 2.3 0 0 0 0-4.6H12"/><path d="M12 11.4h2.1a2.1 2.1 0 0 0 0-4.2H12"/><path d="M21.5 8.2A2.4 2.4 0 0 0 19.4 7a2.7 2.7 0 0 0 0 5.4 2.4 2.4 0 0 0 2.1-1.2"/></svg>`,
  menu: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>`,
  back: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>`,
  pencil: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>`,
  close: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
  home: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11.5 12 4l9 7.5"/><path d="M5 10v10h14V10"/></svg>`,
  settings: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z"/></svg>`,
  stats: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="20" x2="4" y2="12"/><line x1="10" y1="20" x2="10" y2="4"/><line x1="16" y1="20" x2="16" y2="9"/><line x1="22" y1="20" x2="22" y2="15"/></svg>`,
  book: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5a2 2 0 0 1 2-2h11v18H6a2 2 0 0 1-2-2Z"/><path d="M17 3h1a2 2 0 0 1 2 2v14a2 2 0 0 0-2-2h-1"/></svg>`,
  bulb: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18h6"/><path d="M10 22h4"/><path d="M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.2 1 2V17h6v-.3c0-.8.4-1.5 1-2A7 7 0 0 0 12 2Z"/></svg>`,
  dice: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8" cy="8" r="1" fill="currentColor"/><circle cx="16" cy="16" r="1" fill="currentColor"/><circle cx="16" cy="8" r="1" fill="currentColor"/><circle cx="8" cy="16" r="1" fill="currentColor"/><circle cx="12" cy="12" r="1" fill="currentColor"/></svg>`,
  bold: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 4h7a4 4 0 0 1 0 8H6z"/><path d="M6 12h8a4 4 0 0 1 0 8H6z"/></svg>`,
  italic: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="19" y1="4" x2="10" y2="4"/><line x1="14" y1="20" x2="5" y2="20"/><line x1="15" y1="4" x2="9" y2="20"/></svg>`,
  underline: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 4v6a6 6 0 0 0 12 0V4"/><line x1="4" y1="21" x2="20" y2="21"/></svg>`,
};

export function go(hash) { window.location.hash = hash; }

// Builds a top bar. opts: { title, back (hash|true), showMenu (default true),
// pencilHref, rightHtml }
export function topBar({ title = '', back = null, showMenu = true, rightHtml = '' } = {}) {
  const bar = document.createElement('header');
  bar.className = 'topbar';
  const left = back
    ? `<button class="iconbtn" data-nav="${back === true ? 'history' : back}" aria-label="Back">${icons.back}</button>`
    : (showMenu ? `<button class="iconbtn" data-menu aria-label="Menu">${icons.menu}</button>` : `<span class="iconbtn-spacer"></span>`);
  bar.innerHTML = `
    ${left}
    <h1 class="topbar-title">${title}</h1>
    <div class="topbar-right">${rightHtml || (back && showMenu ? `<button class="iconbtn" data-menu aria-label="Menu">${icons.menu}</button>` : '<span class="iconbtn-spacer"></span>')}</div>`;
  bar.addEventListener('click', (e) => {
    const nav = e.target.closest('[data-nav]');
    if (nav) {
      const t = nav.dataset.nav;
      if (t === 'history') history.back(); else go(t);
    }
    if (e.target.closest('[data-menu]')) openMenu();
  });
  return bar;
}

// Slide-in drawer menu. fromEntry toggles the "return to homepage" option.
let drawerEl = null;
export function openMenu(fromEntry = false) {
  if (drawerEl) return;
  drawerEl = document.createElement('div');
  drawerEl.className = 'drawer-overlay';
  const items = [
    { label: 'Home', icon: icons.home, href: '#/home' },
    { label: 'Past memories', icon: icons.book, href: '#/memories' },
    { label: 'Random memory', icon: icons.dice, href: '#/random/memory' },
    { label: 'Past lessons', icon: icons.bulb, href: '#/lessons' },
    { label: 'Random lesson', icon: icons.dice, href: '#/random/lesson' },
    { label: 'Stats', icon: icons.stats, href: '#/stats' },
    { label: 'Settings', icon: icons.settings, href: '#/settings' },
  ];
  drawerEl.innerHTML = `
    <div class="drawer" role="menu">
      <div class="drawer-head">
        <span class="brand">Daily Journal</span>
        <button class="iconbtn" data-close aria-label="Close menu">${icons.close}</button>
      </div>
      <nav class="drawer-nav">
        ${items.map((i) => `<a class="drawer-item" href="${i.href}" role="menuitem"><span class="di-icon">${i.icon}</span>${i.label}</a>`).join('')}
      </nav>
    </div>`;
  const close = () => { drawerEl?.remove(); drawerEl = null; };
  drawerEl.addEventListener('click', (e) => {
    if (e.target === drawerEl || e.target.closest('[data-close]')) return close();
    if (e.target.closest('.drawer-item')) setTimeout(close, 0);
  });
  document.body.appendChild(drawerEl);
  requestAnimationFrame(() => drawerEl.classList.add('open'));
}

export function el(html) {
  const t = document.createElement('template');
  t.innerHTML = html.trim();
  return t.content.firstElementChild;
}
