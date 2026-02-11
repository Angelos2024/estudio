/* hebrew-lexicon-ui.js
   Tooltip de diccionario para hebreo, con correspondencias RKANT usando LXX como puente.
*/
(() => {
  'use strict';

 const HEBREW_DICT_PATH = './diccionario/diccionario_unificado.min.json';
  const HEBREW_INDEX_PATH = './search/index-he.json';
  const GREEK_INDEX_PATH = './search/index-gr.json';
  const TEXT_BASE = './search/texts';
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
 const greekStopwords = new Set([
    'και', 'δε', 'ο', 'η', 'το', 'του', 'της', 'των', 'τω', 'τον', 'την',
    'εις', 'εν', 'αυτος', 'αυτη', 'αυτο', 'ου', 'μη', 'γαρ',
    'ως', 'επι', 'προς', 'δια', 'μετα', 'κατα', 'εκ', 'υπο'
  ]);
  const state = {
    dictMap: new Map(),
    dictLoaded: false,
    indexes: {},
    textCache: new Map(),
    lxxFileCache: new Map(),
    lxxBookCache: new Map(),
    lxxVerseCache: new Map(),
    lxxBookStatsCache: new Map(),
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
function toArray(value) {
    if (Array.isArray(value)) return value;
    if (value == null || value === '') return [];
    return [value];
  }

  function uniqueList(values) {
    return [...new Set(toArray(values).map((item) => String(item || '').trim()).filter(Boolean))];
  }

  function getHebrewLemma(entry) {
    return entry?.lemma || entry?.strong_detail?.lemma || entry?.hebreo || entry?.palabra || '—';
  }

  function getHebrewTranslit(entry) {
    return entry?.translit || entry?.transliteracion || entry?.strong_detail?.transliteracion || '—';
  }

  function getHebrewPos(entry) {
    return entry?.pos || entry?.categoria || entry?.tipo || '—';
  }

  function getHebrewDefinition(entry) {
    return entry?.definitions?.short || entry?.strong_detail?.definicion || entry?.descripcion || '—';
  }

  function getHebrewDefinitionRv(entry) {
    return entry?.definitions?.rv || entry?.strong_detail?.def_rv || '—';
  }

  function getHebrewMorphs(entry) {
    return uniqueList([...(entry?.morphs || []), ...(entry?.morfs || []), ...(entry?.morfologia || [])]);
  }

  function getHebrewForms(entry) {
    return uniqueList([entry?.forma, ...(entry?.forms || []), ...(entry?.formas || []), ...(entry?.variantes || [])]);
  }

  function getHebrewLxx(entry) {
    return entry?.LXX || entry?.lxx || entry?.lxx_refs || null;
  }
function findHebrewEntry(normalizedWord) {
    if (!normalizedWord) return null;

    const direct = state.dictMap.get(normalizedWord);
    if (direct) {
      return { entry: direct, lookup: normalizedWord, mode: 'direct' };
    }

    // Soporte para palabras compuestas con prefijos inseparables (ej. בראשית = ב + ראשית).
    let trimmed = normalizedWord;
    for (let i = 0; i < 3 && trimmed.length > 1; i++) {
      const first = trimmed[0];
      if (!HEBREW_PREFIX_LETTERS.has(first)) break;
      trimmed = trimmed.slice(1);
      const hit = state.dictMap.get(trimmed);
      if (hit) {
        return { entry: hit, lookup: trimmed, mode: 'prefixed' };
      }
    }

    return null;
  }
  function formatHebrewLxx(lxxData) {
    if (!lxxData) return '—';
    if (typeof lxxData === 'string') return lxxData;
    if (Array.isArray(lxxData)) return lxxData.map((item) => {
      if (typeof item === 'string') return item;
      const ref = item?.ref || item?.reference || item?.cita || '';
      const form = item?.forma || item?.form || item?.word || '';
      const lemma = item?.lemma || '';
      return [ref, form, lemma].filter(Boolean).join(' — ');
    }).filter(Boolean).join('\n');
    if (typeof lxxData === 'object') {
      return Object.entries(lxxData)
        .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
        .join('\n');
    }
    return String(lxxData);
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
     const keys = uniqueList([
        item?.palabra,
        item?.lemma,
        item?.hebreo,
        item?.forma,
        ...(item?.forms || []),
        ...(item?.formas || []),
        ...(item?.hebreos || [])
      ]).map((token) => normalizeHebrew(token));
      keys.forEach((key) => {
        if (key && !state.dictMap.has(key)) state.dictMap.set(key, item);
      });
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
    async function loadLxxBookStats(bookCode) {
    if (state.lxxBookStatsCache.has(bookCode)) return state.lxxBookStatsCache.get(bookCode);
    const data = await loadLxxBookData(bookCode);
    const verseFreq = new Map();
    let totalVerses = 0;
    const chapters = data?.text?.[bookCode] || {};
    Object.values(chapters).forEach((verses) => {
      Object.values(verses || {}).forEach((tokens) => {
        totalVerses += 1;
        const verseLemmas = new Set();
        (tokens || []).forEach((token) => {
          const normalized = normalizeGreek(token?.lemma || token?.w || '');
          if (!normalized || greekStopwords.has(normalized)) return;
          verseLemmas.add(normalized);
        });
        verseLemmas.forEach((lemma) => {
          verseFreq.set(lemma, (verseFreq.get(lemma) || 0) + 1);
        });
      });
    });
    const stats = { totalVerses, verseFreq };
    state.lxxBookStatsCache.set(bookCode, stats);
    return stats;
  }


  async function buildGreekCandidateFromHebrewRefs(refs) {
    if (!refs.length) return null;
    const counts = new Map();
    const samples = new Map();
      const usedBooks = new Set();
    for (const ref of refs.slice(0, 50)) {
      const [slug, chapterRaw, verseRaw] = ref.split('|');
      const chapter = Number(chapterRaw);
      const verse = Number(verseRaw);
      const lxxCodes = HEBREW_SLUG_TO_LXX[slug] || [];
      for (const lxxCode of lxxCodes) {
        const tokens = await loadLxxVerseTokens(lxxCode, chapter, verse);
        if (!tokens) continue;
          usedBooks.add(lxxCode);
        const verseLemmas = new Set();
        tokens.forEach((token) => {
          const lemma = token?.lemma || token?.w || '';
          const normalized = normalizeGreek(lemma);
          if (!normalized || greekStopwords.has(normalized)) return;
          verseLemmas.add(normalized);
          if (!samples.has(normalized) && token?.lemma) samples.set(normalized, token.lemma);
        });
          verseLemmas.forEach((lemma) => {
          counts.set(lemma, (counts.get(lemma) || 0) + 1);
        });
      }
    }
    if (!counts.size) return null;
    let totalVerses = 0;
    const verseFreq = new Map();
    for (const bookCode of usedBooks) {
      const stats = await loadLxxBookStats(bookCode);
      totalVerses += stats.totalVerses;
      stats.verseFreq.forEach((count, lemma) => {
        verseFreq.set(lemma, (verseFreq.get(lemma) || 0) + count);
      });
    }

    const ranked = [...counts.entries()].map(([lemma, hits]) => {
      const df = verseFreq.get(lemma) || 0;
      const score = hits * Math.log((totalVerses + 1) / (df + 1));
      return { lemma, hits, score };
    }).sort((a, b) => (b.score - a.score) || (b.hits - a.hits));

    const best = ranked[0]?.lemma;
    if (!best) return null;
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
        .he-lex-popup .rkant{ margin-top:6px; max-height:180px; overflow:auto; }
        .he-lex-popup .rkant-row{ margin-top:4px; font-size:12px; line-height:1.3; }
        .he-lex-popup .muted{ opacity:.7; }
        .he-lex-popup .close{ position:absolute; right:10px; top:8px; background:transparent; border:0; color:#cbd6ff; cursor:pointer; font-size:16px; }
        .he-lex-active-word{
          text-decoration: underline;
          text-decoration-thickness: 2px;
          text-underline-offset: 3px;
          text-decoration-color: currentColor;
        }
      `;
      document.head.appendChild(st);
    }

    const box = document.createElement('div');
    box.id = 'he-lex-popup';
    box.className = 'he-lex-popup';
    box.innerHTML =
      '<button class="close" aria-label="Cerrar">×</button>' +
      '<div class="t1" id="he-lex-word"></div>' +
     '<div class="t2 row"><span class="lab">Lemma:</span><span id="he-lex-entry"></span></div>' +
      '<div class="t2 row"><span class="lab">Forma léxica:</span><span id="he-lex-translit"></span></div>' +
      '<div class="t2 row"><span class="lab">POS:</span><span id="he-lex-pos"></span></div>' +
      '<div class="t2 row"><span class="lab">Definición:</span><div id="he-lex-desc" class="def"></div></div>' +
      '<div class="t2 row"><span class="lab">Definición RV:</span><div id="he-lex-def-rv" class="def"></div></div>' +
      '<div class="t2 row"><span class="lab">Morfología:</span><span id="he-lex-morph"></span></div>' +
      '<div class="t2 row"><span class="lab">Formas:</span><span id="he-lex-variants"></span></div>' +
      '<div class="t2 row"><span class="lab">LXX:</span><div id="he-lex-lxx" class="def"></div></div>' +
      '<hr class="sep" />' +
      '<div class="t2"><span class="lab">Correspondencia RKANT:</span></div>' +
      '<div id="he-lex-rkant" class="rkant"></div>';

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
       if (isHebrewPanel(ev.target) && !ev.target?.closest?.('.note-mark')) return;
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
     clearActiveWordMarker();
  }

  function clearActiveWordMarker() {
    const markers = document.querySelectorAll('.he-lex-active-word');
    markers.forEach((marker) => {
      const parent = marker.parentNode;
      if (!parent) return;
      while (marker.firstChild) parent.insertBefore(marker.firstChild, marker);
      parent.removeChild(marker);
      if (parent.normalize) parent.normalize();
    });
  }

  function markActiveWord(node, start, end) {
    if (!node || node.nodeType !== Node.TEXT_NODE) return null;
    if (start < 0 || end <= start) return null;
    clearActiveWordMarker();
    const range = document.createRange();
    range.setStart(node, start);
    range.setEnd(node, end);
    const marker = document.createElement('span');
    marker.className = 'he-lex-active-word';
    try {
      range.surroundContents(marker);
      return marker;
    } catch (error) {
      return null;
    }
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

  const pos = caretFromPoint(ev.clientX, ev.clientY);
    const resolved = resolveTextNode(pos);
    if (!resolved) return;
    const text = resolved.node.nodeValue || '';
    if (!text) return;
    const { word, start, end } = expandWord(text, Math.max(0, Math.min(resolved.offset, text.length - 1)));
    const normalized = normalizeHebrew(word);
    if (!normalized) return;

     const marker = markActiveWord(resolved.node, start, end);
     const requestId = ++state.popupRequestId;
    ensurePopup();

    const wordEl = document.getElementById('he-lex-word');
    const entryEl = document.getElementById('he-lex-entry');
    const descEl = document.getElementById('he-lex-desc');
      const translitEl = document.getElementById('he-lex-translit');
    const posEl = document.getElementById('he-lex-pos');
    const defRvEl = document.getElementById('he-lex-def-rv');
    const morphEl = document.getElementById('he-lex-morph');
    const variantsEl = document.getElementById('he-lex-variants');
    const lxxEl = document.getElementById('he-lex-lxx');
    const rkantEl = document.getElementById('he-lex-rkant');

    if (wordEl) wordEl.textContent = word || normalized;
    if (entryEl) entryEl.textContent = 'Cargando…';
     if (translitEl) translitEl.textContent = '—';
    if (posEl) posEl.textContent = '—';
    if (descEl) descEl.textContent = 'Buscando entrada en el diccionario hebreo…';
      if (defRvEl) defRvEl.textContent = '—';
    if (morphEl) morphEl.textContent = '—';
    if (variantsEl) variantsEl.textContent = '—';
   if (lxxEl) lxxEl.textContent = '—';
    if (rkantEl) rkantEl.innerHTML = '<div class="rkant-row muted">Buscando correspondencias RKANT…</div>';
    showPopupNear(marker || ev.target);

    let entry = null;
    try {
      await loadHebrewDict();
      if (requestId !== state.popupRequestId) return;
     const found = findHebrewEntry(normalized);
      entry = found?.entry || null;
      if (!entry) {
        if (entryEl) entryEl.textContent = '—';
        if (descEl) descEl.textContent = 'No se pudo cargar el diccionario hebreo.';
         if (translitEl) translitEl.textContent = '—';
        if (posEl) posEl.textContent = '—';
        if (defRvEl) defRvEl.textContent = '—';
        if (morphEl) morphEl.textContent = '—';
        if (variantsEl) variantsEl.textContent = '—';
         if (lxxEl) lxxEl.textContent = '—';
      } else {
        if (entryEl) entryEl.textContent = getHebrewLemma(entry);
        if (translitEl) translitEl.textContent = getHebrewTranslit(entry);
        if (posEl) posEl.textContent = getHebrewPos(entry);
        if (descEl) descEl.textContent = getHebrewDefinition(entry);
        if (defRvEl) defRvEl.textContent = getHebrewDefinitionRv(entry);
        if (morphEl) morphEl.textContent = getHebrewMorphs(entry).join(', ') || '—';
        if (variantsEl) variantsEl.textContent = getHebrewForms(entry).join(', ') || '—';
        if (lxxEl) lxxEl.textContent = formatHebrewLxx(getHebrewLxx(entry));
      }
    } catch (error) {
      if (requestId !== state.popupRequestId) return;
      if (entryEl) entryEl.textContent = '—';
       if (descEl) descEl.textContent = 'No se pudo cargar el diccionario hebreo.';
        if (translitEl) translitEl.textContent = '—';
      if (posEl) posEl.textContent = '—';
      if (defRvEl) defRvEl.textContent = '—';
      if (morphEl) morphEl.textContent = '—';
      if (variantsEl) variantsEl.textContent = '—';
      if (lxxEl) lxxEl.textContent = '—';
    
    }
       try {
      const heIndex = await loadIndex('he');
         if (requestId !== state.popupRequestId) return;
      const refs = heIndex.tokens?.[normalized] || [];
      if (!refs.length) {
        if (rkantEl) rkantEl.innerHTML = '<div class="rkant-row muted">Sin referencias hebreas en el índice.</div>';
        return;
      }
      const greekCandidate = await buildGreekCandidateFromHebrewRefs(refs);
           if (requestId !== state.popupRequestId) return;
      if (!greekCandidate) {
        if (rkantEl) rkantEl.innerHTML = '<div class="rkant-row muted">No se pudo determinar correspondencia griega.</div>';
        return;
      }
      const rkantSamples = await buildNa28Samples(greekCandidate.normalized, 4);
          if (requestId !== state.popupRequestId) return;
      if (!rkantSamples.length) {
        if (rkantEl) rkantEl.innerHTML = `<div class="rkant-row muted">Lema griego: ${escapeHtml(greekCandidate.lemma)} · Sin ocurrencias en RKANT.</div>`;
        return;
      }
      const items = rkantSamples.map((sample) => (
        `<div class="rkant-row">• <b>${escapeHtml(sample.ref)}</b> — ${escapeHtml(sample.text)}</div>`
      )).join('');
      if (rkantEl) {
        rkantEl.innerHTML = `
          <div class="rkant-row"><span class="muted">Lema griego:</span> ${escapeHtml(greekCandidate.lemma)}</div>
          ${items}
        `;
      }
    } catch (error) {
      if (rkantEl) rkantEl.innerHTML = '<div class="rkant-row muted">No se pudo cargar la correspondencia RKANT.</div>';
    }
  }, false);
})();
