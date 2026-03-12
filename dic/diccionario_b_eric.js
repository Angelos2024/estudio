(function (global) {


  const state = {
    loaded: false,
    loadPromise: null,
    entries: []
  };

  // Se consulta SOLAMENTE la carpeta solicitada por el usuario.
  const JSON_SOURCES = [
    { url: '../dic/diccionario_eric/diccionario_1tesalonicenses.json', book: '1 Tesalonicenses' },
    { url: '../dic/diccionario_eric/diccionario_2tesalonicenses.json', book: '2 Tesalonicenses' },
    { url: '../dic/diccionario_eric/diccionario_salmos.json', book: 'Salmos' },
    { url: '../dic/diccionario_eric/diccionario_qohelet.json', book: 'Qohelet' },
    { url: '../dic/diccionario_eric/diccionario_shir_hashirim.json', book: 'Shir Hashirim' },
    { url: '../dic/diccionario_eric/diccionario_parashot.json', book: 'Parashot' }
  ];

  function normalize(value) {
    return String(value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/ς/g, 'σ')
      .replace(/[\u0591-\u05C7]/g, '')
      .replace(/[.,;:!?“”"(){}\[\]<>«»'`´]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }


  function flattenPayload(payload) {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.items)) return payload.items;
    if (Array.isArray(payload?.entries)) return payload.entries;
    if (Array.isArray(payload?.data)) return payload.data;
    return [];
  }

  function hasHebrewChars(value) {
    return /[\u0590-\u05FF]/.test(String(value || ''));
  }

  function hasGreekChars(value) {
    return /[\u0370-\u03FF\u1F00-\u1FFF]/.test(String(value || ''));
  }

  function detectEntryLang(entry) {
    const sourceText = String(
      entry?.texto_hebreo ??
      entry?.he ??
      entry?.hebrew ??
      entry?.hebreo ??
      entry?.gr ??
      entry?.greek ??
      entry?.griego ??
      ''
    ).trim();

    if (hasHebrewChars(sourceText)) return 'he';
    if (hasGreekChars(sourceText)) return 'gr';
    return '';
  }

  async function fetchAllJsonCollections() {
    const merged = [];

    for (const source of JSON_SOURCES) {
      try {
        const response = await fetch(source.url, { cache: 'no-store' });
        if (!response.ok) continue;

        const payload = await response.json();
        const rows = flattenPayload(payload);

        rows.forEach((entry) => {
          if (!entry || typeof entry !== 'object') return;

          merged.push({
            ...entry,
            book: entry.book || entry.libro || entry.book_name || entry.nombre_libro || source.book,
            __lang: detectEntryLang(entry),
            __sourceIndex: merged.length
                      });
        });
      } catch (_) {
        // Continúa con el siguiente archivo.
      }
    }

    return merged;
  }

  function ensureLoaded() {
    if (state.loaded) return Promise.resolve(state);
    if (state.loadPromise) return state.loadPromise;

    state.loadPromise = fetchAllJsonCollections()
      .then((rows) => {
        state.entries = rows;
        state.loaded = true;
        return state;
      })
      .catch(() => {
        state.entries = [];
        state.loaded = true;
        return state;
      });

    return state.loadPromise;
  }



  function getSourceText(entry) {
    return String(
      entry?.texto_hebreo ??
      entry?.he ??
      entry?.hebrew ??
      entry?.hebreo ??
      entry?.gr ??
      entry?.greek ??
      entry?.griego ??
      ''
    ).trim();
  }

  function getTexts(entry, lang) {
    const fields = lang === 'he'
      ? ['he', 'hebrew', 'hebreo', 'palabra', 'lemma', 'lemmas', 'texto_hebreo']
      : ['gr', 'greek', 'griego', 'lxx', 'lemma', 'lemmas', 'texto_hebreo'];

    const values = [];
    fields.forEach((field) => {
      const value = entry?.[field];
      if (Array.isArray(value)) {
        value.forEach((v) => values.push(String(v || '').trim()));
      } else if (value != null) {
        values.push(String(value).trim());
      }
    });

    return values
      .filter(Boolean)
      .filter((value) => (lang === 'he' ? hasHebrewChars(value) : hasGreekChars(value)));
  }

  function getSpanishTexts(entry) {
    const fields = ['es', 'spanish', 'espanol', 'español', 'equivalencia_espanol', 'equivalencia_español', 'traduccion'];
    const values = [];
    fields.forEach((field) => {
      const value = entry?.[field];
      if (Array.isArray(value)) {
        value.forEach(v => values.push(String(v || '').trim()));
      } else if (value != null) {
        values.push(String(value).trim());
      }
    });
    return values.filter(Boolean);
  }

  function collectSearchTerms(rawTerms, lang) {
    return rawTerms
      .map((term) => String(term || '').trim())
      .filter(Boolean)
      .filter((term) => (lang === 'he' ? hasHebrewChars(term) : hasGreekChars(term)))
      .map(normalize)
      .filter(Boolean);
  }

  function collectSpanishTerms(rawTerms) {
    return rawTerms
      .map((term) => String(term || '').trim())
      .filter(Boolean)
      .filter((term) => !hasHebrewChars(term) && !hasGreekChars(term))
      .map(normalize)
      .filter(Boolean);
  }

  function sortMatches(entries) {
    return entries
      .map((entry, index) => ({ entry, index, rank: Number(entry?.__sourceIndex ?? Number.MAX_SAFE_INTEGER) }))
            .sort((a, b) => (a.rank - b.rank) || (a.index - b.index))
      .map((item) => item.entry);
  }

  function findFirstMatchByLanguageOrder(terms) {
    const hebrewTerms = collectSearchTerms(terms, 'he');
    if (hebrewTerms.length) {
      const matched = state.entries.filter((entry) => {
        if ((entry?.__lang || detectEntryLang(entry)) !== 'he') return false;
        const texts = getTexts(entry, 'he').map(normalize);
        if (!texts.length) return false;
        return hebrewTerms.some((term) => texts.some((text) => text === term || text.includes(term)));
      });

      if (matched.length) return sortMatches(matched)[0];
    }

    const greekTerms = collectSearchTerms(terms, 'gr');
    if (greekTerms.length) {
      const matched = state.entries.filter((entry) => {
        if ((entry?.__lang || detectEntryLang(entry)) !== 'gr') return false;
        const texts = getTexts(entry, 'gr').map(normalize);
        if (!texts.length) return false;
        return greekTerms.some((term) => texts.some((text) => text === term || text.includes(term)));
      });

      if (matched.length) return sortMatches(matched)[0];
    }

    // Fallback español: útil cuando el usuario busca "Dios", "griegos", etc.
    const spanishTerms = collectSpanishTerms(terms);
    if (spanishTerms.length) {
      const matched = state.entries.filter((entry) => {
        const texts = getSpanishTexts(entry).map(normalize);
        if (!texts.length) return false;
        return spanishTerms.some((term) => texts.some((text) => text === term || text.includes(term)));
      });

      if (matched.length) return sortMatches(matched)[0];
    }

    return null;
  }

  function esc(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  function renderEricDictionaryCell(rawQuery, primaryEntry) {
    const terms = [
      rawQuery,
      primaryEntry?.he,
      primaryEntry?.hebrew,
      primaryEntry?.hebreo,
      primaryEntry?.gr,
      primaryEntry?.greek,
      primaryEntry?.griego,
      primaryEntry?.texto_hebreo,
      primaryEntry?.equivalencia_espanol,
      primaryEntry?.equivalencia_español,
      primaryEntry?.equivalencia_griega,
      primaryEntry?.es,
      primaryEntry?.spanish
    ].filter(Boolean);

    const hit = findFirstMatchByLanguageOrder(terms);

    if (!hit) {
      return '<div class="trilingual-brief mt-3"><div class="dict-entry-kicker">Diccionario · Prof. Eric de Jesús Rodríguez Mendoza</div><div class="muted">Sin coincidencias en la base de diccionario Eric.</div></div>';
    }

    const sourceText = getSourceText(hit);
    const detectedLang = hit?.__lang || detectEntryLang(hit);
    const isHebrewText = detectedLang === 'he';
    const sourceLabel = isHebrewText ? 'Texto hebreo' : 'Texto griego';
    const sourceClass = isHebrewText ? 'hebrew' : 'greek';
    const spanish = getSpanishTexts(hit)[0] || '—';
    const transliteracion = String(hit?.transliteracion || '').trim() || '—';
    const definicion = String(hit?.observacion || '').trim() || '—';

    return `
      <div class="trilingual-brief mt-3 dict-entry">
        <div class="dict-entry-header">
          <div class="dict-entry-kicker">Diccionario · Prof. Eric de Jesús Rodríguez Mendoza</div>
        </div>
        <div class="trilingual-line"><strong>${sourceLabel}:</strong> <span class="${sourceClass}">${esc(sourceText || '—')}</span></div>
        <div class="trilingual-line"><strong>Transliteración:</strong> ${esc(transliteracion)}</div>
        <div class="trilingual-line"><strong>Equivalencia español:</strong> ${esc(spanish)}</div>
        <div class="trilingual-line"><strong>Definición:</strong> ${esc(definicion)}</div>
      </div>
    `;
  }

  global.AnalisisDiccionarioBEric = {
    ensureLoaded,
    renderEricDictionaryCell
  };
})(window);
