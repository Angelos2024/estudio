// annotations-ui.js
(() => {
  const menu = document.getElementById('ctxMenu');
  if (!menu) return;

  // Colores del menú
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

  // Helpers DOM
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

  // ==============================
  // ✅ FIX: Estas funciones DEBEN estar fuera de buildMenuUI()
  // ==============================

  function getOffsetInVerseText(verseTextEl, range) {
    // Offset (en caracteres) desde el inicio del verso hasta el inicio del range
    const pre = document.createRange();
    pre.selectNodeContents(verseTextEl);
    pre.setEnd(range.startContainer, range.startOffset);
    return pre.toString().length;
  }

  function wrapOffsetLength(verseTextEl, offset, length, colorKey, annId) {
    // Envuelve exactamente offset/length en el texto del verso (aunque haya varios nodos)
    const colors = {
      yellow: '#fbbf24',
      pink:   '#fb7185',
      blue:   '#60a5fa',
      green:  '#4ade80'
    };

    const walker = document.createTreeWalker(verseTextEl, NodeFilter.SHOW_TEXT, null);
    let node, pos = 0;

    let startNode = null, startOffset = 0;
    let endNode = null, endOffset = 0;

    const endPos = offset + length;

    while ((node = walker.nextNode())) {
      const nLen = node.nodeValue.length;
      const nextPos = pos + nLen;

      if (!startNode && offset >= pos && offset <= nextPos) {
        startNode = node;
        startOffset = offset - pos;
      }

      if (!endNode && endPos >= pos && endPos <= nextPos) {
        endNode = node;
        endOffset = endPos - pos;
        break;
      }

      pos = nextPos;
    }

    if (!startNode || !endNode) return false;

    const r = document.createRange();
    r.setStart(startNode, startOffset);
    r.setEnd(endNode, endOffset);

    const span = document.createElement('span');
    span.className = 'hl';
    span.style.backgroundColor = colors[colorKey] || colors.yellow;
    span.style.padding = '0 2px';
    span.style.borderRadius = '4px';
    span.dataset.hlColor = colorKey;
    span.dataset.annId = String(annId);

    try {
      r.surroundContents(span);
    } catch {
      // fallback cuando surroundContents falla (por estructura del DOM)
      const frag = r.extractContents();
      span.appendChild(frag);
      r.insertNode(span);
    }

    return true;
  }

  async function applyHighlightsToPassage(book, ch, vStart, vEnd) {
    if (!window.AnnotationsDB) return;

    const sides = ['rv', 'orig'];

    for (const side of sides) {
      const rows = await window.AnnotationsDB.getHighlightsForPassage(side, book, ch, vStart, vEnd);

      // Agrupar por verso
      const byV = new Map();
      for (const r of rows) {
        if (!byV.has(r.v)) byV.set(r.v, []);
        byV.get(r.v).push(r);
      }

      for (const [v, list] of byV.entries()) {
        const verseNode = document.querySelector(
          `.verse-line[data-side="${side}"][data-book="${book}"][data-ch="${ch}"][data-v="${v}"]`
        );
        if (!verseNode) continue;

        const verseTextEl = verseNode.querySelector('.verse-text');
        if (!verseTextEl) continue;

        // Limpia spans viejos para evitar duplicados
        verseTextEl.querySelectorAll('span.hl').forEach(hl => {
          const parent = hl.parentNode;
          while (hl.firstChild) parent.insertBefore(hl.firstChild, hl);
          parent.removeChild(hl);
        });

        // Envolver desde el final para no “mover” offsets
        list.sort((a, b) => (b.offset - a.offset));

        for (const h of list) {
          wrapOffsetLength(verseTextEl, h.offset, h.length, h.color, h.id);
        }
      }
    }
  }

  // Exponer para que index.html lo llame al final del render()
  window.AnnotationsUI_applyHighlightsToPassage = applyHighlightsToPassage;

  // ==============================
  // UI del menú contextual
  // ==============================

  function buildMenuUI() {
    menu.innerHTML = '';

    // Dots de colores (subrayado)
    for (const c of COLORS) {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'ctx-dot';

      if (c.key === 'clear') {
        dot.textContent = '✕';
        dot.title = 'Quitar subrayado';
        dot.style.background = '#ffffff';
        dot.style.border = '2px solid #111827';
        dot.style.color = '#111827';
        dot.style.display = 'flex';
        dot.style.alignItems = 'center';
        dot.style.justifyContent = 'center';
        dot.style.fontWeight = '900';
        dot.style.fontSize = '16px';
        dot.style.lineHeight = '1';
      } else {
        dot.style.background = c.css;
        dot.title = `Subrayar (${c.key})`;
      }

      dot.addEventListener('mousedown', (ev) => ev.preventDefault());

      dot.addEventListener('click', async () => {
        if (!lastTarget) return;

        if (!window.AnnotationsDB) {
          console.warn('AnnotationsDB no está disponible. ¿Cargaste annotations-db.js antes?');
          hideMenu();
          return;
        }

        if (c.key === 'clear') {
          await clearHighlightAtSelection();
        } else {
          const ref = getRefFromNode(lastTarget);
          await highlightSelection(ref, c.key);
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
  async function highlightSelection(ref, colorKey) {
    if (!lastTarget || !lastRange || !lastSelection) return;

    const verseTextEl = lastTarget.querySelector('.verse-text');
    if (!verseTextEl) return;
    if (!verseTextEl.contains(lastRange.commonAncestorContainer)) return;

    const offset = getOffsetInVerseText(verseTextEl, lastRange);
    const length = lastRange.toString().length;

    const payload = {
      side: ref.side,       // "rv" o "orig"
      book: ref.book,
      ch: ref.ch,
      v: ref.v,
      offset,
      length,
      quote: lastSelection, // útil para debug/export
      color: colorKey,
      created_at: Date.now()
    };

    const id = await window.AnnotationsDB.addHighlight(payload);

    // Aplicar visual
    wrapOffsetLength(verseTextEl, offset, length, colorKey, id);

    // limpiar selección
    const sel = window.getSelection();
    if (sel) sel.removeAllRanges();
    lastRange = null;
    lastSelection = '';
  }

  async function clearHighlightAtSelection() {
    let node = null;

    if (lastRange) node = lastRange.commonAncestorContainer;
    else {
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0) node = sel.getRangeAt(0).commonAncestorContainer;
    }

    if (!node) return;

    const el = (node.nodeType === 1 ? node : node.parentElement);
    const hl = el?.closest?.('span.hl');
    if (!hl) return;

    const annId = Number(hl.dataset.annId || 0);
    if (annId && window.AnnotationsDB) {
      await window.AnnotationsDB.deleteHighlight(annId);
    }

    const parent = hl.parentNode;
    while (hl.firstChild) parent.insertBefore(hl.firstChild, hl);
    parent.removeChild(hl);

    const sel = window.getSelection();
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

  // Guarda selección (texto) en vivo
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
