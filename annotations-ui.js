// annotations-ui.js
(() => {
  const menu = document.getElementById('ctxMenu');
  if (!menu) return;

  // Colores del menú (puedes cambiar/añadir)
const COLORS = [
  { key: 'clear',  css: 'transparent', label: '✕', title: 'Quitar subrayado' },
  { key: 'yellow', css: '#fbbf24' },
  { key: 'pink',   css: '#fb7185' },
  { key: 'blue',   css: '#60a5fa' },
  { key: 'green',  css: '#4ade80' },
];


  // Estado
  let lastTarget = null;      // <p class="verse-line"...>
  let lastSelection = '';
  let lastRange = null;       // Range clonado antes de abrir el menú

  // Helpers
  function getVerseNodeFromEvent(e) {
    return e.target.closest?.('.verse-line') || null;
  }

  function getVerseTextNode(verseNode) {
    return verseNode?.querySelector?.('.verse-text') || null;
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
    const pos = clampMenu(x, y);
    menu.style.left = pos.x + 'px';
    menu.style.top  = pos.y + 'px';
  }

  function buildMenuUI() {
    menu.innerHTML = '';

    // Dots de colores (subrayado)
    for (const c of COLORS) {
     const dot = document.createElement('button');
dot.type = 'button';
dot.className = 'ctx-dot';

if (c.key === 'clear') {
  dot.textContent = c.label || '✕';
  dot.title = c.title || 'Quitar subrayado';
  dot.style.background = '#fff';
  dot.style.border = '1px solid #e6e8eb';
  dot.style.display = 'flex';
  dot.style.alignItems = 'center';
  dot.style.justifyContent = 'center';
  dot.style.fontWeight = '800';
  dot.style.fontSize = '14px';
} else {
  dot.style.background = c.css;
  dot.title = `Subrayar (${c.key})`;
}

dot.addEventListener('mousedown', (ev) => ev.preventDefault());

dot.addEventListener('click', () => {
  if (!lastTarget) return;
  const ref = getRefFromNode(lastTarget);

  if (c.key === 'clear') {
    clearHighlightAtSelection();
  } else {
    highlightSelection(ref, c.key);
  }

  hideMenu();
});

menu.appendChild(dot);
}

    // Separador
    const sep = document.createElement('div');
    sep.className = 'ctx-sep';
    menu.appendChild(sep);

    // Botón de nota (lápiz)
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

    noteBtn.addEventListener('mousedown', (ev) => ev.preventDefault());
    noteBtn.addEventListener('click', () => {
      if (!lastTarget) return;
      const ref = getRefFromNode(lastTarget);
      openNote(ref, lastSelection);
      hideMenu();
    });

    menu.appendChild(noteBtn);
  }

  // ✅ Subrayado SOLO de lo seleccionado (no todo el verso)
  function highlightSelection(ref, colorKey) {
    if (!lastTarget) return;

    // Solo subraya si hubo selección al abrir el menú
    if (!lastRange || !lastSelection) return;

    // Solo permite subrayar dentro del span.verse-text (para no incluir el numerito)
    const verseTextEl = getVerseTextNode(lastTarget);
    if (!verseTextEl) return;
    if (!verseTextEl.contains(lastRange.commonAncestorContainer)) return;

    const colors = {
      yellow: '#fbbf24',
      pink:   '#fb7185',
      blue:   '#60a5fa',
      green:  '#4ade80'
    };

    const span = document.createElement('span');
    span.className = 'hl';
    span.style.backgroundColor = colors[colorKey] || colors.yellow;
    span.style.padding = '0 2px';
    span.style.borderRadius = '4px';

    // (Opcional para futuro DB)
    span.dataset.hlColor = colorKey;
    span.dataset.book = ref.book;
    span.dataset.ch = String(ref.ch);
    span.dataset.v = String(ref.v);

    try {
      // Caso ideal (selección en un solo nodo de texto)
      lastRange.surroundContents(span);
    } catch {
      // Fallback robusto
      const frag = lastRange.extractContents();
      span.appendChild(frag);
      lastRange.insertNode(span);
    } finally {
      const sel = window.getSelection();
      if (sel) sel.removeAllRanges();
      lastRange = null;
      lastSelection = '';
    }
  }
function clearHighlightAtSelection() {
  // Si hay selección, intenta encontrar un .hl que la contenga
  const sel = window.getSelection();
  let node = null;

  if (sel && sel.rangeCount > 0) {
    node = sel.getRangeAt(0).commonAncestorContainer;
  } else if (lastRange) {
    node = lastRange.commonAncestorContainer;
  }

  if (!node) return;

  const el = (node.nodeType === 1 ? node : node.parentElement);
  const hl = el?.closest?.('.hl');
  if (!hl) return;

  // Desenrollar: reemplaza el span por sus hijos (texto plano)
  const parent = hl.parentNode;
  while (hl.firstChild) parent.insertBefore(hl.firstChild, hl);
  parent.removeChild(hl);

  // Limpia selección guardada
  if (sel) sel.removeAllRanges();
  lastRange = null;
  lastSelection = '';
}

  function openNote(ref, selectionText) {
    const txt = prompt(
      `Nota para ${ref.book} ${ref.ch}:${ref.v}` + (selectionText ? `\nSelección: "${selectionText}"` : ''),
      ''
    );
    if (txt == null) return;

    // Aquí luego conectas IndexedDB. Por ahora:
    alert('Nota guardada (pendiente de implementar DB).');
  }

  // Init UI
  buildMenuUI();

  // Guarda selección (texto) en vivo (opcional; el Range real lo clonamos en contextmenu)
  document.addEventListener('selectionchange', () => {
    const sel = window.getSelection();
    lastSelection = (sel && !sel.isCollapsed) ? String(sel).trim() : '';
  });

  // Click derecho SOLO sobre versículos
  document.addEventListener('contextmenu', (e) => {
    const node = getVerseNodeFromEvent(e);
    if (!node) return;

    // Clonar rango ANTES de abrir menú
    const sel = window.getSelection();
    lastRange = null;
    lastSelection = '';

    const verseTextEl = getVerseTextNode(node);

    if (sel && sel.rangeCount > 0 && !sel.isCollapsed && verseTextEl) {
      const r = sel.getRangeAt(0);

      // Solo si la selección está dentro del texto del verso (no el número)
      if (verseTextEl.contains(r.commonAncestorContainer)) {
        lastRange = r.cloneRange();
        lastSelection = String(sel).trim();
      }
    }

    e.preventDefault();
    lastTarget = node;
    showMenu(e.clientX, e.clientY);
  });

  // Cerrar menú al click fuera o scroll/resize
  document.addEventListener('mousedown', (e) => {
    if (menu.style.display !== 'none' && !menu.contains(e.target)) hideMenu();
  });
  document.addEventListener('scroll', hideMenu, true);
  window.addEventListener('resize', hideMenu);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') hideMenu();
  });
})();
