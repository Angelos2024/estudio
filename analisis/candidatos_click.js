(function () {

  const LXX_FREQ_MIN_URLS = [
    '../LXX/frecuencias/min.json',
    './LXX/frecuencias/min.json',
    '/LXX/frecuencias/min.json'
  ];

   const ES_FREQ_MIN_URLS = [
    '../librosRV1960/frecuencias/min.json',
    './librosRV1960/frecuencias/min.json',
    '/librosRV1960/frecuencias/min.json'
  ];
  const HE_FREQ_MIN_URLS = [
    '../IdiomaORIGEN/frecuencias/min.json',
    './IdiomaORIGEN/frecuencias/min.json',
    '/IdiomaORIGEN/frecuencias/min.json'
  ];
  const RKANT_FREQ_MIN_URLS = [
    '../RKANT/min.json',
    './RKANT/min.json',
    '/RKANT/min.json'
  ];

  const jsonCache = new Map();
  let lxxFrequencyIndexPromise = null;
  let esFrequencyIndexPromise = null;
  let heFrequencyIndexPromise = null;
  let rkantFrequencyIndexPromise = null;

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
      .replace(/[\u200E\u200F\u202A-\u202E\u2066-\u2069\u200C\u200D\uFEFF]/g, '')
      .replace(/[\u05BE\-—]/g, ' ')
      .replace(/\u05BA/g, '\u05B9')
      .replace(/[^\u05D0-\u05EA\u05B0-\u05BB\u05BC\u05C1\u05C2\u05C7\s]/g, '')
      .normalize('NFC')
      .replace(/\s+/g, ' ')
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

  

function buildRowsFromBookCounts(bookCounts) {
    if (!bookCounts || typeof bookCounts !== 'object') return [];
    return Object.entries(bookCounts)
      .filter(([, count]) => Number.isFinite(Number(count)) && Number(count) > 0)
      .map(([book, count]) => ({
        book,
        label: book.replace(/_/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase()),
        count: Number(count)
      }))
      .sort((a, b) => b.count - a.count);
  }

  async function buildFrequencyIndex(urls, normalizeWord) {
      const payload = await fetchJsonWithFallback(urls);
      const entries = Array.isArray(payload) ? payload : [];
      const index = new Map();

      entries.forEach((entry) => {
        const key = normalizeWord(entry?.palabra || '');
                if (!key) return;
        const sourceBooks = entry?.libros && typeof entry.libros === 'object' ? entry.libros : null;
        if (!sourceBooks) return;

        const target = index.get(key) || Object.create(null);
        Object.entries(sourceBooks).forEach(([book, count]) => {
          const safeCount = Number(count) || 0;
          if (safeCount <= 0) return;
          target[book] = (target[book] || 0) + safeCount;
        });
        index.set(key, target);
      });

      return index;
    }

 async function getLxxFrequencyIndex() {
    if (lxxFrequencyIndexPromise) return lxxFrequencyIndexPromise;
    lxxFrequencyIndexPromise = buildFrequencyIndex(LXX_FREQ_MIN_URLS, normalizeGreek);


    try {
      return await lxxFrequencyIndexPromise;
    } catch (error) {
      lxxFrequencyIndexPromise = null;
      throw error;
    }
  }

 async function getEsFrequencyIndex() {
    if (esFrequencyIndexPromise) return esFrequencyIndexPromise;
    esFrequencyIndexPromise = buildFrequencyIndex(ES_FREQ_MIN_URLS, normalizeSpanish);

    try {
      return await esFrequencyIndexPromise;
    } catch (error) {
      esFrequencyIndexPromise = null;
      throw error;
    }
  }

  async function getHeFrequencyIndex() {
    if (heFrequencyIndexPromise) return heFrequencyIndexPromise;
    heFrequencyIndexPromise = buildFrequencyIndex(HE_FREQ_MIN_URLS, normalizeHebrew);

    try {
      return await heFrequencyIndexPromise;
    } catch (error) {
      heFrequencyIndexPromise = null;
      throw error;
    }
  }

  async function getRkantFrequencyIndex() {
    if (rkantFrequencyIndexPromise) return rkantFrequencyIndexPromise;
    rkantFrequencyIndexPromise = buildFrequencyIndex(RKANT_FREQ_MIN_URLS, normalizeGreek);

    try {
      return await rkantFrequencyIndexPromise;
    } catch (error) {
      rkantFrequencyIndexPromise = null;
      throw error;
    }
  }

  async function rowsFromFrequencyIndex(word, normalizeWord, getIndex) {
    const key = normalizeWord(word);
    if (!key) return [];
    const index = await getIndex();
        return buildRowsFromBookCounts(index.get(key));
  }
   async function rowsForEsWord(word) {
    return rowsFromFrequencyIndex(word, normalizeSpanish, getEsFrequencyIndex);
  }

  async function rowsForHeWord(word) {
    return rowsFromFrequencyIndex(word, normalizeHebrew, getHeFrequencyIndex);
  }

  async function rowsForRkantWord(word) {
    return rowsFromFrequencyIndex(word, normalizeGreek, getRkantFrequencyIndex);
  }

 async function rowsForLxxWord(word) {
    return rowsFromFrequencyIndex(word, normalizeGreek, getLxxFrequencyIndex);
  }
  async function updateDonutFromSelection() {
    const donut = window.AnalisisComparativoOccurrenceDonut;
    if (!donut?.setData || state.loadingDonut) return;
    state.loadingDonut = true;
    try {
      const [esResult, heResult, grRkantResult, grLxxResult] = await Promise.allSettled([
        rowsForEsWord(state.selectedByLang.es),
        rowsForHeWord(state.selectedByLang.he),
        rowsForRkantWord(state.selectedByLang.gr),
        rowsForLxxWord(state.selectedByLang.gr)
      ]);

      const esRows = esResult.status === 'fulfilled' ? esResult.value : [];
      const heRows = heResult.status === 'fulfilled' ? heResult.value : [];
      const grRkantRows = grRkantResult.status === 'fulfilled' ? grRkantResult.value : [];
      const grLxxRows = grLxxResult.status === 'fulfilled' ? grLxxResult.value : [];

      donut.setData({
         es: esRows,
        he: heRows,
        gr_rkant: grRkantRows,
        gr_lxx: grLxxRows
      });
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
