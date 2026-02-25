

 (() => {
   const DICT_URL = './diccionario/masterdiccionario.json';
   const HEBREW_DICT_URL = './diccionario/diccionario_unificado.min.json';
     const TRILINGUAL_EQUIV_URL = './diccionario/equivalencias_trilingue.min.json';
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
  trilingualEquiv: null,
    trilingualByEs: new Map(),
    trilingualByGr: new Map(),
    trilingualByHe: new Map(),
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
  const failedJsonRequests = new Map();
  const JSON_RETRY_COOLDOWN_MS = 15000;
 
   const queryInput = document.getElementById('queryInput');
   const analyzeBtn = document.getElementById('analyzeBtn');
   const lemmaTags = document.getElementById('lemmaTags');
   const lemmaSummary = document.getElementById('lemmaSummary');
  const lemmaCorrespondence = document.getElementById('lemmaCorrespondence');
   const lemmaExamples = document.getElementById('lemmaExamples');
  const deepLexicalAnalysis = document.getElementById('deepLexicalAnalysis');
  const deepLexicalCorrespondence = document.getElementById('deepLexicalCorrespondence');
  const resultsLoadingIndicator = document.getElementById('resultsLoadingIndicator');
  const resultsLoadingStage = document.getElementById('resultsLoadingStage');
  const analysisResultsSection = document.getElementById('analysisResultsSection');
  const lemmaSummaryPanel = document.getElementById('lemmaSummaryPanel');
const occurrenceDonutMount = document.getElementById('occurrenceDonutMount');
  const occurrenceDonut = window.AnalisisOccurrenceDonut?.create(occurrenceDonutMount)
  
  const nextFrame = () => new Promise((resolve) => requestAnimationFrame(resolve));
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
    if (deepLexicalAnalysis) deepLexicalAnalysis.hidden = isLoading;
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

  function normalizeSpanishWord(text) {
    return normalizeSpanish(text);
  }

    function normalizeSpanishPhrase(text) {
    return String(text || '')
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9ñ\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }
  function tokenizeSpanishWords(text) {
    return String(text || '')
      .split(/[^\p{L}\p{N}ñÑ]+/u)
      .map((token) => normalizeSpanishWord(token))
      .filter(Boolean);
  }
  function tokenizeGreekWords(text) {
    return String(text || '')
      .split(/[^\p{Script=Greek}\p{N}]+/u)
      .map((token) => normalizeGreek(token))
      .filter(Boolean);
  }
  function tokenizeHebrewWords(text) {
    return String(text || '')
      .replace(/[\u05BE\-\u2010-\u2015\u2212]/g, ' ')
      .split(/\s+/)
      .map((token) => normalizeHebrew(token))
      .filter(Boolean);
  }
  function hasTokenSequence(tokens, queryTokens) {
    if (!queryTokens.length || queryTokens.length > tokens.length) return false;
    for (let i = 0; i <= tokens.length - queryTokens.length; i += 1) {
      let matches = true;
      for (let j = 0; j < queryTokens.length; j += 1) {
        if (tokens[i + j] !== queryTokens[j]) {
          matches = false;
          break;
        }
      }
      if (matches) return true;
    }
    return false;
  }
  function tokenizeQueryForExactSearch(rawQuery, lang) {
    if (lang === 'gr' || lang === 'lxx') return tokenizeGreekWords(rawQuery);
    if (lang === 'he') return tokenizeHebrewWords(rawQuery);
    return tokenizeSpanishWords(rawQuery);
  }
  function tokenizeVerseForExactSearch(verseText, lang) {
    if (lang === 'gr' || lang === 'lxx') return tokenizeGreekWords(verseText);
    if (lang === 'he') return tokenizeHebrewWords(verseText);
    return tokenizeSpanishWords(verseText);
  }
  async function filterRefsByExactSequence(refs, lang, rawQuery) {
    const queryTokens = tokenizeQueryForExactSearch(rawQuery, lang);
    if (queryTokens.length < 2) return refs;
    const output = [];
    for (const ref of refs) {
      const [book, chapterRaw, verseRaw] = String(ref || '').split('|');
      const chapter = Number(chapterRaw);
      const verse = Number(verseRaw);
      if (!book || !Number.isFinite(chapter) || !Number.isFinite(verse)) continue;
      const verses = await loadChapterText(lang, book, chapter);
      const verseText = verses?.[verse - 1] || '';
      const verseTokens = tokenizeVerseForExactSearch(verseText, lang);
      if (hasTokenSequence(verseTokens, queryTokens)) output.push(ref);
    }
    return output;
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
   if (tokens.length > 1) {
      const phrasePattern = tokens.map((token) => buildTokenRegex(token, lang).source).join('\\s+');
      const phraseRe = new RegExp(phrasePattern, 'giu');
      return output.replace(phraseRe, (match) => `<mark>${match}</mark>`);
    }
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
    function stripStrongPrefix(token) {
    return String(token || '').replace(/^[GH]\d+:/i, '').trim();
  }
  async function loadTrilingualEquivalences() {
    if (state.trilingualEquiv) return state.trilingualEquiv;
    const data = await loadJson(TRILINGUAL_EQUIV_URL);
    state.trilingualEquiv = data;

    const byEs = new Map();
    const byGr = new Map();
    const byHe = new Map();
    const register = (esWord, grList, heList) => {
      const esKey = normalizeSpanishPhrase(esWord);
      if (!esKey) return;
      const grSet = new Set((grList || []).map((item) => normalizeGreek(stripStrongPrefix(item))).filter(Boolean));
      const heSet = new Set((heList || []).map((item) => normalizeHebrew(stripStrongPrefix(item))).filter(Boolean));
      byEs.set(esKey, {
        gr: new Set([...(byEs.get(esKey)?.gr || []), ...grSet]),
        he: new Set([...(byEs.get(esKey)?.he || []), ...heSet])
      });
      grSet.forEach((grWord) => {
        if (!byGr.has(grWord)) byGr.set(grWord, new Set());
        byGr.get(grWord).add(esKey);
      });
      heSet.forEach((heWord) => {
        if (!byHe.has(heWord)) byHe.set(heWord, new Set());
        byHe.get(heWord).add(esKey);
      });
    };

    if (Array.isArray(data)) {
      data.forEach((item) => register(item?.es, item?.gr, item?.he));
    } else {
      Object.entries(data?.by_es || {}).forEach(([esWord, payload]) => {
        register(esWord, payload?.gr || [], payload?.he || []);
      });
      Object.entries(data?.by_gr || {}).forEach(([grWord, esWords]) => {
        const grKey = normalizeGreek(stripStrongPrefix(grWord));
        if (!grKey) return;
        if (!byGr.has(grKey)) byGr.set(grKey, new Set());
        (esWords || []).forEach((esWord) => byGr.get(grKey).add(normalizeSpanishPhrase(esWord)));
      });
      Object.entries(data?.by_he || {}).forEach(([heWord, esWords]) => {
        const heKey = normalizeHebrew(stripStrongPrefix(heWord));
        if (!heKey) return;
        if (!byHe.has(heKey)) byHe.set(heKey, new Set());
        (esWords || []).forEach((esWord) => byHe.get(heKey).add(normalizeSpanishPhrase(esWord)));
      });
    }

    state.trilingualByEs = byEs;
    state.trilingualByGr = byGr;
    state.trilingualByHe = byHe;
    return data;
  }

  function getEquivalenceSearchTerms(term, langHint = detectLang(term)) {
    const result = { es: new Set(), gr: new Set(), he: new Set() };
    if (!state.trilingualEquiv) return result;
    const normalized = langHint === 'es'
      ? normalizeSpanishPhrase(term)
      : (langHint === 'gr' ? normalizeGreek(term) : normalizeHebrew(term));
    if (!normalized) return result;

    if (langHint === 'es') {
      const match = state.trilingualByEs.get(normalized);
      if (!match) return result;
      match.gr.forEach((item) => result.gr.add(item));
      match.he.forEach((item) => result.he.add(item));
      return result;
    }

    const bridge = langHint === 'gr' ? state.trilingualByGr.get(normalized) : state.trilingualByHe.get(normalized);
    if (!bridge) return result;
    bridge.forEach((esWord) => {
      result.es.add(esWord);
      const match = state.trilingualByEs.get(esWord);
      if (!match) return;
      match.gr.forEach((item) => result.gr.add(item));
      match.he.forEach((item) => result.he.add(item));
    });
    return result;
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
  async function loadJson(url) {
   const failedRequest = failedJsonRequests.get(url);
    if (failedRequest && (Date.now() - failedRequest.timestamp) < JSON_RETRY_COOLDOWN_MS) {
      throw failedRequest.error;
    }

   if (jsonCache.has(url)) return jsonCache.get(url);
    const promise = fetch(url, { cache: 'force-cache' }).then((res) => {
      if (!res.ok) throw new Error(`No se pudo cargar ${url}`);
      return res.json();
    });
    jsonCache.set(url, promise);
    try {
    failedJsonRequests.delete(url);
      return await promise;
    } catch (error) {
      jsonCache.delete(url);
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
    const candidates = tokens.length > 1 ? [term] : [term, ...tokens];
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

  function renderSingleWordInputError(term) {
    renderTags([
      `Entrada: <span class="fw-semibold">${term}</span>`,
      'Estado: <span class="fw-semibold text-danger">Error de validación</span>'
    ]);
    lemmaSummary.textContent = 'Solo se aceptan entradas de una sola palabra en el análisis textual.';
    renderCorrespondence([]);
    renderExamples([]);
    occurrenceDonut?.setData({ es: [], he: [], gr: [] });
    deepLexicalAnalysis.innerHTML = '<div class="col-12"><div class="small muted">Corrige la consulta: usa una sola palabra (sin frases).</div></div>';
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

  function updateTrilingualBrief({ esWord = '—', grWord = '—', heWord = '—' } = {}) {
    if (!deepLexicalCorrespondence) return;
    deepLexicalCorrespondence.innerHTML = `
      <span class="trilingual-title">Correspondencias idiomáticas:</span>
      <span class="trilingual-line">Español: <span class="fw-semibold">${escapeHtml(esWord || '—')}</span> / Hebreo: <span class="fw-semibold he">${escapeHtml(heWord || '—')}</span> / Griego: <span class="fw-semibold gr">${escapeHtml(grWord || '—')}</span></span>
    `;
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

function buildSpanishTestamentLabel(otRefs = [], ntRefs = []) {
    if (otRefs.length && ntRefs.length) return 'RVR1960 (AT/NT)';
    if (otRefs.length) return 'RVR1960 (AT)';
    if (ntRefs.length) return 'RVR1960 (NT)';
    return 'RVR1960';
  }
  function cleanHebrewToken(token) {
    return String(token || '')
      .replace(/[׃.,;:!?"“”(){}\[\]<>«»]/g, '')
      .replace(/[\u05BE\-\u2010-\u2015\u2212]/g, ' ');
  }

   function tokenizeGreekText(text) {
    return String(text || '')
      .split(/\s+/)
      .map((token) => cleanGreekToken(token))
      .filter(Boolean);
  }

    function tokenizeHebrewText(text) {
    return String(text || '')
      .split(/\s+/)
      .flatMap((token) => cleanHebrewToken(token).split(/\s+/))
     .filter(Boolean);
  }
 

    function toPercent(part, total) {
    if (!total) return '0.0%';
    return `${((part / total) * 100).toFixed(1)}%`;
  }

  function describeMorphTag(tag) {
    const raw = String(tag || '').trim();
    if (!raw) return '—';
    const posMap = {
      N: 'Sustantivo',
      V: 'Verbo',
      A: 'Adjetivo',
      D: 'Adverbio',
      P: 'Preposición',
      C: 'Conjunción',
      T: 'Artículo',
      I: 'Interjección',
      X: 'Partícula',
      M: 'Numeral',
      RP: 'Pronombre personal',
      RA: 'Pronombre/artículo',
      RD: 'Pronombre demostrativo',
      RI: 'Pronombre interrogativo',
      RR: 'Pronombre relativo'
    };
    const caseMap = { N: 'Nominativo', G: 'Genitivo', D: 'Dativo', A: 'Acusativo', V: 'Vocativo' };
    const numMap = { S: 'Singular', P: 'Plural', D: 'Dual' };
    const genMap = { M: 'Masculino', F: 'Femenino', N: 'Neutro' };
    const tenseMap = { P: 'Presente', I: 'Imperfecto', F: 'Futuro', A: 'Aoristo', X: 'Perfecto', Y: 'Pluscuamperfecto' };
    const voiceMap = { A: 'Activa', M: 'Media', P: 'Pasiva' };
    const moodMap = { I: 'Indicativo', S: 'Subjuntivo', O: 'Optativo', M: 'Imperativo', N: 'Infinitivo', P: 'Participio' };

    const nounMatch = raw.match(/^([A-Z]{1,2})\.([NGDAV])([SPD])([MFN])$/);
    if (nounMatch) {
      const [, posCode, caseCode, numCode, genCode] = nounMatch;
      const parts = [posMap[posCode] || posCode, caseMap[caseCode], numMap[numCode], genMap[genCode]].filter(Boolean);
      return `${parts.join(' · ')} (${raw})`;
    }

    const pronounMatch = raw.match(/^([A-Z]{1,2})\.([NGDAV])([SP])([MFN]?)$/);
    if (pronounMatch) {
      const [, posCode, caseCode, numCode, genCode] = pronounMatch;
      const parts = [posMap[posCode] || posCode, caseMap[caseCode], numMap[numCode], genMap[genCode]].filter(Boolean);
      return `${parts.join(' · ')} (${raw})`;
    }

    const verbMatch = raw.match(/^V\.([PIFAXY])([AMP])([ISOMNP])([123]?)([SPD]?)$/);
    if (verbMatch) {
      const [, tenseCode, voiceCode, moodCode, personCode, numCode] = verbMatch;
      const person = personCode ? `${personCode}ª persona` : '';
      const parts = ['Verbo', tenseMap[tenseCode], voiceMap[voiceCode], moodMap[moodCode], person, numMap[numCode]].filter(Boolean);
      return `${parts.join(' · ')} (${raw})`;
    }

    return posMap[raw] ? `${posMap[raw]} (${raw})` : raw;
  }
  function buildGreekLexicalRoot(normalizedLemma) {
    const endings = ['ων','ους','ουσ','οις','αις','ειν','εις','ας','ης','ος','οι','αι','ον','ην','ου','ω'];
    for (const ending of endings) {
      if (normalizedLemma.endsWith(ending) && normalizedLemma.length - ending.length >= 3) {
        return normalizedLemma.slice(0, -ending.length);
      }
    }
    return normalizedLemma.slice(0, Math.min(4, normalizedLemma.length));
  }

          function buildHebrewLexicalRoot(baseLemma) {
    const consonants = normalizeHebrew(baseLemma || '');
    return consonants.slice(0, Math.min(3, consonants.length || 0));
  }

 async function buildDeepLexicalModules({ lang, normalizedLemma, displayLemma, grRefs, heRefs, lxxRefs }) {
    const formStats = new Map();
    let totalOccurrences = 0;

  
        const pushForm = (form, source, morph = '') => {
      const key = `${source}::${form}::${morph}`;
      const current = formStats.get(key) || { form, source, morph, count: 0 };
      current.count += 1;
      formStats.set(key, current);
    };

   if (lang === 'gr' || lxxRefs.length) {
      const grIndex = await loadIndex('gr');
      await loadDictionary();
      const greekEntries = Array.isArray(state.dict?.items) ? state.dict.items : [];
      greekEntries.forEach((item) => {
        if (normalizeGreek(item?.lemma || '') !== normalizedLemma) return;
        const form = item?.['Forma flexionada del texto'] || item?.lemma || '';
        const normalizedForm = normalizeGreek(form);
        if (!normalizedForm) return;
        const count = (grIndex.tokens?.[normalizedForm] || []).length;
        if (!count) return;
        pushForm(form, 'RKANT (base completa)', '');
        formStats.get(`RKANT (base completa)::${form}::`).count = count;
      });

      for (const file of LXX_FILES) {
        try {
          const data = await loadLxxFile(file);
          Object.values(data?.text || {}).forEach((chapters) => {
            Object.values(chapters || {}).forEach((verses) => {
              Object.values(verses || {}).forEach((tokens) => {
                (tokens || []).forEach((token) => {
                  if (normalizeGreek(token?.lemma || '') !== normalizedLemma) return;
                  pushForm(token?.w || token?.lemma || '', 'LXX (base completa)', token?.morph || '');
                });
              });
            });
          });
        } catch (error) {
          continue;
        }
      }
    }

    if (lang === 'he') {
      await loadHebrewDictionary();
      const heIndex = await loadIndex('he');
      const formSet = new Set([
        hebrewStopwords.has(displayLemma) ? '' : displayLemma,
        ...(state.hebrewDictMap.get(normalizedLemma)?.forms || []),
        ...(state.hebrewDictMap.get(normalizedLemma)?.formas || [])
      ].filter(Boolean));
      formSet.forEach((form) => {
        const normalizedForm = normalizeHebrew(form);
        const count = (heIndex.tokens?.[normalizedForm] || []).length;
        if (!count) return;
        const key = `Hebreo (base completa)::${form}::`;
        formStats.set(key, { form, source: 'Hebreo (base completa)', morph: '', count });
      });
    }

    if (lang === 'es') {
      const esIndex = await loadIndex('es');
      const normalizedEs = normalizeSpanish(displayLemma);
      const count = (esIndex.tokens?.[normalizedEs] || []).length;
      if (count) {
        formStats.set(`Español (base completa)::${displayLemma}::`, {
          form: displayLemma,
          source: 'Español (base completa)',
          morph: '',
          count
        });
      }
    }
    const forms = [...formStats.values()].sort((a, b) => b.count - a.count);
    const sourceOrder = ['LXX (base completa)', 'Hebreo (base completa)', 'RKANT (base completa)', 'Español (base completa)'];
    const sourceLabels = {
      'LXX (base completa)': 'LXX',
      'Hebreo (base completa)': 'Hebreo',
      'RKANT (base completa)': 'RKANT',
      'Español (base completa)': 'RVR1960'
    };
    const formsBySource = sourceOrder.map((source) => {
      const rows = forms.filter((item) => item.source === source);
      const total = rows.reduce((acc, row) => acc + row.count, 0);
      return {
        source,
        label: sourceLabels[source] || source,
        rows,
        total
      };
    }).filter((item) => item.rows.length);
    return { forms, formsBySource, totalOccurrences };
 }
   function renderDeepLexicalAnalysis(modules) {
    deepLexicalAnalysis.innerHTML = '';
    const wrapper = document.createElement('div');
    wrapper.className = 'col-12';

    if (!modules || (!modules.totalOccurrences && !(modules.forms || []).length)) {
     wrapper.innerHTML = '<div class="small muted">No hay datos suficientes para generar el análisis léxico profundo.</div>';
      deepLexicalAnalysis.appendChild(wrapper);
      return;
    }

   const formsByBookRows = (modules.formsBySource || []).map((group) => {
      const formsRows = group.rows.map((item) => `
        <tr>
          <td>${escapeHtml(item.form)}</td>
          <td>${item.count}</td>
          <td>${escapeHtml(describeMorphTag(item.morph || ''))}</td>
        </tr>
   `).join('');
      return `
        <details class="mb-2">
          <summary class="fw-semibold">${escapeHtml(group.label)} <span class="small muted">(${group.total} coincidencias)</span></summary>
          <div class="table-responsive mt-2">
            <table class="table table-sm align-middle">
              <thead><tr><th>Forma</th><th>Frecuencia</th><th>Morfología</th></tr></thead>
              <tbody>${formsRows || '<tr><td colspan="3" class="small muted">Sin coincidencias.</td></tr>'}</tbody>
            </table>
          </div>
        </details>
      `;
    }).join('');

    wrapper.innerHTML = `
      <details open>
        <summary class="fw-semibold mb-2">Mostrar / ocultar análisis</summary>
        <div class="table-responsive mb-3">
    <div class="fw-semibold mb-2">1) Formas flexionadas encontradas en la base (por libro)</div>
          ${formsByBookRows || '<div class="small muted">Sin coincidencias.</div>'}
        </div>
      </details>
    `;

    deepLexicalAnalysis.appendChild(wrapper);
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

    
    if (!summaryParts.length) summaryParts.push('No se encontró definición directa, se usa la concordancia del corpus para contexto.');
    const summaryQuery = highlightQueries.es || (lang === 'es' ? term : '');
    lemmaSummary.innerHTML = highlightText(summaryParts.join(' '), summaryQuery, 'es');
     const cards = [];
     
     
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
    const term = queryInput.value.trim();
    if (!term) {
      return;
    }
   const queryTokens = tokenizeQueryForExactSearch(term, detectLang(term));
    if (queryTokens.length > 1) {
      renderSingleWordInputError(term);
      return;
    }
    scrollToLemmaSummary();
   setLoading(true);
    await nextFrame();
      try {
    const lang = detectLang(term);
    const normalized = normalizeByLang(term, lang);
  try {
      await loadTrilingualEquivalences();
    } catch (error) {
      // El análisis sigue funcionando aunque falle la carga de equivalencias.
    }
    const equivalenceTerms = getEquivalenceSearchTerms(term, lang);
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
    const isMultiWordQuery = queryTokens.length > 1;
    let refs = lang === 'gr'
     ? getGreekRefs(normalized, index)
      : (lang === 'he' ? getHebrewRefs(normalized, index) : (index.tokens?.[normalized] || []));
       if (isMultiWordQuery) {
      const seed = index.tokens?.[queryTokens[0]] || [];
      refs = await filterRefsByExactSequence(seed, lang, term);
    }
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
      occurrenceDonut?.setData({ es: [], he: [], gr: [] });
      deepLexicalAnalysis.innerHTML = '<div class="col-12"><div class="small muted">No hay ocurrencias para construir el análisis léxico profundo.</div></div>';
      state.last = { term, lang, refs: [], lexicalModules: null };
     return;
     }
 
   
    const esIndexPromise = loadIndex('es');
    const grIndexPromise = loadIndex('gr');
    const heIndexPromise = loadIndex('he');
    const esIndex = await esIndexPromise;
   let esSearchTokens = [];
    if (lang === 'es') {
      esSearchTokens = isMultiWordQuery ? [] : [normalized].filter(Boolean);
    } else if (entry?.definicion) {
      esSearchTokens = extractSpanishTokensFromDefinition(entry.definicion);
 } else if (lang === 'he' && getHebrewDefinition(hebrewEntry)) {
      esSearchTokens = extractSpanishTokensFromDefinition(getHebrewDefinition(hebrewEntry));
    } else {
      esSearchTokens = [normalizeSpanish(term)].filter(Boolean);
    }
         esSearchTokens = [...new Set([
      ...esSearchTokens,
      ...[...(equivalenceTerms.es || [])].flatMap((item) => normalizeSpanishPhrase(item).split(/\s+/)).filter(Boolean)
    ])];
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
       if (lang === 'es' && isMultiWordQuery) {
      const phraseRefs = await filterRefsByExactSequence(index.tokens?.[queryTokens[0]] || [], 'es', term);
      phraseRefs.forEach((ref) => {
        if (esSeen.has(ref)) return;
        esSeen.add(ref);
        esRefs.push(ref);
      });
    }
    const { ot: esOtRefs, nt: esNtRefs } = splitRefsByTestament(esRefs);

    if (lang === 'gr') {
      greekTerm = normalized;
    } else if (lang === 'es') {
        if (!greekTerm && equivalenceTerms.gr?.size) {
        const rankedEquivalents = [...equivalenceTerms.gr]
          .map((candidate) => ({ candidate, refs: getGreekRefs(candidate, grIndex).length }))
          .sort((a, b) => b.refs - a.refs);
        const fromEquivalence = rankedEquivalents.find((item) => item.refs > 0) || rankedEquivalents[0];
        if (fromEquivalence?.candidate) {
          greekTerm = fromEquivalence.candidate;
          await loadDictionary();
          greekEntry = state.dictMap.get(greekTerm) || greekEntry;
        }
      }
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
    const heIndex = await heIndexPromise;
    let hebrewCandidate = null;
    if (lang === 'he') {
      hebrewCandidate = {
        normalized,
        word: term,
        transliteration: transliterateHebrew(term)
      };
     } else if (lang === 'es') {
 if (!hebrewCandidate && equivalenceTerms.he?.size) {
        const preferredHe = [...equivalenceTerms.he]
          .map((candidate) => ({ candidate, refs: getHebrewRefs(candidate, heIndex).length }))
          .sort((a, b) => b.refs - a.refs)[0];
        if (preferredHe?.candidate) {
          hebrewCandidate = {
            normalized: preferredHe.candidate,
            word: preferredHe.candidate,
            transliteration: transliterateHebrew(preferredHe.candidate)
          };
        }
      }
     if (!hebrewCandidate && greekTerm && lxxMatches.refs.length) {
      hebrewCandidate = await buildHebrewCandidateFromLxxRefs(lxxMatches.refs);
      }
      if (!hebrewCandidate && esOtRefs.length) {
        hebrewCandidate = await buildHebrewCandidateFromRefs(esOtRefs);
      }
    } else if (lxxMatches.refs.length) {
      hebrewCandidate = await buildHebrewCandidateFromLxxRefs(lxxMatches.refs);
    }
    const heRefs = hebrewCandidate ? getHebrewRefs(hebrewCandidate.normalized, heIndex) : [];
     const posTag = lang === 'gr' ? extractPos(entry) : '—';
    const lemmaLabel = lang === 'gr' ? (entry?.lemma || term) : term;
    updateTrilingualBrief({
      esWord: esDisplayWord || term,
      heWord: hebrewCandidate?.word || (lang === 'he' ? term : '—'),
      grWord: lemmaLabel || (lang === 'gr' ? term : '—')
    });
       occurrenceDonut?.setData({
      es: buildBookCountRows(esRefs),
      he: buildBookCountRows(heRefs),
      gr: buildBookCountRows([...grRefs, ...lxxMatches.refs])
    });

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
 if (esRefs.length) {
      const esTitle = buildSpanishTestamentLabel(esOtRefs, esNtRefs);
            samplesTasks.push(
                buildSamplesForRefs(esRefs, 'es', 3).then((esSamples) => {
          cards.push(buildCorrespondenceCard({
            title: esTitle,
            word: esDisplayWord,
            transliteration: '',
            samples: esSamples,
           lang: 'es',
            highlightQuery: highlightQueries.es
          }));
        })
      );
    }
       await Promise.all(samplesTasks);
    renderCorrespondence(cards);
deepLexicalAnalysis.innerHTML = '<div class="col-12"><div class="small muted">Construyendo módulos de análisis...</div></div>';
    const lexicalModules = await buildDeepLexicalModules({
      lang,
      normalizedLemma: lang === 'he' ? normalizeHebrew(term) : normalizeGreek(greekLemma !== '—' ? greekLemma : term),
      displayLemma: lang === 'he' ? term : (greekLemma !== '—' ? greekLemma : term),
      grRefs,
      heRefs,
      lxxRefs: lxxMatches.refs
    });
    renderDeepLexicalAnalysis(lexicalModules);
    state.last = { term, lang, refs, lexicalModules };
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

  // Los filtros rápidos no alteran el módulo léxico profundo actual.
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
