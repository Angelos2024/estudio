/* Auto-generated split from busquedax.js (greek + LXX) */
 
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

  async function loadDictionary(options = {}) {
   if (state.dict) return state.dict;
    const data = await loadJson(DICT_URL, options);
   state.dict = data;
    const map = new Map();
    const translitMap = new Map();
   const spanishMap = new Map();
    const definitionEntries = [];
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
      definitionEntries.push({
        item,
        definitionPhrase: normalizeSpanishPhrase(item?.definicion || '')
      }); 
    });
    state.dictMap = map;
    state.dictTranslitMap = translitMap;
state.dictSpanishMap = spanishMap;
    state.dictDefinitionEntries = definitionEntries;
   return data;
  }
  async function findGreekEntryFromSpanish(term, options = {}) {
   if (!term) return null;
    await loadDictionary(options);
const tokens = String(term || '').split(/\s+/).filter(Boolean);
    const isMultiWord = tokens.length > 1;
    const stopwords = new Set(['el', 'la', 'los', 'las', 'de', 'del', 'y', 'o', 'en', 'un', 'una', 'al']);
    const normalizedPhrase = normalizeSpanishPhrase(term);
    const searchableTokens = tokens
      .map((token) => normalizeSpanish(token))
      .filter((token) => token && token.length >= 3 && !stopwords.has(token));
   const candidates = [term, ...tokens];
    for (const candidate of candidates) {
      const key = normalizeTransliteration(candidate);
      if (!key) continue;
      const entry = state.dictTranslitMap.get(key);
      if (entry) return entry;
    }
   if (isMultiWord && normalizedPhrase.length >= 5) {
      const ranked = (state.dictDefinitionEntries || [])
        .map(({ item, definitionPhrase }) => {
          if (!definitionPhrase) return null;
          let score = 0;
          if (definitionPhrase.includes(normalizedPhrase)) score += 8;
          if (definitionPhrase.startsWith(normalizedPhrase)) score += 2;
          searchableTokens.forEach((token) => {
            if (definitionPhrase.includes(token)) score += 1;
          });
          return score > 0 ? { item, score } : null;
        })
        .filter(Boolean)
        .sort((a, b) => b.score - a.score);
      if (ranked[0]?.score >= 8) return ranked[0].item;
      return null;
    }
    for (const candidate of candidates) {
      const key = normalizeSpanish(candidate);
      if (!key || stopwords.has(key) || key.length < 3) continue;
     const spanishMatches = state.dictSpanishMap.get(key) || [];
      if (!spanishMatches.length) continue;
      const ranked = [...spanishMatches].sort((a, b) => {
        const score = (item) => {
          const def = normalizeSpanish(item?.definicion || '');
          const rawDef = String(item?.definicion || '').toLowerCase();
          let value = 0;
          const headDef = rawDef.replace(/nombre\s+prop\.?\s*/g, '').trim();
          if (rawDef.includes('nombre prop')) value -= 2;
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
