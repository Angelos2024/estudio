(() => {
  const menu = document.getElementById('ctxMenu');
  if (!menu) return;

  // Colores (ajusta si quieres)
  const COLORS = [
    { key: 'yellow',  css: '#fbbf24' },
    { key: 'pink',    css: '#fb7185' },
    { key: 'blue',    css: '#60a5fa' },
    { key: 'green',   css: '#4ade80' },
  ];

  let lastTarget = null;   // <p class="verse-line"...>
  let lastSelection = '';

  // --- Helpers ---
  function getVerseNodeFromEvent(e) {
    return e.target.closest?.('.verse-line') || null;
  }

  function getRefFromNode(node) {
    return {
      side: node.dataset.side,
      book: node.dataset.book,
      ch: Number(node.dataset.ch),
      v: Number(node.dataset.v)
    };
  }

  function clampMenu(x, y) {
    const pad = 10;
    const rect = menu.getBoundingClientRect();
    const maxX = window.innerWidth - rect.width - pad;
    const maxY = window.innerHeight - rect.height - pad;
    return { x: Math.max(pad, Math.min(x, maxX)), y: Math.max(pad, Math.min(y, maxY)) };
  }

  function hideMenu() {
    menu.style.display = 'none';
    menu.setAttribute('aria-hidden', 'true');
    lastTarget = null;
  }

  function showMenu(x, y) {
    menu.style.display = 'flex';
    menu.setAttribute('aria-hidden', 'false');
    // primero mostrar para medir tamaño, luego clamp
    const pos = clampMenu(x, y);
    menu.style.left = pos.x + 'px';
    menu.style.top  = pos.y + 'px';
  }

  function buildMenuUI() {
    menu.innerHTML = '';

    // dots
    for (const c of COLORS) {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'ctx-dot';
      dot.style.background = c.css;
      dot.title = `Subrayar (${c.key})`;
      dot.addEventListener('click', () => {
        if (!lastTarget) return;
        const ref = getRefFromNode(lastTarget);
        highlightVerse(ref, c.key, lastSelection);
        hideMenu();
      });
      menu.appendChild(dot);
    }

    // separator
    const sep = document.createElement('div');
    sep.className = 'ctx-sep';
    menu.appendChild(sep);

    // note button (icono lápiz)
    const noteBtn = document.createElement('button');
    noteBtn.type = 'button';
    noteBtn.className = 'ctx-btn';
    noteBtn.title = 'Añadir anotación';
    noteBtn.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M4 20h4l10.5-10.5a2 2 0 0 0 0-2.8L16.3 4.5a2 2 0 0 0-2.8 0L3 15v5Z" stroke="currentColor" stroke-width="2" />
        <path d="M13.5 6.5l4 4" stroke="currentColor" stroke-width="2" />
      </svg>
    `;
    noteBtn.addEventListener('click', () => {
      if (!lastTarget) return;
      const ref = getRefFromNode(lastTarget);
      openNote(ref, lastSelection);
      hideMenu();
    });
    menu.appendChild(noteBtn);
  }

  // --- Acciones (por ahora “stubs”; luego se conectan a IndexedDB) ---
  function highlightVerse(ref, colorKey, selectionText) {
    // mínimo: marcar visualmente el versículo completo (fase 1)
    // luego: guardar en IndexedDB
    lastTarget.style.background = 'rgba(251, 191, 36, .20)'; // fallback
    // si quieres diferenciar por color:
    const map = { yellow:'rgba(251,191,36,.20)', pink:'rgba(251,113,133,.20)', blue:'rgba(96,165,250,.20)', green:'rgba(74,222,128,.20)' };
    lastTarget.style.background = map[colorKey] || map.yellow;

    // opcional: guardar en dataset (solo para debug)
    lastTarget.dataset.hl = colorKey;
    // console.log('highlight', ref, colorKey, selectionText);
  }

  function openNote(ref, selectionText) {
    // por ahora: prompt simple. Luego lo cambias por modal bootstrap.
    const txt = prompt(`Nota para ${ref.book} ${ref.ch}:${ref.v}` + (selectionText ? `\nSelección: "${selectionText}"` : ''), '');
    if (txt == null) return;
    // console.log('note', ref, selectionText, txt);
    // aquí luego guardas en IndexedDB.
    alert('Nota guardada (pendiente de implementar DB).');
  }

  // --- Eventos globales ---
  buildMenuUI();

  // Captura selección
  document.addEventListener('selectionchange', () => {
    const sel = window.getSelection();
    lastSelection = (sel && !sel.isCollapsed) ? String(sel).trim() : '';
  });

  // Click derecho: abrir menú SOLO sobre versículos
  document.addEventListener('contextmenu', (e) => {
    const node = getVerseNodeFromEvent(e);
    if (!node) return; // fuera de versículos: deja menú normal del navegador
    e.preventDefault();

    lastTarget = node;

    // si hay selección, lo más normal es mostrar menú cerca del mouse
    showMenu(e.clientX, e.clientY);
  });

  // Ocultar al hacer click fuera o scroll
  document.addEventListener('mousedown', (e) => {
    if (menu.style.display !== 'none' && !menu.contains(e.target)) hideMenu();
  });
  document.addEventListener('scroll', hideMenu, true);
  window.addEventListener('resize', hideMenu);

  // ESC cierra
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') hideMenu();
  });
})();
