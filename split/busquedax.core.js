/* Auto-generated split from busquedax.js (core shared) */
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
   function normalizeSpanishPhrase(text) {
    return String(text || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9ñ\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
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

  function buildPhraseRegex(tokens, lang) {
    const parts = (tokens || []).map((token) => String(token || '').trim()).filter(Boolean);
    if (!parts.length) return null;
    const joiner = lang === 'he' ? '(?:\\s+|\\u05BE|\\-)+': '(?:\\s+)+';

    const tokenPatterns = parts.map((token) => {
      const escaped = token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const letters = [];
      for (const ch of escaped) {
        if (ch === '\\') continue;
        if ((lang === 'gr' || lang === 'lxx') && ch === 'σ') {
          letters.push('[σς]');
        } else {
          letters.push(ch);
        }
      }
      return letters.map((letter) => `${letter}\\p{M}*`).join('');
    });

    const core = tokenPatterns.join(joiner);
    return new RegExp(`(^|[^\\p{L}\\p{M}])(${core})(?![\\p{L}\\p{M}])`, 'giu');
  }


  function highlightText(text, query, lang) {
    const raw = String(text ?? '');
    const normalizedQuery = String(query ?? '').trim();
    if (!raw || !normalizedQuery) return escapeHtml(raw);

    const safe = escapeHtml(raw);
     const highlightSource = (lang === 'gr' || lang === 'lxx' || lang === 'he')
      ? safe.normalize('NFD')
      : safe;    
      // Hebrew: when searching a phrase (or multiple phrase variants separated by "||"),
// highlight ONLY the full phrase, not each token separately.
if (lang === 'he') {
  const variants = String(normalizedQuery || '')
    .split('||')
    .map((part) => part.trim())
    .filter(Boolean);

  const phraseRegexes = [];
  for (const variant of variants) {
    const phrase = normalizePhraseByLang(variant, 'he');
    const phraseTokens = phrase.split(/\s+/).filter(Boolean);
    if (phraseTokens.length < 2) continue;
    const re = buildPhraseRegex(phraseTokens, 'he');
    if (re) phraseRegexes.push(re);
  }

  if (phraseRegexes.length) {
    let output = highlightSource;
    for (const re of phraseRegexes) {
      output = output.replace(
        re,
        (match, lead, coreText) => `${lead}<mark class="phrase">${coreText}</mark>`
      );
    }
    return output;
  }
}


   const cleanedQuery = (lang === 'gr' || lang === 'lxx')
      ? normalizedQuery.replace(/[⸀··.,;:!?“”"(){}\[\]<>«»]/g, ' ')
      : normalizedQuery;
    const tokens = cleanedQuery
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
function levenshteinDistance(a, b) {
  const left = String(a || '');
  const right = String(b || '');
  if (!left) return right.length;
  if (!right) return left.length;

  const rows = left.length + 1;
  const cols = right.length + 1;
  const matrix = Array.from({ length: rows }, () => new Array(cols).fill(0));

  for (let i = 0; i < rows; i += 1) matrix[i][0] = i;
  for (let j = 0; j < cols; j += 1) matrix[0][j] = j;

  for (let i = 1; i < rows; i += 1) {
    for (let j = 1; j < cols; j += 1) {
      const substitutionCost = left[i - 1] === right[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + substitutionCost
      );
    }
  }

  return matrix[left.length][right.length];
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
return getSpanishRefs(token, index);
  }

  
  function getVerseTextFromChapter(verses, verseNumber) {
    if (!verses || !Number.isFinite(verseNumber)) return '';
    if (Array.isArray(verses)) return String(verses[verseNumber - 1] || '');
    if (typeof verses === 'object') {
      return String(
        verses[verseNumber] ??
        verses[String(verseNumber)] ??
        verses[verseNumber - 1] ??
        verses[String(verseNumber - 1)] ??
        ''
      );
    }
    return '';
  }

function containsHebrewTokenPhrase(normalizedVerse, phrase) {
    const verseTokens = String(normalizedVerse || '').split(/\s+/).filter(Boolean);
    const phraseTokens = String(phrase || '').split(/\s+/).filter(Boolean);
    if (!verseTokens.length || !phraseTokens.length) return false;
    for (let i = 0; i <= verseTokens.length - phraseTokens.length; i += 1) {
      let ok = true;
      for (let j = 0; j < phraseTokens.length; j += 1) {
        if (verseTokens[i + j] !== phraseTokens[j]) { ok = false; break; }
      }
      if (ok) return true;
    }
    return false;
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
        const verseText = getVerseTextFromChapter(verses, verse);
        const normalizedVerse = normalizePhraseByLang(verseText, lang);
        const phraseMatch = lang === 'he'
          ? containsHebrewTokenPhrase(normalizedVerse, phrase)
          : normalizedVerse.includes(phrase);
        if (phraseMatch) {
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

    const tokenMinLength = lang === 'he' ? 2 : 3;
    const tokens = getNormalizedQueryTokens(term, lang, tokenMinLength);
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
