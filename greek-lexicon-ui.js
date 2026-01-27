/* greek-lexicon-ui.js
   Tooltip de “diccionario” para griego SIN alterar el DOM del verso,
   para no romper offsets/rangos de highlights/notas.
*/
(() => {
  'use strict';

  // Ajusta la ruta donde pongas el JSON
 const MORPH_PATH = './diccionario/mt-morphgnt.translit.json';


  // Si luego tienes un diccionario por lema:
  // window.GREEK_DICTIONARY = { "λέγω": { gloss: "decir", ... }, ... }
  const getDictEntry = (lemma) => window.GREEK_DICTIONARY?.[lemma] || null;

  const state = {
    ready: false,
    bySurface: new Map(), // normalizedSurface -> { lemma, tr, surface }
    tipEl: null,
    hideTimer: null,
  };

  function ensureTip() {
    if (state.tipEl) return state.tipEl;

    const styleId = 'greek-lexicon-tip-style';
    if (!document.getElementById(styleId)) {
      const st = document.createElement('style');
      st.id = styleId;
      st.textContent = `
        .gr-lex-tip{
          position: fixed;
          z-index: 9999;
          max-width: min(420px, calc(100vw - 24px));
          background: rgba(17,26,46,.98);
          border: 1px solid rgba(255,255,255,.12);
          border-radius: 12px;
          box-shadow: 0 18px 45px rgba(0,0,0,.45);
          padding: 10px 12px;
          color: #e5e7eb;
          font: 13px/1.35 system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
          display:none;
        }
        .gr-lex-tip .t1{ font-size: 14px; font-weight: 700; margin-bottom: 4px; }
        .gr-lex-tip .t2{ font-size: 12px; opacity: .9; }
        .gr-lex-tip .t3{ margin-top: 6px; font-size: 12px; opacity: .95; }
        .gr-lex-tip .muted{ opacity: .7; }
      `;
      document.head.appendChild(st);
    }

    const el = document.createElement('div');
    el.className = 'gr-lex-tip';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-hidden', 'true');

    // Cierra al click afuera
    document.addEventListener('mousedown', (ev) => {
      if (!el || el.style.display === 'none') return;
      if (ev.target === el || el.contains(ev.target)) return;
      hideTip();
    }, true);

    // ESC cierra
    document.addEventListener('keydown', (ev) => {
      if (ev.key === 'Escape') hideTip();
    });

    document.body.appendChild(el);
    state.tipEl = el;
    return el;
  }

  function showTip(html, x, y) {
    const el = ensureTip();
    el.innerHTML = html;

    el.style.display = 'block';
    el.setAttribute('aria-hidden', 'false');

    // posicionamiento con clamp
    const pad = 10;
    // primer posicionamiento para medir
    el.style.left = (x + 12) + 'px';
    el.style.top  = (y + 12) + 'px';

    const r = el.getBoundingClientRect();
    const maxX = window.innerWidth - r.width - pad;
    const maxY = window.innerHeight - r.height - pad;

    const nx = Math.max(pad, Math.min(x + 12, maxX));
    const ny = Math.max(pad, Math.min(y + 12, maxY));

    el.style.left = nx + 'px';
    el.style.top  = ny + 'px';

    clearTimeout(state.hideTimer);
    state.hideTimer = setTimeout(hideTip, 9000);
  }

  function hideTip() {
    const el = state.tipEl;
    if (!el) return;
    el.style.display = 'none';
    el.setAttribute('aria-hidden', 'true');
  }

  function normalizeGreekToken(s) {
    // Quita signos críticos/NA (⸀ ⸂ ⸃), puntuación común, y deja letras+diacríticos
    return (s || '')
      .replace(/[⸀⸂⸃]/g, '')
      .replace(/[··.,;:!?“”"(){}\[\]<>«»]/g, '')
      .replace(/[\u2019\u02BC']/g, '’') // unifica apóstrofos si los hubiera
      .trim();
  }

  async function loadMorphIndexOnce() {
    if (state.ready) return;
    const r = await fetch(MORPH_PATH, { cache: 'no-store' });
    if (!r.ok) throw new Error(`No se pudo cargar ${MORPH_PATH} (HTTP ${r.status})`);
    const data = await r.json();

    // Estructura típica: [chapters] -> [verses] -> [tokens]
    // Cada token: { g, tr, lemma }:contentReference[oaicite:4]{index=4}
    for (const ch of (data || [])) {
      if (!Array.isArray(ch)) continue;
      for (const v of ch) {
        if (!Array.isArray(v)) continue;
        for (const t of v) {
          if (!t || typeof t !== 'object') continue;
          const surface = String(t.g || '');
          const norm = normalizeGreekToken(surface);
          if (!norm) continue;
          if (!state.bySurface.has(norm)) {
            state.bySurface.set(norm, {
              surface,
              lemma: String(t.lemma || ''),
              tr: String(t.tr || ''),
            });
          }
        }
      }
    }

    state.ready = true;
  }

  function caretFromPoint(x, y) {
    // Moderno
    if (document.caretPositionFromPoint) {
      const p = document.caretPositionFromPoint(x, y);
      if (!p) return null;
      return { node: p.offsetNode, offset: p.offset };
    }
    // Legacy (Chromium aún lo soporta)
    if (document.caretRangeFromPoint) {
      const r = document.caretRangeFromPoint(x, y);
      if (!r) return null;
      return { node: r.startContainer, offset: r.startOffset };
    }
    return null;
  }

  function expandWord(text, idx) {
    // Define “caracter de palabra” como letras griegas + marcas combinantes
    // (esto es deliberadamente conservador para no capturar puntuación).
    const isWordChar = (ch) => {
      const code = ch.codePointAt(0);
      // Greek & Coptic + Greek Extended + Combining Diacritics
      return (
        (code >= 0x0370 && code <= 0x03FF) ||
        (code >= 0x1F00 && code <= 0x1FFF) ||
        (code >= 0x0300 && code <= 0x036F)
      );
    };

    let start = idx;
    let end = idx;

    while (start > 0 && isWordChar(text[start - 1])) start--;
    while (end < text.length && isWordChar(text[end])) end++;

    const word = text.slice(start, end);
    return { word, start, end };
  }

  function isGreekPanel(target) {
    const panel = document.getElementById('passageTextOrig');
    if (!panel) return false;
    if (!panel.classList.contains('greek')) return false;
    return panel.contains(target);
  }

  // CLICK IZQUIERDO: abre “diccionario”
  document.addEventListener('click', async (ev) => {
    // Solo click izquierdo
    if (ev.button !== 0) return;

    // Solo en panel griego (original)
    if (!isGreekPanel(ev.target)) return;

    // Si click sobre nota, NO intervenir (tu handler de notas debe ganar):contentReference[oaicite:5]{index=5}
    if (ev.target?.closest?.('.note-mark')) return;

    // Si hay selección activa, respetarla (para subrayado/notas por menú contextual)
    const sel = window.getSelection();
    if (sel && !sel.isCollapsed) return;

    try {
      await loadMorphIndexOnce();
    } catch (e) {
      // Si el JSON no existe, no rompemos nada: solo no mostramos tip
      return;
    }

    const pos = caretFromPoint(ev.clientX, ev.clientY);
    if (!pos || !pos.node) return;

    // Necesitamos un text node
    let node = pos.node;
    let offset = pos.offset;

    if (node.nodeType === Node.ELEMENT_NODE) {
      // intenta caer a un textNode cercano
      const tw = document.createTreeWalker(node, NodeFilter.SHOW_TEXT, null);
      const tn = tw.nextNode();
      if (!tn) return;
      node = tn;
      offset = Math.min(offset, tn.nodeValue.length);
    }
    if (node.nodeType !== Node.TEXT_NODE) return;

    const text = node.nodeValue || '';
    if (!text) return;

    const { word } = expandWord(text, Math.max(0, Math.min(offset, text.length - 1)));
    const norm = normalizeGreekToken(word);
    if (!norm) return;

    const hit = state.bySurface.get(norm);
    if (!hit) {
      showTip(
        `<div class="t1">${escapeHtml(norm)}</div><div class="t2 muted">Sin entrada (aún) en tu data</div>`,
        ev.clientX, ev.clientY
      );
      return;
    }

    const dict = getDictEntry(hit.lemma);

    const glossHtml = dict?.gloss
      ? `<div class="t3"><b>Def.:</b> ${escapeHtml(String(dict.gloss))}</div>`
      : `<div class="t3 muted">Definición: pendiente (no hay diccionario cargado)</div>`;

    showTip(
      `
        <div class="t1">${escapeHtml(norm)}</div>
        <div class="t2"><b>Lema:</b> ${escapeHtml(hit.lemma || '—')} &nbsp; <span class="muted">|</span> &nbsp; <b>Translit.:</b> ${escapeHtml(hit.tr || '—')}</div>
        ${glossHtml}
      `,
      ev.clientX, ev.clientY
    );
  }, false);

  function escapeHtml(s) {
    return String(s ?? '')
      .replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;')
      .replaceAll('"','&quot;').replaceAll("'","&#39;");
  }
})();
