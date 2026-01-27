/* diccionario/greek-lexicon.js
   - Convierte cada palabra griega en <span class="gk-w">...</span>
   - Click izquierdo abre popup (NO interfiere con click derecho)
*/
(function () {
  const MORPH_URL = './diccionario/mt-morphgnt.translit.json';

  let morph = null; // { book:'Mt', chapters:[...], meta:... }

  function esc(s) {
    return String(s)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  }

  async function loadMorphOnce() {
    if (morph) return morph;
    const res = await fetch(MORPH_URL, { cache: 'no-store' });
    if (!res.ok) throw new Error(`No pude cargar ${MORPH_URL} (${res.status})`);
    morph = await res.json();
    return morph;
  }

  // mt-morphgnt.translit.json (Mt) viene segmentado:
  // - chapters[9]  => caps 1–9    index = ch*100 + (v-1)
  // - chapters[10] => caps 10–19  index = (ch-10)*100 + (v-1)
  // - chapters[11] => caps 20–28  index = (ch-20)*100 + (v-1)
  function getMtTokens(ch, v) {
    if (!morph || morph.book !== 'Mt') return null;

    const seg =
      ch <= 9 ?  ? morph.chapters[9]
    : ch <= 19 ? morph.chapters[10]
    :           morph.chapters[11];

    if (!seg) return null;

    const idx =
      ch <= 9  ? (ch * 100 + (v - 1))
    : ch <= 19 ? ((ch - 10) * 100 + (v - 1))
    :            ((ch - 20) * 100 + (v - 1));

    const tokens = seg[idx];
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
        position: fixed; z-index: 9999;
        min-width: 260px; max-width: min(420px, calc(100vw - 24px));
        background: rgba(17,26,46,.98);
        border: 1px solid rgba(255,255,255,.10);
        border-radius: 14px;
        box-shadow: 0 20px 50px rgba(0,0,0,.35);
        padding: 12px 12px;
        color: #e9eefc;
        display:none;
      }
      .gk-lex-popup .t1{ font-weight: 700; font-size: 14px; margin-bottom: 6px; }
      .gk-lex-popup .t2{ font-size: 13px; opacity: .9; }
      .gk-lex-popup .close{
        position:absolute; right:10px; top:8px;
        background: transparent; border:0; color:#cbd6ff; cursor:pointer;
        font-size: 16px;
      }
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
    document.addEventListener('click', (e) => {
      const pop = document.getElementById('gk-lex-popup');
      if (!pop || pop.style.display === 'none') return;
      if (pop.contains(e.target)) return;
      if (e.target.closest && e.target.closest('.gk-w')) return;
      hidePopup();
    });
  }

  function showPopupNear(el, header, body) {
    ensurePopup();
    const pop = document.getElementById('gk-lex-popup');
    const h = document.getElementById('gk-lex-h');
    const b = document.getElementById('gk-lex-b');
    h.textContent = header;
    b.textContent = body;

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

  // Convierte el texto de cada verso a spans clickeables usando los tokens del morph
  function decorateMtPassage(rootEl, chFrom, v1, v2) {
    const lines = rootEl.querySelectorAll('.verse-line[data-side="orig"]');
    for (const line of lines) {
      const ch = parseInt(line.dataset.ch, 10);
      const v  = parseInt(line.dataset.v, 10);
      if (ch !== chFrom) continue;
      if (v < v1 || v > v2) continue;

      const verseText = line.querySelector('.verse-text');
      if (!verseText) continue;

      // Evita redecorar (si vuelves a renderizar rápido)
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

  function attachClickHandler(rootEl) {
    // Click IZQUIERDO solamente => no choca con click derecho (subrayar/comentar)
    rootEl.addEventListener('click', (e) => {
      if (e.button !== 0) return;

      const w = e.target.closest?.('.gk-w');
      if (!w) return;

      // Si el usuario está seleccionando texto para subrayar, no abrir popup
      const sel = window.getSelection?.();
      if (sel && String(sel).trim().length > 0) return;

      const lemma = w.dataset.lemma || '';
      const tr = w.dataset.tr || '';
      const g = w.textContent || '';

      // Por ahora: muestra lemma + transliteración.
      // (Cuando metas diccionario fuerte, aquí haces lookup por lemma.)
      showPopupNear(w, `${g} — ${lemma}`, tr ? `Translit: ${tr}` : '');
    });
  }

  // API pública
  window.GreekLexicon = {
    async decoratePassage(rootEl, bookSlug, ch, v1, v2) {
      try {
        await loadMorphOnce();
        if (!rootEl) return;

        // Por ahora solo Mt (tú dijiste “este doc de mateo”)
        // bookSlug puede ser "mt" o similar; ajusta si en tu app es distinto.
        const isMt = String(bookSlug).toLowerCase().startsWith('mt') || String(bookSlug).toLowerCase().includes('mateo');
        if (!isMt) return;

        decorateMtPassage(rootEl, ch, v1, v2);
        attachClickHandler(rootEl);
      } catch (err) {
        console.warn('[GreekLexicon] error:', err);
      }
    }
  };
})();
