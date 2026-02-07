/* hebrew-lexicon-ui.js
   Tooltip de diccionario para hebreo, con correspondencias NA28 usando LXX como puente.
*/
(() => {
  'use strict';

  const HEBREW_DICT_PATH = './diccionario/lexico_hebreo.json';
  const HEBREW_INDEX_PATH = './search/index-he.json';
  const GREEK_INDEX_PATH = './search/index-gr.json';
  const TEXT_BASE = './search/texts';
  const LXX_FILES = [
    'lxx_rahlfs_1935_1Chr',
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
  const LXX_TO_HEBREW_SLUG = {
    Gen: 'genesis',
    Exod: 'exodo',
    Lev: 'levitico',
    Num: 'numeros',
    Deut: 'deuteronomio',
    JoshA: 'josue',
    JoshB: 'josue',
    JudgA: 'jueces',
    JudgB: 'jueces',
    Ruth: 'rut',
    '1Sam': '1_samuel',
    '2Sam': '2_samuel',
    '1Kgs': '1_reyes',
    '2Kgs': '2_reyes',
    '1Chr': '1_cronicas',
    '2Chr': '2_cronicas',
    '1Esdr': 'esdras',
    '2Esdr': 'nehemias',
    Esth: 'ester',
    Job: 'job',
    Ps: 'salmos',
    Prov: 'proverbios',
    Eccl: 'eclesiastes',
    Song: 'cantares',
    Isa: 'isaias',
    Jer: 'jeremias',
    Lam: 'lamentaciones',
    Ezek: 'ezequiel',
    DanOG: 'daniel',
    DanTh: 'daniel',
    Hos: 'oseas',
    Joel: 'joel',
    Amos: 'amos',
    Obad: 'abdias',
    Jonah: 'jonas',
    Mic: 'miqueas',
    Nah: 'nahum',
    Hab: 'habacuc',
    Zeph: 'sofonias',
    Hag: 'hageo',
    Zech: 'zacarias',
    Mal: 'malaquias'
  };
  const HEBREW_SLUG_TO_LXX = Object.entries(LXX_TO_HEBREW_SLUG).reduce((acc, [lxx, slug]) => {
    if (!acc[slug]) acc[slug] = [];
    acc[slug].push(lxx);
    return acc;
  }, {});

  const state = {
    dictMap: new Map(),
    dictLoaded: false,
    indexes: {},
    textCache: new Map(),
    lxxFileCache: new Map(),
    lxxBookCache: new Map(),
    lxxVerseCache: new Map(),
    popupEl: null,
     popupRequestId: 0
  };
 const jsonCache = new Map();
  function normalizeHebrew(text) {
    return String(text || '')
      .replace(/[\u0591-\u05BD\u05BF\u05C1-\u05C2\u05C4-\u05C7]/g, '')
      .replace(/[\s\u05BE]/g, '')
      .replace(/[׃,:;.!?()"“”]/g, '');
  }

  function normalizeGreek(text) {
    return String(text || '')
      .replace(/[··.,;:!?“”"(){}\[\]<>«»]/g, '')
      .replace(/\s/g, '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
  }

  async function loadJson(url) {
    if (jsonCache.has(url)) return jsonCache.get(url);
    const promise = fetch(url, { cache: 'force-cache' }).then((res) => {
      if (!res.ok) throw new Error(`No se pudo cargar ${url}`);
      return res.json();
        });
    jsonCache.set(url, promise);
    try {
      return await promise;
    } catch (error) {
      jsonCache.delete(url);
      throw error;
    }
  }

  async function loadHebrewDict() {
    if (state.dictLoaded) return state.dictMap;
    const data = await loadJson(HEBREW_DICT_PATH);
    (data || []).forEach((item) => {
      const key = normalizeHebrew(item?.palabra || '');
      if (key && !state.dictMap.has(key)) {
        state.dictMap.set(key, item);
      }
    });
    state.dictLoaded = true;
    return state.dictMap;
  }

  async function loadIndex(lang) {
    if (state.indexes[lang]) return state.indexes[lang];
    const url = lang === 'he' ? HEBREW_INDEX_PATH : GREEK_INDEX_PATH;
    const data = await loadJson(url);
    state.indexes[lang] = data;
    return data;
  }

  async function loadChapterText(lang, book, chapter) {
    const key = `${lang}/${book}/${chapter}`;
    if (state.textCache.has(key)) return state.textCache.get(key);
    const url = `${TEXT_BASE}/${lang}/${book}/${chapter}.json`;
    const data = await loadJson(url);
    state.textCache.set(key, data);
    return data;
  }

  async function loadLxxFile(file) {
    if (state.lxxFileCache.has(file)) return state.lxxFileCache.get(file);
    const data = await loadJson(`./LXX/${file}`);
    state.lxxFileCache.set(file, data);
    return data;
  }

  async function loadLxxBookData(bookCode) {
    if (state.lxxBookCache.has(bookCode)) return state.lxxBookCache.get(bookCode);
    for (const file of LXX_FILES) {
      try {
        const data = await loadLxxFile(file);
        if (data?.text?.[bookCode]) {
          state.lxxBookCache.set(bookCode, data);
          return data;
        }
      } catch (error) {
        continue;
      }
    }
    state.lxxBookCache.set(bookCode, null);
    return null;
  }

  async function loadLxxVerseTokens(bookCode, chapter, verse) {
    const key = `${bookCode}|${chapter}|${verse}`;
    if (state.lxxVerseCache.has(key)) return state.lxxVerseCache.get(key);
    const data = await loadLxxBookData(bookCode);
    const tokens = data?.text?.[bookCode]?.[chapter]?.[verse] || null;
    state.lxxVerseCache.set(key, tokens);
    return tokens;
  }

  async function buildGreekCandidateFromHebrewRefs(refs) {
    if (!refs.length) return null;
    const counts = new Map();
    const samples = new Map();
    for (const ref of refs.slice(0, 50)) {
      const [slug, chapterRaw, verseRaw] = ref.split('|');
      const chapter = Number(chapterRaw);
      const verse = Number(verseRaw);
      const lxxCodes = HEBREW_SLUG_TO_LXX[slug] || [];
      for (const lxxCode of lxxCodes) {
        const tokens = await loadLxxVerseTokens(lxxCode, chapter, verse);
        if (!tokens) continue;
        tokens.forEach((token) => {
          const lemma = token?.lemma || token?.w || '';
          const normalized = normalizeGreek(lemma);
          if (!normalized) return;
          counts.set(normalized, (counts.get(normalized) || 0) + 1);
          if (!samples.has(normalized) && token?.lemma) samples.set(normalized, token.lemma);
        });
      }
    }
    if (!counts.size) return null;
    const [best] = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
    return {
      normalized: best,
      lemma: samples.get(best) || best
    };
  }

  function formatRef(book, chapter, verse) {
    const bookLabel = book.replace(/_/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase());
    return `${bookLabel} ${chapter}:${verse}`;
  }

  async function buildNa28Samples(normalizedGreek, max = 4) {
    if (!normalizedGreek) return [];
    const grIndex = await loadIndex('gr');
    const refs = grIndex.tokens?.[normalizedGreek] || [];
    const samples = [];
    for (const ref of refs.slice(0, max)) {
      const [book, chapterRaw, verseRaw] = ref.split('|');
      const chapter = Number(chapterRaw);
      const verse = Number(verseRaw);
      let verseText = '';
      try {
        const verses = await loadChapterText('gr', book, chapter);
        verseText = verses?.[verse - 1] || '';
      } catch (error) {
        verseText = 'Texto no disponible.';
      }
      samples.push({
        ref: formatRef(book, chapter, verse),
        text: verseText
      });
    }
    return samples;
  }

  function ensurePopup() {
    if (state.popupEl) return state.popupEl;
    const styleId = 'he-lexicon-style';
    if (!document.getElementById(styleId)) {
      const st = document.createElement('style');
      st.id = styleId;
      st.textContent = `
        .he-lex-popup{
          position:fixed;
          z-index:9997;
          min-width:260px;
          max-width:min(440px, calc(100vw - 24px));
          max-height:calc(100vh - 24px);
          overflow:auto;
          background:rgba(17,26,46,0.98);
          border:1px solid rgba(255,255,255,0.10);
          border-radius:14px;
          box-shadow:0 20px 50px rgba(0,0,0,0.35);
          padding:12px;
          color:#e9eefc;
          display:none;
        }
        .he-lex-popup .t1{ font-weight:700; font-size:15px; margin-bottom:6px; padding-right:18px; direction:rtl; }
        .he-lex-popup .t2{ font-size:13px; opacity:.92; line-height:1.35; }
        .he-lex-popup .row{ margin-top:6px; }
        .he-lex-popup .lab{ opacity:.7; margin-right:6px; }
        .he-lex-popup .sep{ border:0; border-top:1px solid rgba(255,255,255,.12); margin:10px 0; }
        .he-lex-popup .def{ margin-top:4px; line-height:1.35; max-height:160px; overflow:auto; }
        .he-lex-popup .na28{ margin-top:6px; max-height:180px; overflow:auto; }
        .he-lex-popup .na28-row{ margin-top:4px; font-size:12px; line-height:1.3; }
        .he-lex-popup .muted{ opacity:.7; }
        .he-lex-popup .close{ position:absolute; right:10px; top:8px; background:transparent; border:0; color:#cbd6ff; cursor:pointer; font-size:16px; }
      `;
      document.head.appendChild(st);
    }

    const box = document.createElement('div');
    box.id = 'he-lex-popup';
    box.className = 'he-lex-popup';
    box.innerHTML =
      '<button class="close" aria-label="Cerrar">×</button>' +
      '<div class="t1" id="he-lex-word"></div>' +
      '<div class="t2 row"><span class="lab">Entrada:</span><span id="he-lex-entry"></span></div>' +
      '<div class="t2 row"><span class="lab">Descripción:</span><div id="he-lex-desc" class="def"></div></div>' +
      '<div class="t2 row"><span class="lab">Morfología:</span><span id="he-lex-morph"></span></div>' +
      '<div class="t2 row"><span class="lab">Variantes:</span><span id="he-lex-variants"></span></div>' +
      '<div class="t2 row"><span class="lab">Referencias:</span><span id="he-lex-refs"></span></div>' +
      '<hr class="sep" />' +
      '<div class="t2"><span class="lab">Correspondencia NA28:</span></div>' +
      '<div id="he-lex-na28" class="na28"></div>';

    document.body.appendChild(box);
    state.popupEl = box;

    box.querySelector('.close').addEventListener('click', hidePopup, false);
    document.addEventListener('keydown', (ev) => {
      if (ev.key === 'Escape') hidePopup();
    }, false);
    document.addEventListener('click', (ev) => {
      const p = state.popupEl;
      if (!p || p.style.display !== 'block') return;
      if (p.contains(ev.target)) return;
      hidePopup();
    }, false);

    return box;
  }

  function showPopupNear(anchorEl) {
    const box = ensurePopup();
    const rect = anchorEl.getBoundingClientRect();
    const pad = 10;
    box.style.display = 'block';
    const bw = box.offsetWidth;
    const bh = box.offsetHeight;
    let left = rect.left + (rect.width / 2) - (bw / 2);
    let top = rect.bottom + 8;
    if (left < pad) left = pad;
    if (left + bw > window.innerWidth - pad) left = window.innerWidth - pad - bw;
    if (top + bh > window.innerHeight - pad) {
      top = rect.top - bh - 8;
      if (top < pad) top = pad;
    }
    box.style.left = Math.round(left) + 'px';
    box.style.top = Math.round(top) + 'px';
  }

  function hidePopup() {
    if (!state.popupEl) return;
    state.popupEl.style.display = 'none';
  }

  function caretFromPoint(x, y) {
    if (document.caretPositionFromPoint) {
      const p = document.caretPositionFromPoint(x, y);
      if (!p) return null;
      return { node: p.offsetNode, offset: p.offset };
    }
    if (document.caretRangeFromPoint) {
      const r = document.caretRangeFromPoint(x, y);
      if (!r) return null;
      return { node: r.startContainer, offset: r.startOffset };
    }
    return null;
  }

   function resolveTextNode(pos) {
    if (!pos || !pos.node) return null;
    if (pos.node.nodeType === Node.TEXT_NODE) {
      return { node: pos.node, offset: pos.offset };
    }
    if (pos.node.nodeType !== Node.ELEMENT_NODE) return null;

    const element = pos.node;
    const children = element.childNodes || [];
    if (!children.length) return null;

    const idx = Math.max(0, Math.min(pos.offset, children.length - 1));
    const candidates = [children[idx], children[idx - 1], children[idx + 1]].filter(Boolean);

    for (const candidate of candidates) {
      if (candidate.nodeType === Node.TEXT_NODE && candidate.nodeValue) {
        return { node: candidate, offset: Math.min(pos.offset, candidate.nodeValue.length) };
      }
      if (candidate.nodeType === Node.ELEMENT_NODE) {
        const walker = document.createTreeWalker(candidate, NodeFilter.SHOW_TEXT, null);
        const textNode = walker.nextNode();
        if (textNode) return { node: textNode, offset: 0 };
      }
    }

    const fallbackWalker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, null);
    const fallbackText = fallbackWalker.nextNode();
    if (fallbackText) return { node: fallbackText, offset: 0 };
    return null;
  }
  function expandWord(text, idx) {
    const isWordChar = (ch) => {
      const code = ch.codePointAt(0);
      return (
        (code >= 0x0590 && code <= 0x05FF) ||
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

  function isHebrewPanel(target) {
    const panel = document.getElementById('passageTextOrig');
    if (!panel) return false;
    if (!panel.classList.contains('hebrew')) return false;
    return panel.contains(target);
  }

  function escapeHtml(s) {
    return String(s ?? '')
      .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;').replaceAll("'", '&#39;');
  }

  document.addEventListener('click', async (ev) => {
    if (ev.button !== 0) return;
    if (!isHebrewPanel(ev.target)) return;
    if (ev.target?.closest?.('.note-mark')) return;
    const sel = window.getSelection();
    if (sel && !sel.isCollapsed) return;

   const resolved = resolveTextNode(pos);
    if (!resolved) return;
    const text = resolved.node.nodeValue || '';
    if (!text) return;
    const { word } = expandWord(text, Math.max(0, Math.min(resolved.offset, text.length - 1)));
    const normalized = normalizeHebrew(word);
    if (!normalized) return;

     const requestId = ++state.popupRequestId;
    ensurePopup();

    const wordEl = document.getElementById('he-lex-word');
    const entryEl = document.getElementById('he-lex-entry');
    const descEl = document.getElementById('he-lex-desc');
    const morphEl = document.getElementById('he-lex-morph');
    const variantsEl = document.getElementById('he-lex-variants');
    const refsEl = document.getElementById('he-lex-refs');
    const na28El = document.getElementById('he-lex-na28');

    if (wordEl) wordEl.textContent = word || normalized;
    if (entryEl) entryEl.textContent = 'Cargando…';
    if (descEl) descEl.textContent = 'Buscando entrada en el diccionario hebreo…';
    if (morphEl) morphEl.textContent = '—';
    if (variantsEl) variantsEl.textContent = '—';
    if (refsEl) refsEl.textContent = '—';
    if (na28El) na28El.innerHTML = '<div class="na28-row muted">Buscando correspondencias NA28…</div>';
    showPopupNear(ev.target);

    let entry = null;
    try {
      await loadHebrewDict();
      if (requestId !== state.popupRequestId) return;
      entry = state.dictMap.get(normalized) || null;
      if (!entry) {
        if (entryEl) entryEl.textContent = '—';
        if (descEl) descEl.textContent = 'No se pudo cargar el diccionario hebreo.';
        if (morphEl) morphEl.textContent = '—';
        if (variantsEl) variantsEl.textContent = '—';
        if (refsEl) refsEl.textContent = '—';
      } else {
        if (entryEl) entryEl.textContent = entry.palabra || '—';
        if (descEl) descEl.textContent = entry.descripcion || '—';
        if (morphEl) morphEl.textContent = (entry.morfologia || []).join(', ') || '—';
        if (variantsEl) variantsEl.textContent = (entry.variantes || []).join(', ') || '—';
        if (refsEl) refsEl.textContent = (entry.referencias || []).join(', ') || '—';
      }
    } catch (error) {
      if (requestId !== state.popupRequestId) return;
      if (entryEl) entryEl.textContent = '—';
       if (descEl) descEl.textContent = 'No se pudo cargar el diccionario hebreo.';
      if (morphEl) morphEl.textContent = '—';
      if (variantsEl) variantsEl.textContent = '—';
      if (refsEl) refsEl.textContent = '—';
    
    }
       try {
      const heIndex = await loadIndex('he');
         if (requestId !== state.popupRequestId) return;
      const refs = heIndex.tokens?.[normalized] || [];
      if (!refs.length) {
        if (na28El) na28El.innerHTML = '<div class="na28-row muted">Sin referencias hebreas en el índice.</div>';
        return;
      }
      const greekCandidate = await buildGreekCandidateFromHebrewRefs(refs);
           if (requestId !== state.popupRequestId) return;
      if (!greekCandidate) {
        if (na28El) na28El.innerHTML = '<div class="na28-row muted">No se pudo determinar correspondencia griega.</div>';
        return;
      }
      const na28Samples = await buildNa28Samples(greekCandidate.normalized, 4);
          if (requestId !== state.popupRequestId) return;
      if (!na28Samples.length) {
        if (na28El) na28El.innerHTML = `<div class="na28-row muted">Lema griego: ${escapeHtml(greekCandidate.lemma)} · Sin ocurrencias en NA28.</div>`;
        return;
      }
      const items = na28Samples.map((sample) => (
        `<div class="na28-row">• <b>${escapeHtml(sample.ref)}</b> — ${escapeHtml(sample.text)}</div>`
      )).join('');
      if (na28El) {
        na28El.innerHTML = `
          <div class="na28-row"><span class="muted">Lema griego:</span> ${escapeHtml(greekCandidate.lemma)}</div>
          ${items}
        `;
      }
    } catch (error) {
      if (na28El) na28El.innerHTML = '<div class="na28-row muted">No se pudo cargar la correspondencia NA28.</div>';
    }
  }, false);
})();
