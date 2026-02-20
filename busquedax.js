
 (() => {
   const DICT_URL = './diccionario/masterdiccionario.json';
   const HEBREW_DICT_URL = './diccionario/diccionario_unificado.min.json';
  const SEARCH_INDEX = {
     es: './search/index-es.json',
     gr: './search/index-gr.json',
     he: './search/index-he.json'
   };
  const LXX_SHARD_BASE_PATHS = ['./index', './search/index'];
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
   const HISTORICAL = [
     'josue', 'jueces', 'rut', '1_samuel', '2_samuel', '1_reyes', '2_reyes',
     '1_cronicas', '2_cronicas', 'esdras', 'nehemias', 'ester', 'hechos'
   ];
   const WISDOM = ['job', 'salmos', 'proverbios', 'eclesiastes', 'cantares'];
   const PROPHETS = [
     'isaias', 'jeremias', 'lamentaciones', 'ezequiel', 'daniel', 'oseas', 'joel', 'amos',
     'abdias', 'jonas', 'miqueas', 'nahum', 'habacuc', 'sofonias', 'hageo',
     'zacarias', 'malaquias'
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
  const LXX_BOOKS = [
    '1Chr', '1Esdr', '1Kgs', '1Macc', '1Sam', '2Chr', '2Esdr', '2Kgs', '2Macc', '2Sam',
    '3Macc', '4Macc', 'Amos', 'Bar', 'BelOG', 'BelTh', 'DanOG', 'DanTh', 'Deut', 'Eccl',
    'EpJer', 'Esth', 'Exod', 'Ezek', 'Gen', 'Hab', 'Hag', 'Hos', 'Isa', 'Jdt', 'Jer', 'Job',
    'Joel', 'Jonah', 'JoshA', 'JoshB', 'JudgA', 'JudgB', 'Lam', 'Lev', 'Mal', 'Mic', 'Nah',
    'Num', 'Obad', 'Odes', 'Prov', 'Ps', 'PsSol', 'Ruth', 'Sir', 'Song', 'SusOG', 'SusTh',
    'TobBA', 'TobS', 'Wis', 'Zech', 'Zeph'
  ];
  const LXX_FILE_BY_BOOK = LXX_FILES.reduce((acc, file) => {
    const match = file.match(/^lxx_rahlfs_1935_(.+)\.json$/);
    if (match?.[1]) acc[match[1]] = file;
    return acc;
  }, {});
 
   const langLabels = {
     es: 'RVR1960',
     gr: 'RKANT',
    he: 'Hebreo',
    lxx: 'LXX'
   };
 const SEARCH_EQUIVALENCE_GROUPS = [
    {
      id: 'jesus-josue',
      es: ['jesus', 'jesús', 'josue', 'josué'],
      gr: ['Ἰησοῦς'],
      he: ['יֵשׁוּעַ', 'ישוע', 'יְהוֹשֻׁעַ', 'יהושע'],
      relatedLabels: {
        es: ['Josué'],
        he: ['יְהוֹשֻׁעַ']
      }
    }
  ];
 const state = {
    dict: null,
    dictMap: new Map(),
      dictSpanishMap: new Map(),
    hebrewDict: null,
    hebrewDictMap: new Map(),
     indexes: {},
     textCache: new Map(),
    lxxFileCache: new Map(),
    lxxBookCache: new Map(),
    lxxShardCache: new Map(),
    lxxShardBaseByBook: new Map(),
    lxxVerseCache: new Map(),
    lxxBookStatsCache: new Map(),
    lxxSearchCache: new Map(),
     filter: 'todo',
      languageScope: 'auto',
  last: null,
     isLoading: false
    };
  const jsonCache = new Map();
  const failedJsonRequests = new Map();
  const JSON_RETRY_COOLDOWN_MS = 15000;
  const DEBOUNCE_DELAY_MS = 250;
  const MAX_REFS_PER_CORPUS = 800;
  let activeSearchController = null;
  let activeSearchRunId = 0;
 
   const queryInput = document.getElementById('bxQueryInput');
   const analyzeBtn = document.getElementById('bxAnalyzeBtn');
   const lemmaTags = document.getElementById('bxLemmaTags');
   const lemmaSummary = document.getElementById('bxLemmaSummary');
  const lemmaCorrespondence = document.getElementById('bxLemmaCorrespondence');
   const lemmaExamples = document.getElementById('bxLemmaExamples');
  const resultsByCorpus = document.getElementById('bxResultsByCorpus');
  const resultsLoadingIndicator = document.getElementById('bxResultsLoadingIndicator');
  const resultsLoadingStage = document.getElementById('bxResultsLoadingStage');
  const analysisResultsSection = document.getElementById('bxAnalysisResultsSection');
  const lemmaSummaryPanel = document.getElementById('bxLemmaSummaryPanel');
    const languageScopeSelect = document.getElementById('bxLanguageScope');

  
  const nextFrame = () => new Promise((resolve) => requestAnimationFrame(resolve));
  const isAbortError = (error) => error?.name === 'AbortError';
  function debounce(fn, delayMs = 250) {
    let timerId = null;
    return (...args) => {
      if (timerId) clearTimeout(timerId);
      timerId = setTimeout(() => {
        timerId = null;
        fn(...args);
      }, delayMs);
    };
  }

  function hasTokenWithMinLength(query, minLength = 3) {
    return String(query || '')
      .split(/\s+/)
      .map((token) => token.trim())
      .some((token) => token.length >= minLength);
  }

  function throwIfAborted(signal) {
    if (signal?.aborted) {
      throw new DOMException('Aborted', 'AbortError');
    }
  }
  function scrollToLemmaSummary() {
    if (!lemmaSummaryPanel) {
      analysisResultsSection?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    const topbar = document.querySelector('.topbar');
    const topbarHeight = topbar ? topbar.getBoundingClientRect().height : 0;
    const top = window.scrollY + lemmaSummaryPanel.getBoundingClientRect().top - topbarHeight - 12;
    window.scrollTo({ top: Math.max(top, 0), behavior: 'smooth' });
  }

  function setLoading(isLoading) {
    state.isLoading = isLoading;
  
   if (resultsLoadingIndicator) resultsLoadingIndicator.hidden = !isLoading;
    if (resultsLoadingStage) resultsLoadingStage.hidden = !isLoading;
    if (resultsByCorpus) resultsByCorpus.hidden = isLoading;
    if (analyzeBtn) analyzeBtn.disabled = isLoading;
  }
 
function normalizeGreek(text) {
    return String(text || '')
      .replace(/[··.,;:!?“”"(){}\[\]<>«»]/g, '')
      .replace(/\s/g, '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
           .replace(/ς/g, 'σ')
      .toLowerCase();
  }
  function normalizeGreekKey(text) {
    return String(text || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/ς/g, 'σ')
      .replace(/[··.,;:!?\'"“”‘’()\[\]{}]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
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
        .replace(/[\u200C-\u200F\u202A-\u202E]/g, '')
       .replace(/[\u0591-\u05BD\u05BF\u05C1-\u05C2\u05C4-\u05C7]/g, '')
.replace(/[\s\u05BE\-\u2010-\u2015\u2212]/g, '')
       .replace(/[׃.,;:!?()"“”'׳״]/g, '');
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
    variants.add(base.replace(/k/g, 'c'));
    variants.add(base.replace(/c/g, 'k'));
    variants.add(base.replace(/ck/g, 'k'));
    variants.add(base.replace(/qu/g, 'k'));
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
      const accentMap = {
        a: '[aáàâäãå]',
        e: '[eéèêë]',
        i: '[iíìîï]',
        o: '[oóòôöõ]',
        u: '[uúùûü]',
        n: '[nñ]'
      };
      const pattern = escaped.split('').map((ch) => accentMap[ch] || ch).join('');
      return new RegExp(pattern, 'giu');
    }

    const letters = [];
    for (const ch of escaped) {
      if (ch === '\\') continue;
       if ((lang === 'gr' || lang === 'lxx') && ch === 'σ') {
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
     const highlightSource = (lang === 'gr' || lang === 'lxx' || lang === 'he')
      ? safe.normalize('NFD')
      : safe;
   const tokens = normalizedQuery
      .split(/\s+/)
      .map((part) => getNormalizedQuery(lang, part))
      .map((token) => token.trim())
      .filter((token) => token.length >= 2);
    if (!tokens.length) return safe;

    let output = highlightSource;
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

  function getLanguageScope(term = '') {
    const scope = String(state.languageScope || 'auto');
    if (scope === 'es' || scope === 'gr' || scope === 'he' || scope === 'all') return scope;
    return detectLang(term);
  }

  function getAliasCandidates(term, langHint = detectLang(term)) {
    const esTokens = String(term || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/\p{M}/gu, '')
      .split(/\s+/)
      .filter(Boolean);
    const sourceTokens = langHint === 'he'
      ? esTokens.map((token) => normalizeHebrew(token))
      : (langHint === 'gr' ? esTokens.map((token) => normalizeGreek(token)) : esTokens);

    const gr = new Set();
    const he = new Set();
    const es = new Set();
    const relatedLabels = { es: new Set(), he: new Set() };

    SEARCH_EQUIVALENCE_GROUPS.forEach((group) => {
      const normalizedGroup = {
        es: new Set((group.es || []).map((value) => normalizeSpanish(value)).filter(Boolean)),
        gr: new Set((group.gr || []).map((value) => normalizeGreek(value)).filter(Boolean)),
        he: new Set((group.he || []).map((value) => normalizeHebrew(value)).filter(Boolean))
      };
      const matched = sourceTokens.some((token) => normalizedGroup[langHint]?.has(token));
      if (!matched) return;

      normalizedGroup.gr.forEach((value) => gr.add(value));
      normalizedGroup.he.forEach((value) => he.add(value));
      normalizedGroup.es.forEach((value) => es.add(value));
      (group.relatedLabels?.es || []).forEach((value) => relatedLabels.es.add(value));
      (group.relatedLabels?.he || []).forEach((value) => relatedLabels.he.add(value));
    });

    return {
      gr: [...gr],
      he: [...he],
      es: [...es],
      relatedLabels: {
        es: [...relatedLabels.es],
        he: [...relatedLabels.he]
      }
    };
  }
  function pickPreferredHebrewAlias(candidates = []) {
    if (!Array.isArray(candidates) || !candidates.length) return null;
    return candidates.find((item) => item === 'יהושע')
      || candidates.find((item) => item === 'ישוע')
      || candidates[0];
  }
  function getCorporaForScope(scope) {
    if (scope === 'es') return ['es'];
    if (scope === 'gr') return ['gr', 'lxx'];
    if (scope === 'he') return ['he'];
   return ['gr', 'lxx', 'he', 'es'];
  }
  function normalizeByLang(text, lang) {
    if (lang === 'gr') return normalizeGreek(text);
    if (lang === 'he') return normalizeHebrew(text);
    return normalizeSpanish(text);
  }
  function normalizePhraseByLang(text, lang) {
    if (lang === 'he') {
      return String(text || '')
        .replace(/[\u200C-\u200F\u202A-\u202E]/g, '')
        .replace(/[\u0591-\u05BD\u05BF\u05C1-\u05C2\u05C4-\u05C7]/g, '')
        .replace(/[׃.,;:!?()"“”'׳״]/g, ' ')
        .replace(/[\u05BE\-\u2010-\u2015\u2212]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    }
    if (lang === 'gr' || lang === 'lxx') {
      return String(text || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/\p{M}/gu, '')
        .replace(/[··.,;:!?(){}\[\]<>«»]/g, ' ')
        .replace(/ς/g, 'σ')
        .replace(/\s+/g, ' ')
        .trim();
    }
    return String(text || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9ñ\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }
  function getNormalizedQueryTokens(term, lang, minLength = 3) {
    return String(term || '')
      .split(/\s+/)
      .map((token) => normalizeByLang(token, lang).trim())
      .filter((token) => token.length >= minLength);
  }
  function getRefsForTokenByLang(lang, token, index) {
    if (!token) return [];
    if (lang === 'gr') return getGreekRefs(token, index);
    if (lang === 'he') return getHebrewRefs(token, index);
    return index.tokens?.[token] || [];
  }
  async function filterRefsByPhrase(refs, lang, term, options = {}) {
    const phrase = normalizePhraseByLang(term, lang);
    if (!phrase || !refs.length) return refs;

    const filtered = [];
    for (const ref of refs) {
      throwIfAborted(options.signal);
      const [book, chapterRaw, verseRaw] = String(ref || '').split('|');
      const chapter = Number(chapterRaw);
      const verse = Number(verseRaw);
      if (!book || !Number.isFinite(chapter) || !Number.isFinite(verse)) continue;
      try {
        const verses = await loadChapterText(lang, book, chapter, options);
        const verseText = verses?.[verse - 1] || '';
        const normalizedVerse = normalizePhraseByLang(verseText, lang);
        if (normalizedVerse.includes(phrase)) {
          filtered.push(ref);
        }
      } catch (error) {
        if (isAbortError(error)) throw error;
      }
    }
    return filtered;
  }
  async function getRefsForQuery(term, lang, index, options = {}) {
    const normalized = normalizeByLang(term, lang);
    if (!normalized) return [];

    const tokens = getNormalizedQueryTokens(term, lang, 3);
    if (!tokens.length) return getRefsForTokenByLang(lang, normalized, index);

    const uniqueTokens = [...new Set(tokens)];
    const tokenRefLists = uniqueTokens
      .map((token) => getRefsForTokenByLang(lang, token, index))
      .filter((list) => Array.isArray(list) && list.length);

    if (!tokenRefLists.length) return [];

    let refs = tokenRefLists[0].slice();
    for (let i = 1; i < tokenRefLists.length; i += 1) {
      const lookup = new Set(tokenRefLists[i]);
      refs = refs.filter((ref) => lookup.has(ref));
      if (!refs.length) break;
    }

    if (uniqueTokens.length >= 2 && refs.length) {
      refs = await filterRefsByPhrase(refs, lang, term, options);
    }
    return refs;
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
   function getHebrewRefs(normalized, index) {
    if (!normalized) return [];
    const direct = index.tokens?.[normalized] || [];
    if (direct.length) return direct;

    const refs = [];
    const seen = new Set();
    Object.entries(index.tokens || {}).forEach(([token, matches]) => {
      if (!token || token === normalized) return;
      if (!token.endsWith(normalized) && !token.includes(normalized)) return;
     const prefixLen = token.length - normalized.length;
      if (prefixLen < 0 || prefixLen > 3) return;
     (matches || []).forEach((ref) => {
        if (seen.has(ref)) return;
        seen.add(ref);
        refs.push(ref);
      });
    });
    return refs;
  }
async function loadJson(url, options = {}) {
   const { signal } = options;
 const failedRequest = failedJsonRequests.get(url);
    if (failedRequest && (Date.now() - failedRequest.timestamp) < JSON_RETRY_COOLDOWN_MS) {
      throw failedRequest.error;
    }

   if (jsonCache.has(url)) return jsonCache.get(url);
    const promise = fetch(url, { cache: 'force-cache', signal }).then((res) => {
     if (!res.ok) throw new Error(`No se pudo cargar ${url}`);
      return res.json();
    });
    jsonCache.set(url, promise);
    try {
    failedJsonRequests.delete(url);
      return await promise;
    } catch (error) {
      jsonCache.delete(url);
      if (isAbortError(error)) {
        throw error;
      }
const offline = typeof navigator !== 'undefined' && navigator.onLine === false;
      const isNetworkError = offline || error instanceof TypeError;
      const normalizedError = isNetworkError
        ? new Error(
          `Error de red cargando ${url}. Revisa si el navegador está en modo Offline (DevTools), ` +
          'si el servidor local está activo y si no hay un bloqueador/proxy interrumpiendo peticiones locales.'
        )
        : error;

      failedJsonRequests.set(url, { timestamp: Date.now(), error: normalizedError });
      throw normalizedError;
    }
  }

  async function loadDictionary(options = {}) {
   if (state.dict) return state.dict;
    const data = await loadJson(DICT_URL, options);
   state.dict = data;
    const map = new Map();
    const translitMap = new Map();
       const spanishMap = new Map();
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
      extractSpanishTokensFromDefinition(item?.definicion || '').forEach((token) => {
        if (!token) return;
        if (!spanishMap.has(token)) spanishMap.set(token, []);
        spanishMap.get(token).push(item);
      });
    });
    state.dictMap = map;
    state.dictTranslitMap = translitMap;
       state.dictSpanishMap = spanishMap;
    return data;
  }
  async function findGreekEntryFromSpanish(term, options = {}) {
   if (!term) return null;
    await loadDictionary(options);
   const tokens = String(term || '').split(/\s+/).filter(Boolean);
    const candidates = [term, ...tokens];
    for (const candidate of candidates) {
      const key = normalizeTransliteration(candidate);
      if (!key) continue;
      const entry = state.dictTranslitMap.get(key);
      if (entry) return entry;
    }
    for (const candidate of candidates) {
      const key = normalizeSpanish(candidate);
      if (!key) continue;
      const spanishMatches = state.dictSpanishMap.get(key) || [];
      if (!spanishMatches.length) continue;
      const ranked = [...spanishMatches].sort((a, b) => {
        const score = (item) => {
          const def = normalizeSpanish(item?.definicion || '');
          const rawDef = String(item?.definicion || '').toLowerCase();
          let value = 0;
          const headDef = rawDef.replace(/nombre\s+prop\.?\s*/g, '').trim();
          if (rawDef.includes('nombre prop')) value += 4;
          if (normalizeSpanish(headDef).startsWith(key)) value += 4;
          if (def.startsWith(key)) value += 3;
          if (def.includes(key)) value += 2;
          if (normalizeTransliteration(item?.['Forma flexionada del texto']).includes(key)) value += 1;
          return value;
        };
        return score(b) - score(a);
      });
      if (ranked[0]) return ranked[0];
    }
    return null;
  }
 async function loadHebrewDictionary(options = {}) {
  if (state.hebrewDict) return state.hebrewDict;
    const data = await loadJson(HEBREW_DICT_URL, options);
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
   async function loadIndex(lang, options = {}) {
    if (state.indexes[lang]) return state.indexes[lang];
     const data = await loadJson(SEARCH_INDEX[lang], options);
    state.indexes[lang] = data;
     return data;
   }
 
   async function loadChapterText(lang, book, chapter, options = {}) {
    const key = `${lang}/${book}/${chapter}`;
     if (state.textCache.has(key)) return state.textCache.get(key);
     const url = `${TEXT_BASE}/${lang}/${book}/${chapter}.json`;
     const data = await loadJson(url, options);
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
    const file = LXX_FILE_BY_BOOK[bookCode];
    if (!file) {
      state.lxxBookCache.set(bookCode, null);
      return null;
    }
    try {
      const data = await loadLxxFile(file);
      state.lxxBookCache.set(bookCode, data);
      return data;
    } catch (error) {
      if (isAbortError(error)) throw error;
    }
    state.lxxBookCache.set(bookCode, null);
    return null;
  }

  async function loadLxxShard(bookId, shardKey) {
    const cacheKey = `${bookId}|${shardKey}`;
    if (state.lxxShardCache.has(cacheKey)) return state.lxxShardCache.get(cacheKey);
    const knownBase = state.lxxShardBaseByBook.get(bookId);
    const baseCandidates = knownBase
      ? [knownBase, ...LXX_SHARD_BASE_PATHS.filter((base) => base !== knownBase)]
      : LXX_SHARD_BASE_PATHS;
    for (const basePath of baseCandidates) {
      try {
        const res = await fetch(`${basePath}/${bookId}/index_${shardKey}.json`);
        if (!res.ok) {
          if (res.status === 404) continue;
          throw new Error(`No se pudo cargar shard LXX ${bookId}/${shardKey}`);
        }
        const data = await res.json();
        const tokens = data?.tokens || {};
        state.lxxShardBaseByBook.set(bookId, basePath);
        state.lxxShardCache.set(cacheKey, tokens);
        return tokens;
      } catch (error) {
        if (isAbortError(error)) throw error;
      }
    }
    state.lxxShardCache.set(cacheKey, {});
    return {};
  }

  async function getLxxMatchesFromIndex(query, options = {}) {
    const maxRefs = Number.isFinite(options.maxRefs) ? options.maxRefs : 40;
    const key = normalizeGreekKey(query);
    if (!key) return { refs: [], texts: new Map(), highlightTerms: [] };

    const qRaw = String(query || '').trim();
    const keyNoSpaces = key.replace(/\s+/g, '');

    const lookupTerms = new Set([keyNoSpaces]);

    if (/^lemma:/i.test(qRaw)) {
      lookupTerms.clear();
      lookupTerms.add(`#${normalizeGreekKey(qRaw.slice(6)).replace(/\s+/g, '')}`);
    } else if (qRaw.startsWith('#')) {
      lookupTerms.clear();
      lookupTerms.add(`#${normalizeGreekKey(qRaw.slice(1)).replace(/\s+/g, '')}`);
    }
    const refs = [];
    const texts = new Map();
    const highlightTerms = new Set();
    const seenRefs = new Set();

    for (const term of lookupTerms) {
      const shardKey = term.slice(0, 2);
      if (!shardKey) continue;
      const bookBatches = [];
      const batchSize = 8;
      for (let index = 0; index < LXX_BOOKS.length; index += batchSize) {
        bookBatches.push(LXX_BOOKS.slice(index, index + batchSize));
      }
      for (const batch of bookBatches) {
        if (refs.length >= maxRefs) break;
        const batchResults = await Promise.all(batch.map((bookId) => loadLxxShard(bookId, shardKey)));
        for (let i = 0; i < batch.length; i += 1) {
          if (refs.length >= maxRefs) break;
          const bookId = batch[i];
          const tokens = batchResults[i] || {};
          const hits = tokens[term] || [];
          for (const hit of hits) {
            if (refs.length >= maxRefs) break;
            const hitBook = hit?.book || bookId;
            const chapter = String(hit?.ch || '');
            const verse = String(hit?.v || '');
            if (!hitBook || !chapter || !verse) continue;
            const ref = `${hitBook}|${chapter}|${verse}`;
            if (!seenRefs.has(ref)) {
              seenRefs.add(ref);
              refs.push(ref);
            }
            if (hit?.w) highlightTerms.add(hit.w);
          }
        }
      }
    }

    for (const ref of refs) {
      const [book, chapterRaw, verseRaw] = ref.split('|');
      const chapter = Number(chapterRaw);
      const verse = Number(verseRaw);
      const tokens = await loadLxxVerseTokens(book, chapter, verse);
      const verseText = Array.isArray(tokens)
        ? tokens.map((token) => token?.w).filter(Boolean).join(' ')
        : '';
      texts.set(ref, verseText || 'Texto no disponible.');
    }

    return { refs, texts, highlightTerms: [...highlightTerms] };
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
    if (!normalizedGreek) return { refs: [], texts: new Map(), highlightTerms: [] };
   if (state.lxxSearchCache.has(normalizedGreek)) return state.lxxSearchCache.get(normalizedGreek);
    const payload = await getLxxMatchesFromIndex(normalizedGreek, { maxRefs });
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
   const usedBooks = new Set();
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

  async function buildGreekCandidateFromGreekRefs(refs, options = {}) {
   if (!refs.length) return null;
    const counts = new Map();
    const samples = new Map();
   const usedBooks = new Set();
    for (const ref of refs.slice(0, 40)) {
      const [book, chapterRaw, verseRaw] = ref.split('|');
      const chapter = Number(chapterRaw);
      const verse = Number(verseRaw);
      try {
        const verses = await loadChapterText('gr', book, chapter, options);
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
               if (isAbortError(error)) throw error;
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

  async function buildHebrewCandidateFromRefs(refs, options = {}) {
    const counts = new Map();
    const samples = new Map();
    const limitedRefs = refs.slice(0, 40);
    for (const ref of limitedRefs) {
      const [book, chapterRaw, verseRaw] = ref.split('|');
      const chapter = Number(chapterRaw);
      const verse = Number(verseRaw);
      try {
        const verses = await loadChapterText('he', book, chapter, options);
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
        if (isAbortError(error)) throw error;
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

   async function buildHebrewCandidateFromLxxRefs(refs, options = {}) {
    const mappedRefs = refs
      .map((ref) => {
        const [book, chapter, verse] = ref.split('|');
        const slug = LXX_TO_HEBREW_SLUG[book];
        if (!slug) return null;
        return `${slug}|${chapter}|${verse}`;
      })
      .filter(Boolean);
    return buildHebrewCandidateFromRefs(mappedRefs, options);
  }

  function groupForBook(book) {
     const slug = LXX_TO_HEBREW_SLUG[book] || book;
     if (TORAH.includes(slug)) return { key: 'torah', label: 'Torah' };
    if (HISTORICAL.includes(slug)) return { key: 'historicos', label: 'Históricos' };
     if (WISDOM.includes(slug)) return { key: 'sabiduria', label: 'Sabiduría' };
     if (PROPHETS.includes(slug)) return { key: 'profetas', label: 'Profetas' };
     if (GOSPELS.includes(slug)) return { key: 'evangelios', label: 'Evangelios' };
     if (LETTERS.includes(slug)) return { key: 'cartas', label: 'Cartas' };
     if (APOCALYPSE.includes(slug)) return { key: 'apocalipsis', label: 'Apocalipsis' };
     return { key: 'otros', label: 'Otros' };
   }

  function prettyBookLabel(book) {
     return (book || '').replace(/_/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase());
   }

   function buildBookCountRows(refs) {
     const counts = new Map();
     refs.forEach((ref) => {
       const [book] = String(ref || '').split('|');
       if (!book) return;
       const slug = LXX_TO_HEBREW_SLUG[book] || book;
       counts.set(slug, (counts.get(slug) || 0) + 1);
     });
     return [...counts.entries()]
       .map(([book, count]) => ({ book, label: prettyBookLabel(book), count }))
       .sort((a, b) => b.count - a.count);
   }
   function formatRef(book, chapter, verse) {
     const bookLabel = prettyBookLabel(book);
    return `${bookLabel} ${chapter}:${verse}`;
   }
 
    function classForLang(lang) {
    if (lang === 'gr' || lang === 'lxx') return 'greek';
     if (lang === 'he') return 'hebrew';
     return 'mono';
   }
 
   function renderTags(tags) {
     if (!lemmaTags) return;
     lemmaTags.innerHTML = '';
     tags.forEach((tag) => {
       const span = document.createElement('span');
       span.className = 'tag';
       span.innerHTML = tag;
       lemmaTags.appendChild(span);
     });
   }
 
   function renderExamples(cards) {
     if (!lemmaExamples) return;
     lemmaExamples.innerHTML = '';
     cards.forEach((card) => {
       const div = document.createElement('div');
       div.className = 'example-card';
       div.innerHTML = card;
       lemmaExamples.appendChild(div);
     });
   }
 
  function renderCorrespondence(cards) {
       if (!lemmaCorrespondence) return;
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
 
  async function buildSamplesForRefs(refs, lang, max = 3, preloadedTexts = null, options = {}) {
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
          const verses = await loadChapterText(lang, book, chapter, options);
          verseText = verses?.[verse - 1] || '';
        } catch (error) {
          if (isAbortError(error)) throw error;
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

 function renderResults(groupsByCorpus, highlightQueries = state.last?.highlightQueries || {}, relatedTerms = state.last?.relatedTerms || {}) {
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
      button.className = `btn btn-sm result-toggle-btn${corpus.expanded ? ' is-open' : ''}`;
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
 bookBlock.className = 'book-result-card';
          const bookTop = document.createElement('div');
          bookTop.className = 'd-flex flex-wrap justify-content-between align-items-center gap-2';
         
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
         const bookHeadText = document.createElement('div');
          bookHeadText.appendChild(bookHeader);
          bookHeadText.appendChild(bookMeta);
          const toggleBookBtn = document.createElement('button');
          toggleBookBtn.className = `btn btn-sm result-toggle-btn${group.expanded ? ' is-open' : ''}`;
         toggleBookBtn.type = 'button';
          toggleBookBtn.textContent = group.expanded ? 'Ocultar resultados' : 'Ver resultados';
          bookTop.appendChild(bookHeadText);
          bookTop.appendChild(toggleBookBtn);
          bookBlock.appendChild(bookTop);
         
          const bookList = document.createElement('div');
bookList.className = 'mt-2 d-grid gap-1';
         const highlightQuery = highlightQueries[lang] || '';
         const relatedLabels = relatedTerms[lang] || [];
          if (group.expanded) {
            group.items.forEach((item) => {
              const row = document.createElement('div');
              row.className = 'verse-row';
              const textWrap = document.createElement('div');
              textWrap.className = `${classForLang(lang)} mb-2`;
              const relatedBadge = (lang === 'es' && relatedLabels.length && relatedLabels.some((label) => normalizeSpanish(item.text).includes(normalizeSpanish(label))))
                ? `<span class="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle ms-1">Coincidencia relacionada: ${escapeHtml(relatedLabels.join(', '))}</span>`
                : '';
              textWrap.innerHTML = `<span class="verse-ref">${escapeHtml(item.ref)}</span>${relatedBadge} · ${highlightText(item.text, highlightQuery, lang)}`;
              const actions = document.createElement('div');
              actions.className = 'd-flex justify-content-end';
              const openBtn = document.createElement('button');
              openBtn.className = 'btn btn-primary btn-sm';
              openBtn.type = 'button';
              openBtn.textContent = 'Abrir';
              openBtn.addEventListener('click', () => {
                const p = new URLSearchParams();
                p.set('book', item.book);
                p.set('name', group.label);
                p.set('search', `${item.chapter}:${item.verse}`);
                p.set('version', 'RVR1960');
                p.set('orig', '1');
                location.href = `./index.html?${p.toString()}`;
              });
              actions.appendChild(openBtn);
              row.appendChild(textWrap);
              row.appendChild(actions);
              bookList.appendChild(row);
            });
            bookBlock.appendChild(bookList);
          }
         if (group.expanded && lang === 'es' && group.hasMore) {
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
              await loadMoreRvr1960(group, {});
              group.loadingMore = false;
              renderResults(groupsByCorpus);
            });
            loadMoreWrapper.appendChild(loadMoreButton);
            bookBlock.appendChild(loadMoreWrapper);
          }
          toggleBookBtn.addEventListener('click', () => {
            group.expanded = !group.expanded;
            renderResults(groupsByCorpus);
          });
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
 

  async function buildBookGroups(refs, lang, preloadedTexts = null, options = {}) {
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
             book: bookName,
              chapter,
              verse,
             ref: formatRef(bookName, chapter, verse),
             text: verseText
           });
         } catch (error) {
          try {
             const verses = await loadChapterText(lang, bookName, chapter, options);
             const verseText = verses?.[verse - 1] || '';
             group.items.push({
               book: bookName,
               chapter,
               verse,
               ref: formatRef(bookName, chapter, verse),
               text: verseText
             });
           } catch (innerError) {
             if (isAbortError(innerError)) throw innerError;
             group.items.push({
                  book: bookName,
               chapter,
               verse,
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
 async function loadMoreRvr1960(group, options = {}) {
    const refsToLoad = group.refs.slice(group.loadedCount);
    for (const ref of refsToLoad) {
      const [book, chapterRaw, verseRaw] = ref.split('|');
      const chapter = Number(chapterRaw);
      const verse = Number(verseRaw);
      try {
        const verses = await loadChapterText('es', book, chapter, options);
        const verseText = verses?.[verse - 1] || '';
        group.items.push({
          book,
          chapter,
          verse,
          ref: formatRef(book, chapter, verse),
          text: verseText
        });
      } catch (error) {
        if (isAbortError(error)) throw error;
        group.items.push({
          book,
          chapter,
          verse,
          ref: formatRef(book, chapter, verse),
          text: 'Texto no disponible.'
        });
      }
    }
    group.loadedCount = group.items.length;
    group.hasMore = false;
  }
  async function buildSummary(term, lang, entry, hebrewEntry, refs, highlightQueries = {}, options = {}) {
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
        const verses = await loadChapterText(lang, book, chapter, options);
        sampleText = verses?.[verse - 1] || '';
        if (lang !== 'es') {
          const versesEs = await loadChapterText('es', book, chapter, options);
          sampleEs = versesEs?.[verse - 1] || '';
        }
      } catch (error) {
        if (isAbortError(error)) throw error;
        sampleText = '';
        sampleEs = '';
      }
    }
    if (!summaryParts.length) summaryParts.push('No se encontró definición directa, se usa la concordancia del corpus para contexto.');
    const summaryQuery = highlightQueries.es || (lang === 'es' ? term : '');
 if (lemmaSummary) {
      lemmaSummary.innerHTML = highlightText(summaryParts.join(' '), summaryQuery, 'es');
    }     const cards = [];
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
    const term = queryInput.value.trim();
    if (!term) return;

    if (activeSearchController) {
      activeSearchController.abort();
    }
    const controller = new AbortController();
    activeSearchController = controller;
    const options = { signal: controller.signal };
    const runId = ++activeSearchRunId;

    scrollToLemmaSummary();
    setLoading(true);
    await nextFrame();
    try {
      throwIfAborted(options.signal);

      const lang = detectLang(term);
      const selectedScope = getLanguageScope(term);
     const enabledCorpora = new Set(getCorporaForScope(selectedScope));
           const aliasCandidates = getAliasCandidates(term, lang);
      const normalized = normalizeByLang(term, lang);

      let entry = null;
      let hebrewEntry = null;
      if (lang === 'gr') {
        await loadDictionary(options);
        throwIfAborted(options.signal);
        entry = state.dictMap.get(normalized) || null;
      } else if (lang === 'he') {
        await loadHebrewDictionary(options);
        throwIfAborted(options.signal);
        hebrewEntry = state.hebrewDictMap.get(normalized) || null;
      }

      const index = await loadIndex(lang, options);
      throwIfAborted(options.signal);
 const refs = await getRefsForQuery(term, lang, index, options);
        ? await buildLxxMatches(normalized, 70)
        : { refs: [], texts: new Map() };
      const hasInitialGreekMatches = refs.length || initialLxxMatches.refs.length;

      if (!refs.length && !(lang === 'gr' && hasInitialGreekMatches)) {
        renderTags([
          `Lema: <span class="fw-semibold">${term}</span>`,
          'Transliteración: —',
          'POS: —'
        ]);
        if (lemmaSummary) {
          lemmaSummary.textContent = 'No se encontraron ocurrencias en los índices disponibles.';
        }
        renderCorrespondence([]);
        if (lemmaExamples) {
          lemmaExamples.innerHTML = '';
        }
        state.last = { term, lang, refs: [], groupsByCorpus: [] };
        return;
      }
 const needsSpanishBridge = lang === 'es' && (enabledCorpora.has('gr') || enabledCorpora.has('lxx') || enabledCorpora.has('he'));
      const esIndexPromise = (enabledCorpora.has('es') || needsSpanishBridge)
        ? loadIndex('es', options)
        : Promise.resolve(null);
      const grIndexPromise = enabledCorpora.has('gr') ? loadIndex('gr', options) : Promise.resolve(null);
      const heIndexPromise = enabledCorpora.has('he') ? loadIndex('he', options) : Promise.resolve(null);
      const esIndex = await esIndexPromise;
      throwIfAborted(options.signal);

      let esSearchTokens = [];
      if (enabledCorpora.has('es') || needsSpanishBridge) {
       if (lang === 'es') {
          const relatedEsTokens = aliasCandidates.es.filter((token) => token && token !== normalized);
          esSearchTokens = [...relatedEsTokens, normalized].filter(Boolean);
        } else if (entry?.definicion) {
          esSearchTokens = extractSpanishTokensFromDefinition(entry.definicion);
        } else if (lang === 'he' && getHebrewDefinition(hebrewEntry)) {
          esSearchTokens = extractSpanishTokensFromDefinition(getHebrewDefinition(hebrewEntry));
        } else {
          esSearchTokens = [normalizeSpanish(term)].filter(Boolean);
        }
      }

      const esDisplayWord = lang === 'es' ? term : (esSearchTokens[0] || term);
      let greekEntry = entry;
      let greekTerm = null;
      let greekCandidate = null;

      if (lang === 'es' && (enabledCorpora.has('gr') || enabledCorpora.has('lxx'))) {
        greekEntry = await findGreekEntryFromSpanish(term, options);
        if (greekEntry?.lemma) {
          greekTerm = normalizeGreek(greekEntry.lemma);
        }
         if (!greekTerm && aliasCandidates.gr.length) {
          greekTerm = aliasCandidates.gr[0];
        }
      }

      const summaryHighlightQueries = {
        es: esDisplayWord,
        [lang]: lang === 'gr' ? (entry?.lemma || term) : term
      };
      const summaryRefs = lang === 'gr' && !refs.length ? initialLxxMatches.refs : refs;
      await buildSummary(term, lang, entry || greekEntry, hebrewEntry, summaryRefs, summaryHighlightQueries, options);
      throwIfAborted(options.signal);

      const esRefs = [];
      const esSeen = new Set();
      if ((enabledCorpora.has('es') || needsSpanishBridge) && esIndex) {
       const directEsRefs = [];
        if (lang === 'gr') {
          refs.forEach((ref) => directEsRefs.push(ref));
          mapLxxRefsToHebrewRefs(initialLxxMatches.refs).forEach((ref) => directEsRefs.push(ref));
      } else if (lang === 'he' && (enabledCorpora.has('gr') || enabledCorpora.has('lxx'))) {
         refs.forEach((ref) => directEsRefs.push(ref));
        }
        directEsRefs.forEach((ref) => {
          if (esSeen.has(ref)) return;
          esSeen.add(ref);
          esRefs.push(ref);
        });
for (const token of esSearchTokens) {
          const matches = await getRefsForQuery(token, 'es', esIndex, options);
          matches.forEach((ref) => {
            if (esSeen.has(ref)) return;
            esSeen.add(ref);
            esRefs.push(ref);
          });
        }
      }

      const { ot: esOtRefs, nt: esNtRefs } = splitRefsByTestament(esRefs);

      if (lang === 'gr') {
        greekTerm = normalized;
      } else if (lang === 'es') {
        if (!greekTerm) {
          const ntCandidate = esNtRefs.length ? await buildGreekCandidateFromGreekRefs(esNtRefs, options) : null;
          const otLxxRefs = esOtRefs.length ? mapOtRefsToLxxRefs(esOtRefs) : [];
          const otCandidate = otLxxRefs.length ? await buildGreekCandidateFromLxxRefs(otLxxRefs) : null;
          if (ntCandidate && otCandidate) {
            greekCandidate = ntCandidate.count >= otCandidate.count ? ntCandidate : otCandidate;
          } else {
            greekCandidate = ntCandidate || otCandidate;
          }
          if (greekCandidate) {
            greekTerm = greekCandidate.normalized;
            await loadDictionary(options);
            greekEntry = state.dictMap.get(greekTerm) || greekEntry;
          }
        }
      } else if (lang === 'he') {
        greekCandidate = await buildGreekCandidateFromHebrewRefs(refs);
        if (greekCandidate) {
          greekTerm = greekCandidate.normalized;
          await loadDictionary(options);
          greekEntry = state.dictMap.get(greekTerm) || greekEntry;
        }
      }

      const greekLemma = greekEntry?.lemma || greekCandidate?.lemma || (lang === 'gr' ? term : '—');
      const greekTranslit = greekEntry?.['Forma lexica'] || (greekTerm ? transliterateGreek(greekLemma || term) : '—');
      const hebrewSearchTerms = new Set();
      const grIndex = await grIndexPromise;
      throwIfAborted(options.signal);
 let grRefs = (enabledCorpora.has('gr') && grIndex && greekTerm)
        ? await getRefsForQuery(greekTerm, 'gr', grIndex, options)
        : [];
     if (lang === 'es' && enabledCorpora.has('gr') && esNtRefs.length) {
        const seenRefs = new Set(grRefs);
        esNtRefs.forEach((ref) => {
          if (seenRefs.has(ref)) return;
          seenRefs.add(ref);
          grRefs.push(ref);
        });
      }
      const lxxMatches = (enabledCorpora.has('lxx') && greekTerm)
        ? await (lang === 'gr' && greekTerm === normalized
            ? Promise.resolve(initialLxxMatches)
            : buildLxxMatches(greekTerm, 70))
        : { refs: [], texts: new Map(), highlightTerms: [] };

      let hebrewCandidate = null;
      if (lang === 'he') {
        hebrewCandidate = {
          normalized,
          word: term,
          transliteration: transliterateHebrew(term)
        };
        hebrewSearchTerms.add(normalized);
        aliasCandidates.he.forEach((item) => hebrewSearchTerms.add(item));
      } else if (lang === 'es') {
 if (aliasCandidates.he.length) {
          aliasCandidates.he.forEach((item) => hebrewSearchTerms.add(item));
          const preferredWord = pickPreferredHebrewAlias(aliasCandidates.he);
          hebrewCandidate = {
            normalized: preferredWord,
            word: preferredWord,
            transliteration: transliterateHebrew(preferredWord)
          };
        }
        if (!hebrewCandidate && greekTerm && lxxMatches.refs.length) {
         hebrewCandidate = await buildHebrewCandidateFromLxxRefs(lxxMatches.refs, options);
        }
        if (!hebrewCandidate && esOtRefs.length) {
          hebrewCandidate = await buildHebrewCandidateFromRefs(esOtRefs, options);
        }
      } else if (lxxMatches.refs.length) {
        hebrewCandidate = await buildHebrewCandidateFromLxxRefs(lxxMatches.refs, options);
      }
if (hebrewCandidate?.normalized) {
        hebrewSearchTerms.add(hebrewCandidate.normalized);
      }
      const heIndex = await heIndexPromise;
      throwIfAborted(options.signal);
      const heRefs = [];
      if (enabledCorpora.has('he') && heIndex && hebrewSearchTerms.size) {
        const seen = new Set();
          for (const token of hebrewSearchTerms) {
          const matches = await getRefsForQuery(token, 'he', heIndex, options);
          matches.forEach((ref) => {
            if (seen.has(ref)) return;
            seen.add(ref);
            heRefs.push(ref);
          });
        }
      }

      const posTag = lang === 'gr' ? extractPos(entry) : '—';
      const lemmaLabel = lang === 'gr' ? (entry?.lemma || term) : term;
      const translitLabel = lang === 'he'
        ? transliterateHebrew(term)
        : (entry?.['Forma lexica'] || (lang === 'gr' ? transliterateGreek(term) : '—'));

      renderTags([
        `Lema: <span class="fw-semibold">${lemmaLabel}</span>`,
        `Transliteración: ${translitLabel}`,
        `POS: ${posTag}`,
        `RKANT: ${enabledCorpora.has('gr') ? grRefs.length : '—'}`,
        `LXX: ${enabledCorpora.has('lxx') ? lxxMatches.refs.length : '—'}`,
        `Hebreo: ${enabledCorpora.has('he') ? heRefs.length : '—'}`,
        `RVR1960: ${enabledCorpora.has('es') ? esRefs.length : '—'}`
      ]);

      const lxxHighlightQuery = lxxMatches.highlightTerms?.length
        ? lxxMatches.highlightTerms.join(' ')
        : (greekLemma !== '—' ? greekLemma : (lang === 'gr' ? term : ''));

      const relatedTerms = {
        es: aliasCandidates.relatedLabels?.es || [],
        he: aliasCandidates.relatedLabels?.he || []
      };

      const highlightQueries = {
        gr: greekLemma !== '—' ? greekLemma : (lang === 'gr' ? term : ''),
        lxx: lxxHighlightQuery,
        he: hebrewCandidate?.word || (lang === 'he' ? term : ''),
        es: [esDisplayWord, ...relatedTerms.es].join(' ').trim()
      };

      const cards = [];
      const samplesTasks = [];

      if (greekTerm && grRefs.length) {
        samplesTasks.push(
          buildSamplesForRefs(grRefs, 'gr', 3, null, options).then((grSamples) => {
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
          buildSamplesForRefs(lxxMatches.refs, 'lxx', 3, lxxMatches.texts, options).then((lxxSamples) => {
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
          buildSamplesForRefs(heRefs, 'he', 3, null, options).then((heSamples) => {
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
          buildSamplesForRefs(esOtRefs, 'es', 3, null, options).then((esOtSamples) => {
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
          buildSamplesForRefs(esNtRefs, 'es', 3, null, options).then((esNtSamples) => {
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
      throwIfAborted(options.signal);
      renderCorrespondence(cards);

      const corpusConfigs = [
        { lang: 'gr', refs: grRefs, preloaded: null },
        { lang: 'lxx', refs: lxxMatches.refs, preloaded: lxxMatches.texts },
        { lang: 'he', refs: heRefs, preloaded: null },
        { lang: 'es', refs: esRefs, preloaded: null }
      ]
        .filter((config) => enabledCorpora.has(config.lang))
        .map((config) => ({ ...config, safeRefs: config.refs.slice(0, MAX_REFS_PER_CORPUS) }));

      const groupsByCorpus = corpusConfigs.map((config) => ({
        lang: config.lang,
        groups: [],
        expanded: false,
        loading: true
      }));

      renderResults(groupsByCorpus, highlightQueries, relatedTerms);
      state.last = { term, lang, refs, groupsByCorpus, highlightQueries, relatedTerms };

      await Promise.all(corpusConfigs.map(async (config, index) => {
        throwIfAborted(options.signal);
        const groups = await buildBookGroups(config.safeRefs, config.lang, config.preloaded, options);
        groupsByCorpus[index].groups = groups;
        groupsByCorpus[index].loading = false;
        renderResults(groupsByCorpus, highlightQueries, relatedTerms);
      }));
    } catch (error) {
      if (!isAbortError(error)) {
        console.error('Error en el análisis:', error);
      }
    } finally {
      if (runId === activeSearchRunId) {
        setLoading(false);
        if (activeSearchController === controller) {
          activeSearchController = null;
        }
      }
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
      renderResults(state.last.groupsByCorpus || [], state.last.highlightQueries || {}, state.last.relatedTerms || {});
     }
   }
 
function handleLanguageScopeChange(event) {
    const value = String(event?.target?.value || 'auto');
    state.languageScope = (value === 'es' || value === 'gr' || value === 'he' || value === 'all') ? value : 'auto';
    if (queryInput?.value.trim()) {
      analyze();
    }
   }
 
   
   const debouncedAnalyzeInput = debounce(() => {
     if (!hasTokenWithMinLength(queryInput?.value || '', 3)) return;
     analyze();
   }, DEBOUNCE_DELAY_MS);

analyzeBtn?.addEventListener('click', analyze);
   queryInput?.addEventListener('input', () => {
     debouncedAnalyzeInput();
   });
   queryInput?.addEventListener('keydown', (event) => {
     if (event.key === 'Enter') {
       event.preventDefault();
       analyze();
     }
   });
 
   document.body.addEventListener('click', handleFilterClick);
    languageScopeSelect?.addEventListener('change', handleLanguageScopeChange);
  function applyQueryFromUrl() {
    const params = new URLSearchParams(window.location.search);
const rawScope = String(params.get('scope') || params.get('mode') || '').trim();
    const scopeParam = rawScope.toLowerCase();
   if (scopeParam === 'es' || scopeParam === 'gr' || scopeParam === 'he' || scopeParam === 'all' || scopeParam === 'auto') {
    state.languageScope = scopeParam;
      if (languageScopeSelect) languageScopeSelect.value = scopeParam;
    } else if (languageScopeSelect) {
      languageScopeSelect.value = state.languageScope;
    }
    const q = String(params.get('q') || '').trim();
    if (!q || !queryInput) return;
    queryInput.value = q;
    analyze();
  }

  applyQueryFromUrl();
})();
