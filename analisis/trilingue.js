// =========================================================================
// TRILINGUE.JS - ORQUESTADOR MULTI-IDIOMA (Hebreo, Griego, Español)
// =========================================================================

/**
 * Normalización avanzada para Griego y Español.
 * Elimina acentos, diacríticos y convierte a minúsculas para búsqueda "fuzzy".
 */
function normalizeFuzzy(str) {
    return String(str || '')
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // Quita acentos/diacríticos
        .toLowerCase()
        .trim();
}

function normalizeBookKey(str) {
    return normalizeFuzzy(str)
        .replace(/[^a-z0-9]+/g, '');
}

const CANONICAL_BOOK_ORDER = [
    { rank: 1, keys: ['01genesis', 'genesis', 'gen', 'génesis', 'gn'] },
    { rank: 2, keys: ['02exodo', '02éxodo', 'exodo', 'éxodo', 'ex', 'exo'] },
    { rank: 3, keys: ['03levitico', '03levítico', 'levitico', 'levítico', 'lev', 'lv'] },
    { rank: 4, keys: ['04numeros', '04números', 'numeros', 'números', 'num', 'nm'] },
    { rank: 5, keys: ['05deuteronomio', 'deuteronomio', 'deut', 'dt'] }
];

const entryOrderCache = new WeakMap();

function getEntryLoadOrder(entry) {
    if (!entry || typeof entry !== 'object') return Number.MAX_SAFE_INTEGER;
    if (entryOrderCache.has(entry)) return entryOrderCache.get(entry);

    const idx = Array.isArray(entries) ? entries.indexOf(entry) : -1;
    const safeIdx = idx >= 0 ? idx : Number.MAX_SAFE_INTEGER;
    entryOrderCache.set(entry, safeIdx);
    return safeIdx;
}

function extractBookStrings(entry) {
    return [
        entry.book,
        entry.bookName,
        entry.book_name,
        entry.libro,
        entry.nombre_libro,
        entry.sourceBook,
        entry._book,
        entry.archivo,
        entry.file,
        entry.filename,
        entry.source,
        entry.ref,
        entry.referencia,
        entry.ubicacion
    ]
        .filter(Boolean)
        .map(v => String(v).trim());
}

function getCanonicalBookRank(entry) {
    const rawValues = extractBookStrings(entry);
    for (const raw of rawValues) {
        const key = normalizeBookKey(raw);
        for (const book of CANONICAL_BOOK_ORDER) {
            if (book.keys.some(alias => key.includes(normalizeBookKey(alias)))) {
                return book.rank;
            }
        }
    }
    return Number.MAX_SAFE_INTEGER;
}

function sortMatchesByBookOrderStable(list) {
    return list
        .map((entry, index) => ({
            entry,
            index,
            bookRank: getCanonicalBookRank(entry),
            loadOrder: getEntryLoadOrder(entry)
        }))
        .sort((a, b) => {
            if (a.bookRank !== b.bookRank) return a.bookRank - b.bookRank;
            if (a.loadOrder !== b.loadOrder) return a.loadOrder - b.loadOrder;
            return a.index - b.index;
        })
        .map(item => item.entry);
}

function getHebrewText(entry) {
    return String(entry?.he || entry?.hebrew || entry?.palabra || '').trim();
}

function getGreekText(entry) {
    return String(entry?.gr || entry?.equivalencia_griega || entry?.greek || '').trim();
}

function getGreekParts(entry) {
    return String(getGreekText(entry) || '')
        .split(/[,;·/]+/)
        .map(v => String(v || '').trim())
        .filter(Boolean);
}

function getGreekPriority(entry) {
    const raw = getGreekText(entry);
    const parts = getGreekParts(entry);
    const bestPart = parts.length
        ? parts.slice().sort((a, b) => {
            const aTokens = normalizeFuzzy(a).split(/\s+/).filter(Boolean).length || 999;
            const bTokens = normalizeFuzzy(b).split(/\s+/).filter(Boolean).length || 999;
            if (aTokens !== bTokens) return aTokens - bTokens;
            if (a.length !== b.length) return a.length - b.length;
            return a.localeCompare(b, 'el');
        })[0]
        : raw;

    const bestTokenCount = normalizeFuzzy(bestPart).split(/\s+/).filter(Boolean).length || 999;
    const rawTokenCount = normalizeFuzzy(raw).split(/\s+/).filter(Boolean).length || 999;

    return {
        partCount: parts.length || (raw ? 1 : 999),
        bestTokenCount,
        bestCharCount: bestPart ? bestPart.length : 999,
        rawTokenCount,
        rawCharCount: raw ? raw.length : 999,
        bestPart,
        raw
    };
}

function getGreekMatchPriorityForSpanish(entry) {
    const raw = getGreekText(entry);
    const parts = getGreekParts(entry);
    const rawTokens = normalizeFuzzy(raw).split(/\s+/).filter(Boolean);
    const bestPart = getGreekPriority(entry).bestPart || raw;
    const bestPartTokens = normalizeFuzzy(bestPart).split(/\s+/).filter(Boolean);

    const hasStandaloneSingle = parts.some((part) => {
        const tokens = normalizeFuzzy(part).split(/\s+/).filter(Boolean);
        return tokens.length === 1;
    }) || rawTokens.length === 1;

    const isSingleWordWholeGreekField = !hasListSeparator && rawTokens.length === 1;

    return {
        singleWordFieldRank: isSingleWordWholeGreekField ? 0 : 1,
        standaloneRank: hasStandaloneSingle ? 0 : 1,  
        partCount: parts.length || (raw ? 1 : 999),
         tokenCount: bestPartTokens.length || 999,
        charCount: bestPart ? bestPart.length : 999,
        bestPart,
        raw
    };
}
function getHebrewPriority(entry) {
    const heb = getHebrewText(entry);
    if (!heb) return { wordCount: 999, charCount: 999 };

    const clean = heb.replace(/[\u05BE]/g, ' ').trim();
    const words = clean ? clean.split(/\s+/).filter(Boolean) : [];
    const wordCount = words.length || 999;

    return {
        wordCount,
        charCount: heb.length
    };
}

function normalizeHebrewForSort(text) {
    const value = String(text || '');
    if (typeof stripHebrewMarksAnywhere === 'function' && typeof normalizeText === 'function') {
        return normalizeText(stripHebrewMarksAnywhere(value));
    }
    return value
        .normalize('NFD')
        .replace(/[\u0591-\u05C7]/g, '')
        .replace(/[\s\u05BE\-\u2010-\u2015\u2212]/g, '')
        .trim();
}

function getHebrewExactness(entry, queryRaw) {
    const query = String(queryRaw || '').trim();
    const heb = getHebrewText(entry);
    if (!query || !heb) return 999;

    const queryCompact = query.replace(/[\s\u05BE\-\u2010-\u2015\u2212]+/g, '');
    const hebCompact = heb.replace(/[\s\u05BE\-\u2010-\u2015\u2212]+/g, '');
    const queryNorm = normalizeHebrewForSort(query);
    const hebNorm = normalizeHebrewForSort(heb);

    if (heb === query) return 0;
    if (hebCompact === queryCompact) return 1;
    if (hebNorm === queryNorm) return 2;
    if (hebNorm.includes(queryNorm) || queryNorm.includes(hebNorm)) return 3;
    return 9;
}

function sortSpanishMatches(list) {
    return list.sort((a, b) => {
 const ga = getGreekMatchPriorityForSpanish(a);
        const gb = getGreekMatchPriorityForSpanish(b);
        const ba = getCanonicalBookRank(a);
        const bb = getCanonicalBookRank(b);
        const la = getEntryLoadOrder(a);
        const lb = getEntryLoadOrder(b);

        if (ga.singleWordFieldRank !== gb.singleWordFieldRank) return ga.singleWordFieldRank - gb.singleWordFieldRank;
        if (ga.standaloneRank !== gb.standaloneRank) return ga.standaloneRank - gb.standaloneRank;
        if (ga.partCount !== gb.partCount) return ga.partCount - gb.partCount;
         if (ga.tokenCount !== gb.tokenCount) return ga.tokenCount - gb.tokenCount;
        if (ga.charCount !== gb.charCount) return ga.charCount - gb.charCount;
        if (ba !== bb) return ba - bb;
        if (la !== lb) return la - lb;

        const ha = getHebrewPriority(a);
        const hb = getHebrewPriority(b);
        if (ha.wordCount !== hb.wordCount) return ha.wordCount - hb.wordCount;
        if (ha.charCount !== hb.charCount) return ha.charCount - hb.charCount;

        const greekCmp = ga.bestPart.localeCompare(gb.bestPart, 'el');
        if (greekCmp !== 0) return greekCmp;

        const haText = getHebrewText(a);
        const hbText = getHebrewText(b);
        return haText.localeCompare(hbText, 'he');
    });
}

function sortGreekMatches(list, token, getGreekSpecificity) {
    return list.sort((a, b) => {
        const ga = getGreekSpecificity(a, token);
        const gb = getGreekSpecificity(b, token);
        const ba = getCanonicalBookRank(a);
        const bb = getCanonicalBookRank(b);
        const la = getEntryLoadOrder(a);
        const lb = getEntryLoadOrder(b);

        if (ga.matchPriority !== gb.matchPriority) return ga.matchPriority - gb.matchPriority;
        if (ga.tokenCount !== gb.tokenCount) return ga.tokenCount - gb.tokenCount;
        if (ga.charCount !== gb.charCount) return ga.charCount - gb.charCount;
        if (ba !== bb) return ba - bb;
        if (la !== lb) return la - lb;

        const ha = getHebrewPriority(a);
        const hb = getHebrewPriority(b);
        if (ha.wordCount !== hb.wordCount) return ha.wordCount - hb.wordCount;
        if (ha.charCount !== hb.charCount) return ha.charCount - hb.charCount;

        const rawCmp = ga.raw.localeCompare(gb.raw, 'el');
        if (rawCmp !== 0) return rawCmp;

        return getHebrewText(a).localeCompare(getHebrewText(b), 'he');
    });
}

function sortHebrewMatches(list, queryRaw) {
    return (Array.isArray(list) ? list : []).sort((a, b) => {
        const ea = getHebrewExactness(a, queryRaw);
        const eb = getHebrewExactness(b, queryRaw);
        const ha = getHebrewPriority(a);
        const hb = getHebrewPriority(b);
        const ba = getCanonicalBookRank(a);
        const bb = getCanonicalBookRank(b);
        const la = getEntryLoadOrder(a);
        const lb = getEntryLoadOrder(b);

        if (ea !== eb) return ea - eb;
        if (ha.wordCount !== hb.wordCount) return ha.wordCount - hb.wordCount;
        if (ha.charCount !== hb.charCount) return ha.charCount - hb.charCount;
        if (ba !== bb) return ba - bb;
        if (la !== lb) return la - lb;

        const hebCmp = getHebrewText(a).localeCompare(getHebrewText(b), 'he');
        if (hebCmp !== 0) return hebCmp;

        return getGreekText(a).localeCompare(getGreekText(b), 'el');
    });
}


/**
 * MOTOR DE BÚSQUEDA GRIEGA
 * Permite buscar palabras con o sin acentos.
 */
function searchGreek(query) {
    const normQ = normalizeFuzzy(query);
    if (!normQ) return { ok: false, matches: [] };

    function getMainGreekTexts(entry) {
        return [entry.gr, entry.equivalencia_griega, entry.greek]
            .filter(Boolean)
            .map(v => String(v).trim());
    }

    function getCandidateGreekTexts(entry) {
        return (entry.candidatos || [])
            .filter(Boolean)
            .map(v => String(v).trim());
    }

    function greekWordTokens(text) {
        return normalizeFuzzy(text)
            .replace(/[\[\]\{\}\(\)«»"“”'’`]/g, ' ')
            .split(/[^a-z\u0370-\u03ff\u1f00-\u1fff]+/i)
            .map(t => t.trim())
            .filter(Boolean);
    }

    function hasExactGreekToken(texts, token) {
        return texts.some(t => greekWordTokens(t).includes(token));
    }

    function hasExactGreekField(texts, token) {
        return texts.some(t => normalizeFuzzy(t) === token);
    }

    function greekListParts(text) {
        return String(text || '')
            .split(/[,;·/]+/)
            .map(x => String(x || '').trim())
            .filter(Boolean);
    }

    function getGreekTokenContextPriority(raw, token) {
        const cleanRaw = String(raw || '').trim();
        if (!cleanRaw) return 999;

        const normRaw = normalizeFuzzy(cleanRaw);
        if (normRaw === token) return 0;

        const listParts = greekListParts(cleanRaw);
        if (listParts.some(part => normalizeFuzzy(part) === token)) return 1;

        const tokens = greekWordTokens(cleanRaw);
        const idx = tokens.indexOf(token);
        if (idx === -1) return 9;

        const hasListSeparator = /[,;·/]/.test(cleanRaw);
        if (hasListSeparator) return 2;

        return 3;
    }

    function getGreekSpecificity(entry, token) {
        const raw = String(entry.gr || entry.equivalencia_griega || entry.greek || '').trim();
        const tokens = greekWordTokens(raw);
        return {
            matchPriority: getGreekTokenContextPriority(raw, token),
            tokenCount: tokens.length || 999,
            charCount: raw.length || 999,
            raw
        };
    }

    function getHebrewText(entry) {
        return String(entry.he || entry.hebrew || entry.palabra || '').trim();
    }

    function getHebrewPriority(entry) {
        const heb = getHebrewText(entry);
        if (!heb) return { wordCount: 999, charCount: 999 };

        const clean = heb.replace(/[\u05BE]/g, ' ').trim();
        const words = clean ? clean.split(/\s+/).filter(Boolean) : [];
        const wordCount = words.length || 999;

        return { wordCount, charCount: heb.length };
    }

    function sortGreekMatches(list, token) {
        return list.sort((a, b) => {
            const ga = getGreekSpecificity(a, token);
            const gb = getGreekSpecificity(b, token);
            const ha = getHebrewPriority(a);
            const hb = getHebrewPriority(b);

            if (ga.matchPriority !== gb.matchPriority) return ga.matchPriority - gb.matchPriority;
            if (ga.tokenCount !== gb.tokenCount) return ga.tokenCount - gb.tokenCount;
            if (ha.wordCount !== hb.wordCount) return ha.wordCount - hb.wordCount;
            if (ga.charCount !== gb.charCount) return ga.charCount - gb.charCount;
            if (ha.charCount !== hb.charCount) return ha.charCount - hb.charCount;

            const rawCmp = ga.raw.localeCompare(gb.raw, 'el');
            if (rawCmp !== 0) return rawCmp;

            return getHebrewText(a).localeCompare(getHebrewText(b), 'he');
        });
    }

    function getGreekPluralVariants(word) {
        const variants = new Set();
        if (!word) return variants;

        if (word.endsWith('ος')) variants.add(word.slice(0, -2) + 'οι');
        if (word.endsWith('οι') && word.length > 2) variants.add(word.slice(0, -2) + 'ος');

        if (word.endsWith('η')) variants.add(word.slice(0, -1) + 'αι');
        if (word.endsWith('αι') && word.length > 2) variants.add(word.slice(0, -2) + 'η');

        if (word.endsWith('α')) variants.add(word.slice(0, -1) + 'αι');
        if (word.endsWith('αι') && word.length > 2) variants.add(word.slice(0, -2) + 'α');

        if (word.endsWith('ον')) variants.add(word.slice(0, -2) + 'α');
        if (word.endsWith('α') && word.length > 1) variants.add(word.slice(0, -1) + 'ον');

        return variants;
    }

    const pluralVariants = getGreekPluralVariants(normQ);

    const exactMainFieldMatches = [];
    const exactCandidateFieldMatches = [];
    const exactMainTokenMatches = [];
    const exactCandidateTokenMatches = [];
    const pluralMainFieldMatches = [];
    const pluralCandidateFieldMatches = [];
    const pluralMainTokenMatches = [];
    const pluralCandidateTokenMatches = [];

    entries.forEach(e => {
        const mainTexts = getMainGreekTexts(e);
        const candidateTexts = getCandidateGreekTexts(e);
        if (!mainTexts.length && !candidateTexts.length) return;

        if (hasExactGreekField(mainTexts, normQ)) {
            exactMainFieldMatches.push(e);
            return;
        }

        if (hasExactGreekField(candidateTexts, normQ)) {
            exactCandidateFieldMatches.push(e);
            return;
        }

        if (hasExactGreekToken(mainTexts, normQ)) {
            exactMainTokenMatches.push(e);
            return;
        }

        if (hasExactGreekToken(candidateTexts, normQ)) {
            exactCandidateTokenMatches.push(e);
            return;
        }

        if (pluralVariants.size && Array.from(pluralVariants).some(v => hasExactGreekField(mainTexts, v))) {
            pluralMainFieldMatches.push(e);
            return;
        }

        if (pluralVariants.size && Array.from(pluralVariants).some(v => hasExactGreekField(candidateTexts, v))) {
            pluralCandidateFieldMatches.push(e);
            return;
        }

        if (pluralVariants.size && Array.from(pluralVariants).some(v => hasExactGreekToken(mainTexts, v))) {
            pluralMainTokenMatches.push(e);
            return;
        }

        if (pluralVariants.size && Array.from(pluralVariants).some(v => hasExactGreekToken(candidateTexts, v))) {
            pluralCandidateTokenMatches.push(e);
        }
    });

    sortGreekMatchesLocal(exactMainFieldMatches, normQ);
    sortGreekMatchesLocal(exactCandidateFieldMatches, normQ);
    sortGreekMatchesLocal(exactMainTokenMatches, normQ);
    sortGreekMatchesLocal(exactCandidateTokenMatches, normQ);
    sortGreekMatchesLocal(pluralMainFieldMatches, normQ);
    sortGreekMatchesLocal(pluralCandidateFieldMatches, normQ);
    sortGreekMatchesLocal(pluralMainTokenMatches, normQ);
    sortGreekMatchesLocal(pluralCandidateTokenMatches, normQ);

    const finalMatches = [
        ...exactMainFieldMatches,
        ...exactCandidateFieldMatches,
        ...exactMainTokenMatches,
        ...exactCandidateTokenMatches,
        ...pluralMainFieldMatches,
        ...pluralCandidateFieldMatches,
        ...pluralMainTokenMatches,
        ...pluralCandidateTokenMatches
    ].slice(0, 4);

    return {
        ok: finalMatches.length > 0,
        tier: 'Búsqueda Griega (Exacta)',
        matches: finalMatches,
        trace: [
            `Búsqueda exacta griega para: ${query}`,
            `Variantes plurales aceptadas: ${Array.from(pluralVariants).join(', ') || 'ninguna'}`,
            'Orden: exacto visible completo > exacto en listas léxicas (coma/punto y coma) > exacto como palabra completa en frase > plurales exactos.',
            'Dentro de cada grupo se prioriza primero la forma griega más corta y después el orden canónico del libro.'
        ],
        diag: 'Se priorizan primero las coincidencias griegas más exactas; dentro de cada grupo va primero la forma griega más corta y después el orden canónico del libro.'
    };
}

/**
 * MOTOR DE BÚSQUEDA ESPAÑOL
 * Coincidencia exacta únicamente, con excepción de plurales regulares simples
 * (por ejemplo: boda <-> bodas, mar <-> mares). Los exactos visibles van primero.
 */
function searchSpanish(query) {
    const firstWord = (query || '').trim().split(/\s+/).filter(Boolean)[0] || '';
    const normQ = normalizeFuzzy(firstWord);

    if (!normQ) return { ok: false, matches: [] };

    function getMainSpanishTexts(entry) {
        return [entry.es, entry.equivalencia_espanol, entry.equivalencia]
            .filter(Boolean)
            .map(v => normalizeFuzzy(v));
    }

    function getCandidateSpanishTexts(entry) {
        return (entry.candidatos || [])
            .filter(Boolean)
            .map(v => normalizeFuzzy(v));
    }

    function getRegularPluralVariants(word) {
        const variants = new Set();
        if (!word) return variants;

        if (/[aeiouáéíóú]$/i.test(word)) {
            variants.add(word + 's');
        } else {
            variants.add(word + 'es');
        }

        if (word.endsWith('es') && word.length > 2) {
            variants.add(word.slice(0, -2));
        }
        if (word.endsWith('s') && word.length > 1) {
            variants.add(word.slice(0, -1));
        }

        return variants;
    }

    function getGreekText(entry) {
        return String(entry.gr || entry.equivalencia_griega || entry.greek || '').trim();
    }

    function getGreekParts(entry) {
        const raw = getGreekText(entry);
        return String(raw || '')
            .split(/[,;·/]+/)
            .map(v => String(v || '').trim())
            .filter(Boolean);
    }

    function getGreekPriority(entry) {
        const raw = getGreekText(entry);
        const parts = getGreekParts(entry);
        const bestPart = parts.length
            ? parts.slice().sort((a, b) => {
                const aTokens = normalizeFuzzy(a).split(/\s+/).filter(Boolean).length || 999;
                const bTokens = normalizeFuzzy(b).split(/\s+/).filter(Boolean).length || 999;
                if (aTokens !== bTokens) return aTokens - bTokens;
                if (a.length !== b.length) return a.length - b.length;
                return a.localeCompare(b, 'el');
            })[0]
            : raw;

        const bestTokenCount = normalizeFuzzy(bestPart).split(/\s+/).filter(Boolean).length || 999;
        const rawTokenCount = normalizeFuzzy(raw).split(/\s+/).filter(Boolean).length || 999;

        return {
            partCount: parts.length || (raw ? 1 : 999),
            bestTokenCount,
            bestCharCount: bestPart ? bestPart.length : 999,
            rawTokenCount,
            rawCharCount: raw ? raw.length : 999,
            bestPart,
            raw
        };
    }

    function getHebrewText(entry) {
        return String(entry.he || entry.hebrew || entry.palabra || '').trim();
    }

    function getHebrewPriority(entry) {
        const heb = getHebrewText(entry);
        if (!heb) return { wordCount: 999, charCount: 999 };

        const clean = heb.replace(/[\u05BE]/g, ' ').trim();
        const words = clean ? clean.split(/\s+/).filter(Boolean) : [];
        const wordCount = words.length || 999;

        return {
            wordCount,
            charCount: heb.length
        };
    }

    function sortSpanishMatches(list) {
        return list.sort((a, b) => {
            const ga = getGreekMatchPriorityForSpanish(a);
            const gb = getGreekMatchPriorityForSpanish(b);
            const ha = getHebrewPriority(a);
            const hb = getHebrewPriority(b);
            const ba = getCanonicalBookRank(a);
            const bb = getCanonicalBookRank(b);
            const la = getEntryLoadOrder(a);
            const lb = getEntryLoadOrder(b);

            if (ga.singleWordFieldRank !== gb.singleWordFieldRank) return ga.singleWordFieldRank - gb.singleWordFieldRank;
            if (ga.standaloneRank !== gb.standaloneRank) return ga.standaloneRank - gb.standaloneRank;
             if (ga.partCount !== gb.partCount) return ga.partCount - gb.partCount;
            if (ga.tokenCount !== gb.tokenCount) return ga.tokenCount - gb.tokenCount;
            if (ga.charCount !== gb.charCount) return ga.charCount - gb.charCount;           
            if (ha.wordCount !== hb.wordCount) return ha.wordCount - hb.wordCount;
            if (ha.charCount !== hb.charCount) return ha.charCount - hb.charCount;
            if (ba !== bb) return ba - bb;
            if (la !== lb) return la - lb;

            const greekCmp = ga.bestPart.localeCompare(gb.bestPart, 'el');
            if (greekCmp !== 0) return greekCmp;

            const haText = getHebrewText(a);
            const hbText = getHebrewText(b);
            return haText.localeCompare(hbText, 'he');
        });
    }

    const pluralVariants = getRegularPluralVariants(normQ);

    const exactMainMatches = [];
    const exactCandidateMatches = [];
    const pluralMainMatches = [];
    const pluralCandidateMatches = [];

    entries.forEach(e => {
        const mainTexts = getMainSpanishTexts(e);
        const candidateTexts = getCandidateSpanishTexts(e);
        if (!mainTexts.length && !candidateTexts.length) return;

        if (mainTexts.some(t => t === normQ)) {
            exactMainMatches.push(e);
            return;
        }

        if (candidateTexts.some(t => t === normQ)) {
            exactCandidateMatches.push(e);
            return;
        }

        if (mainTexts.some(t => pluralVariants.has(t))) {
            pluralMainMatches.push(e);
            return;
        }

        if (candidateTexts.some(t => pluralVariants.has(t))) {
            pluralCandidateMatches.push(e);
        }
    });

sortSpanishMatches(exactMainMatches);
    sortSpanishMatches(exactCandidateMatches);
    sortSpanishMatches(pluralMainMatches);
    sortSpanishMatches(pluralCandidateMatches);

    const finalMatches = [
        ...exactMainMatches,
        ...exactCandidateMatches,
        ...pluralMainMatches,
        ...pluralCandidateMatches
    ];

    return {
        ok: finalMatches.length > 0,
        tier: 'Búsqueda Español (Exacta)',
        matches: finalMatches,
        trace: [
            `Búsqueda exacta para: ${firstWord}`,
            `Variantes plurales aceptadas: ${Array.from(pluralVariants).join(', ') || 'ninguna'}`,
            'Orden: exacto visible > exacto en candidatos > plural visible > plural en candidatos.',
            'Dentro de cada grupo se prioriza: campo griego de una sola palabra (sin listas) > presencia de palabra aislada > menos variantes griegas > menos tokens > menor longitud; después, orden canónico/carga y desempates hebreos.'        ],
        diag: 'Se muestran primero las coincidencias exactas de la traducción visible; dentro de cada grupo se prioriza la equivalencia griega de una sola palabra (sin lista), luego formas más compactas y finalmente el orden canónico del libro.'    };
}

/**
 * RENDERIZADO UNIFICADO
 * Asegura que se vean las 3 columnas pase lo que pase.
 */
function renderResults(items, rawQuery = '') {
    // Usamos la función de buscador2.js para procesar las glosas si vienen del hebreo
    const displayItems = typeof buildDisplayResults === 'function' 
        ? buildDisplayResults(items, rawQuery) 
        : items;
    
    if (!displayItems || !displayItems.length) {
        if (resultsTbodyEl) {
            resultsTbodyEl.innerHTML = '<tr><td colspan="3" class="muted">Sin resultados precisos para esta entrada.</td></tr>';
        }
        return;
    }

    const limitedItems = displayItems.slice(0, 4);

    if (!resultsTbodyEl) return;

    const normalizeDisplayText = (value) => {
        const txt = String(value ?? '');
        return txt
            .replace(/\s*\/n\s*/gi, ' ')
            .replace(/\s*\\n\s*/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    };


    resultsTbodyEl.innerHTML = limitedItems.map(e => {
        // Extraer griego de cualquier posible llave en el JSON
const griegoRaw = e.gr || e.equivalencia_griega || e.greek || '—';
        const griego = normalizeDisplayText(griegoRaw) || '—';
        const espanol = normalizeDisplayText(e.es || '—') || '—';
                return `
        <tr>
            <td class="he">${escapeHtml(e.he)}</td>
            <td class="gr" style="font-family: 'Times New Roman', serif; font-size: 1.2rem; color: #1e3a8a;">
                ${escapeHtml(griego)}
            </td>
            <td class="es">
                ${e._isSynthetic ? `<small style="color:var(--muted)">[Sintético]</small> ` : ''}
                ${escapeHtml(espanol)}
                            </td>
        </tr>
    `}).join('');
}

/**
 * SOBREESCRITURA DE DO-SEARCH
 * Detecta el idioma y dirige al motor correcto.
 */
function doSearch() {
    if (!entries || !entries.length) {
        setTierBadge('Sin Datos', false);
        if (diagEl) diagEl.textContent = 'Por favor, cargue los archivos JSON de los libros primero.';
        return;
    }

    const rawQuery = queryEl.value.trim();
    if (!rawQuery) return;

    // Rangos Unicode para detección
    const isHebrew = /[\u0590-\u05FF]/.test(rawQuery);
    const isGreek = /[\u0370-\u03FF\u1F00-\u1FFF]/.test(rawQuery);

    let res;

    if (isHebrew) {
        // Mantiene la lógica avanzada de morfología de buscador3.js
        res = searchHebrewWord(rawQuery);
        if (res && Array.isArray(res.matches)) {
            res.matches = sortHebrewMatches(res.matches, rawQuery);
            if (Array.isArray(res.trace)) {
                res.trace.push('Reordenado final hebreo: exactitud hebrea > hebreo más corto > orden canónico del libro.');
            }
        }
    } else if (isGreek) {
        // Nuevo motor para palabras como κατασπερεῖς
        res = searchGreek(rawQuery);
    } else {
        // Motor español limitado a una palabra
        res = searchSpanish(rawQuery);
    }

    // Actualizar Interfaz
    renderResults(res.matches, rawQuery);
    
    resultCountEl.textContent = `${res.matches.length} resultado(s)`;
    setTierBadge(res.tier, !!res.ok);
    diagEl.textContent = res.diag;
    traceEl.textContent = (res.trace || []).join('\n');
}

// Inicialización: Asegurarnos de que el botón use esta nueva función
if (searchBtn) {
    searchBtn.onclick = doSearch;

}