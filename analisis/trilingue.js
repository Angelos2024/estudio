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

    function getGreekSpecificity(entry) {
        const raw = String(entry.gr || entry.equivalencia_griega || entry.greek || '').trim();
        const tokens = greekWordTokens(raw);
        return {
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

    function sortGreekMatches(list) {
        return list.sort((a, b) => {
            const ga = getGreekSpecificity(a);
            const gb = getGreekSpecificity(b);
            const ha = getHebrewPriority(a);
            const hb = getHebrewPriority(b);

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

    sortGreekMatches(exactMainFieldMatches);
    sortGreekMatches(exactCandidateFieldMatches);
    sortGreekMatches(exactMainTokenMatches);
    sortGreekMatches(exactCandidateTokenMatches);
    sortGreekMatches(pluralMainFieldMatches);
    sortGreekMatches(pluralCandidateFieldMatches);
    sortGreekMatches(pluralMainTokenMatches);
    sortGreekMatches(pluralCandidateTokenMatches);

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
            'Orden: exacto visible completo > exacto en candidatos > exacto como palabra completa > plurales exactos.'
        ],
        diag: 'Se priorizan primero las coincidencias exactas de campo completo; después las coincidencias exactas como palabra completa; al final, plurales griegos relacionados.'
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

    function sortByHebrewPriority(list) {
        return list.sort((a, b) => {
            const pa = getHebrewPriority(a);
            const pb = getHebrewPriority(b);

            if (pa.wordCount !== pb.wordCount) return pa.wordCount - pb.wordCount;
            if (pa.charCount !== pb.charCount) return pa.charCount - pb.charCount;

            const ha = getHebrewText(a);
            const hb = getHebrewText(b);
            return ha.localeCompare(hb, 'he');
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

    sortByHebrewPriority(exactMainMatches);
    sortByHebrewPriority(exactCandidateMatches);
    sortByHebrewPriority(pluralMainMatches);
    sortByHebrewPriority(pluralCandidateMatches);

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
            'Dentro de cada grupo se prioriza hebreo de una sola palabra.'
        ],
        diag: 'Se muestran primero las coincidencias exactas de la traducción visible; después las coincidencias exactas en candidatos; al final, plurales regulares relacionados.'
    };
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

    resultsTbodyEl.innerHTML = limitedItems.map(e => {
        // Extraer griego de cualquier posible llave en el JSON
        const griego = e.gr || e.equivalencia_griega || e.greek || '—';
        return `
        <tr>
            <td class="he">${escapeHtml(e.he)}</td>
            <td class="gr" style="font-family: 'Times New Roman', serif; font-size: 1.2rem; color: #1e3a8a;">
                ${escapeHtml(griego)}
            </td>
            <td class="es">
                ${e._isSynthetic ? `<small style="color:var(--muted)">[Sintético]</small> ` : ''}
                ${escapeHtml(e.es || '—')}
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