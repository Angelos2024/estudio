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
      lxxCache: new Map(), // normalizedLemma -> [{ ref, word, lemma, morph }]
    tipEl: null,
    tipDrag: null,
    tipRequestId: 0,
    tipStopDrag: null,
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
           max-height: calc(100vh - 24px);
          overflow: auto;
          background: rgba(0,0,0,.96);
          border: 1px solid rgba(255,255,255,.12);
          border-radius: 12px;
          box-shadow: 0 18px 45px rgba(0,0,0,.45);
          padding: 10px 12px;
          color: #e5e7eb;
          font: 13px/1.35 system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
          display: none;
        }
        .gr-lex-tip{ cursor: default; }
        .gr-lex-tip .t1{ font-size: 14px; font-weight: 700; margin-bottom: 4px; }
        .gr-lex-tip .head{
          display:flex;
          align-items:center;
          justify-content:space-between;
          gap:8px;
          margin-bottom:4px;
          cursor:move;
          user-select:none;
          -webkit-user-select:none;
          touch-action:none;
        }
        .gr-lex-tip .head .t1{ margin-bottom:0; }
        .gr-lex-tip .close{ border:0; background:transparent; color:#cbd6ff; font-size:16px; line-height:1; cursor:pointer; padding:0 2px; }
        .gr-lex-tip .t2{ font-size: 12px; opacity: .9; }
        .gr-lex-tip .t3{ margin-top: 6px; font-size: 12px; opacity: .95; }
        .gr-lex-tip .muted{ opacity: .7; }
       .gr-lex-tip #gr-lex-content,
        .gr-lex-tip #gr-lex-content *{
          cursor:text;
          user-select:text;
          -webkit-user-select:text;
          touch-action: pan-y;
        }
       `;
      document.head.appendChild(st);
    }

    const el = document.createElement('div');
    el.className = 'gr-lex-tip';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-hidden', 'true');
     el.innerHTML = '<div class="head"><div class="t1" id="gr-lex-word"></div><button type="button" class="close" aria-label="Cerrar">×</button></div><div id="gr-lex-content"></div>';     
    // Cierra al click afuera
    document.addEventListener('pointerdown', (ev) => {
       if (!el || el.style.display === 'none') return;
      if (ev.target === el || el.contains(ev.target)) return;
      hideTip();
    }, true);

    // ESC cierra
    document.addEventListener('keydown', (ev) => {
      if (ev.key === 'Escape') hideTip();
    });
      const onPointerMove = (ev) => {
      const drag = state.tipDrag;
      if (!drag) return;
         if (ev.pointerId !== drag.pointerId) return;
      if ((ev.buttons & 1) !== 1) {
        stopDrag();
        return;
      }
      const box = state.tipEl;
      if (!box) return;
      const pad = 10;
      const maxX = Math.max(pad, window.innerWidth - box.offsetWidth - pad);
      const maxY = Math.max(pad, window.innerHeight - box.offsetHeight - pad);
      const nx = Math.max(pad, Math.min(ev.clientX - drag.offsetX, maxX));
      const ny = Math.max(pad, Math.min(ev.clientY - drag.offsetY, maxY));
      box.style.left = `${Math.round(nx)}px`;
      box.style.top = `${Math.round(ny)}px`;
    };
    const stopDrag = () => {
      state.tipDrag = null;
      document.removeEventListener('pointermove', onPointerMove, true);
      document.removeEventListener('pointerup', stopDrag, true);
      document.removeEventListener('pointercancel', stopDrag, true);
    };
    state.tipStopDrag = stopDrag;
    const beginDrag = (ev) => {
      if (ev.button !== 0) return;
      if (ev.target?.closest?.('.close')) return;
             stopDrag();
      const r = el.getBoundingClientRect();
             state.tipDrag = {
        offsetX: ev.clientX - r.left,
        offsetY: ev.clientY - r.top,
        pointerId: ev.pointerId,
      };
      document.addEventListener('pointermove', onPointerMove, true);
      document.addEventListener('pointerup', stopDrag, true);
      document.addEventListener('pointercancel', stopDrag, true);
      ev.preventDefault();
      };

   
     const header = el.querySelector('.head');
     header?.addEventListener('pointerdown', beginDrag);
    el.querySelector('.close')?.addEventListener('click', hideTip, false);
    document.body.appendChild(el);
    state.tipEl = el;
    return el;
  }

  function showTip(title, bodyHtml, x, y) {
    const el = ensureTip();
   const titleEl = el.querySelector('#gr-lex-word');
    const bodyEl = el.querySelector('#gr-lex-content');
    if (titleEl) titleEl.textContent = title || '—';
    if (bodyEl) bodyEl.innerHTML = bodyHtml;

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
  }

  function hideTip() {
   state.tipStopDrag?.();
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
 function normalizeGreekLemmaKey(s) {
    return normalizeGreekToken(s)
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
  }

  const LXX_FILES = [
    'lxx_rahlfs_1935_1Chr.json',
    'lxx_rahlfs_1935_1Esdr.json',
    'lxx_rahlfs_1935_1Kgs.json',
    'lxx_rahlfs_1935_1Macc.json',
    'lxx_rahlfs_1935_1Sam.json',
    'lxx_rahlfs_1935_2Chr.json',
    'lxx_rahlfs_1935_2Esdr.json',
    'lxx_rahlfs_1935_2Kgs.json',
    'lxx_rahlfs_1935_2Macc.json',
    'lxx_rahlfs_1935_2Sam.json',
    'lxx_rahlfs_1935_3Macc.json',
    'lxx_rahlfs_1935_4Macc.json',
    'lxx_rahlfs_1935_Amos.json',
    'lxx_rahlfs_1935_Bar.json',
    'lxx_rahlfs_1935_BelOG.json',
    'lxx_rahlfs_1935_BelTh.json',
    'lxx_rahlfs_1935_DanOG.json',
    'lxx_rahlfs_1935_DanTh.json',
    'lxx_rahlfs_1935_Deut.json',
    'lxx_rahlfs_1935_Eccl.json',
    'lxx_rahlfs_1935_EpJer.json',
    'lxx_rahlfs_1935_Esth.json',
    'lxx_rahlfs_1935_Exod.json',
    'lxx_rahlfs_1935_Ezek.json',
    'lxx_rahlfs_1935_Gen.json',
    'lxx_rahlfs_1935_Hab.json',
    'lxx_rahlfs_1935_Hag.json',
    'lxx_rahlfs_1935_Hos.json',
    'lxx_rahlfs_1935_Isa.json',
    'lxx_rahlfs_1935_Jdt.json',
    'lxx_rahlfs_1935_Jer.json',
    'lxx_rahlfs_1935_Job.json',
    'lxx_rahlfs_1935_Joel.json',
    'lxx_rahlfs_1935_Jonah.json',
    'lxx_rahlfs_1935_JoshA.json',
    'lxx_rahlfs_1935_JoshB.json',
    'lxx_rahlfs_1935_JudgA.json',
    'lxx_rahlfs_1935_JudgB.json',
    'lxx_rahlfs_1935_Lam.json',
    'lxx_rahlfs_1935_Lev.json',
    'lxx_rahlfs_1935_Mal.json',
    'lxx_rahlfs_1935_Mic.json',
    'lxx_rahlfs_1935_Nah.json',
    'lxx_rahlfs_1935_Num.json',
    'lxx_rahlfs_1935_Obad.json',
    'lxx_rahlfs_1935_Odes.json',
    'lxx_rahlfs_1935_Prov.json',
    'lxx_rahlfs_1935_Ps.json',
    'lxx_rahlfs_1935_PsSol.json',
    'lxx_rahlfs_1935_Ruth.json',
    'lxx_rahlfs_1935_Sir.json',
    'lxx_rahlfs_1935_Song.json',
    'lxx_rahlfs_1935_SusOG.json',
    'lxx_rahlfs_1935_SusTh.json',
    'lxx_rahlfs_1935_TobBA.json',
    'lxx_rahlfs_1935_TobS.json',
    'lxx_rahlfs_1935_Wis.json',
    'lxx_rahlfs_1935_Zech.json',
    'lxx_rahlfs_1935_Zeph.json',
  ];

  async function findLxxSamples(lemma, max = 4) {
    const normalized = normalizeGreekLemmaKey(lemma);
    if (!normalized) return [];
    if (state.lxxCache.has(normalized)) return state.lxxCache.get(normalized);

    const results = [];
    for (const file of LXX_FILES) {
      if (results.length >= max) break;
      try {
        const r = await fetch(`./LXX/${file}`, { cache: 'no-store' });
        if (!r.ok) continue;
        const data = await r.json();
        const text = data?.text || {};
        for (const [book, chapters] of Object.entries(text)) {
          for (const [chapter, verses] of Object.entries(chapters || {})) {
            for (const [verse, tokens] of Object.entries(verses || {})) {
              for (const t of tokens || []) {
                if (!t) continue;
                const lemmaKey = normalizeGreekLemmaKey(t.lemma || '');
                const wordKey = normalizeGreekLemmaKey(t.w || '');
                if (lemmaKey !== normalized && wordKey !== normalized) continue;
                results.push({
                  ref: `${book} ${chapter}:${verse}`,
                  word: String(t.w || ''),
                  lemma: String(t.lemma || ''),
                  morph: String(t.morph || ''),
                });
                if (results.length >= max) break;
              }
              if (results.length >= max) break;
            }
            if (results.length >= max) break;
          }
          if (results.length >= max) break;
        }
      } catch (e) {
        continue;
      }
    }

    state.lxxCache.set(normalized, results);
    return results;
  }

  function renderLxxSection(samples, loading = false) {
    if (loading) {
      return `<div class="t3 muted">LXX: buscando coincidencias...</div>`;
    }
    if (!samples || samples.length === 0) {
      return `<div class="t3 muted">LXX: sin resultados en la carpeta LXX</div>`;
    }
    const items = samples.map((s) => {
      const morph = s.morph ? ` <span class="muted">(${escapeHtml(s.morph)})</span>` : '';
      return `<div class="t3">• <b>${escapeHtml(s.ref)}</b> — ${escapeHtml(s.word || '—')} <span class="muted">|</span> ${escapeHtml(s.lemma || '—')}${morph}</div>`;
    }).join('');
    return `<div class="t3"><b>LXX:</b></div>${items}`;
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
         const requestId = ++state.tipRequestId;
    if (!hit) {
      showTip(
               norm,
        `<div class="t2 muted">Sin entrada (aún) en tu data</div>`,
        ev.clientX, ev.clientY
      );
      return;
    }

    const dict = getDictEntry(hit.lemma);

    const glossHtml = dict?.gloss
      ? `<div class="t3"><b>Def.:</b> ${escapeHtml(String(dict.gloss))}</div>`
      : `<div class="t3 muted">Definición: pendiente (no hay diccionario cargado)</div>`;

    showTip(
       norm,
      `
        <div class="t2"><b>Lema:</b> ${escapeHtml(hit.lemma || '—')} &nbsp; <span class="muted">|</span> &nbsp; <b>Translit.:</b> ${escapeHtml(hit.tr || '—')}</div>
        ${glossHtml}
         ${renderLxxSection([], true)}
      `,
      ev.clientX, ev.clientY
    );
const lxxSamples = await findLxxSamples(hit.lemma || norm, 4);
    if (requestId !== state.tipRequestId) return;
     if (state.tipEl && state.tipEl.style.display !== 'none') {
     const bodyEl = state.tipEl.querySelector('#gr-lex-content');
      if (bodyEl) bodyEl.innerHTML = `
        <div class="t2"><b>Lema:</b> ${escapeHtml(hit.lemma || '—')} &nbsp; <span class="muted">|</span> &nbsp; <b>Translit.:</b> ${escapeHtml(hit.tr || '—')}</div>
        ${glossHtml}
        ${renderLxxSection(lxxSamples, false)}
      `;
    }
  }, false);

  function escapeHtml(s) {
    return String(s ?? '')
      .replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;')
      .replaceAll('"','&quot;').replaceAll("'","&#39;");
  }
})();
