/* split: filter */
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
  
async function loadTrilingualEquivalences(options = {}) {
  if (state.trilingualEquiv) return state.trilingualEquiv;
  const data = await loadJson(TRILINGUAL_EQUIV_URL, options);
  state.trilingualEquiv = data;

  const byEs = new Map();
  Object.entries(data?.by_es || {}).forEach(([esWord, payload]) => {
    const key = normalizeSpanishPhrase(esWord);
    if (!key) return;
    const gr = new Set((payload?.gr || []).map((item) => normalizeGreek(item)).filter(Boolean));
    const he = new Set((payload?.he || []).map((item) => normalizeHebrew(item)).filter(Boolean));
    byEs.set(key, { gr, he });
  });

  const byGr = new Map();
  Object.entries(data?.by_gr || {}).forEach(([grWord, esWords]) => {
    const key = normalizeGreek(grWord);
    if (!key) return;
    byGr.set(key, new Set((esWords || []).map((item) => normalizeSpanishPhrase(item)).filter(Boolean)));
  });

  const byHe = new Map();
  Object.entries(data?.by_he || {}).forEach(([heWord, esWords]) => {
    const key = normalizeHebrew(heWord);
    if (!key) return;
    byHe.set(key, new Set((esWords || []).map((item) => normalizeSpanishPhrase(item)).filter(Boolean)));
  });

  state.trilingualByEs = byEs;
  state.trilingualByGr = byGr;
  state.trilingualByHe = byHe;
  return data;
}

function getPhraseTokensForLang(term, lang) {
  if (lang === 'he') {
    return String(term || '')
      .replace(/[\u200C-\u200F\u202A-\u202E]/g, '')
      .replace(/[\u0591-\u05BD\u05BF\u05C1-\u05C2\u05C4-\u05C7]/g, '')
      .replace(/[׃.,;:!?()"“”'׳״]/g, ' ')
      .split(/\s+/)
      .map((token) => normalizeHebrew(token))
      .filter(Boolean);
  }
  if (lang === 'gr') {
    return String(term || '')
      .split(/\s+/)
      .map((token) => normalizeGreek(token))
      .filter(Boolean);
  }
  return normalizeSpanishPhrase(term)
    .split(/\s+/)
    .map((token) => token.trim())
    .filter(Boolean);
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

function resolveClosestSpanishEquivalenceToken(unit) {
  const token = normalizeSpanishPhrase(unit || '');
  if (!token || !state.trilingualByEs?.size) return null;
  if (state.trilingualByEs.has(token)) return token;
  if (token.length < 5) return null;

  const maxDistance = token.length >= 8 ? 2 : 1;
  let best = null;
  let bestDistance = Infinity;

  state.trilingualByEs.forEach((_, key) => {
    if (!key) return;
    if (Math.abs(key.length - token.length) > maxDistance) return;
    if (bestDistance <= 1 && key[0] !== token[0]) return;

    const distance = levenshteinDistance(token, key);
    if (distance > maxDistance || distance >= bestDistance) return;
    bestDistance = distance;
    best = key;
  });

  return bestDistance <= maxDistance ? best : null;
}

function getEquivalenceSearchTerms(term, langHint = detectLang(term)) {
  const result = { es: new Set(), gr: new Set(), he: new Set() };
  if (!state.trilingualEquiv) return result;

  const normalizedPhrase = normalizePhraseByLang(term, langHint);
  const tokens = getPhraseTokensForLang(term, langHint);
  const sourceUnits = [...new Set([normalizedPhrase, ...tokens].filter(Boolean))];
  if (!sourceUnits.length) return result;

  if (langHint === 'es') {
    sourceUnits.forEach((unit) => {
     const directKey = normalizeSpanishPhrase(unit || '');
      const match = state.trilingualByEs.get(directKey)
        || state.trilingualByEs.get(resolveClosestSpanishEquivalenceToken(unit));
     if (!match) return;
      match.gr.forEach((item) => result.gr.add(item));
      match.he.forEach((item) => result.he.add(item));
    });
    return result;
  }

  const spanishBridge = new Set();
  const sourceMap = langHint === 'he' ? state.trilingualByHe : state.trilingualByGr;
  sourceUnits.forEach((unit) => {
    const esWords = sourceMap.get(unit);
    if (!esWords) return;
    esWords.forEach((item) => spanishBridge.add(item));
  });

  spanishBridge.forEach((esWord) => {
    result.es.add(esWord);
    const match = state.trilingualByEs.get(esWord);
    if (!match) return;
    match.gr.forEach((item) => result.gr.add(item));
    match.he.forEach((item) => result.he.add(item));
  });
  return result;
}
  function pickPreferredHebrewAlias(candidates = []) {
    if (!Array.isArray(candidates) || !candidates.length) return null;
    return candidates.find((item) => item === 'יהוה')
      || candidates.find((item) => item === 'אלהים')
      || candidates.find((item) => item === 'אלוהים')
      || candidates.find((item) => item === 'אדני')
      || candidates.find((item) => item === 'אל')
      || candidates.find((item) => item === 'אלה')
      || candidates.find((item) => item === 'יהושע')
      || candidates.find((item) => item === 'ישוע')
      || candidates.slice().sort((a, b) => b.length - a.length)[0];
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
