/* diccionario/greek-lexicon.js
   - Hace cada palabra griega clickeable (click IZQUIERDO).
   - No interfiere con click DERECHO (subrayar / comentar).
   - Se auto-reaplica si el DOM cambia (MutationObserver), para convivir con subrayados/notas.
*/
(function () {
  const MORPH_URL = './diccionario/mt-morphgnt.translit.json';

  let morph = null;
  let loaded = false;
  let observing = false;
  let decorating = false;

  function esc(s) {
    return String(s ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  }

  async function loadMorphOnce() {
    if (loaded) return morph;
    const res = await fetch(MORPH_URL, { cache: 'no-store' });
    if (!res.ok) throw new Error(`No pude cargar ${MORPH_URL} (${res.status})`);
    morph = await res.json();
    loaded = true;
    return morph;
  }

  function isMatthewSlug(slug) {
    const s = String(slug || '').toLowerCase().trim();
    // Ajusta aquí si tu slug real es otro
    return s === 'mt' || s.startsWith('mt') || s.includes('mateo') || s.includes('matt');
  }

  // Estructura esperada:
  // morph[chapterIndex][verseIndex] => [ {g,tr,lemma}, ... ]
  function getMtTokens(ch, v) {
    if (!Array.isArray(morph)) return null;
    const chArr = morph[ch - 1];
    if (!Array.isArray(chArr)) return null;
    const tokens = chArr[v - 1];
    return Array.isArray(tokens) ? tokens : null;
  }

  function ensurePopup() {
    if (document.getElementById('gk-lex-popup')) return;

    const st = document.createElement('style');
    st.id = 'gk-lex-style';
    st.textContent = `
      .gk-w{ cursor:pointer; }
      .gk-w:hover{ text-decoration: underline; }

      .gk-lex-popup{
        position: fixed;
        z-index: 9997; /* por debajo del overlay de notas (si usas 9998/9999) */
        min-width: 260px;
        max-width: min(420px, calc(100vw - 24px));
        background: rgba(17,26,46,0.98);
        border: 1px solid rgba(255,255,255,0.10);
        border-radius: 14px;
        box-shadow: 0 20px 50px rgba(0,0,0,0.35);
        padding: 12px;
        color: #e9eefc;
        display:none;
      }
      .gk-lex-popup .t1{ font-weight:700; font-size:14px; margin-bottom:6px; padding-right:18px; }
      .gk-lex-popup .t2{ font-size:13px; opacity:.92; }
      .gk-lex-popup .close{
        position:absolute; right:10px; top:8px;
        background: transparent; border:0; color:#cbd6ff; cursor:pointer;
        font-size: 16px;
      }
      .gk-lex-popup .row{ margin-top:6px; }
      .gk-lex-popup .lab{ opacity:.75; margin-right:6px; }
      .gk-lex-popup .mono{ font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; }
    `;
    document.head.appendChild(st);

    const p = document.createElement('div');
    p.id = 'gk-lex-popup';
    p.className = 'gk-lex-popup';
    p.innerHTML = `
      <button class="close" title="Cerrar">×</button>
      <div class="t1" id="gk-lex-h"></div>
      <div class="t2" id="gk-lex-b"></div>
    `;
    document.body.appendChild(p);

    p.querySelector('.close').addEventListener('click', () => hidePopup());
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') hidePopup(); });

    // Click afuera cierra, pero NO bloquea click derecho
    document.addEventListener('click', (e) => {
      const pop = document.getElementById('gk-lex-popup');
      if (!pop || pop.style.display === 'none') return;
      if (pop.contains(e.target)) return;
      if (e.target.closest && e.target.closest('.gk-w')) return;
      hidePopup();
    });
  }

  function showPopupNear(el, g, lemma, tr) {
    ensurePopup();
    const pop = document.getElementById('gk-lex-popup');
    const h = document.getElementById('gk-lex-h');
    const b = document.getElementById('gk-lex-b');

    h.textContent = g || '';
    b.innerHTML = `
      <div class="row"><span class="lab">Lemma:</span> <span class="mono">${esc(lemma)}</span></div>
      ${tr ? `<div class="row"><span class="lab">Translit:</span> <span class="mono">${esc(tr)}</span></div>` : ``}
    `;

    pop.style.display = 'block';

    const r = el.getBoundingClientRect();
    const pad = 10;
    let x = r.left;
    let y = r.bottom + 8;

    // Ajuste a pantalla
    const pr = pop.getBoundingClientRect();
    if (x + pr.width > window.innerWidth - pad) x = window.innerWidth - pr.width - pad;
    if (y + pr.height > window.innerHeight - pad) y = r.top - pr.height - 8;
    if (x < pad) x = pad;
    if (y < pad) y = pad;

    pop.style.left = `${x}px`;
    pop.style.top = `${y}px`;
  }

  function hidePopup() {
    const pop = document.getElementById('gk-lex-popup');
    if (pop) pop.style.display = 'none';
  }

  function decorateMatthewRange(rootEl, bookSlug, chFrom, v1, v2) {
    if (!rootEl) return;
    if (!isMatthewSlug(bookSlug)) return;

    // Solo tiene sentido si el panel está mostrando griego
    // (tu app alterna hebreo/griego; en griego agrega clase "greek")
    if (!rootEl.classList.contains('greek')) return;

    const lines = rootEl.querySelectorAll('.verse-line[data-side="orig"]');
    for (const line of lines) {
      const ch = parseInt(line.dataset.ch, 10);
      const v = parseInt(line.dataset.v, 10);
      if (Number.isNaN(ch) || Number.isNaN(v)) continue;
      if (ch !== chFrom) continue;
      if (v < v1 || v > v2) continue;

      const verseText = line.querySelector('.verse-text');
      if (!verseText) continue;

      // Evita redecorar si ya está
      if (verseText.querySelector('.gk-w')) continue;

      const tokens = getMtTokens(ch, v);
      if (!tokens) continue;

      verseText.innerHTML = tokens.map((t) => {
        const g = t.g ?? '';
        const lemma = t.lemma ?? '';
        const tr = t.tr ?? '';
        return `<span class="gk-w" data-lemma="${esc(lemma)}" data-tr="${esc(tr)}">${esc(g)}</span>`;
      }).join(' ');
    }
  }

  function attachLeftClickHandler(rootEl) {
    if (!rootEl || rootEl.__gkLexClickBound) return;
    rootEl.__gkLexClickBound = true;

    rootEl.addEventListener('click', (e) => {
      // Solo click izquierdo
      if (e.button !== 0) return;

      const w = e.target && e.target.closest ? e.target.closest('.gk-w') : null;
      if (!w) return;

      // Si hay selección activa (usuario marcando para subrayar), no abrir popup
      const sel = window.getSelection ? window.getSelection() : null;
      if (sel && String(sel).trim().length > 0) return;

      const lemma = w.dataset.lemma || '';
      const tr = w.dataset.tr || '';
      const g = w.textContent || '';
      showPopupNear(w, g, lemma, tr);
    }, false);
  }

  function observeOrigPanel() {
    if (observing) return;
    const rootEl = document.getElementById('passageTextOrig');
    if (!rootEl) return;

    observing = true;

    const obs = new MutationObserver(() => {
      if (decorating) return;
      try {
        decorating = true;

        // Detecta rango actual desde el DOM (lo renderizas con data-ch / data-v)【turn11file16†L31-L33】
        const first = rootEl.querySelector('.verse-line[data-side="orig"][data-ch][data-v]');
        const last = rootEl.querySelector('.verse-line[data-side="orig"][data-ch][data-v]:last-of-type');

        if (!first) return;

        const bookSlug = first.dataset.book || window.currentBookSlug || '';
        const ch = parseInt(first.dataset.ch, 10);
        const v1 = parseInt(first.dataset.v, 10);
        const v2 = last ? parseInt(last.dataset.v, 10) : v1;

        if (!Number.isNaN(ch) && !Number.isNaN(v1) && !Number.isNaN(v2)) {
          decorateMatthewRange(rootEl, bookSlug, ch, v1, v2);
          attachLeftClickHandler(rootEl);
        }
      } catch (err) {
        console.warn('[GreekLexicon] observer error:', err);
      } finally {
        decorating = false;
      }
    });

    obs.observe(rootEl, { childList: true, subtree: true });
  }

  async function init() {
    try {
      await loadMorphOnce();
      observeOrigPanel();
      // Primer intento inmediato (por si ya había contenido)
      const rootEl = document.getElementById('passageTextOrig');
      if (rootEl) {
        // fuerza un “tick” para que el observer corra aunque no haya mutación
        setTimeout(() => {
          const first = rootEl.querySelector('.verse-line[data-side="orig"][data-ch][data-v]');
          if (!first) return;
          const bookSlug = first.dataset.book || window.currentBookSlug || '';
          const ch = parseInt(first.dataset.ch, 10);
          const v1 = parseInt(first.dataset.v, 10);
          const last = rootEl.querySelector('.verse-line[data-side="orig"][data-ch][data-v]:last-of-type');
          const v2 = last ? parseInt(last.dataset.v, 10) : v1;
          if (!Number.isNaN(ch) && !Number.isNaN(v1) && !Number.isNaN(v2)) {
            decorateMatthewRange(rootEl, bookSlug, ch, v1, v2);
            attachLeftClickHandler(rootEl);
          }
        }, 0);
      }
    } catch (err) {
      console.warn('[GreekLexicon] init error:', err);
    }
  }

  window.GreekLexicon = { init };
})();
