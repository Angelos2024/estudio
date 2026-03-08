(function () {
  const state = {
    rows: [],
    activeRow: 0,
    rawQuery: ''
  };

  function escapeHtml(text) {
    return String(text ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function splitSelectableOptions(value) {
    const raw = String(value || '').trim();
    if (!raw) return [];
    const options = raw
      .split(/[,;·/]+/)
      .map((item) => String(item || '').trim())
      .filter(Boolean);
    return Array.from(new Set(options.length ? options : [raw]));
  }

  function createSelectableRow(entry) {
    const heRaw = entry?.he || entry?.hebrew || entry?.palabra || '';
    const grRaw = entry?.gr || entry?.equivalencia_griega || entry?.greek || '';
    const esRaw = entry?.es || entry?.equivalencia_espanol || entry?.equivalencia || '';

    const heOptions = splitSelectableOptions(heRaw);
    const grOptions = splitSelectableOptions(grRaw);
    const esOptions = splitSelectableOptions(esRaw);

    return {
      entry,
      options: { he: heOptions, gr: grOptions, es: esOptions },
      selected: {
        he: heOptions[0] || '—',
        gr: grOptions[0] || '—',
        es: esOptions[0] || '—'
      }
    };
  }

  function renderSelectableOptions(row, rowIndex, lang) {
    const options = row?.options?.[lang] || [];
    if (!options.length) return '<span class="result-option-text">—</span>';

    return options.map((option, optionIndex) => {
      const isSelected = (row?.selected?.[lang] || '') === option;
      return `<button type="button" class="result-option-chip ${isSelected ? 'is-selected' : ''}" data-role="result-option" data-row="${rowIndex}" data-lang="${lang}" data-option-index="${optionIndex}">${escapeHtml(option)}</button>`;
    }).join('');
  }

  function renderRowsFromSelectionState() {
    const tbody = document.getElementById('resultsTbody');
    if (!tbody) return;
    tbody.innerHTML = state.rows.map((row, rowIndex) => `
      <tr class="result-row ${rowIndex === state.activeRow ? 'result-row--active' : ''}" data-row-index="${rowIndex}">
        <td class="he">${renderSelectableOptions(row, rowIndex, 'he')}</td>
        <td class="gr" style="font-family: 'Times New Roman', serif; font-size: 1.2rem; color: #1e3a8a;">${renderSelectableOptions(row, rowIndex, 'gr')}</td>
        <td class="es">${row.entry._isSynthetic ? `<small style="color:var(--muted)">[Sintético]</small> ` : ''}${renderSelectableOptions(row, rowIndex, 'es')}</td>
      </tr>
    `).join('');
  }

  function getActiveSelectedEntry() {
    const row = state.rows[state.activeRow];
    if (!row) return null;
    return {
      ...row.entry,
      he: row.selected.he,
      gr: row.selected.gr,
      es: row.selected.es
    };
  }

  function refreshComparisonAndSummary() {
    const selectedEntry = getActiveSelectedEntry();
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
        diag: 'Resumen actualizado con el candidato seleccionado manualmente.'
      }).catch(() => {});
    }
  }

  function onResultsRendered(event) {
    const items = Array.isArray(event?.detail?.items) ? event.detail.items : [];
    state.rawQuery = String(event?.detail?.rawQuery || '');

    if (!items.length) {
      state.rows = [];
      state.activeRow = 0;
      return;
    }

    state.rows = items.map((entry) => createSelectableRow(entry));
    state.activeRow = 0;
    renderRowsFromSelectionState();
    refreshComparisonAndSummary();
  }

  function onResultsClick(event) {
    const target = event.target instanceof HTMLElement
      ? event.target.closest('[data-role="result-option"]')
      : null;
    if (!target) return;

    const rowIndex = Number.parseInt(target.dataset.row || '', 10);
    const lang = String(target.dataset.lang || '');
    const optionIndex = Number.parseInt(target.dataset.optionIndex || '', 10);

    const row = state.rows[rowIndex];
    const options = row?.options?.[lang];
    const optionValue = Array.isArray(options) ? options[optionIndex] : null;
    if (!row || !optionValue) return;

    row.selected[lang] = optionValue;
    state.activeRow = rowIndex;
    if (!state.rawQuery) {
      state.rawQuery = String(document.getElementById('query')?.value || '').trim();
    }

    renderRowsFromSelectionState();
    refreshComparisonAndSummary();
  }

  function init() {
    window.addEventListener('trilingue:results-rendered', onResultsRendered);
    const tbody = document.getElementById('resultsTbody');
    if (tbody) {
      tbody.addEventListener('click', onResultsClick);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
