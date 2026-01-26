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
let lastRange = null; // copia del rango seleccionado (se conserva al hacer click en el menú)

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

  // ✅ Evita que el click en el menú mate la selección guardada
  dot.addEventListener('mousedown', (ev) => ev.preventDefault());

  dot.addEventListener('click', () => {
    if (!lastTarget) return;
    const ref = getRefFromNode(lastTarget);

    // ✅ SOLO 2 parámetros
    highlightVerse(ref, c.key);

    hideMenu();
  });

  menu.appendChild(dot);
}

function highlightVerse(ref, colorKey) {
  if (!lastTarget) return;

  // ✅ si no hay selección guardada, NO subrayes
  if (!lastRange || !lastSelection) return;

  if (!lastTarget.contains(lastRange.commonAncestorContainer)) return;

  const colors = {
    yellow: '#fbbf24',
    pink:   '#fb7185',
    blue:   '#60a5fa',
    green:  '#4ade80'
  };

  const span = document.createElement('span');
  span.style.backgroundColor = colors[colorKey] || colors.yellow;
  span.style.padding = '0 2px';
  span.style.borderRadius = '4px';

  try {
    lastRange.surroundContents(span);
  } catch (e) {
    // fallback para selecciones que cruzan nodos
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
function highlightVerse(ref, colorKey) {
  if (!lastTarget) return;

  // Si no hay selección guardada, no subrayes todo el verso
  if (!lastRange || !lastSelection) {
    console.warn('No hay selección guardada para subrayar.');
    return;
  }

  // Seguridad: el rango debe seguir dentro del verso
  if (!lastTarget.contains(lastRange.commonAncestorContainer)) return;

  const colors = {
    yellow: '#fbbf24',
    pink:   '#fb7185',
    blue:   '#60a5fa',
    green:  '#4ade80'
  };

  // Envolver solo la selección
  const span = document.createElement('span');
  span.style.backgroundColor = colors[colorKey] || colors.yellow;
  span.style.padding = '0 2px';
  span.style.borderRadius = '4px';

  try {
    lastRange.surroundContents(span);
  } catch (e) {
    // Si la selección cruza nodos complejos, fallback: envolver texto con extract/insert (más tolerante)
    try {
      const frag = lastRange.extractContents();
      span.appendChild(frag);
      lastRange.insertNode(span);
    } catch (e2) {
      console.warn('No se pudo subrayar esta selección:', e2);
    }
  } finally {
    // limpiar selección “visual”
    const sel = window.getSelection();
    if (sel) sel.removeAllRanges();
    lastRange = null;
    lastSelection = '';
  }
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
  if (!node) return;

  // Guardar selección actual (si existe) antes de abrir el menú
  const sel = window.getSelection();
  lastRange = null;
  lastSelection = '';

  if (sel && sel.rangeCount > 0 && !sel.isCollapsed) {
    const r = sel.getRangeAt(0);

    // Validación: debe estar dentro del mismo versículo
    if (node.contains(r.commonAncestorContainer)) {
      lastRange = r.cloneRange();
      lastSelection = String(sel).trim();
    }
  }

  e.preventDefault();
  lastTarget = node;
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
