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

function loadJson(url, options = {}

function loadDictionary(options = {}

function loadHebrewDictionary(options = {}

function loadIndex(lang, options = {}

function loadChapterText(lang, book, chapter, options = {}

function pickBestCandidate(counts, samples) {
    if (!counts.size) return null;
    const [best, count] = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
    return {
      normalized: best,
      lemma: samples.get(best) || best,
      count
    };
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

function buildSamplesForRefs(refs, lang, max = 3, preloadedTexts = null, options = {}

function buildCorrespondenceCard({ title, word, transliteration, samples, lang, highlightQuery }

function sortRefsCanonically(refs = []) {
    return [...refs].sort((a, b) => {
      const [ba, ca, va] = String(a).split('|');
      const [bb, cb, vb] = String(b).split('|');
      const sa = LXX_TO_HEBREW_SLUG[ba] || ba;
      const sb = LXX_TO_HEBREW_SLUG[bb] || bb;
      const ia = CANON_INDEX.has(sa) ? CANON_INDEX.get(sa) : 9999;
      const ib = CANON_INDEX.has(sb) ? CANON_INDEX.get(sb) : 9999;
      if (ia !== ib) return ia - ib;
      const c1 = Number(ca) || 0, c2 = Number(cb) || 0;
      if (c1 !== c2) return c1 - c2;
      const v1 = Number(va) || 0, v2 = Number(vb) || 0;
      return v1 - v2;
    });
  }

function getActiveLangForNewUI() {
    // Priorizamos un solo idioma: el scope seleccionado o el detectado
    const last = state.last;
    if (!last) return null;
    const scope = state.languageScope || 'auto';
    if (scope && scope !== 'auto' && scope !== 'all') return scope;
    return last.lang || null;
  }

function pickCorpus(groupsByCorpus, lang) {
    return (groupsByCorpus || []).find((c) => c.lang === lang) || null;
  }

function buildFilterAggFromGroups(groups = [], lang = 'es') {
    // groups: salida de buildBookGroups (por libro)
    const byBook = new Map();
    groups.forEach((g) => {
      const bookSlug = LXX_TO_HEBREW_SLUG[g.items?.[0]?.book] || LXX_TO_HEBREW_SLUG[g.refs?.[0]?.split?.('|')?.[0]] || (g.refs?.[0]?.split?.('|')?.[0]) || g.book || g.slug || null;
      const slug = LXX_TO_HEBREW_SLUG[bookSlug] || bookSlug;
      if (!slug) return;
      byBook.set(slug, {
        slug,
        label: prettyBookLabel(slug),
        count: g.count || (g.refs?.length || 0),
        refs: g.refs || [],
        group: g
      });
    });

    // orden canónico
    const orderedBooks = CANONICAL_BOOK_ORDER
      .filter((slug) => byBook.has(slug))
      .map((slug) => byBook.get(slug));

    // por si hay libros fuera de lista
    const extras = [...byBook.values()].filter((b) => !CANON_INDEX.has(b.slug))
      .sort((a, b) => a.label.localeCompare(b.label));
    const books = [...orderedBooks, ...extras];

    const ot = books.filter((b) => OT_SET.has(b.slug));
    const nt = books.filter((b) => NT_SET.has(b.slug));
    const otCount = ot.reduce((s, b) => s + (b.count || 0), 0);
    const ntCount = nt.reduce((s, b) => s + (b.count || 0), 0);
    const allCount = otCount + ntCount;

    return { lang, books, ot, nt, otCount, ntCount, allCount };
  }

function renderFiltersPanel(agg) {
    if (!filtersPanel) return;
    const { books, ot, nt, otCount, ntCount, allCount } = agg;

    const mkBtn = (id, label, count, active) => {
      return `
        <button class="bx-filter-item ${active ? 'is-active' : ''}" type="button"
          data-bx-filter="${id}">
          <span>${escapeHtml(label)}</span>
          <span class="bx-count">(${count})</span>
        </button>
      `;
    };

    const isAll = !state.pagination.selectedBook && !state.pagination.selectedTestament;
    const isOT = state.pagination.selectedTestament === 'ot';
    const isNT = state.pagination.selectedTestament === 'nt';

    const otItems = ot.map((b) => mkBtn(`book:${b.slug}`, b.label, b.count, state.pagination.selectedBook === b.slug)).join('');
    const ntItems = nt.map((b) => mkBtn(`book:${b.slug}`, b.label, b.count, state.pagination.selectedBook === b.slug)).join('');

    filtersPanel.innerHTML = `
      <div class="d-grid gap-2">
        ${mkBtn('all', 'Todos', allCount, isAll)}
        ${mkBtn('ot', 'Toráh', otCount, isOT)}
        <div class="ps-1 d-grid gap-2">${otItems || '<div class="small muted ps-2">Sin resultados.</div>'}</div>
        ${mkBtn('nt', 'Evangelios', ntCount, isNT)}
        <div class="ps-1 d-grid gap-2">${ntItems || '<div class="small muted ps-2">Sin resultados.</div>'}</div>
      </div>
    `;
  }

function flattenRefsForSelection(agg) {
    const selBook = state.pagination.selectedBook;
    const selTest = state.pagination.selectedTestament;

    if (selBook) {
      const b = agg.books.find((x) => x.slug === selBook);
      return sortRefsCanonically(b?.refs || []);
    }
    const pool = selTest === 'ot'
      ? agg.ot
      : selTest === 'nt'
        ? agg.nt
        : agg.books;

    const refs = [];
    pool.forEach((b) => refs.push(...(b.refs || [])));
    return sortRefsCanonically(refs);
  }

function resolveVerseTextsForRefs(refs, lang, options = {}

function renderResultsPage(agg, highlightQueries = {}

function renderSearchUI(groupsByCorpus, highlightQueries = {}

function renderResults(groupsByCorpus, highlightQueries = state.last?.highlightQueries || {}

function buildBookGroups(refs, lang, preloadedTexts = null, options = {}

function loadMoreRvr1960(group, options = {}

function buildSummary(term, lang, entry, hebrewEntry, refs, highlightQueries = {}

function analyze() {
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
      const isCompoundQuery = /\s/.test(String(term || '').trim());
      let selectedScope = getLanguageScope(term);

      // Para aligerar carga: no permitimos búsquedas multi-idioma para frases (palabras compuestas).
      // Si es una frase y el usuario eligió "all", forzamos al idioma detectado.
      if (isCompoundQuery && selectedScope === 'all') {
        selectedScope = lang;
      }
     // reset UI filters/paginación para nueva búsqueda
     state.pagination.page = 1;
     state.pagination.selectedBook = null;
     state.pagination.selectedTestament = null;
     state.pagination.activeLang = null;
     const enabledCorpora = isCompoundQuery ? new Set([selectedScope]) : new Set(getCorporaForScope(selectedScope));
     const enforceSpanishReferenceCorrespondence = lang === 'es' && (selectedScope === 'gr' || selectedScope === 'he')
        && !/\s/.test(String(term || '').trim());
      if (!isCompoundQuery) { await loadTrilingualEquivalences(options); }
     const aliasCandidates = isCompoundQuery ? { es: [], gr: [], he: [], lxx: [] } : getAliasCandidates(term, lang);
      const equivalenceTerms = isCompoundQuery ? { es: [], gr: [], he: [], lxx: [] } : getEquivalenceSearchTerms(term, lang);
      const normalized = normalizeByLang(term, lang);
      const canCrossDisplay = (!isCompoundQuery) && (lang === 'es') && (selectedScope === 'gr' || selectedScope === 'he');
      // Para búsquedas de una sola palabra: si el usuario cambió a gr/he, seguimos buscando en ES para no perder el NT,
      // y usamos equivalencias solo para resaltar / abrir en el idioma elegido.
      const searchLang = canCrossDisplay ? 'es' : (isCompoundQuery ? selectedScope : lang);


      let entry = null;
      let hebrewEntry = null;
      if (lang === 'gr' && !isCompoundQuery) {
        await loadDictionary(options);
        throwIfAborted(options.signal);
        entry = state.dictMap.get(normalized) || null;
      } else if (lang === 'he' && !isCompoundQuery) {
        await loadHebrewDictionary(options);
        throwIfAborted(options.signal);
        hebrewEntry = state.hebrewDictMap.get(normalized) || null;
      }

      const index = await loadIndex(searchLang, options);
      throwIfAborted(options.signal);
      const refs = await getRefsForQuery(term, searchLang, index, options);
      // UI: el corpus base de resultados es searchLang
      state.pagination.activeLang = searchLang;
   let initialLxxMatches = { refs: [], texts: new Map() };
      if (lang === 'gr' && normalized && enabledCorpora.has('lxx')) {
        initialLxxMatches = await buildLxxMatches(normalized, 70);
      }
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
 const needsSpanishBridge = !isCompoundQuery && lang === 'es' && (enabledCorpora.has('gr') || enabledCorpora.has('lxx') || enabledCorpora.has('he'));
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
 const equivalentEsTokens = [...(equivalenceTerms.es || [])];
 esSearchTokens = [term, ...relatedEsTokens, ...equivalentEsTokens]
            .map((value) => String(value || '').trim())
            .filter(Boolean)
            .filter((value, index, list) => list.indexOf(value) === index);
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

      if (!isCompoundQuery && lang === 'es' && (enabledCorpora.has('gr') || enabledCorpora.has('lxx'))) {
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
      const scopedLxxRefsFromSpanish = enforceSpanishReferenceCorrespondence ? mapOtRefsToLxxRefs(esOtRefs) : [];

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
      const greekSearchTerms = new Set();
      if (greekTerm) greekSearchTerms.add(greekTerm);
      aliasCandidates.gr.forEach((item) => greekSearchTerms.add(item));
      (equivalenceTerms.gr || []).forEach((item) => greekSearchTerms.add(item));
      const greekTranslit = greekEntry?.['Forma lexica'] || (greekTerm ? transliterateGreek(greekLemma || term) : '—');
      const hebrewSearchTerms = new Set();
      let hebrewPhraseQueries = [];
      if (lang === 'es') {
        const esPhrase = normalizeSpanishPhrase(term);
        if (esPhrase === 'hijo de dios' || esPhrase === 'hijo del dios' || esPhrase === 'hijos de dios' || esPhrase === 'hijos del dios') {
          hebrewPhraseQueries = ['בן האלהים', 'בן האלוהים', 'בני האלהים', 'בני האלוהים', 'בן אל'];
        } else if (esPhrase === 'hijo del hombre' || esPhrase === 'hijo de hombre') {
          hebrewPhraseQueries = ['בן אדם'];
        }
      }

      const grIndex = await grIndexPromise;
      throwIfAborted(options.signal);
 let grRefs = [];
      if (enabledCorpora.has('gr') && grIndex && greekSearchTerms.size) {
        const seen = new Set();
        for (const token of greekSearchTerms) {
          const matches = await getRefsForQuery(token, 'gr', grIndex, options);
          matches.forEach((ref) => {
            if (seen.has(ref)) return;
            seen.add(ref);
            grRefs.push(ref);
          });
        }
      }
     if (enforceSpanishReferenceCorrespondence && enabledCorpora.has('gr')) {
        grRefs = esNtRefs.slice();
      }
     if (lang === 'es' && enabledCorpora.has('gr') && esNtRefs.length) {
        const seenRefs = new Set(grRefs);
        esNtRefs.forEach((ref) => {
          if (seenRefs.has(ref)) return;
          seenRefs.add(ref);
          grRefs.push(ref);
        });
      }
      let lxxMatches = { refs: [], texts: new Map(), highlightTerms: [] };
      if (enabledCorpora.has('lxx') && greekSearchTerms.size) {
        const lxxSeenRefs = new Set();
        const lxxTexts = new Map();
        const lxxTerms = [];
        for (const token of greekSearchTerms) {
          const tokenMatches = (lang === 'gr' && token === normalized)
            ? initialLxxMatches
            : await buildLxxMatches(token, 70);
          (tokenMatches.refs || []).forEach((ref) => {
            if (lxxSeenRefs.has(ref)) return;
            lxxSeenRefs.add(ref);
            lxxMatches.refs.push(ref);
          });
          (tokenMatches.texts || new Map()).forEach((value, key) => {
            if (!lxxTexts.has(key)) lxxTexts.set(key, value);
          });
          (tokenMatches.highlightTerms || []).forEach((termItem) => {
            if (!lxxTerms.includes(termItem)) lxxTerms.push(termItem);
          });
        }
        lxxMatches.texts = lxxTexts;
        lxxMatches.highlightTerms = lxxTerms;
      }
      if (enforceSpanishReferenceCorrespondence && enabledCorpora.has('lxx')) {
        lxxMatches.refs = scopedLxxRefsFromSpanish.slice();
        lxxMatches.texts = new Map();
        lxxMatches.highlightTerms = greekTerm ? [greekTerm] : [];
      }

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
      (equivalenceTerms.he || []).forEach((item) => hebrewSearchTerms.add(item));
if (hebrewCandidate?.normalized) {
        hebrewSearchTerms.add(hebrewCandidate.normalized);
      }
      const heIndex = await heIndexPromise;
      throwIfAborted(options.signal);
      const heRefs = [];
if (enforceSpanishReferenceCorrespondence && enabledCorpora.has('he')) {
        esOtRefs.forEach((ref) => heRefs.push(ref));
      } else if (enabledCorpora.has('he') && heIndex) {
        const seen = new Set();
        if (hebrewPhraseQueries.length) {
          for (const phrase of hebrewPhraseQueries) {
            const matches = await getRefsForQuery(phrase, 'he', heIndex, options);
            matches.forEach((ref) => {
              if (seen.has(ref)) return;
              seen.add(ref);
              heRefs.push(ref);
            });
          }
        } else if (hebrewSearchTerms.size) {
          for (const token of hebrewSearchTerms) {
            const matches = await getRefsForQuery(token, 'he', heIndex, options);
            matches.forEach((ref) => {
              if (seen.has(ref)) return;
              seen.add(ref);
              heRefs.push(ref);
            });
          }
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

      // --- FIX Punto 1 (ES -> GR): resaltar declinaciones ---
      // Nota: equivalenceTerms.* vienen como Set() (desde getEquivalenceSearchTerms),
      // así que aquí los convertimos a arrays y elegimos un "stem" (prefijo común) para resaltar
      // palabras flexionadas como θεου/θεον/θεος, etc.
      const grEquivs = equivalenceTerms?.gr ? [...equivalenceTerms.gr] : [];
      const greekLemmaNorm = (greekLemma && greekLemma !== '—') ? normalizeGreek(greekLemma) : '';
      const greekStem = (greekLemmaNorm.endsWith('σ') && greekLemmaNorm.length >= 3)
        ? greekLemmaNorm.slice(0, -1)
        : greekLemmaNorm;

      let grPreferred = grEquivs[0] || greekStem || greekTerm || '';
      if (grEquivs.length > 1) {
        let prefix = grEquivs[0];
        for (const w of grEquivs.slice(1)) {
          let i = 0;
          while (i < prefix.length && i < w.length && prefix[i] === w[i]) i += 1;
          prefix = prefix.slice(0, i);
          if (prefix.length < 3) break;
        }
        if (prefix.length >= 3) grPreferred = prefix;
      }
      if (!grPreferred && greekStem) grPreferred = greekStem;

      const isSpanishCrossToGreek = (!isCompoundQuery) && (lang === 'es') && (selectedScope === 'gr' || selectedScope === 'all');

      const grHighlight = isSpanishCrossToGreek
        ? [grPreferred, greekStem].filter(Boolean).join(' ').trim()
        : ((greekLemma && greekLemma !== '—') ? greekLemma : (lang === 'gr' ? term : ''));

      const lxxHighlight = isSpanishCrossToGreek
        ? [lxxHighlightQuery, grPreferred, greekStem].filter(Boolean).join(' ').trim()
        : (lxxHighlightQuery || grPreferred || ((greekLemma && greekLemma !== '—') ? greekLemma : ''));

      const heEquivs = equivalenceTerms?.he ? [...equivalenceTerms.he] : [];
      const hePreferred =
        heEquivs.find((t) => String(t || '').includes('יהוה')) ||
        heEquivs.find((t) => String(t || '').includes('אלהים')) ||
        heEquivs.find((t) => String(t || '') === 'אל') ||
        heEquivs.sort((a, b) => String(b || '').length - String(a || '').length)[0] ||
        '';

      const highlightQueries = {
        gr: grHighlight,
        lxx: lxxHighlight,
        he: (hebrewPhraseQueries.length ? hebrewPhraseQueries.join(' || ') : '')
          || hePreferred
          || hebrewCandidate?.word
          || (lang === 'he' ? term : ''),
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

      await renderSearchUI(groupsByCorpus, highlightQueries, relatedTerms, options);
      state.last = { term, lang, refs, groupsByCorpus, highlightQueries, relatedTerms };

      await Promise.all(corpusConfigs.map(async (config, index) => {
        throwIfAborted(options.signal);
        const groups = await buildBookGroups(config.safeRefs, config.lang, config.preloaded, options);
        groupsByCorpus[index].groups = groups;
        groupsByCorpus[index].loading = false;
        await renderSearchUI(groupsByCorpus, highlightQueries, relatedTerms, options);
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
     // Panel derecho: filtros (All / OT / NT / Libro)
     const bxFilterBtn = event.target.closest('button[data-bx-filter]');
     if (bxFilterBtn) {
       const id = bxFilterBtn.dataset.bxFilter || 'all';
       if (id === 'all') {
         state.pagination.selectedTestament = null;
         state.pagination.selectedBook = null;
       } else if (id === 'ot' || id === 'nt') {
         state.pagination.selectedTestament = id;
         state.pagination.selectedBook = null;
       } else if (id.startsWith('book:')) {
         state.pagination.selectedBook = id.slice(5);
         state.pagination.selectedTestament = null;
       }
       state.pagination.page = 1;
       if (state.last?.groupsByCorpus) {
         void renderSearchUI(state.last.groupsByCorpus || [], state.last.highlightQueries || {}, state.last.relatedTerms || {});
       }
       return;
     }

     // Paginación
     const pageBtn = event.target.closest('button[data-bx-page]');
     if (pageBtn) {
       const nextPage = Number(pageBtn.dataset.bxPage);
       if (!Number.isFinite(nextPage) || nextPage < 1) return;
       state.pagination.page = nextPage;
       if (state.last?.groupsByCorpus) {
         void renderSearchUI(state.last.groupsByCorpus || [], state.last.highlightQueries || {}, state.last.relatedTerms || {});
       }
       return;
     }

     // Botones superiores por corpus (Torah/Profetas/Evangelios/etc.)
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

     // Al cambiar de categoría, volvemos a "All" (pero mantenemos el panel a la derecha)
     state.pagination.page = 1;
     state.pagination.selectedTestament = null;
     state.pagination.selectedBook = null;

     if (state.last?.groupsByCorpus) {
       void renderSearchUI(state.last.groupsByCorpus || [], state.last.highlightQueries || {}, state.last.relatedTerms || {});
     }
   }

function handleLanguageScopeChange(event) {
    const value = String(event?.target?.value || 'auto');
    state.languageScope = (value === 'es' || value === 'gr' || value === 'he' || value === 'all') ? value : 'auto';
    if (queryInput?.value.trim()) {
      analyze();
    }
   }

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
