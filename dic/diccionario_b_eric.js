(function (global) {
  const BOOK_ORDER = [
    'genesis','éxodo','exodo','levítico','levitico','números','numeros','deuteronomio','josué','josue','jueces','rut','samuel1','samuel2','reyes1','reyes2','crónicas1','cronicas1','crónicas2','cronicas2','esdras','nehemías','nehemias','ester','job','salmos','proverbios','eclesiastes','cantares','isaías','isaias','jeremías','jeremias','lamentaciones','ezequiel','daniel','oseas','joel','amós','amos','abdías','abdias','jonás','jonas','miqueas','nahúm','nahum','habacuc','sofonías','sofonias','hageo','zacarias','zacarías','malaquias'
  ];

  const state = {
    loaded: false,
    loadPromise: null,
    entries: []
  };

  const JSON_SOURCES = [
    '../dic/diccionario_eric/index.json',
    '../dic/diccionario_eric/diccionario_eric.json',
    '../dic/diccionario_eric/diccionarios.json',
    '../dic/diccionario_eric/data.json'
  ];

const FALLBACK_JSON_COLLECTION = [
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

  function normalizeBookKey(value) {
    return normalize(value).replace(/[^a-z0-9\u0370-\u03ff\u0590-\u05ff]+/g, '');
  }

  function flattenPayload(payload) {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.items)) return payload.items;
    if (Array.isArray(payload?.entries)) return payload.entries;
    if (Array.isArray(payload?.data)) return payload.data;
    return [];
  }

  async function fetchFirstAvailableJson() {
    for (const url of JSON_SOURCES) {
      try {
        const response = await fetch(url, { cache: 'no-store' });
        if (!response.ok) continue;
        const payload = await response.json();
        const rows = flattenPayload(payload);
        if (rows.length) return rows;
      } catch (_) {
        // Se intenta la siguiente fuente.
      }
    }
     const merged = [];
    for (const source of FALLBACK_JSON_COLLECTION) {
      try {
        const response = await fetch(source.url, { cache: 'no-store' });
        if (!response.ok) continue;
        const payload = await response.json();
        const rows = flattenPayload(payload);
        rows.forEach((entry) => {
          if (!entry || typeof entry !== 'object') return;
          merged.push({
            ...entry,
            book: entry.book || entry.libro || entry.book_name || entry.nombre_libro || source.book
          });
        });
      } catch (_) {
        // Se continúa con la siguiente colección.
      }
    }

    if (merged.length) return merged;
    return [];
  }

  function ensureLoaded() {
    if (state.loaded) return Promise.resolve(state);
    if (state.loadPromise) return state.loadPromise;

    state.loadPromise = fetchFirstAvailableJson()
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

  function getBookRank(entry) {
    const candidates = [entry?.book, entry?.libro, entry?.book_name, entry?.nombre_libro, entry?.archivo, entry?.file].filter(Boolean);
    for (const candidate of candidates) {
      const key = normalizeBookKey(candidate);
      const index = BOOK_ORDER.findIndex((name) => key.includes(normalizeBookKey(name)));
      if (index >= 0) return index + 1;
    }
    return Number.MAX_SAFE_INTEGER;
  }

  function getTexts(entry, lang) {
    const fields = lang === 'he'
      ? ['he', 'hebrew', 'hebreo', 'palabra', 'lemma', 'lemmas', 'texto_hebreo']
            : lang === 'gr'
        ? ['gr', 'greek', 'griego', 'equivalencia_griega', 'lxx', 'texto_hebreo', 'transliteracion']
                : ['es', 'spanish', 'espanol', 'español', 'equivalencia_espanol', 'equivalencia_español', 'traduccion'];

    const values = [];
    fields.forEach((field) => {
      const value = entry?.[field];
      if (Array.isArray(value)) {
        value.forEach(v => values.push(String(v || '')));
      } else if (value != null) {
        values.push(String(value));
      }
    });

    return values.map(v => v.trim()).filter(Boolean);
  }

  function findFirstMatchByLanguageOrder(terms) {
    const safeTerms = terms.map(normalize).filter(Boolean);
    if (!safeTerms.length || !state.entries.length) return null;

    const langs = ['he', 'gr', 'es'];
    for (const lang of langs) {
      const matched = state.entries.filter((entry) => {
        const texts = getTexts(entry, lang).map(normalize);
        if (!texts.length) return false;
        return safeTerms.some((term) => texts.some(text => text === term || text.includes(term)));
      });

      if (matched.length) {
        return matched
          .map((entry, index) => ({ entry, index, rank: getBookRank(entry) }))
          .sort((a, b) => (a.rank - b.rank) || (a.index - b.index))[0].entry;
      }
    }

    return null;
  }

  function esc(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  function hasHebrewChars(value) {
    return /[\u0590-\u05FF]/.test(String(value || ''));
  }
  function renderEricDictionaryCell(rawQuery, primaryEntry) {
    const terms = [
      rawQuery,
      primaryEntry?.he,
      primaryEntry?.hebrew,
      primaryEntry?.gr,
      primaryEntry?.greek,
      primaryEntry?.equivalencia_espanol,
      primaryEntry?.equivalencia_español,
      primaryEntry?.equivalencia_griega
    ].filter(Boolean);

    const hit = findFirstMatchByLanguageOrder(terms);
    if (!hit) {
      return '<div class="trilingual-brief mt-3"><div class="dict-entry-kicker">Diccionario B · Prof. Eric de Jesús Rodríguez Mendoza</div><div class="muted">Sin coincidencias en la base de diccionario Eric.</div></div>';
    }

    const sourceText = String(hit?.texto_hebreo || hit?.he || hit?.hebrew || hit?.hebreo || '').trim();
    const isHebrewText = hasHebrewChars(sourceText);
    const sourceLabel = isHebrewText ? 'Texto hebreo' : 'Texto griego';
    const sourceClass = isHebrewText ? 'hebrew' : 'greek';
    const spanish = getTexts(hit, 'es')[0] || '—';
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
