 (() => {
const TORAH_TRILINGUAL_DICT_URLS = [
    '../diccionario/pruebas/01Génesis.json',
    '../diccionario/pruebas/02Éxodo.json',
    '../diccionario/pruebas/03Levítico.json',
    '../diccionario/pruebas/04Números.json',
    '../diccionario/pruebas/05Deuteronomio.json'
      ];
   const SEARCH_INDEX = {
     es: '../search/index-es.json',
     gr: '../search/index-gr.json',
     he: '../search/index-he.json'
   };
   const TEXT_BASE = '../search/texts';
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
    greekUnifiedMap: new Map(),
    hebrewExtended: null,
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

  if (typeof document !== 'undefined' && !document.getElementById('compoundPartialStyle')) {
    const compoundStyle = document.createElement('style');
    compoundStyle.id = 'compoundPartialStyle';
    compoundStyle.textContent = `
      .metric-card[data-partial="true"] {
        border-left: 4px solid var(--warn, #f59e0b);
      }
    `;
    document.head.appendChild(compoundStyle);
  }
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

  const HEBREW_COMPOUND_CONNECTOR_RE = /[\s\u05BE\-\u2010-\u2015\u2212]+/;
  const RE_HEB = /[\u0590-\u05FF]/;

  function hasCompoundConnector(text) {
    return /[\s\u05BE\-\u2010-\u2015\u2212]/.test(String(text || ''));
  }

  function splitCompoundQuery(text) {
    return String(text || '')
      .split(HEBREW_COMPOUND_CONNECTOR_RE)
      .map((part) => String(part || '').trim())
      .filter(Boolean);
  }

  function dedupeCompoundMatches(matches) {
    const output = [];
    const seen = new Set();
    (matches || []).forEach((match) => {
      const key = [
        normalizeHebrew(match?.lemma || ''),
        normalizeSpanishPhrase(match?.es || ''),
        String(match?._queryPart || '')
      ].join('|');
      if (seen.has(key)) return;
      seen.add(key);
      output.push(match);
    });
    return output;
  }

  function compactHebrewNoVowels(text) {
    return normalizeHebrew(String(text || '').replace(HEBREW_COMPOUND_CONNECTOR_RE, ''));
  }

  const KNOWN_LEXICALIZED_COMPOUND_SPLITS = (() => {
    const raw = [
      ['בארשבע', ['באר', 'שבע']],
      ['באר-שבע', ['באר', 'שבע']],
      ['ביתספר', ['בית', 'ספר']],
      ['בןאדם', ['בן', 'אדם']],
      ['קריתארבע', ['קרית', 'ארבע']],
      ['ביתאל', ['בית', 'אל']],
      ['ביתלחם', ['בית', 'לחם']]
    ];
    const map = new Map();
    raw.forEach(([whole, parts]) => {
      const wholeKey = compactHebrewNoVowels(whole);
      const normalizedParts = (parts || []).map(compactHebrewNoVowels).filter(Boolean);
      if (!wholeKey || normalizedParts.length < 2) return;
      if (!map.has(wholeKey)) map.set(wholeKey, []);
      map.get(wholeKey).push(normalizedParts);
    });
    return map;
  })();

  function scoreCompoundSplit(parts, wholeKey) {
    const lens = (parts || []).map((part) => String(part || '').length).filter(Boolean);
    if (!lens.length) return 999;
    const minLen = Math.min(...lens);
    const maxLen = Math.max(...lens);
    const diff = maxLen - minLen;
    const joined = (parts || []).join('');
    const joinedPenalty = joined === wholeKey ? 0 : 5;
    const shortPenalty = lens.reduce((acc, n) => acc + (n < 2 ? 20 : 0), 0);
    const oneLetterPenalty = lens.reduce((acc, n) => acc + (n === 1 ? 100 : 0), 0);
    const partsPenalty = Math.max(0, (parts.length - 2) * 4);
    return oneLetterPenalty + shortPenalty + partsPenalty + diff + joinedPenalty;
  }

  function dedupeSplitPlans(plans) {
    const seen = new Set();
    const output = [];
    (plans || []).forEach((plan) => {
      const parts = Array.isArray(plan?.parts) ? plan.parts.map(String).filter(Boolean) : [];
      if (parts.length < 2) return;
      const key = parts.join('+');
      if (seen.has(key)) return;
      seen.add(key);
      output.push({
        kind: plan?.kind || 'heuristic',
        parts,
        score: Number.isFinite(plan?.score) ? plan.score : 999
      });
    });
    const kindRank = (plan) => (plan?.kind === 'known' ? 0 : 1);
    output.sort((a, b) => kindRank(a) - kindRank(b) || a.score - b.score || a.parts.length - b.parts.length);
    return output;
  }

  async function searchHebrewWordSingle(rawInput) {
    const rawSpan = String(rawInput || '').trim();
    const normalized = normalizeHebrew(rawSpan);
    if (!rawSpan || !normalized) {
      return { ok: false, tier: 'Sin coincidencias', matches: [], refs: [], trace: [`Sin consulta hebrea válida: ${rawSpan || '—'}`] };
    }

    await loadDictionary();
    await loadHebrewDictionary();
    const index = await loadIndex('he');

    const refs = getHebrewRefs(normalized, index);
    const matches = [];
    const items = Array.isArray(state.hebrewDict?.items) ? state.hebrewDict.items : [];
    items.forEach((item) => {
      const lemma = String(item?.texto_hebreo || item?.entrada_impresa || '').trim();
      if (!lemma) return;
      if (normalizeHebrew(lemma) !== normalized) return;
      matches.push({
        lemma,
        es: getTorahSpanishDisplay(item) || String(item?.equivalencia_espanol || item?.equivalencia_español || '').trim(),
        gr: getTorahGreekDisplay(item) || '',
        entry: item
      });
    });

    if (!matches.length && state.hebrewDictMap.has(normalized)) {
      const fallback = state.hebrewDictMap.get(normalized);
      matches.push({
        lemma: fallback?.lemma || rawSpan,
        es: '',
        gr: '',
        entry: fallback || null
      });
    }

    return {
      ok: Boolean(refs.length || matches.length),
      tier: refs.length || matches.length ? 'Coincidencia literal/normalizada' : 'Sin coincidencias',
      matches: dedupeCompoundMatches(matches),
      refs: [...new Set(refs)],
      trace: [
        `Consulta: ${rawSpan}`,
        `Normalizada: ${normalized}`,
        `Coincidencias: ${matches.length}`,
        `Referencias: ${refs.length}`
      ]
    };
  }

  async function resolveBySeparatedParts(parts, rawSpan, label, options = {}) {
    const requireAllParts = options.requireAllParts !== false;
    const allMatches = [];
    const refs = [];
    const refsSeen = new Set();
    const partsTrace = [];
    const partsFound = [];
    const partsMissing = [];

    for (const part of (parts || []).filter(Boolean)) {
      const sub = await searchHebrewWordSingle(part);
      partsTrace.push(`[Parte: ${part}]`);
      (sub.trace || []).forEach((line) => partsTrace.push(line));

      if (sub.ok && sub.matches.length) {
        sub.matches.forEach((match) => {
          allMatches.push({ ...match, _queryPart: part });
        });
        partsFound.push(`${part} → ${sub.tier} (${sub.matches.length || 0})`);
      } else {
        partsMissing.push(part);
      }

      (sub.refs || []).forEach((ref) => {
        if (refsSeen.has(ref)) return;
        refsSeen.add(ref);
        refs.push(ref);
      });
    }

    if (requireAllParts && partsMissing.length > 0) return null;
    const merged = dedupeCompoundMatches(allMatches);
    if (!merged.length && !refs.length) return null;

    return {
      ok: true,
      tier: partsMissing.length > 0 ? 'Resultado parcial de compuesto' : 'Compuesto segmentado automáticamente',
      matches: merged,
      refs,
      trace: [
        `${label}: ${rawSpan}`,
        `Se divide en partes: ${(parts || []).join(' + ')}`,
        ...(partsFound.length ? [`Partes con resultado: ${partsFound.join(' | ')}`] : []),
        ...(partsMissing.length ? [`Partes sin resultado: ${partsMissing.join(' | ')}`] : []),
        ...partsTrace
      ],
      diag: `No se encontró la expresión completa "${rawSpan}", por lo que se buscaron sus componentes por separado.`,
      _isCompound: true,
      _partsFound: partsFound,
      _partsMissing: partsMissing
    };
  }

  function findLexicalizedCompoundPlans(rawSpan) {
    const plans = [];
    const wholeKey = compactHebrewNoVowels(rawSpan);
    if (!wholeKey || wholeKey.length < 4) return plans;

    const known = KNOWN_LEXICALIZED_COMPOUND_SPLITS.get(wholeKey) || [];
    known.forEach((parts) => {
      plans.push({ kind: 'known', parts, score: scoreCompoundSplit(parts, wholeKey) });
    });

    const indexNoVowels = new Set([
      ...Array.from(state.hebrewDictMap?.keys?.() || []),
      ...Array.from((state.hebrewDict?.items || []).map((item) => compactHebrewNoVowels(item?.texto_hebreo || item?.entrada_impresa || '')).filter(Boolean))
    ]);

    const wholeExists = indexNoVowels.has(wholeKey);

    for (let i = 2; i <= wholeKey.length - 2; i += 1) {
      const a = wholeKey.slice(0, i);
      const b = wholeKey.slice(i);
      if (a.length < 2 || b.length < 2) continue;
      if (!indexNoVowels.has(a) || !indexNoVowels.has(b)) continue;
      if (wholeExists && !known.length) continue;
      const parts = [a, b];
      plans.push({ kind: 'heuristic', parts, score: scoreCompoundSplit(parts, wholeKey) });
    }

    if (wholeKey.length >= 6) {
      for (let i = 2; i <= wholeKey.length - 4; i += 1) {
        for (let j = i + 2; j <= wholeKey.length - 2; j += 1) {
          const a = wholeKey.slice(0, i);
          const b = wholeKey.slice(i, j);
          const c = wholeKey.slice(j);
          if (a.length < 2 || b.length < 2 || c.length < 2) continue;
          if (!indexNoVowels.has(a) || !indexNoVowels.has(b) || !indexNoVowels.has(c)) continue;
          if (wholeExists && !known.length) continue;
          const parts = [a, b, c];
          plans.push({ kind: 'heuristic', parts, score: scoreCompoundSplit(parts, wholeKey) + 3 });
        }
      }
    }

    return dedupeSplitPlans(plans).slice(0, 8);
  }

  async function searchHebrewWord(rawInput) {
    const rawSpan = String(rawInput || '').trim();
    const tokens = splitCompoundQuery(rawSpan);
    if (!rawSpan || !RE_HEB.test(rawSpan)) {
      return searchHebrewWordSingle(rawInput);
    }

    const fullMatch = await searchHebrewWordSingle(rawInput);
    if (fullMatch.ok && ((fullMatch.matches && fullMatch.matches.length) || (fullMatch.refs && fullMatch.refs.length))) {
      return fullMatch;
    }

    const hasConnector = hasCompoundConnector(rawSpan) || rawSpan.includes(' ');
    if (hasConnector) {
      const parts = tokens.length > 0 ? tokens : rawSpan.split(/[\s־\-‐‑‒–—]+/).filter(Boolean);
      if (parts.length >= 2) {
        const resParts = await resolveBySeparatedParts(parts, rawSpan, 'Segmentación automática por falta de unidad completa', {
          requireAllParts: false
        });
        if (resParts && ((resParts.matches && resParts.matches.length) || (resParts.refs && resParts.refs.length))) {
          resParts._isCompound = true;
          return resParts;
        }
      }
    }

    if (!hasConnector && tokens.length === 1) {
      const plans = findLexicalizedCompoundPlans(rawSpan);
      for (const plan of plans) {
        const resParts = await resolveBySeparatedParts(plan.parts, rawSpan, `Lexicalizado (${plan.kind})`, { requireAllParts: true });
        if (resParts) return resParts;
      }
    }

    return fullMatch;
  }

    function stripStrongPrefix(token) {
    return String(token || '').replace(/^[GH]\d+:/i, '').trim();
  }
  async function loadTrilingualEquivalences() {
    if (state.trilingualEquiv) return state.trilingualEquiv;
    const data = await loadDictionary();
        state.trilingualEquiv = data;

    const byEs = new Map();
    const byGr = new Map();
    const byHe = new Map();
      const normalizeAndStrip = (item, lang) => {
      const stripped = stripStrongPrefix(item);
      if (lang === 'gr') return normalizeGreek(stripped);
      if (lang === 'he') return normalizeHebrew(stripped);
      return normalizeSpanishPhrase(stripped);
    };
    const register = (esWord, grList, heList) => {
      const esKey = normalizeSpanishPhrase(esWord);
      if (!esKey) return;
     const grSet = new Set((grList || []).map((item) => normalizeAndStrip(item, 'gr')).filter(Boolean));
      const heSet = new Set((heList || []).map((item) => normalizeAndStrip(item, 'he')).filter(Boolean));
      const grDisplayList = [];
      const heDisplayList = [];
      (grList || []).forEach((item) => {
        const normalized = normalizeAndStrip(item, 'gr');
        if (!normalized) return;
        grDisplayList.push({ normalized, display: stripStrongPrefix(item) });
      });
      (heList || []).forEach((item) => {
        const normalized = normalizeAndStrip(item, 'he');
        if (!normalized) return;
        heDisplayList.push({ normalized, display: stripStrongPrefix(item) });
      });
      byEs.set(esKey, {
                gr: new Set([...(byEs.get(esKey)?.gr || []), ...grSet]),
          he: new Set([...(byEs.get(esKey)?.he || []), ...heSet]),
        grDisplay: [...(byEs.get(esKey)?.grDisplay || []), ...grDisplayList],
        heDisplay: [...(byEs.get(esKey)?.heDisplay || []), ...heDisplayList]
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

    (data?.entries || []).forEach((item) => {
      const es = String(item?.equivalencia_espanol || '').trim();
      const gr = String(item?.equivalencia_griega || '')
        .split(',')
        .map((part) => String(part || '').trim())
        .filter(Boolean);
      const he = [String(item?.texto_hebreo || '').trim()].filter(Boolean);
      register(es, gr, he);
    });

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


  // ============================
  // Torah trilingüe (Gen→Deut): primer match por libro (ES/GR/HE)
  // ============================

  function splitEsVariants(raw) {
    return String(raw || '')
      .split('/')
      .flatMap((part) => String(part || '').split(','))
      .map((s) => String(s || '').trim())
      .filter(Boolean);
  }

  function splitGrVariants(raw) {
    return String(raw || '')
      .split(',')
      .map((s) => String(s || '').trim())
      .filter(Boolean);
  }

  function cleanTorahHebrewDisplay(raw) {
    return String(raw || '')
      .trim()
      .replace(/^[\u05D0-\u05EA]\s+/, '')
      .trim();
  }

  function getTorahSpanishDisplay(entry) {
    const firstCandidate = Array.isArray(entry?.candidatos)
      ? String(entry.candidatos.find((item) => String(item || '').trim()) || '').trim()
      : '';
    return firstCandidate
      || String(entry?.equivalencia_espanol || entry?.equivalencia_español || '').trim();
  }

  function getTorahGreekDisplay(entry) {
    return String(entry?.equivalencia_griega || '').trim();
  }

  function getTorahGreekSearchTerm(entry) {
    const full = getTorahGreekDisplay(entry);
    return splitGrVariants(full)[0] || full;
  }

  function isExactTorahHebrewMatch(entry, normalizedHebrewQuery) {
    const heDisplay = cleanTorahHebrewDisplay(entry?.texto_hebreo || '');
    return !!heDisplay && normalizeHebrew(heDisplay) === normalizeHebrew(normalizedHebrewQuery);
  }

  async function loadTorahTrilingualEquivalences() {
    if (state.torahTriLoaded) return state.torahTriLoaded;

    state.torahTri = [];
    state.torahTriLoaded = (async () => {
      const batches = await Promise.all(TORAH_TRILINGUAL_DICT_URLS.map((url) => loadJson(url)));
      // Mantener el orden exacto del array: Génesis→Deuteronomio
      for (let i = 0; i < batches.length; i++) {
        const entries = Array.isArray(batches[i]) ? batches[i] : [];
        const byEs = new Map();
        const byGr = new Map();
        const byHe = new Map();

        const pushMap = (map, key, entry) => {
          if (!key) return;
          if (!map.has(key)) map.set(key, []);
          map.get(key).push(entry);
        };

        entries.forEach((entry) => {
          const heRaw = cleanTorahHebrewDisplay(entry?.texto_hebreo || '');
          const grRaw = getTorahGreekDisplay(entry);
          const esRaw = String(entry?.equivalencia_espanol || entry?.equivalencia_español || '').trim();
          const candidatos = Array.isArray(entry?.candidatos)
            ? entry.candidatos.map((item) => String(item || '').trim()).filter(Boolean)
            : [];

          const heKeys = [normalizeHebrew(heRaw)].filter(Boolean);
          const grKeys = splitGrVariants(grRaw).map(normalizeGreek).filter(Boolean);
          const esKeys = [
            ...splitEsVariants(esRaw),
            ...candidatos
          ].map(normalizeSpanishPhrase).filter(Boolean);

          const enriched = { ...entry, __torahBookIndex: i };

          heKeys.forEach((k) => pushMap(byHe, k, enriched));
          grKeys.forEach((k) => pushMap(byGr, k, enriched));
          esKeys.forEach((k) => pushMap(byEs, k, enriched));
        });

        state.torahTri.push({ byEs, byGr, byHe, entries });
      }
      return state.torahTri;
    })();

    return state.torahTriLoaded;
  }

  async function findFirstTorahTrilingualMatch(term) {
    await loadTorahTrilingualEquivalences();

    const qEs = normalizeSpanishPhrase(term);
    const qGr = normalizeGreek(term);
    const qHe = normalizeHebrew(term);

    // Regla: respetar orden Génesis→Deuteronomio. Dentro de un mismo libro:
    // 1) Si la consulta es hebrea y hay match hebreo → tomarlo.
    // 2) Si la consulta es griega y hay match griego → tomarlo.
    // 3) Si la consulta es española y hay match español → tomarlo.
    // 4) Si hay varios hits por combinaciones, preferir el que tenga hebreo visible.
    for (const book of (state.torahTri || [])) {
      const heHits = qHe ? (book.byHe.get(qHe) || []) : [];
      const grHits = qGr ? (book.byGr.get(qGr) || []) : [];
      const esHits = qEs ? (book.byEs.get(qEs) || []) : [];

      if (heHits.length) {
        const exactHebrew = heHits.find((e) => isExactTorahHebrewMatch(e, qHe));
        return exactHebrew || heHits[0];
      }
      if (grHits.length) {
        const withHebrew = grHits.find((e) => cleanTorahHebrewDisplay(e?.texto_hebreo || ''));
        return withHebrew || grHits[0];
      }
      if (esHits.length) {
        const withHebrew = esHits.find((e) => cleanTorahHebrewDisplay(e?.texto_hebreo || ''));
        return withHebrew || esHits[0];
      }

      // Si no hay match directo pero por alguna razón hay hits cruzados, elegir el más completo
      const hits = [...heHits, ...grHits, ...esHits];
      if (hits.length) {
        const withHebrew = hits.find((e) => String(e?.texto_hebreo || '').trim());
        return withHebrew || hits[0];
      }
    }
    return null;
  }

  // Dado un lema griego, buscar (Gen→Deut) la primera entrada que tenga ese griego y un hebreo no vacío.
  async function findFirstTorahHebrewByGreek(normalizedGreekLemma) {
    await loadTorahTrilingualEquivalences();
    const grKey = normalizeGreek(normalizedGreekLemma);
    if (!grKey) return null;

    for (const book of (state.torahTri || [])) {
      const hits = book.byGr.get(grKey) || [];
      const withHebrew = hits.find((e) => String(e?.texto_hebreo || '').trim());
      if (withHebrew) {
        const heDisplay = String(withHebrew.texto_hebreo || '').trim();
        const heNorm = normalizeHebrew(heDisplay);
        if (heNorm) return { normalized: heNorm, display: heDisplay };
      }
    }
    return null;
  }

  // Dado un hebreo normalizado, devolver una forma de display desde Torah (Gen→Deut).
  async function findTorahHebrewDisplayByNormalized(normalizedHebrew) {
    await loadTorahTrilingualEquivalences();
    const heKey = normalizeHebrew(normalizedHebrew);
    if (!heKey) return null;
    for (const book of (state.torahTri || [])) {
      const hits = book.byHe.get(heKey) || [];
      if (hits.length) {
        const heDisplay = String(hits[0]?.texto_hebreo || '').trim();
        if (heDisplay) return heDisplay;
      }
    }
    return null;
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

   function buildJsonUrlCandidates(url) {
    const candidates = [url];
    const cleaned = String(url || '').replace(/^\.\//, '');
    const withoutParents = cleaned.replace(/^(\.\.\/)+/, '');
    if (withoutParents && withoutParents !== cleaned) {
      candidates.push(`/${withoutParents}`);
    }
    if (typeof window !== 'undefined' && withoutParents) {
      const segments = window.location.pathname.split('/').filter(Boolean);
      if (segments.length) {
        candidates.push(`/${segments[0]}/${withoutParents}`);
      }
    }
    return [...new Set(candidates.filter(Boolean))];
  }
  async function loadJson(url) {
   const failedRequest = failedJsonRequests.get(url);
    if (failedRequest && (Date.now() - failedRequest.timestamp) < JSON_RETRY_COOLDOWN_MS) {
      throw failedRequest.error;
    }

   if (jsonCache.has(url)) return jsonCache.get(url);
     const candidates = buildJsonUrlCandidates(url);
    const promise = (async () => {
      let lastError = null;
      for (const candidate of candidates) {
        try {
          const res = await fetch(candidate, { cache: 'force-cache' });
          if (!res.ok) {
            lastError = new Error(`No se pudo cargar ${candidate}`);
            continue;
          }
          return await res.json();
        } catch (error) {
          lastError = error;
        }
      }
      throw lastError || new Error(`No se pudo cargar ${url}`);
    })();
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

  async function loadTorahTrilingualEntries() {
      if (state.dict) return state.dict;

    const batches = await Promise.all(TORAH_TRILINGUAL_DICT_URLS.map((url) => loadJson(url)));
    const entries = batches.flatMap((batch) => Array.isArray(batch) ? batch : []);
    const items = entries.map((entry) => {
      const greekLemma = String(entry?.equivalencia_griega || '')
        .split(',')
        .map((part) => String(part || '').trim())
        .find(Boolean) || '';
      const glosses = [
        String(entry?.equivalencia_espanol || '').trim(),
        ...(Array.isArray(entry?.candidatos) ? entry.candidatos.map((item) => String(item || '').trim()) : [])
      ].filter(Boolean);
      return {
        lemma: greekLemma,
        'Forma flexionada del texto': greekLemma,
        'Forma lexica': greekLemma,
        definicion: glosses.join(' · '),
        entrada_impresa: String(entry?.texto_hebreo || '').trim(),
        texto_hebreo: String(entry?.texto_hebreo || '').trim(),
        equivalencia_griega: String(entry?.equivalencia_griega || '').trim(),
        equivalencia_espanol: String(entry?.equivalencia_espanol || '').trim(),
        candidatos: Array.isArray(entry?.candidatos) ? entry.candidatos : []
      };
    });
    const data = { items, entries };
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
   async function loadDictionary() {
    return loadTorahTrilingualEntries();
  }
   async function loadGreekUnifiedDictionary() {
    if (state.greekUnifiedMap.size) return state.greekUnifiedMap;
    const map = new Map();
    const data = await loadDictionary();
    (data?.items || []).forEach((row) => {
      const key = normalizeGreek(row?.lemma || row?.equivalencia_griega || '');
      const glosses = [
        row?.equivalencia_espanol,
        ...(Array.isArray(row?.candidatos) ? row.candidatos : [])
      ].map((item) => String(item || '').trim()).filter(Boolean);
      if (!key || !glosses.length) return;
      if (!map.has(key)) map.set(key, []);
      const current = map.get(key);
  glosses.forEach((gloss) => {
        if (current.length < 60 && !current.includes(gloss)) current.push(gloss);
      });
          });
    state.greekUnifiedMap = map;
    return map;
  }
    async function loadHebrewExtendedDictionary() {
    if (state.hebrewExtended) return state.hebrewExtended;

     await loadDictionary();
    state.hebrewExtended = {
       byLemma: new Map(),
      entriesById: new Map(),
      segmentIndex: new Map(),
      index: { tokens: {} }
    };

    return state.hebrewExtended;
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
    const data = await loadDictionary();
        state.hebrewDict = data;
    const map = new Map();
     (data.items || []).forEach((item) => {
      const hebrew = String(item?.texto_hebreo || item?.entrada_impresa || '').trim();
      const key = normalizeHebrew(hebrew);
      if (!key) return;
      if (!map.has(key)) {
        map.set(key, { lemma: hebrew, forms: [hebrew], formas: [hebrew] });
      }
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
      output += `${consonant}${vowel}`;
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

async function buildFormsBySource({ lang, normalizedLemma, displayLemma, lxxRefs }) {
    const formStats = new Map();
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
        return { forms, formsBySource };
 }

 async function buildDeepLexicalModules({ lang, normalizedLemma, displayLemma, grRefs, heRefs, lxxRefs, comparisonContext = {} }) {
 const dictionaryComparison = await buildDictionaryComparison({
      lemmaIntroducido: comparisonContext.lemmaIntroducido || displayLemma,
      normalizedGreekLemma: comparisonContext.greekLemma || (lang === 'he' ? '' : normalizedLemma),
      normalizedHebrewLemma: comparisonContext.hebrewLemma || (lang === 'he' ? normalizedLemma : '')
    });
  const totalOccurrences = [grRefs, heRefs, lxxRefs].reduce((acc, refs) => {
      if (!Array.isArray(refs)) return acc;
      return acc + refs.length;
    }, 0);

    return {
      forms: [],
      formsBySource: [],
      totalOccurrences,
      dictionaryComparison,
      compoundMeta,
      formsContext: { lang, normalizedLemma, displayLemma, lxxRefs }
    };
         }
  async function buildDictionaryComparison({ lemmaIntroducido, normalizedGreekLemma, normalizedHebrewLemma }) {
    await loadDictionary();
    await loadGreekUnifiedDictionary();

    const greekKey = normalizeGreek(normalizedGreekLemma || lemmaIntroducido || '');
    const greekEntry = state.dictMap.get(greekKey);
    const greekGlosses = state.greekUnifiedMap.get(greekKey) || [];
    const greekParts = [];
    if (greekEntry?.lemma) greekParts.push(`Lemma: ${greekEntry.lemma}`);
    if (greekEntry?.['Forma lexica']) greekParts.push(`Transliteración: ${greekEntry['Forma lexica']}`);
    if (greekEntry?.entrada_impresa) greekParts.push(`Entrada: ${greekEntry.entrada_impresa}`);
    if (greekEntry?.definicion) greekParts.push(greekEntry.definicion);
    if (greekGlosses.length) greekParts.push(`Glosas (diccionario trilingüe Torah): ${greekGlosses.join('; ')}`);    const greekText = greekParts.join('\n\n') || 'Sin coincidencias para este lemma en Diccionario A.';

    const hebrewResources = await loadHebrewExtendedDictionary();
    const rawQuery = normalizedHebrewLemma || lemmaIntroducido || '';
    const hebrewQuery = normalizeHebrew(rawQuery);

    const countLatinLetters = (s) => (String(s || '').match(/[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]/g) || []).length;

    const buildHebrewQueryVariants = (q) => {
      const out = [];
      const seen = new Set();
      const push = (x) => {
        const k = String(x || '').trim();
        if (!k || k.length < 2) return;
        if (seen.has(k)) return;
        seen.add(k);
        out.push(k);
      };

      push(q);

      // Prefijos comunes (muy conservador)
      ['ה', 'ו', 'ב', 'כ', 'ל', 'מ'].forEach((pref) => {
        if (q.startsWith(pref) && q.length >= 3) push(q.slice(1));
      });

      // Sufijos pronominales frecuentes / constructo: אביו, אביך, אבינו, etc.
      const suffixes = [
        'יהם','יהן','יכם','יכן','ינו','כם','כן','נו','יו','יה','הו','ך','י','ם','ן','ה'
      ];
      suffixes.forEach((suf) => {
        if (q.endsWith(suf) && q.length - suf.length >= 2) push(q.slice(0, -suf.length));
      });

      return out;
    };

    const variants = buildHebrewQueryVariants(hebrewQuery);

    const candidates = [];
    const seenCand = new Set();

    const pushCand = (cand, variant, source) => {
      if (!cand) return;
      const id = String(cand.id || '') || `${source}:${cand.lemma}:${variant}`;
      const key = `${id}:${variant}`;
      if (seenCand.has(key)) return;
      seenCand.add(key);
      candidates.push({ cand, variant, source });
    };

    // 1) Segmentos (lo más fiable)
    variants.forEach((v) => {
      (hebrewResources.segmentIndex?.get(v) || []).forEach((seg) => pushCand(seg, v, 'segment'));
    });

    // 2) Fallbacks: entradas completas por lemma o por indexByLemma (si faltan segmentos)
    if (!candidates.length) {
      variants.forEach((v) => {
        const ids = hebrewResources.indexByLemma?.[v] || [];
        ids.forEach((id) => pushCand(hebrewResources.entriesById.get(id), v, 'id'));
        (hebrewResources.byLemma.get(v) || []).forEach((e) => pushCand(e, v, 'lemma'));
      });
    }

    const scoreHebrewText = (text, lemmaNorm, usedVariant, isExactQuery) => {
      const t = String(text || '');
      if (!t) return -Infinity;

      let score = 0;

      // match fuerte si el segmento empieza con el lema (en forma compacta o con espacios)
      const compact = normalizeHebrew(t).replace(/^[\[\]\s]+/, '');
      if (compact.startsWith(lemmaNorm)) score += 60;

      // si la variante no es la consulta exacta, pequeño castigo (pero permite caer a forma base)
      if (!isExactQuery) score -= 8;

      // entradas "ricas" suelen contener estos marcadores
      if (/Sentido\s+propio|Sentido\s+figurad|Significa|Fraseolog/i.test(t)) score += 25;

      // que tenga explicación en español (evita segmentos casi solo morfológicos)
      const latin = countLatinLetters(t);
      if (latin >= 80) score += 25;
      else if (latin >= 30) score += 10;
      else score -= 15;

      // completitud
      score += Math.min(80, Math.floor(t.length / 450));

      // bonus si aparece una glosa clara al comienzo (muchas entradas traen "]LEMMA Glosa...")
      if (/]\s*[\u0590-\u05FF]{2,12}\s+[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]/.test(t.slice(0, 200))) score += 10;

      return score;
    };

    const ranked = candidates
      .map(({ cand, variant, source }) => {
        const lemmaNorm = normalizeHebrew(cand?.lemma || variant || '');
        const text = String(cand?.text || cand?.headword_line || cand?.gloss_es || '').trim();
        const isExactQuery = variant === hebrewQuery;
        const score = scoreHebrewText(text, lemmaNorm || variant, variant, isExactQuery);
        return { cand, variant, source, text, score };
      })
      .filter((x) => x.text && Number.isFinite(x.score))
      .sort((a, b) => b.score - a.score || b.text.length - a.text.length);

    let hebrewText = ranked[0]?.text || 'Sin coincidencias para este lemma en Diccionario B.';

    // Si hay ambigüedad fuerte, muestra alternativas mínimas (sin romper el contrato: sigue siendo un texto)
    const alts = ranked
      .slice(1, 6)
      .filter((x) => x.text && x.text !== hebrewText)
      .filter((x) => x.score >= (ranked[0]?.score ?? 0) - 12)
      .slice(0, 2);

    if (alts.length) {
      const altLines = alts.map((x) => `• ${x.variant} → ${normalizeHebrew(x.cand?.lemma || x.variant)} (otra coincidencia)`);
      hebrewText = `${hebrewText}\n\n—\nOtras coincidencias cercanas:\n${altLines.join('\n')}`;
    }

    return {
      lemmaIntroducido: lemmaIntroducido || '—',
      greekText,
      hebrewText
    };
  }
  function renderFormsBySource(target, formsBySource = []) {
    const formsByBookRows = formsBySource.map((group) => {
          const formsRows = group.rows.map((item) => `
        <tr>
          <td>${escapeHtml(item.form)}</td>
          <td>${item.count}</td>
          <td>${escapeHtml(describeMorphTag(item.morph || ''))}</td>
        </tr>
   `).join('');
      return `
        <details class="mb-2" open>
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
    target.innerHTML = formsByBookRows || '<div class="small muted">Sin coincidencias.</div>';
  }

  function renderDeepLexicalAnalysis(modules) {
      deepLexicalAnalysis.innerHTML = '';

    if (modules?.compoundMeta?._isCompound) {
      const glossMap = new Map();
      (modules.compoundMeta.matches || []).forEach((match) => {
        const part = String(match?._queryPart || '').trim();
        const gloss = String(match?.es || '').split('(')[0].trim();
        if (part && gloss && !glossMap.has(part)) glossMap.set(part, gloss);
      });
      const compoundCards = document.createElement('div');
      compoundCards.className = 'col-12 mb-3';
      const foundParts = Array.isArray(modules.compoundMeta._partsFound) ? modules.compoundMeta._partsFound : [];
      const missingParts = Array.isArray(modules.compoundMeta._partsMissing) ? modules.compoundMeta._partsMissing : [];
      const cards = [
        { label: 'Consulta', value: modules?.dictionaryComparison?.lemmaIntroducido || '—' },
        { label: 'Resultado', value: modules.compoundMeta.tier || 'Análisis por partes' },
        { label: 'Glosa sugerida', value: [...glossMap.values()].join(' + ') || '—' },
        { label: 'Coincidencias', value: String((modules.compoundMeta.matches || []).length) },
        { label: 'Componentes hallados', value: foundParts.length ? foundParts.join(' | ') : 'ninguno' },
        { label: 'Componentes ausentes', value: missingParts.length ? missingParts.join(' | ') : 'ninguno' }
      ];
      compoundCards.innerHTML = `<div class="row g-2">` + cards.map((card) => `
        <div class="col-12 col-md-6 col-xl-3">
          <article class="metric-card" data-partial="${modules.compoundMeta._partsMissing?.length ? 'true' : 'false'}">
            <div class="label">${escapeHtml(card.label)}</div>
            <div class="value ${/[א-ת]/.test(card.value) ? 'hebrew' : ''}">${escapeHtml(card.value)}</div>
          </article>
        </div>
      `).join('') + `</div>`;
      deepLexicalAnalysis.appendChild(compoundCards);
    }

    const wrapper = document.createElement('div');
    wrapper.className = 'col-12';

const hasDictionaryData = Boolean(
      modules?.dictionaryComparison &&
      ((modules.dictionaryComparison.greekText && modules.dictionaryComparison.greekText !== 'Sin coincidencias para este lemma en Diccionario A.') ||
      (modules.dictionaryComparison.hebrewText && modules.dictionaryComparison.hebrewText !== 'Sin coincidencias para este lemma en Diccionario B.'))
    );

    if (!modules || (!modules.totalOccurrences && !(modules.forms || []).length && !hasDictionaryData)) {
         wrapper.innerHTML = '<div class="small muted">No hay datos suficientes para generar el análisis léxico profundo.</div>';
      deepLexicalAnalysis.appendChild(wrapper);
      return;
    }


 const comparison = modules.dictionaryComparison || {};
  const formsLoaded = Array.isArray(modules.formsBySource) && modules.formsBySource.length > 0;
    wrapper.innerHTML = `
       <div class="fw-semibold mb-2">Lemma introducido: ${escapeHtml(comparison.lemmaIntroducido || '—')}</div>
      <div class="table-responsive mb-3 dictionary-comparison-wrap">
          <table class="table table-sm align-middle dictionary-comparison-table">
            <thead>
              <tr>
                <th>Diccionario A (Griego)</th>
                <th>Diccionario B (Hebreo)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><pre class="comparison-pre comparison-pre--greek">${escapeHtml(comparison.greekText || 'Sin datos')}</pre></td>
                <td><pre class="comparison-pre comparison-pre--hebrew">${escapeHtml(comparison.hebrewText || 'Sin datos')}</pre></td>
              </tr>
            </tbody>
          </table>
       </div>
      <div class="table-responsive mb-3">
        <div class="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-2">
          <div class="fw-semibold">Formas flexionadas encontradas en la base (por libro)</div>
          <button type="button" class="btn btn-soft btn-sm" id="loadFormsByBookBtn">${formsLoaded ? 'Recargar formas' : 'Cargar formas'}</button>
        </div>
       <div id="formsByBookContainer">${formsLoaded ? '' : '<div class="small muted">Carga bajo demanda para evitar retrasos. Usa el botón para consultar este bloque.</div>'}</div>
             </div>
    `;

    deepLexicalAnalysis.appendChild(wrapper);
     if (formsLoaded) {
      const formsContainer = wrapper.querySelector('#formsByBookContainer');
      renderFormsBySource(formsContainer, modules.formsBySource);
    }
    const loadFormsButton = wrapper.querySelector('#loadFormsByBookBtn');
    const formsContainer = wrapper.querySelector('#formsByBookContainer');
    loadFormsButton?.addEventListener('click', async () => {
      if (!modules.formsContext || !formsContainer) return;
      loadFormsButton.disabled = true;
      loadFormsButton.textContent = 'Cargando...';
      formsContainer.innerHTML = '<div class="small muted">Consultando formas flexionadas...</div>';
      try {
        const formsModule = await buildFormsBySource(modules.formsContext);
        modules.forms = formsModule.forms;
        modules.formsBySource = formsModule.formsBySource;
        renderFormsBySource(formsContainer, modules.formsBySource);
        loadFormsButton.textContent = 'Recargar formas';
      } catch (error) {
        formsContainer.innerHTML = '<div class="small muted">No se pudieron cargar las formas en este momento.</div>';
        loadFormsButton.textContent = 'Reintentar carga';
      } finally {
        loadFormsButton.disabled = false;
      }
    });
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
    // Siempre definido para evitar ReferenceError; se rellena si hay match Torah.
    let torahDisplay = { he: '', gr: '', es: '' };

    if (!term) {
      return;
    }
    const detectedLang = detectLang(term);
    const queryTokens = tokenizeQueryForExactSearch(term, detectedLang);
    const allowHebrewCompoundInput = detectedLang === 'he' && hasCompoundConnector(term);
    if (queryTokens.length > 1 && !allowHebrewCompoundInput) {
      renderSingleWordInputError(term);
      return;
    }
    scrollToLemmaSummary();
   setLoading(true);
    await nextFrame();
      try {
    const lang = detectLang(term);
    const normalized = normalizeByLang(term, lang);
    let hebrewSearchResult = null;

    // 1) Prioridad: resolver correspondencias trilingües por Torah (Génesis→Deuteronomio)
    //    sin importar el idioma de entrada (ES/GR/HE).
    let torahEntry = null;
    try {
      torahEntry = await findFirstTorahTrilingualMatch(term);
    } catch (e) {
      torahEntry = null;
    }

    let torahEquivalenceTerms = { es: new Set(), gr: new Set(), he: new Set() };
    if (torahEntry) {
      const heRaw = cleanTorahHebrewDisplay(torahEntry?.texto_hebreo || '');
      const grRaw = getTorahGreekDisplay(torahEntry);
      const esRaw = String(torahEntry?.equivalencia_espanol || torahEntry?.equivalencia_español || '').trim();
      const candidatos = Array.isArray(torahEntry?.candidatos)
        ? torahEntry.candidatos.map((item) => String(item || '').trim()).filter(Boolean)
        : [];

      if (heRaw) torahEquivalenceTerms.he.add(normalizeHebrew(heRaw));
      splitGrVariants(grRaw).map(normalizeGreek).filter(Boolean).forEach((x) => torahEquivalenceTerms.gr.add(x));
      [...splitEsVariants(esRaw), ...candidatos].map(normalizeSpanishPhrase).filter(Boolean).forEach((x) => torahEquivalenceTerms.es.add(x));
    // Guardar hebreo/griego/español "display" directo del primer match Torah (si existe).
    torahDisplay = {
      he: heRaw,
      gr: grRaw,
      es: getTorahSpanishDisplay(torahEntry)
    };

}

  try {
      await loadTrilingualEquivalences();
    } catch (error) {
      // El análisis sigue funcionando aunque falle la carga de equivalencias.
    }
    const equivalenceTerms = torahEntry ? torahEquivalenceTerms : getEquivalenceSearchTerms(term, lang);
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
    const grIndex = await grIndexPromise;
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
     const esDisplayWord = lang === 'es' ? term : (torahDisplay?.es || esSearchTokens[0] || term);
    let greekEntry = entry;
    let greekTerm = null;
    let greekCandidate = null;
        let greekDisplayWord = '';
    if (lang === 'es') {
      greekEntry = await findGreekEntryFromSpanish(term);
      if (greekEntry?.lemma) {
        greekTerm = normalizeGreek(greekEntry.lemma);
      }
    }
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
        const esEquivalence = state.trilingualByEs.get(normalizeSpanishPhrase(term));
        const orderedGreek = (esEquivalence?.grDisplay || []).map((item) => item.normalized);
        const seenGreek = new Set();
        const mergedEquivalents = [...orderedGreek, ...equivalenceTerms.gr]
          .filter((candidate) => {
            if (seenGreek.has(candidate)) return false;
            seenGreek.add(candidate);
            return true;
          });
        const orderedMatch = orderedGreek.find((candidate) => getGreekRefs(candidate, grIndex).length > 0) || orderedGreek[0];
        const rankedEquivalents = mergedEquivalents
          .map((candidate) => ({ candidate, refs: getGreekRefs(candidate, grIndex).length }))
          .sort((a, b) => b.refs - a.refs);
  const fromEquivalence = orderedMatch ? { candidate: orderedMatch } : (rankedEquivalents.find((item) => item.refs > 0) || rankedEquivalents[0]);        if (fromEquivalence?.candidate) {
          greekTerm = fromEquivalence.candidate;
           const selected = (esEquivalence?.grDisplay || []).find((item) => item.normalized === greekTerm);
          greekDisplayWord = selected?.display || greekDisplayWord;
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


    const greekLemma = greekEntry?.lemma || greekCandidate?.lemma || greekDisplayWord || (lang === 'gr' ? term : '—');
    const greekTranslit = greekEntry?.['Forma lexica'] || (greekTerm ? transliterateGreek(greekLemma || term) : '—');
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
      // Prioridad absoluta: si el primer match Torah ya trae hebreo, úsalo (evita '—' injustificado).
      if (!hebrewCandidate && torahDisplay?.he) {
        const heNorm = normalizeHebrew(torahDisplay.he);
        if (heNorm) {
          hebrewCandidate = {
            normalized: heNorm,
            word: torahDisplay.he,
            transliteration: transliterateHebrew(torahDisplay.he)
          };
        }
      }

  if (!hebrewCandidate && equivalenceTerms.he?.size) {
        const esEquivalence = state.trilingualByEs.get(normalizeSpanishPhrase(term));
        const orderedHebrew = (esEquivalence?.heDisplay || []).map((item) => item.normalized);
        const seenHebrew = new Set();
        const mergedHebrew = [...orderedHebrew, ...equivalenceTerms.he]
          .filter((candidate) => {
            if (seenHebrew.has(candidate)) return false;
            seenHebrew.add(candidate);
            return true;
          });
        const orderedMatch = orderedHebrew.find((candidate) => getHebrewRefs(candidate, heIndex).length > 0) || orderedHebrew[0];
        const preferredHe = orderedMatch
          ? { candidate: orderedMatch }
          : mergedHebrew
              .map((candidate) => ({ candidate, refs: getHebrewRefs(candidate, heIndex).length }))
              .sort((a, b) => b.refs - a.refs)[0];
        if (preferredHe?.candidate) {
           const selected = (esEquivalence?.heDisplay || []).find((item) => item.normalized === preferredHe.candidate);
          hebrewCandidate = {
            normalized: preferredHe.candidate,
           word: selected?.display || (await findTorahHebrewDisplayByNormalized(preferredHe.candidate)) || preferredHe.candidate,
            transliteration: transliterateHebrew(selected?.display || preferredHe.candidate)
          };
        }
      }

    // Fallback prioritario: si ya tenemos griego pero aún no hay hebreo en equivalencias,
    // buscar hebreo directamente en los diccionarios Torah por ese lema griego (Gen→Deut).
    if (!hebrewCandidate && greekTerm) {
      const heFromTorah = await findFirstTorahHebrewByGreek(greekTerm);
      if (heFromTorah?.normalized) {
        hebrewCandidate = {
          normalized: heFromTorah.normalized,
          word: heFromTorah.display,
          transliteration: transliterateHebrew(heFromTorah.display)
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

    // Resumen del lema: ejecutar cuando ya se resolvieron correspondencias y candidatos
    const summaryHighlightQueries = {
      es: esDisplayWord,
      gr: greekLemma !== '—' ? greekLemma : (lang === 'gr' ? term : ''),
      he: hebrewCandidate?.word || (lang === 'he' ? term : '')
    };
    const summaryRefs = lang === 'gr' && !refs.length ? lxxMatches.refs : refs;
    await buildSummary(term, lang, entry || greekEntry, hebrewEntry, summaryRefs, summaryHighlightQueries);
    if (lang === 'he' && hebrewSearchResult?._isCompound) {
      const glossMap = new Map();
      (hebrewSearchResult.matches || []).forEach((match) => {
        const part = String(match?._queryPart || '').trim();
        const gloss = String(match?.es || '').split('(')[0].trim();
        if (part && gloss && !glossMap.has(part)) glossMap.set(part, gloss);
      });
      const combinedGloss = [...glossMap.values()].join(' + ');
      const compoundSummary = [
        'Resultado compuesto por segmentación automática.',
        combinedGloss ? `Glosa sugerida combinada: ${combinedGloss}.` : '',
        hebrewSearchResult.diag || ''
      ].filter(Boolean).join(' ');
      if (compoundSummary) {
        lemmaSummary.textContent = `${compoundSummary} ${lemmaSummary.textContent || ''}`.trim();
      }
    }


     const posTag = lang === 'gr' ? extractPos(entry) : '—';
    const lemmaLabel = lang === 'gr' ? (entry?.lemma || term) : term;
    updateTrilingualBrief({
      esWord: torahDisplay?.es || esDisplayWord || term,
      heWord: hebrewCandidate?.word || (lang === 'he' ? term : (torahDisplay?.he || '—')),
      grWord: torahDisplay?.gr || greekDisplayWord || greekLemma || (lang === 'gr' ? term : '—')
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
      ...(lang === 'he' && hebrewSearchResult?._isCompound ? [`Modo: <span class="fw-semibold text-warning">Análisis por partes</span>`] : []),
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
      lxxRefs: lxxMatches.refs,
      compoundMeta: lang === 'he' ? hebrewSearchResult : null,
      comparisonContext: {
        lemmaIntroducido: term,
        greekLemma: greekLemma !== '—' ? normalizeGreek(greekLemma) : '',
        hebrewLemma: hebrewCandidate?.word ? normalizeHebrew(hebrewCandidate.word) : ''
      }
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
