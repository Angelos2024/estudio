(() => {
  const PANEL_IDS = {
    panel: 'lemmaSummaryPanel',
    tags: 'lemmaTags',
    summary: 'lemmaSummary',
    correspondence: 'lemmaCorrespondence',
    examples: 'lemmaExamples'
  };

  function $(id) {
    return document.getElementById(id);
  }

  function escapeHtml(text) {
    return String(text ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
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
      .replace(/[\u200C-\u200F\u202A-\u202E]/g, '')
      .replace(/[\u0591-\u05BD\u05BF\u05C1-\u05C2\u05C4-\u05C7]/g, '')
      .replace(/[\s\u05BE\-\u2010-\u2015\u2212]/g, '')
      .replace(/[׃.,;:!?()"“”'׳״]/g, '');
  }

  function detectLang(text) {
    const sample = String(text || '');
    if (/[\u0590-\u05FF]/.test(sample)) return 'he';
    if (/[\u0370-\u03FF\u1F00-\u1FFF]/.test(sample)) return 'gr';
    return 'es';
  }

  function transliterateGreek(text) {
    const map = {
      α: 'a', β: 'b', γ: 'g', δ: 'd', ε: 'e', ζ: 'z', η: 'e', θ: 'th',
      ι: 'i', κ: 'k', λ: 'l', μ: 'm', ν: 'n', ξ: 'x', ο: 'o', π: 'p',
      ρ: 'r', σ: 's', ς: 's', τ: 't', υ: 'u', φ: 'f', χ: 'ch', ψ: 'ps', ω: 'o'
    };
    const normalized = String(text || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
    return normalized.split('').map((char) => map[char] || char).join('');
  }

  function transliterateHebrew(word) {
    if (!word) return '—';
    const consonants = {
      'א': '', 'ב': 'b', 'ג': 'g', 'ד': 'd', 'ה': 'h', 'ו': 'v', 'ז': 'z', 'ח': 'j',
      'ט': 't', 'י': 'y', 'כ': 'k', 'ך': 'k', 'ל': 'l', 'מ': 'm', 'ם': 'm', 'נ': 'n',
      'ן': 'n', 'ס': 's', 'ע': "'", 'פ': 'p', 'ף': 'p', 'צ': 'ts', 'ץ': 'ts', 'ק': 'q',
      'ר': 'r', 'ש': 'sh', 'ת': 't'
    };
    const vowelMap = {
      '\u05B0': 'e', '\u05B1': 'e', '\u05B2': 'a', '\u05B3': 'a', '\u05B4': 'i',
      '\u05B5': 'e', '\u05B6': 'e', '\u05B7': 'a', '\u05B8': 'a', '\u05B9': 'o',
      '\u05BB': 'u', '\u05C7': 'o'
    };
    const decomposed = String(word || '').normalize('NFD');
    let output = '';
    for (let i = 0; i < decomposed.length; i += 1) {
      const char = decomposed[i];
      if (!Object.prototype.hasOwnProperty.call(consonants, char)) {
        const vowel = vowelMap[char];
        if (vowel) output += vowel;
        continue;
      }
      let consonant = consonants[char];
      let j = i + 1;
      let vowel = '';
      let hasShinDot = false;
      let hasSinDot = false;
      while (j < decomposed.length && /[\u0591-\u05C7]/.test(decomposed[j])) {
        if (decomposed[j] === '\u05C1') hasShinDot = true;
        if (decomposed[j] === '\u05C2') hasSinDot = true;
        if (!vowel && vowelMap[decomposed[j]]) vowel = vowelMap[decomposed[j]];
        j += 1;
      }
      if (char === 'ש') consonant = hasSinDot ? 's' : 'sh';
      output += consonant + vowel;
      i = j - 1;
    }
    return output || normalizeHebrew(word) || '—';
  }

  function shortDefinition(text) {
    if (!text) return '';
    const trimmed = String(text).replace(/\s+/g, ' ').trim();
    const split = trimmed.split('. ');
    return split[0] || trimmed;
  }

  const stopwords = new Set([
    'de', 'la', 'el', 'los', 'las', 'y', 'o', 'a', 'en', 'por', 'para',
    'un', 'una', 'unos', 'unas', 'del', 'al', 'que', 'se', 'con', 'como',
    'su', 'sus', 'es', 'son', 'lo', 'uno', 'tambien', 'también', 'sobre',
    'desde', 'hacia', 'entre', 'sin', 'segun', 'según'
  ]);

  function keywordList(text) {
    if (!text) return [];
    const cleaned = String(text)
      .replace(/[()]/g, ' ')
      .replace(/[^a-zA-ZáéíóúñüÁÉÍÓÚÑÜ\s]/g, ' ')
      .toLowerCase();
    const words = cleaned.split(/\s+/).filter(Boolean);
    const keywords = [];
    for (const word of words) {
      if (stopwords.has(word)) continue;
      if (!keywords.includes(word)) keywords.push(word);
      if (keywords.length >= 6) break;
    }
    return keywords;
  }

  function installLemmaSummaryPanel() {
    const panel = $(PANEL_IDS.panel);
    if (!panel) return null;

    const header = panel.querySelector('.panel-header');
    if (header) header.textContent = 'Resumen del lema';

    const body = panel.querySelector('.panel-body');
    if (!body) return null;

    body.innerHTML = `
      <div class="d-flex flex-column gap-2">
        <div id="${PANEL_IDS.tags}" class="d-flex flex-wrap gap-2"></div>
        <p id="${PANEL_IDS.summary}" class="mb-2 small muted">Escribe un término para generar el resumen del lema.</p>
        <div>
          <div id="${PANEL_IDS.correspondence}" class="d-grid gap-2 mt-2"></div>
        </div>
        <div id="${PANEL_IDS.examples}" class="d-grid gap-2"></div>
      </div>
    `;

    return {
      tags: $(PANEL_IDS.tags),
      summary: $(PANEL_IDS.summary),
      correspondence: $(PANEL_IDS.correspondence),
      examples: $(PANEL_IDS.examples)
    };
  }

  function ensurePanelNodes() {
    const existing = {
      tags: $(PANEL_IDS.tags),
      summary: $(PANEL_IDS.summary),
      correspondence: $(PANEL_IDS.correspondence),
      examples: $(PANEL_IDS.examples)
    };
    if (existing.tags && existing.summary && existing.correspondence && existing.examples) return existing;
    return installLemmaSummaryPanel();
  }

  function renderTags(tags) {
    const nodes = ensurePanelNodes();
    if (!nodes?.tags) return;
    nodes.tags.innerHTML = '';
    tags.forEach((tag) => {
      const span = document.createElement('span');
      span.className = 'tag';
      span.innerHTML = tag;
      nodes.tags.appendChild(span);
    });
  }

  function renderSummary(html) {
    const nodes = ensurePanelNodes();
    if (nodes?.summary) nodes.summary.innerHTML = html;
  }

  function renderCorrespondence(cards) {
    const nodes = ensurePanelNodes();
    if (!nodes?.correspondence) return;
    nodes.correspondence.innerHTML = '';
    if (!cards.length) {
      nodes.correspondence.innerHTML = '<div class="small muted">Sin correspondencias disponibles.</div>';
      return;
    }
    cards.forEach((card) => {
      const div = document.createElement('div');
      div.className = 'example-card';
      div.innerHTML = card;
      nodes.correspondence.appendChild(div);
    });
  }

  function renderExamples(cards) {
    const nodes = ensurePanelNodes();
    if (!nodes?.examples) return;
    nodes.examples.innerHTML = '';
    cards.forEach((card) => {
      const div = document.createElement('div');
      div.className = 'example-card';
      div.innerHTML = card;
      nodes.examples.appendChild(div);
    });
  }

  function getDisplayRows(matches, rawQuery) {
    if (typeof window.buildDisplayResults === 'function') {
      try {
        return window.buildDisplayResults(matches || [], rawQuery || '');
      } catch (_) {}
    }
    return Array.isArray(matches) ? matches : [];
  }

  function pickPrimaryMatch(matches, rawQuery) {
    const rows = getDisplayRows(matches, rawQuery);
    return rows[0] || matches?.[0] || null;
  }

  function getHebrew(entry) {
    return String(entry?.he || entry?.hebrew || entry?.palabra || '').trim();
  }

  function getGreek(entry) {
    return String(entry?.gr || entry?.equivalencia_griega || entry?.greek || '').trim();
  }

  function getSpanish(entry) {
    return String(
      entry?.es ||
      entry?.equivalencia_espanol ||
      entry?.equivalencia ||
      entry?.glosa ||
      ''
    ).trim();
  }

  function getCandidateList(entry) {
    return Array.isArray(entry?.candidatos)
      ? entry.candidatos.map((item) => String(item || '').trim()).filter(Boolean)
      : [];
  }

  function classForLang(lang) {
    if (lang === 'he') return 'hebrew';
    if (lang === 'gr') return 'greek';
    return '';
  }

  function buildCorrespondenceCard({ title, word, transliteration, detail, lang }) {
    const wordLine = word
      ? `<div class="${classForLang(lang)} fw-semibold">${escapeHtml(word)}</div>`
      : '<div class="small muted">—</div>';
    const translitLine = transliteration
      ? `<div class="small muted">Transliteración: ${escapeHtml(transliteration)}</div>`
      : '';
    const detailLine = detail
      ? `<div class="small muted">${escapeHtml(detail)}</div>`
      : '';
    return `
      <div class="fw-semibold">${escapeHtml(title)}</div>
      ${wordLine}
      ${translitLine}
      ${detailLine}
    `;
  }

  function summarizeEntry(entry, rawQuery) {
    const lang = detectLang(rawQuery);
    const heb = getHebrew(entry);
    const gr = getGreek(entry);
    const es = getSpanish(entry);
    const candidates = getCandidateList(entry);

    const definitionBase = es || candidates[0] || '';
    const shortDef = shortDefinition(definitionBase);
    const summaryParts = [];
    if (shortDef) summaryParts.push(shortDef);
    if (definitionBase && definitionBase !== shortDef) summaryParts.push(definitionBase);
    if (!summaryParts.length) {
      summaryParts.push('No se encontró una glosa directa; se usa la coincidencia principal del buscador para resumir el lema.');
    }

    const tags = [];
    const lemmaText =
      lang === 'he' ? (heb || rawQuery) :
      lang === 'gr' ? (gr || rawQuery) :
      (es || rawQuery);
    tags.push(`Lema: <span class="fw-semibold ${classForLang(lang)}">${escapeHtml(lemmaText || '—')}</span>`);

    const transliteration =
      lang === 'he' ? transliterateHebrew(heb || rawQuery) :
      lang === 'gr' ? transliterateGreek(gr || rawQuery) :
      '—';

    tags.push(`Transliteración: <span class="fw-semibold">${escapeHtml(transliteration || '—')}</span>`);

    const status = entry ? 'Coincidencia localizada' : 'Sin coincidencia';
    tags.push(`Estado: <span class="fw-semibold">${escapeHtml(status)}</span>`);

    renderTags(tags);
    renderSummary(escapeHtml(summaryParts.join(' ')));

    const correspondence = [
      buildCorrespondenceCard({
        title: 'Hebreo',
        word: heb || '—',
        transliteration: heb ? transliterateHebrew(heb) : '',
        detail: heb ? 'Forma hebrea principal encontrada en la tabla.' : 'Sin forma hebrea visible.',
        lang: 'he'
      }),
      buildCorrespondenceCard({
        title: 'Griego',
        word: gr || '—',
        transliteration: gr ? transliterateGreek(gr) : '',
        detail: gr ? 'Equivalencia griega principal encontrada en la tabla.' : 'Sin equivalencia griega visible.',
        lang: 'gr'
      }),
      buildCorrespondenceCard({
        title: 'Español',
        word: es || '—',
        transliteration: '',
        detail: es ? 'Glosa o traducción española principal.' : 'Sin glosa española visible.',
        lang: 'es'
      })
    ];
    renderCorrespondence(correspondence);

    const exampleCards = [];
    const keywords = keywordList(es || candidates.join(', '));
    if (keywords.length) {
      exampleCards.push(`
        <div class="fw-semibold">Campos semánticos</div>
        <div class="small muted">${escapeHtml(keywords.join(', '))}</div>
      `);
    }
    if (candidates.length) {
      exampleCards.push(`
        <div class="fw-semibold">Candidatos asociados</div>
        <div class="small muted">${escapeHtml(candidates.slice(0, 8).join(' · '))}</div>
      `);
    }
    if (!exampleCards.length) {
      exampleCards.push(`
        <div class="fw-semibold">Observación</div>
        <div class="small muted">La entrada no trae candidatos adicionales para ampliar el resumen.</div>
      `);
    }
    renderExamples(exampleCards);
  }

  function renderEmptySummary(rawQuery, reason = '') {
    renderTags([
      `Entrada: <span class="fw-semibold">${escapeHtml(rawQuery || '—')}</span>`,
      'Estado: <span class="fw-semibold">Sin resultados</span>'
    ]);
    renderSummary(escapeHtml(reason || 'No se encontraron coincidencias para construir el resumen del lema.'));
    renderCorrespondence([]);
    renderExamples([]);
  }

  function runSearch(rawQuery) {
    const query = String(rawQuery || '').trim();
    if (!query) return null;
    const lang = detectLang(query);
    try {
      if (lang === 'he' && typeof window.searchHebrewWord === 'function') return window.searchHebrewWord(query);
      if (lang === 'gr' && typeof window.searchGreek === 'function') return window.searchGreek(query);
      if (typeof window.searchSpanish === 'function') return window.searchSpanish(query);
    } catch (_) {
      return null;
    }
    return null;
  }

  function renderLemmaSummaryForSearch(rawQuery, searchResult) {
    ensurePanelNodes();
    const query = String(rawQuery || '').trim();
    if (!query) {
      renderEmptySummary('', 'Escribe un término para generar el resumen del lema.');
      return null;
    }
    const result = searchResult || runSearch(query);
    const matches = Array.isArray(result?.matches) ? result.matches : [];
    if (!matches.length) {
      renderEmptySummary(query, result?.diag || 'No se encontraron coincidencias para construir el resumen del lema.');
      return result || null;
    }
    const primary = pickPrimaryMatch(matches, query);
    if (!primary) {
      renderEmptySummary(query, 'No fue posible resolver una entrada principal para el resumen.');
      return result || null;
    }
    summarizeEntry(primary, query);
    return result || null;
  }

  function wrapSearch() {
    if (window.__buscadorLemmaSummaryWrapped) return;
    window.__buscadorLemmaSummaryWrapped = true;

    const originalDoSearch = typeof window.doSearch === 'function' ? window.doSearch : null;
    if (originalDoSearch) {
      window.doSearch = function wrappedDoSearch(...args) {
        const output = originalDoSearch.apply(this, args);
        try {
          const query = $('query')?.value || '';
          renderLemmaSummaryForSearch(query);
        } catch (_) {}
        return output;
      };
    }

    const searchBtn = $('searchBtn');
    if (searchBtn) {
      searchBtn.addEventListener('click', () => {
        const query = $('query')?.value || '';
        setTimeout(() => renderLemmaSummaryForSearch(query), 0);
      }, true);
    }

    const queryEl = $('query');
    if (queryEl) {
      queryEl.addEventListener('keydown', (event) => {
        if (event.key !== 'Enter') return;
        setTimeout(() => renderLemmaSummaryForSearch(queryEl.value), 0);
      }, true);
    }

    const exampleBtn = $('exampleBtn');
    if (exampleBtn) {
      exampleBtn.addEventListener('click', () => {
        setTimeout(() => {
          const query = $('query')?.value || '';
          if (query) renderLemmaSummaryForSearch(query);
        }, 0);
      }, true);
    }
  }

  function init() {
    ensurePanelNodes();
    wrapSearch();
  }

  window.BuscadorResumenLema = {
    init,
    installLemmaSummaryPanel,
    renderLemmaSummaryForSearch
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
