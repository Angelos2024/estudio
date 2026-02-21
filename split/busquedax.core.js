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
