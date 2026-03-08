(function () {
  const state = {
    rows: [],
    rawQuery: '',
    selectedByLang: { he: '—', gr: '—', es: '—' }
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
      state.selectedByLang = { he: '—', gr: '—', es: '—' };
      return;
    }

    state.rows = items.map((entry) => createSelectableRow(entry));
    ensureInitialSelection();
    renderRows();
    refreshComparisonAndSummary();
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
