(function () {
  const SEARCH_INDEX_URLS = {
    es: ['../search/index-es.json', './search/index-es.json', '/search/index-es.json'],
    he: ['../search/index-he.json', './search/index-he.json', '/search/index-he.json'],
    gr: ['../search/index-gr.json', './search/index-gr.json', '/search/index-gr.json']
  };
  const LXX_FILES = [
    'lxx_rahlfs_1935_1Chr.json', 'lxx_rahlfs_1935_1Esdr.json', 'lxx_rahlfs_1935_1Kgs.json', 'lxx_rahlfs_1935_1Macc.json',
    'lxx_rahlfs_1935_1Sam.json', 'lxx_rahlfs_1935_2Chr.json', 'lxx_rahlfs_1935_2Esdr.json', 'lxx_rahlfs_1935_2Kgs.json',
    'lxx_rahlfs_1935_2Macc.json', 'lxx_rahlfs_1935_2Sam.json', 'lxx_rahlfs_1935_3Macc.json', 'lxx_rahlfs_1935_4Macc.json',
    'lxx_rahlfs_1935_Amos.json', 'lxx_rahlfs_1935_Bar.json', 'lxx_rahlfs_1935_BelOG.json', 'lxx_rahlfs_1935_BelTh.json',
    'lxx_rahlfs_1935_DanOG.json', 'lxx_rahlfs_1935_DanTh.json', 'lxx_rahlfs_1935_Deut.json', 'lxx_rahlfs_1935_Eccl.json',
    'lxx_rahlfs_1935_EpJer.json', 'lxx_rahlfs_1935_Esth.json', 'lxx_rahlfs_1935_Exod.json', 'lxx_rahlfs_1935_Ezek.json',
    'lxx_rahlfs_1935_Gen.json', 'lxx_rahlfs_1935_Hab.json', 'lxx_rahlfs_1935_Hag.json', 'lxx_rahlfs_1935_Hos.json',
    'lxx_rahlfs_1935_Isa.json', 'lxx_rahlfs_1935_Jdt.json', 'lxx_rahlfs_1935_Jer.json', 'lxx_rahlfs_1935_Job.json',
    'lxx_rahlfs_1935_Joel.json', 'lxx_rahlfs_1935_Jonah.json', 'lxx_rahlfs_1935_JoshA.json', 'lxx_rahlfs_1935_JoshB.json',
    'lxx_rahlfs_1935_JudgA.json', 'lxx_rahlfs_1935_JudgB.json', 'lxx_rahlfs_1935_Lam.json', 'lxx_rahlfs_1935_Lev.json',
    'lxx_rahlfs_1935_Mal.json', 'lxx_rahlfs_1935_Mic.json', 'lxx_rahlfs_1935_Nah.json', 'lxx_rahlfs_1935_Num.json',
    'lxx_rahlfs_1935_Obad.json', 'lxx_rahlfs_1935_Odes.json', 'lxx_rahlfs_1935_Prov.json', 'lxx_rahlfs_1935_Ps.json',
    'lxx_rahlfs_1935_PsSol.json', 'lxx_rahlfs_1935_Ruth.json', 'lxx_rahlfs_1935_Sir.json', 'lxx_rahlfs_1935_Song.json',
    'lxx_rahlfs_1935_SusOG.json', 'lxx_rahlfs_1935_SusTh.json', 'lxx_rahlfs_1935_TobBA.json', 'lxx_rahlfs_1935_TobS.json',
    'lxx_rahlfs_1935_Wis.json', 'lxx_rahlfs_1935_Zech.json', 'lxx_rahlfs_1935_Zeph.json'
  ];

  const NT_BOOKS = new Set([
    'mateo', 'marcos', 'lucas', 'juan', 'hechos', 'romanos',
    '1_corintios', '2_corintios', 'galatas', 'efesios', 'filipenses', 'colosenses',
    '1_tesalonicenses', '2_tesalonicenses', '1_timoteo', '2_timoteo', 'tito', 'filemon',
    'hebreos', 'santiago', '1_pedro', '2_pedro', '1_juan', '2_juan', '3_juan',
    'judas', 'apocalipsis'
  ]);

  const jsonCache = new Map();
   const lxxFileCache = new Map();
  const lxxSearchCache = new Map();

  const state = {
    rows: [],
    rawQuery: '',
  selectedByLang: { he: '—', gr: '—', es: '—' },
    loadingDonut: false
      };

  function escapeHtml(text) {
    return String(text ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function splitWords(value, lang) {
    const raw = String(value || '').trim();
    if (!raw) return [];

    const normalized = raw
      .replace(/[;,·/]/g, ' ')
      .replace(/[\u05BE]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    const words = normalized.split(' ').map((w) => w.trim()).filter(Boolean);
    const unique = Array.from(new Set(words));

    if (!unique.length) return [];

    if (lang === 'es') {
      return unique.map((word) => word.toLowerCase());
    }
    return unique;
  }

  function normalizeSpanish(text) {
    return String(text || '')
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9ñ\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function normalizeGreek(text) {
    return String(text || '')
      .replace(/[··.,;:!?“”"(){}\[\]<>«»]/g, '')
      .replace(/\s/g, '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
  }

  function normalizeHebrew(text) {
    return String(text || '')
      .replace(/[\u0591-\u05C7]/g, '')
      .replace(/[\u200E\u200F\u202A-\u202E\u2066-\u2069\u200C\u200D\uFEFF]/g, '')
      .trim();
  }

  async function fetchJsonWithFallback(urls) {
    let lastError = null;
    for (const url of urls || []) {
      try {
        if (jsonCache.has(url)) return jsonCache.get(url);
        const response = await fetch(url, { cache: 'force-cache' });
        if (!response.ok) {
          lastError = new Error(`No se pudo cargar ${url} (HTTP ${response.status}).`);
          continue;
        }
        const payload = await response.json();
        jsonCache.set(url, payload);
        return payload;
      } catch (error) {
        lastError = error;
      }
    }
    throw lastError || new Error('No se pudo cargar el índice de búsqueda.');
  }

  async function getIndexForLang(lang) {
    const urls = SEARCH_INDEX_URLS[lang];
    const data = await fetchJsonWithFallback(urls);
    return data?.tokens && typeof data.tokens === 'object' ? data.tokens : {};
  }

 async function loadLxxFile(file) {
    if (lxxFileCache.has(file)) return lxxFileCache.get(file);
    const promise = fetch(`../LXX/${file}`, { cache: 'force-cache' }).then((response) => {
      if (!response.ok) throw new Error(`No se pudo cargar ${file} (HTTP ${response.status}).`);
      return response.json();
    });
    lxxFileCache.set(file, promise);
    try {
      return await promise;
    } catch (error) {
      lxxFileCache.delete(file);
      throw error;
    }
  }
  function buildBookCountRows(refs) {
    const counts = new Map();
    refs.forEach((ref) => {
      const [book] = String(ref || '').split('|');
      if (!book) return;
      counts.set(book, (counts.get(book) || 0) + 1);
    });
    return [...counts.entries()]
      .map(([book, count]) => ({ book, label: book.replace(/_/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase()), count }))
      .sort((a, b) => b.count - a.count);
  }

  function filterOtRefs(refs) {
    return refs.filter((ref) => {
      const [book] = String(ref || '').split('|');
      return book && !NT_BOOKS.has(book);
    });
  }

  async function refsForWord(lang, word) {
    const index = await getIndexForLang(lang);
    if (lang === 'es') {
      const key = normalizeSpanish(word);
      return Array.isArray(index[key]) ? index[key] : [];
    }
    if (lang === 'gr') {
      const key = normalizeGreek(word);
      return Array.isArray(index[key]) ? index[key] : [];
    }
    const exact = Array.isArray(index[word]) ? index[word] : [];
    if (exact.length) return exact;
    const fallback = normalizeHebrew(word);
    return Array.isArray(index[fallback]) ? index[fallback] : [];
  }

  async function refsForLxxWord(word) {
    const key = normalizeGreek(word);
    if (!key) return [];
    if (lxxSearchCache.has(key)) return lxxSearchCache.get(key);

    const refs = [];
    const seen = new Set();

    for (const file of LXX_FILES) {
      try {
        const data = await loadLxxFile(file);
        const text = data?.text || {};
        for (const [book, chapters] of Object.entries(text)) {
          for (const [chapter, verses] of Object.entries(chapters || {})) {
            for (const [verse, tokens] of Object.entries(verses || {})) {
              const hit = (tokens || []).some((token) => {
                const lemmaKey = normalizeGreek(token?.lemma || '');
                const wordKey = normalizeGreek(token?.w || '');
                return lemmaKey === key || wordKey === key;
              });
              if (!hit) continue;
              const ref = `${book}|${chapter}|${verse}`;
              if (seen.has(ref)) continue;
              seen.add(ref);
              refs.push(ref);
            }
          }
        }
      } catch (_) {
        continue;
      }
    }

    lxxSearchCache.set(key, refs);
    return refs;
  }
  async function updateDonutFromSelection() {
    const donut = window.AnalisisComparativoOccurrenceDonut;
    if (!donut?.setData || state.loadingDonut) return;
    state.loadingDonut = true;
    try {
      const [esRefsRaw, heRefsRaw, grRkantRefsRaw, grLxxRefsRaw] = await Promise.all([
              refsForWord('es', state.selectedByLang.es),
        refsForWord('he', state.selectedByLang.he),
refsForWord('gr', state.selectedByLang.gr),
        refsForLxxWord(state.selectedByLang.gr)
              ]);
      const esRefs = filterOtRefs(esRefsRaw);
      const heRefs = filterOtRefs(heRefsRaw);
 const grRkantRefs = grRkantRefsRaw;
      const grLxxRefs = grLxxRefsRaw;
            donut.setData({
        es: buildBookCountRows(esRefs),
        he: buildBookCountRows(heRefs),
         gr_rkant: buildBookCountRows(grRkantRefs),
        gr_lxx: buildBookCountRows(grLxxRefs)
      });
    } catch (_) {
      donut.setData({ es: [], he: [], gr_rkant: [], gr_lxx: [] });
          } finally {
      state.loadingDonut = false;
    }
  }


  function createSelectableRow(entry) {
    const heRaw = entry?.he || entry?.hebrew || entry?.palabra || '';
    const grRaw = entry?.gr || entry?.equivalencia_griega || entry?.greek || '';
    const esRaw = entry?.es || entry?.equivalencia_espanol || entry?.equivalencia || '';

    return {
      entry,
      words: {
        he: splitWords(heRaw, 'he'),
        gr: splitWords(grRaw, 'gr'),
        es: splitWords(esRaw, 'es')
      }
    };
  }

  function ensureInitialSelection() {
    const first = state.rows[0];
    state.selectedByLang = {
      he: first?.words?.he?.[0] || '—',
      gr: first?.words?.gr?.[0] || '—',
      es: first?.words?.es?.[0] || '—'
    };
  }

  function isWordSelected(lang, word) {
    return String(state.selectedByLang?.[lang] || '') === String(word || '');
  }

  function renderWords(rowIndex, lang) {
    const words = state.rows[rowIndex]?.words?.[lang] || [];
    if (!words.length) return '<span class="result-option-text">—</span>';

    return words.map((word, wordIndex) => {
      const selected = isWordSelected(lang, word);
      return `<button type="button" class="result-word ${selected ? 'is-active' : ''}" data-role="result-word" data-row="${rowIndex}" data-lang="${lang}" data-word-index="${wordIndex}">${escapeHtml(word)}</button>`;
    }).join(' ');
  }

  function renderRows() {
    const tbody = document.getElementById('resultsTbody');
    if (!tbody) return;

    tbody.innerHTML = state.rows.map((row, rowIndex) => `
      <tr data-row-index="${rowIndex}">
        <td class="he">${renderWords(rowIndex, 'he')}</td>
        <td class="gr" style="font-family: 'Times New Roman', serif; font-size: 1.2rem; color: #1e3a8a;">${renderWords(rowIndex, 'gr')}</td>
        <td class="es">${row.entry._isSynthetic ? `<small style="color:var(--muted)">[Sintético]</small> ` : ''}${renderWords(rowIndex, 'es')}</td>
      </tr>
    `).join('');
  }

  function buildSelectedEntry() {
    const baseEntry = state.rows[0]?.entry;
    if (!baseEntry) return null;

    return {
      ...baseEntry,
      he: state.selectedByLang.he,
      gr: state.selectedByLang.gr,
      es: state.selectedByLang.es
    };
  }

  function refreshComparisonAndSummary() {
    const selectedEntry = buildSelectedEntry();
    const api = window.TrilingueComparativoAPI;

    if (!selectedEntry) {
      api?.updateDictionaryComparison?.([], state.rawQuery);
      return;
    }

    api?.updateDictionaryComparison?.([selectedEntry], state.rawQuery);

    const summaryApi = window.BuscadorResumenLema;
    if (summaryApi?.renderLemmaSummaryForSearch) {
      summaryApi.renderLemmaSummaryForSearch(state.rawQuery, {
        ok: true,
        matches: [selectedEntry],
        diag: 'Resumen actualizado con selección manual por palabra e idioma.'
      }).catch(() => {});
    }
  }

  function onResultsRendered(event) {
    const items = Array.isArray(event?.detail?.items) ? event.detail.items : [];
    state.rawQuery = String(event?.detail?.rawQuery || '');

    if (!items.length) {
      state.rows = [];
      window.AnalisisComparativoOccurrenceDonut?.setData?.({ es: [], he: [], gr_rkant: [], gr_lxx: [] });      return;
      }

    state.rows = items.map((entry) => createSelectableRow(entry));
    ensureInitialSelection();
    renderRows();
    refreshComparisonAndSummary();
    updateDonutFromSelection();
  }

  function onResultsClick(event) {
    const target = event.target instanceof HTMLElement
      ? event.target.closest('[data-role="result-word"]')
      : null;
    if (!target) return;

    const rowIndex = Number.parseInt(target.dataset.row || '', 10);
    const lang = String(target.dataset.lang || '');
    const wordIndex = Number.parseInt(target.dataset.wordIndex || '', 10);

    const words = state.rows[rowIndex]?.words?.[lang] || [];
    const wordValue = words[wordIndex];
    if (!wordValue || !['he', 'gr', 'es'].includes(lang)) return;

    state.selectedByLang[lang] = wordValue;

    if (!state.rawQuery) {
      state.rawQuery = String(document.getElementById('query')?.value || '').trim();
    }

    renderRows();
    refreshComparisonAndSummary();
    updateDonutFromSelection();
  }

  function init() {
    window.addEventListener('trilingue:results-rendered', onResultsRendered);
    const tbody = document.getElementById('resultsTbody');
    if (tbody) tbody.addEventListener('click', onResultsClick);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
