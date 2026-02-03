
 (() => {
   const DICT_URL = './diccionario/masterdiccionario.json';
   const SEARCH_INDEX = {
     es: './search/index-es.json',
     gr: './search/index-gr.json',
     he: './search/index-he.json'
   };
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
 
   const stopwords = new Set([
     'de', 'la', 'el', 'los', 'las', 'y', 'o', 'a', 'en', 'por', 'para',
     'un', 'una', 'unos', 'unas', 'del', 'al', 'que', 'se', 'con', 'como',
     'su', 'sus', 'es', 'son', 'lo', 'una', 'uno', 'tambien'
   ]);
  const hebrewStopwords = new Set([
    'ו', 'ה', 'את', 'יהוה', 'אלהים', 'אשר', 'כל', 'על', 'אל', 'ב', 'ל', 'מ', 'עם', 'כי'
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
  const NT_BOOKS = new Set([...GOSPELS, ...ACTS, ...LETTERS, ...APOCALYPSE]);
 
   const langLabels = {
     es: 'RVR1960',
     gr: 'NA28',
    he: 'Hebreo',
    lxx: 'LXX'
   };
 
   const state = {
     dict: null,
     dictMap: new Map(),
     indexes: {},
     textCache: new Map(),
    lxxFileCache: new Map(),
    lxxSearchCache: new Map(),
     filter: 'todo',
     last: null
   };
 
   const queryInput = document.getElementById('queryInput');
   const analyzeBtn = document.getElementById('analyzeBtn');
   const lemmaTags = document.getElementById('lemmaTags');
   const lemmaSummary = document.getElementById('lemmaSummary');
  const lemmaCorrespondence = document.getElementById('lemmaCorrespondence');
   const lemmaExamples = document.getElementById('lemmaExamples');
   const resultsByCorpus = document.getElementById('resultsByCorpus');
   const saveSessionBtn = document.getElementById('saveSessionBtn');
   const saveStatus = document.getElementById('saveStatus');
 
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
    const sample = String(text || '');
    if (/[\u0590-\u05FF]/.test(sample)) return 'he';
    if (/[\u0370-\u03FF\u1F00-\u1FFF]/.test(sample)) return 'gr';
    return 'es';
  }

  function normalizeByLang(text, lang) {
    if (lang === 'gr') return normalizeGreek(text);
    if (lang === 'he') return normalizeHebrew(text);
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
 
  async function loadLxxFile(file) {
    if (state.lxxFileCache.has(file)) return state.lxxFileCache.get(file);
    const res = await fetch(`./LXX/${file}`);
    if (!res.ok) throw new Error(`No se pudo cargar ${file}`);
    const data = await res.json();
    state.lxxFileCache.set(file, data);
    return data;
  }

  function transliterateHebrew(word) {
    if (!word) return '—';
    const consonants = {
      'א': '',
      'ב': 'b',
      'ג': 'g',
      'ד': 'd',
      'ה': 'h',
      'ו': 'v',
      'ז': 'z',
      'ח': 'j',
      'ט': 't',
      'י': 'y',
      'כ': 'k',
      'ך': 'k',
      'ל': 'l',
      'מ': 'm',
      'ם': 'm',
      'נ': 'n',
      'ן': 'n',
      'ס': 's',
      'ע': '\'',
      'פ': 'p',
      'ף': 'p',
      'צ': 'ts',
      'ץ': 'ts',
      'ק': 'q',
      'ר': 'r',
      'ש': 'sh',
      'ת': 't'
    };
    const vowelMap = {
      '\u05B0': 'e',
      '\u05B1': 'e',
      '\u05B2': 'a',
      '\u05B3': 'a',
      '\u05B4': 'i',
      '\u05B5': 'e',
      '\u05B6': 'e',
      '\u05B7': 'a',
      '\u05B8': 'a',
      '\u05B9': 'o',
      '\u05BB': 'u',
      '\u05C7': 'o'
    };
    const decomposed = word.normalize('NFD');
    let output = '';
     for (let i = 0; i < decomposed.length; i += 1) {
      const char = decomposed[i];
      if (!consonants.hasOwnProperty(char)) {
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
        vowel = vowelMap[decomposed[j]] || '';
        j += 1;
      }
      if (char === 'ש') {
        consonant = hasSinDot ? 's' : 'sh';
      }
      if (char === 'ו' && vowel) {
        consonant = '';
      }
      output = `${consonant}${vowel}`;
    }
    return output.replace(/''/g, '\'').trim() || '—';
  }

  async function buildLxxMatches(normalizedGreek, maxRefs = 40) {
    if (!normalizedGreek) return { refs: [], texts: new Map() };
    if (state.lxxSearchCache.has(normalizedGreek)) return state.lxxSearchCache.get(normalizedGreek);
    const refs = [];
    const texts = new Map();
    for (const file of LXX_FILES) {
      if (refs.length >= maxRefs) break;
      try {
        const data = await loadLxxFile(file);
        const text = data?.text || {};
        for (const [book, chapters] of Object.entries(text)) {
          for (const [chapter, verses] of Object.entries(chapters || {})) {
            for (const [verse, tokens] of Object.entries(verses || {})) {
              const hit = (tokens || []).some((token) => {
                const lemmaKey = normalizeGreek(token?.lemma || '');
                const wordKey = normalizeGreek(token?.w || '');
                return lemmaKey === normalizedGreek || wordKey === normalizedGreek;
              });
              if (!hit) continue;
              const ref = `${book}|${chapter}|${verse}`;
              if (!texts.has(ref)) {
                const verseText = (tokens || []).map((token) => token.w).join(' ');
                refs.push(ref);
                texts.set(ref, verseText);
              }
              if (refs.length >= maxRefs) break;
            }
            if (refs.length >= maxRefs) break;
          }
          if (refs.length >= maxRefs) break;
        }
      } catch (error) {
        continue;
      }
    }
    const payload = { refs, texts };
    state.lxxSearchCache.set(normalizedGreek, payload);
    return payload;
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
     const trimmed = text.replace(/\s/g, ' ').trim();
     const split = trimmed.split('. ');
     return split[0] || trimmed;
   }
 
   function keywordList(text) {
     if (!text) return [];
     const cleaned = text
       .replace(/[()]/g, ' ')
       .replace(/[^a-zA-ZáéíóúñüÁÉÍÓÚÑÜ\s]/g, ' ')
       .toLowerCase();
     const words = cleaned.split(/\s/).filter(Boolean);
     const keywords = [];
     for (const word of words) {
       if (stopwords.has(word)) continue;
       if (!keywords.includes(word)) keywords.push(word);
       if (keywords.length >= 6) break;
     }
     return keywords;
   }
 
  function splitRefsByTestament(refs) {
    const ot = [];
    const nt = [];
    refs.forEach((ref) => {
      const [book] = ref.split('|');
      if (NT_BOOKS.has(book)) {
        nt.push(ref);
      } else {
        ot.push(ref);
      }
    });
    return { ot, nt };
  }

  async function findGreekEntryForSpanish(term) {
    const target = normalizeSpanish(term);
    if (!target) return null;
    const dict = await loadDictionary();
    const items = dict.items || [];
    for (const item of items) {
      const def = normalizeSpanish(item.definicion || '');
      if (def && def.includes(target)) return item;
      const entry = normalizeSpanish(item.entrada_impresa || '');
      if (entry && entry.includes(target)) return item;
    }
    return null;
  }

  async function buildHebrewCandidateFromRefs(refs) {
    const counts = new Map();
    const samples = new Map();
    const limitedRefs = refs.slice(0, 40);
    for (const ref of limitedRefs) {
      const [book, chapterRaw, verseRaw] = ref.split('|');
      const chapter = Number(chapterRaw);
      const verse = Number(verseRaw);
      try {
        const verses = await loadChapterText('he', book, chapter);
        const verseText = verses?.[verse - 1] || '';
        const tokens = verseText.split(/\s/).filter(Boolean);
        tokens.forEach((token) => {
          const cleaned = token.replace(/[׃,:;.!?()"“”]/g, '');
          const normalized = normalizeHebrew(cleaned);
          if (!normalized || hebrewStopwords.has(normalized)) return;
          counts.set(normalized, (counts.get(normalized) || 0) + 1);
          if (!samples.has(normalized)) samples.set(normalized, cleaned);
        });
      } catch (error) {
        continue;
      }
    }
    if (!counts.size) return null;
    const [best] = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
    const word = samples.get(best) || best;
    return {
      normalized: best,
      word,
      transliteration: transliterateHebrew(word)
    };
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
    if (lang === 'gr' || lang === 'lxx') return 'greek';
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
 
  function renderCorrespondence(cards) {
    lemmaCorrespondence.innerHTML = '';
    if (!cards.length) {
      lemmaCorrespondence.innerHTML = '<div class="small muted">Sin correspondencias disponibles.</div>';
      return;
    }
    cards.forEach((card) => {
      const div = document.createElement('div');
      div.className = 'example-card';
      div.innerHTML = card;
      lemmaCorrespondence.appendChild(div);
     });
   }
 
  async function buildSamplesForRefs(refs, lang, max = 7, preloadedTexts = null) {
    const samples = [];
    for (const ref of refs.slice(0, max)) {
      const [book, chapterRaw, verseRaw] = ref.split('|');
      const chapter = Number(chapterRaw);
      const verse = Number(verseRaw);
      let verseText = '';
      if (preloadedTexts?.has?.(ref)) {
        verseText = preloadedTexts.get(ref) || '';
      } else {
        try {
          const verses = await loadChapterText(lang, book, chapter);
          verseText = verses?.[verse - 1] || '';
        } catch (error) {
          verseText = 'Texto no disponible.';
        }
      }
      samples.push({
        ref: formatRef(book, chapter, verse),
        text: verseText
      });
    }
    return samples;
  }

  function buildCorrespondenceCard({ title, word, transliteration, samples, lang }) {
    const wordLine = word
      ? `<div class="${classForLang(lang)} fw-semibold">${word}</div>`
      : '<div class="muted">—</div>';
    const translitLine = transliteration ? `<div class="small muted">Translit.: ${transliteration}</div>` : '';
    const sampleLines = samples.length
      ? samples.map((sample) => `<div class="small">${sample.ref} · ${sample.text}</div>`).join('')
      : '<div class="small muted">Sin ejemplos.</div>';
    return `
      <div class="fw-semibold">${title}</div>
      ${wordLine}
      ${translitLine}
      <div class="mt-1 d-grid gap-1">${sampleLines}</div>
    `;
  }

  function renderResults(groupsByCorpus) {
    resultsByCorpus.innerHTML = '';
    if (!groupsByCorpus.length) {
      resultsByCorpus.innerHTML = '<div class="col-12"><div class="muted small">Sin resultados en el corpus.</div></div>';
       return;
     }

    groupsByCorpus.forEach(({ lang, groups }) => {
      const wrapper = document.createElement('div');
      wrapper.className = 'col-12';
       const header = document.createElement('div');
      header.className = 'fw-semibold mb-2';
      header.textContent = langLabels[lang] || lang;
      wrapper.appendChild(header);

      const filteredGroups = groups.filter((group) => {
        if (state.filter === 'todo') return true;
        return group.category === state.filter;
       });
 

      if (!filteredGroups.length) {
        const empty = document.createElement('div');
        empty.className = 'muted small';
        empty.textContent = 'No hay resultados para el filtro seleccionado.';
        wrapper.appendChild(empty);
        resultsByCorpus.appendChild(wrapper);
        return;
      }

      filteredGroups.forEach((group) => {
        const col = document.createElement('div');
        col.className = 'mb-3';
        const info = document.createElement('div');
        info.className = 'd-flex align-items-center justify-content-between';
        const meta = document.createElement('div');
        meta.innerHTML = `
          <div class="fw-semibold">${group.label}</div>
          <div class="small muted">${group.count} ocurrencia(s).</div>
        `;
        const button = document.createElement('button');
        button.className = 'btn btn-soft btn-sm';
        button.type = 'button';
        button.textContent = group.expanded ? 'Ocultar' : `Ver ${group.count} resultados`;
        info.appendChild(meta);
        info.appendChild(button);

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
          renderResults(groupsByCorpus);
        });

        col.appendChild(info);
        col.appendChild(list);
        wrapper.appendChild(col);
       });
 

      resultsByCorpus.appendChild(wrapper);
     });
   }
 

  async function buildBookGroups(refs, lang, preloadedTexts = null) {
     const grouped = new Map();
     for (const ref of refs) {
       const [book, chapterRaw, verseRaw] = ref.split('|');
       const chapter = Number(chapterRaw);
       const verse = Number(verseRaw);
       const { key, label } = groupForBook(book);

      if (!grouped.has(book)) {
        grouped.set(book, {
          label: book.replace(/_/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase()),
          items: [],
          count: 0,
          expanded: false,
          category: key,
          categoryLabel: label
        });
       }

      const group = grouped.get(book);
       group.count = 1;

      if (group.items.length < 12) {
         try {

          const verseText = preloadedTexts?.get?.(ref);
          if (!verseText) throw new Error('no preloaded');
           group.items.push({
             ref: formatRef(book, chapter, verse),
             text: verseText
           });
         } catch (error) {
          try {
            const verses = await loadChapterText(lang, book, chapter);
            const verseText = verses?.[verse - 1] || '';
            group.items.push({
              ref: formatRef(book, chapter, verse),
              text: verseText
            });
          } catch (innerError) {
            group.items.push({
              ref: formatRef(book, chapter, verse),
              text: 'Texto no disponible.'
            });
          }
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
    const summaryParts = [];
    if (defShort) summaryParts.push(defShort);
    if (definition && definition !== defShort) summaryParts.push(definition);

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
        if (lang !== 'es') {
          const versesEs = await loadChapterText('es', book, chapter);
          sampleEs = versesEs?.[verse - 1] || '';
        }
      } catch (error) {
        sampleText = '';
        sampleEs = '';
      }
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
      renderCorrespondence([]);
       lemmaExamples.innerHTML = '';
      state.last = { term, lang, refs: [], groupsByCorpus: [] };
       return;
     }
 
     await buildSummary(term, lang, entry, refs);
    const esIndex = await loadIndex('es');
    const esNormalized = lang === 'es' ? normalized : normalizeSpanish(term);
    const esRefs = esIndex.tokens?.[esNormalized] || [];
    const { ot: esOtRefs, nt: esNtRefs } = splitRefsByTestament(esRefs);

    let greekEntry = entry;
    let greekTerm = null;
    if (lang === 'gr') {
      greekTerm = normalized;
    } else if (lang === 'es') {
      greekEntry = await findGreekEntryForSpanish(term);
      greekTerm = greekEntry ? normalizeGreek(greekEntry.lemma) : null;
    }

    const greekTranslit = greekEntry?.['Forma lexica'] || '—';
    const greekLemma = greekEntry?.lemma || (lang === 'gr' ? term : '—');

    const grIndex = await loadIndex('gr');
    const grRefs = greekTerm ? (grIndex.tokens?.[greekTerm] || []) : [];
    const lxxMatches = greekTerm ? await buildLxxMatches(greekTerm, 70) : { refs: [], texts: new Map() };

    let hebrewCandidate = null;
    if (lang === 'he') {
      hebrewCandidate = {
        normalized,
        word: term,
        transliteration: transliterateHebrew(term)
      };
    } else if (esOtRefs.length) {
      hebrewCandidate = await buildHebrewCandidateFromRefs(esOtRefs);
    }
    const heIndex = await loadIndex('he');
    const heRefs = hebrewCandidate ? (heIndex.tokens?.[hebrewCandidate.normalized] || []) : [];

    const cards = [];
    if (greekTerm) {
      const grSamples = await buildSamplesForRefs(grRefs, 'gr', 7);
      cards.push(buildCorrespondenceCard({
        title: 'NA28 (NT)',
        word: greekLemma,
        transliteration: greekTranslit,
        samples: grSamples,
        lang: 'gr'
      }));
    }
    if (greekTerm) {
      const lxxSamples = await buildSamplesForRefs(lxxMatches.refs, 'lxx', 7, lxxMatches.texts);
      cards.push(buildCorrespondenceCard({
        title: 'LXX (AT)',
        word: greekLemma,
        transliteration: greekTranslit,
        samples: lxxSamples,
        lang: 'lxx'
      }));
    }
    if (hebrewCandidate) {
      const heSamples = await buildSamplesForRefs(heRefs, 'he', 7);
      cards.push(buildCorrespondenceCard({
        title: 'Hebreo (AT)',
        word: hebrewCandidate.word,
        transliteration: hebrewCandidate.transliteration,
        samples: heSamples,
        lang: 'he'
      }));
    }
    if (esOtRefs.length) {
      const esOtSamples = await buildSamplesForRefs(esOtRefs, 'es', 7);
      cards.push(buildCorrespondenceCard({
        title: 'RVR1960 (AT)',
        word: term,
        transliteration: '',
        samples: esOtSamples,
        lang: 'es'
      }));
    }
    if (esNtRefs.length) {
      const esNtSamples = await buildSamplesForRefs(esNtRefs, 'es', 7);
      cards.push(buildCorrespondenceCard({
        title: 'RVR1960 (NT)',
        word: term,
        transliteration: '',
        samples: esNtSamples,
        lang: 'es'
      }));
    }
    renderCorrespondence(cards);

    const groupsByCorpus = [
      { lang: 'gr', groups: await buildBookGroups(grRefs, 'gr') },
      { lang: 'lxx', groups: await buildBookGroups(lxxMatches.refs, 'lxx', lxxMatches.texts) },
      { lang: 'he', groups: await buildBookGroups(heRefs, 'he') },
      { lang: 'es', groups: await buildBookGroups(esRefs, 'es') }
    ];
    renderResults(groupsByCorpus);
 

    state.last = { term, lang, refs, groupsByCorpus };
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

  if (state.last?.groupsByCorpus) {
      renderResults(state.last.groupsByCorpus || []);
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
})();
