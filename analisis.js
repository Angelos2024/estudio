(() => {
  const DICT_URL = './diccionario/masterdiccionario.json';
  const SEARCH_INDEX = {
    es: './search/index-es.json',
    gr: './search/index-gr.json',
    he: './search/index-he.json'
  };
  const TEXT_BASE = './search/texts';

  const stopwords = new Set([
    'de', 'la', 'el', 'los', 'las', 'y', 'o', 'a', 'en', 'por', 'para',
    'un', 'una', 'unos', 'unas', 'del', 'al', 'que', 'se', 'con', 'como',
    'su', 'sus', 'es', 'son', 'lo', 'una', 'uno', 'tambien'
  ]);

  const TORAH = ['genesis', 'exodo', 'levitico', 'numeros', 'deuteronomio'];
  const PROPHETS = [
    'josue', 'jueces', '1_samuel', '2_samuel', '1_reyes', '2_reyes', 'isaias',
    'jeremias', 'lamentaciones', 'ezequiel', 'daniel', 'oseas', 'joel', 'amos',
    'abdias', 'jonas', 'miqueas', 'nahum', 'habacuc', 'sofonias', 'hageo',
    'zacarias', 'malaquias'
  ];
  const WRITINGS = [
    'rut', '1_cronicas', '2_cronicas', 'esdras', 'nehemias', 'ester', 'job',
    'salmos', 'proverbios', 'eclesiastes', 'cantares'
  ];
  const GOSPELS = ['mateo', 'marcos', 'lucas', 'juan'];
  const ACTS = ['hechos'];
  const LETTERS = [
    'romanos', '1_corintios', '2_corintios', 'galatas', 'efesios', 'filipenses',
    'colosenses', '1_tesalonicenses', '2_tesalonicenses', '1_timoteo',
    '2_timoteo', 'tito', 'filemon', 'hebreos', 'santiago', '1_pedro',
    '2_pedro', '1_juan', '2_juan', '3_juan', 'judas'
  ];
  const APOCALYPSE = ['apocalipsis'];

  const langLabels = {
    es: 'RVR1960',
    gr: 'NA28',
    he: 'Hebreo'
  };

  const state = {
    dict: null,
    dictMap: new Map(),
    indexes: {},
    textCache: new Map(),
    filter: 'todo',
    last: null
  };

  const queryInput = document.getElementById('queryInput');
  const analyzeBtn = document.getElementById('analyzeBtn');
  const lemmaTags = document.getElementById('lemmaTags');
  const lemmaSummary = document.getElementById('lemmaSummary');
  const lemmaExamples = document.getElementById('lemmaExamples');
  const resultsByCorpus = document.getElementById('resultsByCorpus');
  const breakdownList = document.getElementById('breakdownList');
  const textualNotes = document.getElementById('textualNotes');
  const saveSessionBtn = document.getElementById('saveSessionBtn');
  const saveStatus = document.getElementById('saveStatus');

  function normalizeGreek(text) {
    return String(text || '')
      .replace(/[··.,;:!?“”"(){}\[\]<>«»]/g, '')
      .replace(/\s+/g, '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
  }

  function normalizeHebrew(text) {
    return String(text || '')
      .replace(/[\u0591-\u05BD\u05BF\u05C1-\u05C2\u05C4-\u05C7]/g, '')
      .replace(/[\s\u05BE]/g, '');
  }

  function normalizeSpanish(text) {
    return String(text || '')
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9ñ]/g, '');
  }

  function detectLang(text) {
    if (/[\u0590-\u05FF]/.test(text)) return 'he';
    if (/[\u0370-\u03FF\u1F00-\u1FFF]/.test(text)) return 'gr';
    return 'es';
  }

  function normalizeByLang(text, lang) {
    if (lang === 'he') return normalizeHebrew(text);
    if (lang === 'gr') return normalizeGreek(text);
    return normalizeSpanish(text);
  }

  async function loadJson(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`No se pudo cargar ${url}`);
    return res.json();
  }

  async function loadDictionary() {
    if (state.dict) return state.dict;
    const data = await loadJson(DICT_URL);
    state.dict = data;
    const map = new Map();
    (data.items || []).forEach((item) => {
      const lemmaKey = normalizeGreek(item.lemma);
      const formKey = normalizeGreek(item['Forma flexionada del texto']);
      if (lemmaKey && !map.has(lemmaKey)) map.set(lemmaKey, item);
      if (formKey && !map.has(formKey)) map.set(formKey, item);
    });
    state.dictMap = map;
    return data;
  }

  async function loadIndex(lang) {
    if (state.indexes[lang]) return state.indexes[lang];
    const data = await loadJson(SEARCH_INDEX[lang]);
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

  function extractPos(entry) {
    if (!entry) return '—';
    const raw = entry.entrada_impresa || '';
    if (!raw) return '—';
    const parts = raw.split('.');
    if (parts.length < 2) return raw.trim();
    return parts[1].trim() || '—';
  }

  function shortDefinition(text) {
    if (!text) return '';
    const trimmed = text.replace(/\s+/g, ' ').trim();
    const split = trimmed.split('. ');
    return split[0] || trimmed;
  }

  function keywordList(text) {
    if (!text) return [];
    const cleaned = text
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

  function groupForBook(book) {
    if (TORAH.includes(book)) return { key: 'torah', label: 'Torah' };
    if (PROPHETS.includes(book)) return { key: 'profetas', label: 'Profetas' };
    if (WRITINGS.includes(book)) return { key: 'escritos', label: 'Escritos' };
    if (GOSPELS.includes(book)) return { key: 'evangelios', label: 'Evangelios' };
    if (ACTS.includes(book)) return { key: 'hechos', label: 'Hechos' };
    if (LETTERS.includes(book)) return { key: 'cartas', label: 'Cartas' };
    if (APOCALYPSE.includes(book)) return { key: 'apocalipsis', label: 'Apocalipsis' };
    return { key: 'otros', label: 'Otros' };
  }

  function formatRef(book, chapter, verse) {
    const bookLabel = book.replace(/_/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase());
    return `${bookLabel} ${chapter}:${verse}`;
  }

  function classForLang(lang) {
    if (lang === 'gr') return 'greek';
    if (lang === 'he') return 'hebrew';
    return 'mono';
  }

  function renderTags(tags) {
    lemmaTags.innerHTML = '';
    tags.forEach((tag) => {
      const span = document.createElement('span');
      span.className = 'tag';
      span.innerHTML = tag;
      lemmaTags.appendChild(span);
    });
  }

  function renderExamples(cards) {
    lemmaExamples.innerHTML = '';
    cards.forEach((card) => {
      const div = document.createElement('div');
      div.className = 'example-card';
      div.innerHTML = card;
      lemmaExamples.appendChild(div);
    });
  }

  function renderBreakdown(items) {
    breakdownList.innerHTML = '';
    items.forEach((item) => {
      const li = document.createElement('li');
      li.innerHTML = item;
      breakdownList.appendChild(li);
    });
  }

  function renderResults(groups, lang) {
    resultsByCorpus.innerHTML = '';
    const filteredGroups = groups.filter((group) => {
      if (state.filter === 'todo') return true;
      return group.key === state.filter;
    });

    if (!filteredGroups.length) {
      resultsByCorpus.innerHTML = '<div class="col-12"><div class="muted small">No hay resultados para el filtro seleccionado.</div></div>';
      return;
    }

    filteredGroups.forEach((group) => {
      const col = document.createElement('div');
      col.className = 'col-12';
      const header = document.createElement('div');
      header.className = 'd-flex align-items-center justify-content-between';
      const info = document.createElement('div');
      info.innerHTML = `
        <div class="fw-semibold">${langLabels[lang]} · ${group.label}</div>
        <div class="small muted">${group.count} ocurrencia(s) · ${group.books.size} libro(s).</div>
      `;
      const button = document.createElement('button');
      button.className = 'btn btn-soft btn-sm';
      button.type = 'button';
      button.textContent = group.expanded ? 'Ocultar' : `Ver ${group.count} resultados`;
      header.appendChild(info);
      header.appendChild(button);

      const list = document.createElement('div');
      list.className = 'mt-2 d-grid gap-1';
      const displayItems = group.expanded ? group.items : group.items.slice(0, 3);
      displayItems.forEach((item) => {
        const row = document.createElement('div');
        row.className = classForLang(lang);
        row.textContent = `${item.ref} · ${item.text}`;
        list.appendChild(row);
      });

      button.addEventListener('click', () => {
        group.expanded = !group.expanded;
        renderResults(groups, lang);
      });

      col.appendChild(header);
      col.appendChild(list);
      resultsByCorpus.appendChild(col);
    });
  }

  async function buildGroups(refs, lang) {
    const grouped = new Map();
    for (const ref of refs) {
      const [book, chapterRaw, verseRaw] = ref.split('|');
      const chapter = Number(chapterRaw);
      const verse = Number(verseRaw);
      const { key, label } = groupForBook(book);
      if (!grouped.has(key)) {
        grouped.set(key, { key, label, items: [], books: new Set(), count: 0, expanded: false });
      }
      const group = grouped.get(key);
      group.count += 1;
      group.books.add(book);
      if (group.items.length < 10) {
        try {
          const verses = await loadChapterText(lang, book, chapter);
          const verseText = verses?.[verse - 1] || '';
          group.items.push({
            ref: formatRef(book, chapter, verse),
            text: verseText
          });
        } catch (error) {
          group.items.push({
            ref: formatRef(book, chapter, verse),
            text: 'Texto no disponible.'
          });
        }
      }
    }
    return Array.from(grouped.values()).sort((a, b) => b.count - a.count);
  }

  async function buildSummary(term, lang, entry, refs) {
    const lemma = entry?.lemma || term;
    const transliteration = entry?.['Forma lexica'] || '—';
    const pos = extractPos(entry);
    const definition = entry?.definicion || '';
    const defShort = definition ? shortDefinition(definition) : '';
    const keywords = keywordList(definition);

    let sampleRef = null;
    let sampleText = '';
    let sampleEs = '';
    if (refs.length) {
      const [book, chapterRaw, verseRaw] = refs[0].split('|');
      const chapter = Number(chapterRaw);
      const verse = Number(verseRaw);
      sampleRef = formatRef(book, chapter, verse);
      try {
        const verses = await loadChapterText(lang, book, chapter);
        sampleText = verses?.[verse - 1] || '';
      } catch (error) {
        sampleText = 'Texto no disponible.';
      }
      if (lang !== 'es') {
        try {
          const versesEs = await loadChapterText('es', book, chapter);
          sampleEs = versesEs?.[verse - 1] || '';
        } catch (error) {
          sampleEs = '';
        }
      }
    }

    renderTags([
      `Lema: <span class="fw-semibold">${lemma}</span>`,
      `Transliteración: ${transliteration || '—'}`,
      `POS: ${pos}`
    ]);

    const summaryParts = [];
    if (defShort) summaryParts.push(defShort);
    if (!defShort && refs.length) {
      summaryParts.push(`Resumen por corpus: ${refs.length} ocurrencias en ${new Set(refs.map((r) => r.split('|')[0])).size} libro(s).`);
    }
    if (!summaryParts.length) summaryParts.push('No se encontró definición directa, se usa la concordancia del corpus para contexto.');
    lemmaSummary.textContent = summaryParts.join(' ');

    const cards = [];
    if (sampleRef && sampleText) {
      cards.push(`
        <div class="fw-semibold">Ejemplo en ${langLabels[lang]}</div>
        <div class="small muted">${sampleRef}</div>
        <div class="${classForLang(lang)}">${sampleText}</div>
      `);
    }
    if (sampleEs) {
      cards.push(`
        <div class="fw-semibold">Traducción RVR1960</div>
        <div class="small muted">Ejemplo contextual</div>
        <div>${sampleEs}</div>
      `);
    }
    if (keywords.length) {
      cards.push(`
        <div class="fw-semibold">Campos semánticos</div>
        <div class="small muted">${keywords.join(', ')}</div>
      `);
    }
    renderExamples(cards);

    const breakdownItems = [
      `Forma analizada: <span class="${classForLang(lang)}">${term}</span>.`,
      `Idioma detectado: ${langLabels[lang]}.`,
      `Lema principal: <span class="${classForLang(lang)}">${lemma}</span>.`,
      `Parte de la oración: ${pos}.`,
      `Definición: ${defShort || 'Sin definición directa en diccionario local; se utiliza concordancia del corpus.'}`,
      `Campos semánticos: ${keywords.length ? keywords.join(', ') : 'No disponible.'}`,
      `Frecuencia: ${refs.length} ocurrencia(s).`
    ];
    if (sampleRef && sampleText) {
      breakdownItems.push(`Ejemplo: ${sampleRef} · ${sampleText}`);
    }
    renderBreakdown(breakdownItems);

    textualNotes.textContent = entry
      ? 'Notas basadas en el diccionario griego y en el uso del corpus.'
      : 'Notas generadas desde las ocurrencias disponibles del corpus.';
  }

  async function analyze() {
    const term = queryInput.value.trim();
    if (!term) return;

    const lang = detectLang(term);
    const normalized = normalizeByLang(term, lang);

    let entry = null;
    if (lang === 'gr') {
      await loadDictionary();
      entry = state.dictMap.get(normalized) || null;
    }

    const index = await loadIndex(lang);
    const refs = index.tokens?.[normalized] || [];

    if (!refs.length) {
      renderTags([
        `Lema: <span class="fw-semibold">${term}</span>`,
        'Transliteración: —',
        'POS: —'
      ]);
      lemmaSummary.textContent = 'No se encontraron ocurrencias en los índices disponibles.';
      lemmaExamples.innerHTML = '';
      renderBreakdown([
        `Forma analizada: <span class="${classForLang(lang)}">${term}</span>.`,
        'No hay datos suficientes en el corpus para generar un desglose.'
      ]);
      textualNotes.textContent = 'Intenta con otra forma o revisa la ortografía.';
      resultsByCorpus.innerHTML = '<div class="col-12"><div class="muted small">Sin resultados en el corpus.</div></div>';
      state.last = { term, lang, refs: [] };
      return;
    }

    await buildSummary(term, lang, entry, refs);
    const groups = await buildGroups(refs, lang);
    renderResults(groups, lang);

    state.last = { term, lang, refs, groups };
  }

  function handleFilterClick(event) {
    const button = event.target.closest('button[data-filter]');
    if (!button) return;
    state.filter = button.dataset.filter || 'todo';
    document.querySelectorAll('button[data-filter]').forEach((btn) => {
      if (btn.dataset.filter === state.filter) {
        btn.classList.add('btn-primary');
        btn.classList.remove('btn-soft');
      } else {
        btn.classList.remove('btn-primary');
        btn.classList.add('btn-soft');
      }
    });
    if (state.last?.groups) {
      renderResults(state.last.groups, state.last.lang);
    }
  }

  function saveSession() {
    const payload = {
      query: queryInput.value.trim(),
      savedAt: new Date().toISOString()
    };
    localStorage.setItem('analisisSession', JSON.stringify(payload));
    saveStatus.textContent = 'Sesión guardada.';
    setTimeout(() => {
      saveStatus.textContent = '';
    }, 2000);
  }

  analyzeBtn?.addEventListener('click', analyze);
  queryInput?.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      analyze();
    }
  });

  document.body.addEventListener('click', handleFilterClick);
  saveSessionBtn?.addEventListener('click', saveSession);

  const saved = localStorage.getItem('analisisSession');
  if (saved) {
    try {
      const payload = JSON.parse(saved);
      if (payload.query) queryInput.value = payload.query;
    } catch (error) {
      localStorage.removeItem('analisisSession');
    }
  }

  analyze();
})();
