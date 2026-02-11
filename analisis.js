
 (() => {
   const DICT_URL = './diccionario/masterdiccionario.json';
   const HEBREW_DICT_URL = './diccionario/diccionario_unificado.min.json';
   const SEARCH_INDEX = {
     es: './search/index-es.json',
     gr: './search/index-gr.json',
     he: './search/index-he.json'
   };
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
   const stopwords = new Set([
    'de', 'la', 'el', 'los', 'las', 'y', 'o', 'a', 'en', 'por', 'para',
    'un', 'una', 'unos', 'unas', 'del', 'al', 'que', 'se', 'con', 'como',
    'su', 'sus', 'es', 'son', 'lo', 'una', 'uno', 'tambien'
  ]);
  const greekStopwords = new Set([
    'και', 'δε', 'ο', 'η', 'το', 'του', 'της', 'των', 'τω', 'τον', 'την',
    'εις', 'εν', 'αυτος', 'αυτη', 'αυτο', 'ου', 'μη', 'γαρ', 'δε',
    'ως', 'επι', 'προς', 'δια', 'μετα', 'κατα', 'εκ', 'υπο'
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
     gr: 'RKANT',
    he: 'Hebreo',
    lxx: 'LXX'
   };
 
 const state = {
    dict: null,
    dictMap: new Map(),
    hebrewDict: null,
    hebrewDictMap: new Map(),
     indexes: {},
     textCache: new Map(),
    lxxFileCache: new Map(),
    lxxBookCache: new Map(),
    lxxVerseCache: new Map(),
  lxxBookStatsCache: new Map(),
    lxxSearchCache: new Map(),
     filter: 'todo',
    last: null,
     isLoading: false
    };
  const jsonCache = new Map();
 
   const queryInput = document.getElementById('queryInput');
   const analyzeBtn = document.getElementById('analyzeBtn');
   const lemmaTags = document.getElementById('lemmaTags');
   const lemmaSummary = document.getElementById('lemmaSummary');
  const lemmaCorrespondence = document.getElementById('lemmaCorrespondence');
   const lemmaExamples = document.getElementById('lemmaExamples');
   const resultsByCorpus = document.getElementById('resultsByCorpus');
   const resultsLoadingIndicator = document.getElementById('resultsLoadingIndicator');

  const nextFrame = () => new Promise((resolve) => requestAnimationFrame(resolve));

  function setLoading(isLoading) {
    state.isLoading = isLoading;
  
   if (resultsLoadingIndicator) resultsLoadingIndicator.hidden = !isLoading;
    if (analyzeBtn) analyzeBtn.disabled = isLoading;
  }
 
function normalizeGreek(text) {
    return String(text || '')
      .replace(/[··.,;:!?“”"(){}\[\]<>«»]/g, '')
      .replace(/\s/g, '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
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
  function buildGreekSearchKeys(normalized) {
    if (!normalized) return [];
    const variants = new Set();
    const chars = normalized.split('');
    const swapMap = {
      β: 'υ',
      υ: 'β'
    };
    const walk = (index, current) => {
      if (index >= chars.length) {
        variants.add(current);
        return;
      }
      const ch = chars[index];
      const swap = swapMap[ch];
      walk(index + 1, `${current}${ch}`);
      if (swap) {
        walk(index + 1, `${current}${swap}`);
      }
    };
    walk(0, '');
    return [...variants];
  }
 function escapeHtml(text) {
    return String(text ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
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
  function getHebrewDefinition(entry) {
    return entry?.definitions?.short || entry?.strong_detail?.definicion || entry?.descripcion || '';
  }
  function normalizeTransliteration(text) {
    return normalizeSpanish(text).replace(/ñ/g, 'n');
  }

  function buildTranslitVariants(text) {
    const base = normalizeTransliteration(text);
    if (!base) return [];
    const variants = new Set([base]);
    variants.add(base.replace(/u/g, 'v'));
    variants.add(base.replace(/v/g, 'u'));
    variants.add(base.replace(/y/g, 'i'));
    variants.add(base.replace(/i/g, 'y'));
    variants.add(base.replace(/au/g, 'av'));
    variants.add(base.replace(/ou/g, 'ov'));
    return [...variants].filter(Boolean);
  }
  function getNormalizedQuery(lang, query) {
    if (lang === 'gr' || lang === 'lxx') return normalizeGreek(query);
    if (lang === 'he') return normalizeHebrew(query);
    return normalizeSpanish(query);
  }

  function buildTokenRegex(token, lang) {
    const escaped = token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    if (lang === 'es') {
      return new RegExp(escaped, 'gi');
    }

    const letters = [];
    for (const ch of escaped) {
      if (ch === '\\') continue;
      if (lang === 'gr' && ch === 'σ') {
        letters.push('[σς]');
      } else {
        letters.push(ch);
      }
    }
    const pattern = letters.map((letter) => `${letter}\\p{M}*`).join('');
    return new RegExp(pattern, 'giu');
  }

  function highlightText(text, query, lang) {
    const raw = String(text ?? '');
    const normalizedQuery = String(query ?? '').trim();
    if (!raw || !normalizedQuery) return escapeHtml(raw);

    const safe = escapeHtml(raw);
    const normalized = getNormalizedQuery(lang, normalizedQuery);
    const tokens = normalized.split(' ').map((token) => token.trim()).filter((token) => token.length >= 2);
    if (!tokens.length) return safe;

    let output = safe;
    for (const token of tokens) {
      const re = buildTokenRegex(token, lang);
      output = output.replace(re, (match) => `<mark>${match}</mark>`);
    }
    return output;
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
function getGreekRefs(normalized, index) {
    if (!normalized) return [];
    const keys = buildGreekSearchKeys(normalized);
    const refs = [];
    const seen = new Set();
    keys.forEach((key) => {
      const matches = index.tokens?.[key] || [];
      matches.forEach((ref) => {
        if (seen.has(ref)) return;
        seen.add(ref);
        refs.push(ref);
      });
    });
    return refs;
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

  async function loadDictionary() {
    if (state.dict) return state.dict;
    const data = await loadJson(DICT_URL);
    state.dict = data;
    const map = new Map();
    const translitMap = new Map();
    (data.items || []).forEach((item) => {
      const lemmaKey = normalizeGreek(item.lemma);
      const formKey = normalizeGreek(item['Forma flexionada del texto']);
      if (lemmaKey && !map.has(lemmaKey)) map.set(lemmaKey, item);
      if (formKey && !map.has(formKey)) map.set(formKey, item);
      const translitKeys = [
        ...buildTranslitVariants(item['Forma lexica']),
        ...buildTranslitVariants(item['Forma flexionada del texto'])
      ];
      translitKeys.forEach((key) => {
        if (!key || translitMap.has(key)) return;
        translitMap.set(key, item);
      });
    });
    state.dictMap = map;
    state.dictTranslitMap = translitMap;
    return data;
  }
  async function findGreekEntryFromSpanish(term) {
    if (!term) return null;
    await loadDictionary();
    const tokens = String(term || '').split(/\s+/).filter(Boolean);
    const candidates = [term, ...tokens];
    for (const candidate of candidates) {
      const key = normalizeTransliteration(candidate);
      if (!key) continue;
      const entry = state.dictTranslitMap.get(key);
      if (entry) return entry;
    }
    return null;
  }
 async function loadHebrewDictionary() {
    if (state.hebrewDict) return state.hebrewDict;
    const data = await loadJson(HEBREW_DICT_URL);
    state.hebrewDict = data;
    const map = new Map();
    (data || []).forEach((item) => {
     const keys = [
        item?.palabra,
        item?.lemma,
        item?.hebreo,
        item?.forma,
        ...(item?.forms || []),
        ...(item?.formas || []),
        ...(item?.hebreos || [])
      ]
        .map((token) => normalizeHebrew(token || ''))
        .filter(Boolean);
      keys.forEach((key) => {
        if (!map.has(key)) map.set(key, item);
      });
    });
    state.hebrewDictMap = map;
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

  async function rankGreekCandidatesByLxxStats(counts, samples, usedBooks) {
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
    if (!totalVerses) return pickBestCandidate(counts, samples);
    const ranked = [...counts.entries()].map(([lemma, hits]) => {
      const df = verseFreq.get(lemma) || 0;
      const score = hits * Math.log((totalVerses + 1) / (df + 1));
      return { lemma, hits, score };
    }).sort((a, b) => (b.score - a.score) || (b.hits - a.hits));
    const best = ranked[0];
    if (!best) return null;
    return {
      normalized: best.lemma,
      lemma: samples.get(best.lemma) || best.lemma,
      count: best.hits
    };
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

   function pickBestCandidate(counts, samples) {
    if (!counts.size) return null;
    const [best, count] = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
    return {
      normalized: best,
      lemma: samples.get(best) || best,
      count
    };
  }

  function cleanGreekToken(token) {
    return String(token || '').replace(/[··.,;:!?“”"(){}\[\]<>«»]/g, '');
  }

  async function buildGreekCandidateFromHebrewRefs(refs) {
    if (!refs.length) return null;
    const counts = new Map();
    const samples = new Map();
    for (const ref of refs.slice(0, 40)) {
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
          if (!normalized) return;
          if (greekStopwords.has(normalized)) return;
         verseLemmas.add(normalized);
          if (!samples.has(normalized) && token?.lemma) samples.set(normalized, token.lemma);
        });
        verseLemmas.forEach((lemma) => {
          counts.set(lemma, (counts.get(lemma) || 0) + 1);
        });
      }
    }
   return rankGreekCandidatesByLxxStats(counts, samples, usedBooks);
  }

  async function buildGreekCandidateFromGreekRefs(refs) {
    if (!refs.length) return null;
    const counts = new Map();
    const samples = new Map();
   const usedBooks = new Set();
    for (const ref of refs.slice(0, 40)) {
      const [book, chapterRaw, verseRaw] = ref.split('|');
      const chapter = Number(chapterRaw);
      const verse = Number(verseRaw);
      try {
        const verses = await loadChapterText('gr', book, chapter);
        const verseText = verses?.[verse - 1] || '';
        const tokens = verseText.split(/\s+/).filter(Boolean);
        tokens.forEach((token) => {
          const cleaned = cleanGreekToken(token);
          const normalized = normalizeGreek(cleaned);
          if (!normalized || greekStopwords.has(normalized)) return;
          counts.set(normalized, (counts.get(normalized) || 0) + 1);
          if (!samples.has(normalized)) samples.set(normalized, cleaned);
        });
      } catch (error) {
        continue;
      }
    }
    return pickBestCandidate(counts, samples);
  }

  async function buildGreekCandidateFromLxxRefs(refs) {
    if (!refs.length) return null;
    const counts = new Map();
    const samples = new Map();
    const usedBooks = new Set();
    for (const ref of refs.slice(0, 40)) {
      const [book, chapterRaw, verseRaw] = ref.split('|');
      const chapter = Number(chapterRaw);
      const verse = Number(verseRaw);
      const tokens = await loadLxxVerseTokens(book, chapter, verse);
      if (!tokens) continue;
      usedBooks.add(book);
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
    return rankGreekCandidatesByLxxStats(counts, samples, usedBooks);
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

  function extractSpanishTokensFromDefinition(definition) {
    if (!definition) return [];
    const cleaned = definition
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zñ\s]/g, ' ');
    const words = cleaned.split(/\s+/).filter((word) => word.length >= 3);
    const extraStopwords = new Set([
      'lit', 'nt', 'lxx', 'pl', 'sg', 'adj', 'adv', 'pron', 'conj', 'prep',
      'part', 'indecl', 'num', 'prop', 'pers', 'rel', 'dem', 'interj', 'fig',
      'met', 'art'
    ]);
    const tokens = [];
    words.forEach((word) => {
      if (stopwords.has(word) || extraStopwords.has(word)) return;
      if (!tokens.includes(word)) tokens.push(word);
    });
    return tokens;
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

function mapOtRefsToLxxRefs(refs) {
    return refs
      .flatMap((ref) => {
        const [book, chapter, verse] = ref.split('|');
        const lxxCodes = HEBREW_SLUG_TO_LXX[book] || [];
        return lxxCodes.map((code) => `${code}|${chapter}|${verse}`);
      })
      .filter(Boolean);
  }
   function mapLxxRefsToHebrewRefs(refs) {
    return refs
      .map((ref) => {
        const [book, chapter, verse] = ref.split('|');
        const slug = LXX_TO_HEBREW_SLUG[book];
        if (!slug) return null;
        return `${slug}|${chapter}|${verse}`;
      })
      .filter(Boolean);
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
    const candidate = pickBestCandidate(counts, samples);
    if (!candidate) return null;
    const word = candidate.lemma || candidate.normalized;
    return {
      normalized: candidate.normalized,
      word,
      transliteration: transliterateHebrew(word),
      count: candidate.count
    };
  }

   async function buildHebrewCandidateFromLxxRefs(refs) {
    const mappedRefs = refs
      .map((ref) => {
        const [book, chapter, verse] = ref.split('|');
        const slug = LXX_TO_HEBREW_SLUG[book];
        if (!slug) return null;
        return `${slug}|${chapter}|${verse}`;
      })
      .filter(Boolean);
    return buildHebrewCandidateFromRefs(mappedRefs);
  }

  function groupForBook(book) {
     const slug = LXX_TO_HEBREW_SLUG[book] || book;
     if (TORAH.includes(slug)) return { key: 'torah', label: 'Torah' };
     if (PROPHETS.includes(slug)) return { key: 'profetas', label: 'Profetas' };
     if (WRITINGS.includes(slug)) return { key: 'escritos', label: 'Escritos' };
     if (GOSPELS.includes(slug)) return { key: 'evangelios', label: 'Evangelios' };
     if (ACTS.includes(slug)) return { key: 'hechos', label: 'Hechos' };
     if (LETTERS.includes(slug)) return { key: 'cartas', label: 'Cartas' };
     if (APOCALYPSE.includes(slug)) return { key: 'apocalipsis', label: 'Apocalipsis' };
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
 
  async function buildSamplesForRefs(refs, lang, max = 3, preloadedTexts = null) {
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

  function buildCorrespondenceCard({ title, word, transliteration, samples, lang, highlightQuery }) {
    const wordLine = word
      ? `<div class="${classForLang(lang)} fw-semibold">${highlightText(word, highlightQuery, lang)}</div>`
      : '<div class="muted">—</div>';
    const translitLine = transliteration ? `<div class="small muted">Translit.: ${transliteration}</div>` : '';
    const sampleLines = samples.length
      ? samples.map((sample) => `<div class="small">${escapeHtml(sample.ref)} · ${highlightText(sample.text, highlightQuery, lang)}</div>`).join('')
      : '<div class="small muted">Sin ejemplos.</div>';
    return `
      <div class="fw-semibold">${title}</div>
      ${wordLine}
      ${translitLine}
      <div class="mt-1 d-grid gap-1">${sampleLines}</div>
    `;
  }

 function renderResults(groupsByCorpus, highlightQueries = state.last?.highlightQueries || {}) {
    resultsByCorpus.innerHTML = '';
    if (!groupsByCorpus.length) {
      resultsByCorpus.innerHTML = '<div class="col-12"><div class="muted small">Sin resultados en el corpus.</div></div>';
       return;
     }

   groupsByCorpus.forEach((corpus) => {
      const { lang, groups } = corpus;
      const wrapper = document.createElement('div');
      wrapper.className = 'col-12';
       const header = document.createElement('div');
      header.className = 'fw-semibold mb-2';
      header.textContent = langLabels[lang] || lang;
      wrapper.appendChild(header);

    if (corpus.loading) {
        const loading = document.createElement('div');
        loading.className = 'muted small';
        loading.textContent = 'Cargando resultados...';
        wrapper.appendChild(loading);
        resultsByCorpus.appendChild(wrapper);
        return;
      }
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

            const totalCount = filteredGroups.reduce((sum, group) => sum + group.count, 0);
      const info = document.createElement('div');
      info.className = 'd-flex align-items-center justify-content-between mb-2';
      const meta = document.createElement('div');
      meta.innerHTML = `
        <div class="fw-semibold">Resultados en ${filteredGroups.length} libro(s)</div>
        <div class="small muted">${totalCount} ocurrencia(s) en total.</div>
      `;
      const button = document.createElement('button');
      button.className = 'btn btn-soft btn-sm';
      button.type = 'button';
      button.textContent = corpus.expanded ? 'Ocultar resultados' : 'Ver resultados';
      info.appendChild(meta);
      info.appendChild(button);
      wrapper.appendChild(info);

      const list = document.createElement('div');
      list.className = 'd-grid gap-2';
      if (corpus.expanded) {
        filteredGroups.forEach((group) => {
          const bookBlock = document.createElement('div');
          bookBlock.className = 'mb-2';
          const bookHeader = document.createElement('div');
          bookHeader.className = 'fw-semibold';
          bookHeader.textContent = group.label;
          const bookMeta = document.createElement('div');
          bookMeta.className = 'small muted';
         if (lang === 'es' && group.limit) {
            bookMeta.textContent = `${group.loadedCount} de ${group.count} ocurrencia(s).`;
          } else {
            bookMeta.textContent = `${group.count} ocurrencia(s).`;
          }
          bookBlock.appendChild(bookHeader);
          bookBlock.appendChild(bookMeta);
          const bookList = document.createElement('div');
          bookList.className = 'mt-1 d-grid gap-1';
         const highlightQuery = highlightQueries[lang] || '';
          group.items.forEach((item) => {
            const row = document.createElement('div');
            row.className = classForLang(lang);
            row.innerHTML = `${escapeHtml(item.ref)} · ${highlightText(item.text, highlightQuery, lang)}`;
            bookList.appendChild(row);
          });
          bookBlock.appendChild(bookList);
         if (lang === 'es' && group.hasMore) {
            const loadMoreWrapper = document.createElement('div');
            loadMoreWrapper.className = 'mt-2';
            const loadMoreButton = document.createElement('button');
            loadMoreButton.className = 'btn btn-soft btn-sm';
            loadMoreButton.type = 'button';
            loadMoreButton.disabled = group.loadingMore;
            loadMoreButton.textContent = group.loadingMore
              ? 'Cargando...'
              : 'Cargar más en RVR1960';
            loadMoreButton.addEventListener('click', async () => {
              if (group.loadingMore) return;
              group.loadingMore = true;
              renderResults(groupsByCorpus);
              await loadMoreRvr1960(group);
              group.loadingMore = false;
              renderResults(groupsByCorpus);
            });
            loadMoreWrapper.appendChild(loadMoreButton);
            bookBlock.appendChild(loadMoreWrapper);
          }
          list.appendChild(bookBlock);
        });
       }
      wrapper.appendChild(list);
    
       button.addEventListener('click', () => {
        corpus.expanded = !corpus.expanded;
        renderResults(groupsByCorpus);
      });
 

      resultsByCorpus.appendChild(wrapper);
     });
   }
 

  async function buildBookGroups(refs, lang, preloadedTexts = null) {
     const grouped = new Map();
     refs.forEach((ref) => {
       const [book] = ref.split('|');
       if (!grouped.has(book)) grouped.set(book, []);
       grouped.get(book).push(ref);
     });
     
        const limit = lang === 'es' ? 20 : 12;
     const groups = [];
     for (const [book, bookRefs] of grouped.entries()) {
       const { key, label } = groupForBook(book);
       const group = {
         label: book.replace(/_/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase()),
         items: [],
         count: bookRefs.length,
         expanded: false,
         category: key,
         categoryLabel: label,
         refs: bookRefs,
         limit,
         loadedCount: 0,
         hasMore: false,
         loadingMore: false
       };
       const refsToLoad = bookRefs.slice(0, limit);
       for (const ref of refsToLoad) {
         const [bookName, chapterRaw, verseRaw] = ref.split('|');
         const chapter = Number(chapterRaw);
         const verse = Number(verseRaw);
         try {

          const verseText = preloadedTexts?.get?.(ref);
           if (!verseText) throw new Error('no preloaded');
           group.items.push({
             ref: formatRef(bookName, chapter, verse),
             text: verseText
           });
         } catch (error) {
          try {
             const verses = await loadChapterText(lang, bookName, chapter);
             const verseText = verses?.[verse - 1] || '';
             group.items.push({
               ref: formatRef(bookName, chapter, verse),
               text: verseText
             });
           } catch (innerError) {
             group.items.push({
               ref: formatRef(bookName, chapter, verse),
               text: 'Texto no disponible.'
             });
           }
         }
       }
      group.loadedCount = group.items.length;
       group.hasMore = lang === 'es' && group.loadedCount < group.count;
       groups.push(group);
       }
    return groups.sort((a, b) => b.count - a.count);
   }
 async function loadMoreRvr1960(group) {
    const refsToLoad = group.refs.slice(group.loadedCount);
    for (const ref of refsToLoad) {
      const [book, chapterRaw, verseRaw] = ref.split('|');
      const chapter = Number(chapterRaw);
      const verse = Number(verseRaw);
      try {
        const verses = await loadChapterText('es', book, chapter);
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
    group.loadedCount = group.items.length;
    group.hasMore = false;
  }
  async function buildSummary(term, lang, entry, hebrewEntry, refs, highlightQueries = {}) {
     const lemma = entry?.lemma || term;
     const transliteration = entry?.['Forma lexica'] || '—';
     const pos = extractPos(entry);
     const hebrewDefinition = getHebrewDefinition(hebrewEntry);
     const definition = lang === 'he' ? hebrewDefinition : (entry?.definicion || '');
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
    const summaryQuery = highlightQueries.es || (lang === 'es' ? term : '');
    lemmaSummary.innerHTML = highlightText(summaryParts.join(' '), summaryQuery, 'es');
     const cards = [];
     const primaryQuery = highlightQueries[lang] || term;
    const spanishQuery = highlightQueries.es || '';
    if (sampleRef && sampleText) {
      cards.push(`
        <div class="fw-semibold">Ejemplo en ${langLabels[lang]}</div>
        <div class="small muted">${sampleRef}</div>
        <div class="${classForLang(lang)}">${highlightText(sampleText, primaryQuery, lang)}</div>
      `);
    }
    if (sampleEs) {
      cards.push(`
        <div class="fw-semibold">Traducción RVR1960</div>
        <div class="small muted">Ejemplo contextual</div>
        <div>${highlightText(sampleEs, spanishQuery, 'es')}</div>
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
    if (state.isLoading) return;
    setLoading(true);
    await nextFrame();
    const term = queryInput.value.trim();
    if (!term) {
      setLoading(false);
      return;
    }
 
      try {
    const lang = detectLang(term);
    const normalized = normalizeByLang(term, lang);
 
     let entry = null;
       let hebrewEntry = null;
    if (lang === 'gr') {
      await loadDictionary();
      entry = state.dictMap.get(normalized) || null;
      } else if (lang === 'he') {
      await loadHebrewDictionary();
      hebrewEntry = state.hebrewDictMap.get(normalized) || null;
    }
 
    const indexPromise = loadIndex(lang);
    const index = await indexPromise;
   const refs = lang === 'gr' ? getGreekRefs(normalized, index) : (index.tokens?.[normalized] || []);
 
   const initialLxxMatches = lang === 'gr' && normalized
      ? await buildLxxMatches(normalized, 70)
      : { refs: [], texts: new Map() };
    const hasInitialGreekMatches = refs.length || initialLxxMatches.refs.length;

    if (!refs.length && !(lang === 'gr' && hasInitialGreekMatches)) {
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
 
   
    const esIndexPromise = loadIndex('es');
    const grIndexPromise = loadIndex('gr');
    const heIndexPromise = loadIndex('he');
    const esIndex = await esIndexPromise;
   let esSearchTokens = [];
    if (lang === 'es') {
      esSearchTokens = [normalized].filter(Boolean);
    } else if (entry?.definicion) {
      esSearchTokens = extractSpanishTokensFromDefinition(entry.definicion);
 } else if (lang === 'he' && getHebrewDefinition(hebrewEntry)) {
      esSearchTokens = extractSpanishTokensFromDefinition(getHebrewDefinition(hebrewEntry));
    } else {
      esSearchTokens = [normalizeSpanish(term)].filter(Boolean);
    }
     const esDisplayWord = lang === 'es' ? term : (esSearchTokens[0] || term);
    let greekEntry = entry;
    let greekTerm = null;
    let greekCandidate = null;
    if (lang === 'es') {
      greekEntry = await findGreekEntryFromSpanish(term);
      if (greekEntry?.lemma) {
        greekTerm = normalizeGreek(greekEntry.lemma);
      }
    }
    const summaryHighlightQueries = {
      es: esDisplayWord,
      [lang]: lang === 'gr' ? (entry?.lemma || term) : term
    };
const summaryRefs = lang === 'gr' && !refs.length ? initialLxxMatches.refs : refs;
    await buildSummary(term, lang, entry || greekEntry, hebrewEntry, summaryRefs, summaryHighlightQueries);
    const esRefs = [];
    const esSeen = new Set();
        const directEsRefs = [];
    if (lang === 'gr') {
      refs.forEach((ref) => directEsRefs.push(ref));
      mapLxxRefsToHebrewRefs(initialLxxMatches.refs).forEach((ref) => directEsRefs.push(ref));
    } else if (lang === 'he') {
      refs.forEach((ref) => directEsRefs.push(ref));
    }
    directEsRefs.forEach((ref) => {
      if (esSeen.has(ref)) return;
      esSeen.add(ref);
      esRefs.push(ref);
    });
    esSearchTokens.forEach((token) => {
      const matches = esIndex.tokens?.[token] || [];
      matches.forEach((ref) => {
        if (esSeen.has(ref)) return;
        esSeen.add(ref);
        esRefs.push(ref);
      });
    });
    const { ot: esOtRefs, nt: esNtRefs } = splitRefsByTestament(esRefs);

    if (lang === 'gr') {
      greekTerm = normalized;
    } else if (lang === 'es') {
      if (!greekTerm) {
        const ntCandidate = esNtRefs.length ? await buildGreekCandidateFromGreekRefs(esNtRefs) : null;
        const otLxxRefs = esOtRefs.length ? mapOtRefsToLxxRefs(esOtRefs) : [];
        const otCandidate = otLxxRefs.length ? await buildGreekCandidateFromLxxRefs(otLxxRefs) : null;
        if (ntCandidate && otCandidate) {
          greekCandidate = ntCandidate.count >= otCandidate.count ? ntCandidate : otCandidate;
        } else {
          greekCandidate = ntCandidate || otCandidate;
        }
        if (greekCandidate) {
          greekTerm = greekCandidate.normalized;
          await loadDictionary();
          greekEntry = state.dictMap.get(greekTerm) || greekEntry;
        }
      }
    } else if (lang === 'he') {
      greekCandidate = await buildGreekCandidateFromHebrewRefs(refs);
      if (greekCandidate) {
        greekTerm = greekCandidate.normalized;
        await loadDictionary();
        greekEntry = state.dictMap.get(greekTerm) || greekEntry;
      }
    }


    const greekLemma = greekEntry?.lemma || greekCandidate?.lemma || (lang === 'gr' ? term : '—');
const greekTranslit = greekEntry?.['Forma lexica'] || (greekTerm ? transliterateGreek(greekLemma || term) : '—');
     const grIndex = await grIndexPromise;
   const grRefs = greekTerm ? getGreekRefs(greekTerm, grIndex) : [];
   const lxxMatchesPromise = greekTerm
      ? (lang === 'gr' && greekTerm === normalized
          ? Promise.resolve(initialLxxMatches)
          : buildLxxMatches(greekTerm, 70))
      : Promise.resolve({ refs: [], texts: new Map() });
    const lxxMatches = await lxxMatchesPromise;

    let hebrewCandidate = null;
    if (lang === 'he') {
      hebrewCandidate = {
        normalized,
        word: term,
        transliteration: transliterateHebrew(term)
      };
     } else if (lang === 'es') {
     if (greekTerm && lxxMatches.refs.length) {
        hebrewCandidate = await buildHebrewCandidateFromLxxRefs(lxxMatches.refs);
      }
      if (!hebrewCandidate && esOtRefs.length) {
        hebrewCandidate = await buildHebrewCandidateFromRefs(esOtRefs);
      }
    } else if (lxxMatches.refs.length) {
      hebrewCandidate = await buildHebrewCandidateFromLxxRefs(lxxMatches.refs);
    }
    const heIndex = await heIndexPromise;
    const heRefs = hebrewCandidate ? (heIndex.tokens?.[hebrewCandidate.normalized] || []) : [];
const posTag = lang === 'gr' ? extractPos(entry) : '—';
    const lemmaLabel = lang === 'gr' ? (entry?.lemma || term) : term;
    const translitLabel = lang === 'he'
      ? transliterateHebrew(term)
       : (entry?.['Forma lexica'] || (lang === 'gr' ? transliterateGreek(term) : '—'));
    renderTags([
      `Lema: <span class="fw-semibold">${lemmaLabel}</span>`,
      `Transliteración: ${translitLabel}`,
      `POS: ${posTag}`,
      `RKANT: ${grRefs.length}`,
      `LXX: ${lxxMatches.refs.length}`,
      `Hebreo: ${heRefs.length}`,
      `RVR1960: ${esRefs.length}`
    ]);
       const highlightQueries = {
      gr: greekLemma !== '—' ? greekLemma : (lang === 'gr' ? term : ''),
      lxx: greekLemma !== '—' ? greekLemma : (lang === 'gr' ? term : ''),
      he: hebrewCandidate?.word || (lang === 'he' ? term : ''),
      es: esDisplayWord
    };
    const cards = [];
        const samplesTasks = [];
   if (greekTerm && grRefs.length) {
samplesTasks.push(
        buildSamplesForRefs(grRefs, 'gr', 3).then((grSamples) => {
          cards.push(buildCorrespondenceCard({
            title: 'RKANT (NT)',
            word: greekLemma,
            transliteration: greekTranslit,
            samples: grSamples,
            lang: 'gr',
           highlightQuery: highlightQueries.gr
          }));
        })
      );
     }
    if (greekTerm && lxxMatches.refs.length) {
      samplesTasks.push(
        buildSamplesForRefs(lxxMatches.refs, 'lxx', 3, lxxMatches.texts).then((lxxSamples) => {
          cards.push(buildCorrespondenceCard({
            title: 'LXX (AT)',
            word: greekLemma,
            transliteration: greekTranslit,
            samples: lxxSamples,
            lang: 'lxx',
           highlightQuery: highlightQueries.lxx
          }));
        })
      );
    }
   if (hebrewCandidate && heRefs.length) {
    samplesTasks.push(
        buildSamplesForRefs(heRefs, 'he', 3).then((heSamples) => {
          cards.push(buildCorrespondenceCard({
            title: 'Hebreo (AT)',
            word: hebrewCandidate.word,
            transliteration: hebrewCandidate.transliteration,
            samples: heSamples,
            lang: 'he',
           highlightQuery: highlightQueries.he
          }));
        })
      );
    }
    if (esOtRefs.length) {
      samplesTasks.push(
        buildSamplesForRefs(esOtRefs, 'es', 3).then((esOtSamples) => {
          cards.push(buildCorrespondenceCard({
            title: 'RVR1960 (AT)',
            word: esDisplayWord,
            transliteration: '',
            samples: esOtSamples,
            lang: 'es',
           highlightQuery: highlightQueries.es
          }));
        })
      );
    }
    if (esNtRefs.length) {
     samplesTasks.push(
        buildSamplesForRefs(esNtRefs, 'es', 3).then((esNtSamples) => {
          cards.push(buildCorrespondenceCard({
            title: 'RVR1960 (NT)',
            word: esDisplayWord,
            transliteration: '',
            samples: esNtSamples,
            lang: 'es',
           highlightQuery: highlightQueries.es
          }));
        })
      );
    }
       await Promise.all(samplesTasks);
    renderCorrespondence(cards);
const corpusConfigs = [
      { lang: 'gr', refs: grRefs, preloaded: null },
      { lang: 'lxx', refs: lxxMatches.refs, preloaded: lxxMatches.texts },
      { lang: 'he', refs: heRefs, preloaded: null },
      { lang: 'es', refs: esRefs, preloaded: null }
    ];
       const groupsByCorpus = corpusConfigs.map((config) => ({
      lang: config.lang,
      groups: [],
      expanded: false,
      loading: true
    }));
       renderResults(groupsByCorpus, highlightQueries);
    state.last = { term, lang, refs, groupsByCorpus, highlightQueries };
       await Promise.all(corpusConfigs.map(async (config, index) => {
      const groups = await buildBookGroups(config.refs, config.lang, config.preloaded);
      groupsByCorpus[index].groups = groups;
      groupsByCorpus[index].loading = false;
       renderResults(groupsByCorpus, highlightQueries);
    }));
        } catch (error) {
      console.error('Error en el análisis:', error);
    } finally {
      setLoading(false);
    }
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
 

 
   analyzeBtn?.addEventListener('click', analyze);
   queryInput?.addEventListener('keydown', (event) => {
     if (event.key === 'Enter') {
       event.preventDefault();
       analyze();
     }
   });
 
   document.body.addEventListener('click', handleFilterClick);
})();
