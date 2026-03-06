(() => {
  const PANEL_IDS = {
    panel: 'lemmaSummaryPanel',
    tags: 'lemmaTags',
    summary: 'lemmaSummary',
    correspondence: 'lemmaCorrespondence',
    examples: 'lemmaExamples'
  };

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
    'lxx_rahlfs_1935_Zeph.json'
  ];

  const state = {
    indexes: {},
    textCache: new Map(),
    lxxFileCache: new Map(),
 lxxSearchCache: new Map(),
      };
  const jsonCache = new Map();

  function $(id) {
    return document.getElementById(id);
  }

  function escapeHtml(text) {
    return String(text ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function normalizeSpanish(text) {
    return String(text || '')
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9ñ\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function normalizeGreek(text) {
    return String(text || '')
      .replace(/[··.,;:!?“”"(){}\[\]<>«»]/g, '')
      .replace(/\s/g, '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
  }

  function normalizeHebrew(text) {
    return String(text || '')
      .replace(/[\u200C-\u200F\u202A-\u202E]/g, '')
      .replace(/[\u0591-\u05BD\u05BF\u05C1-\u05C2\u05C4-\u05C7]/g, '')
      .replace(/[\s\u05BE\-\u2010-\u2015\u2212]/g, '')
      .replace(/[׃.,;:!?()"“”'׳״]/g, '');
  }

  function detectLang(text) {
    const sample = String(text || '');
    if (/[\u0590-\u05FF]/.test(sample)) return 'he';
    if (/[\u0370-\u03FF\u1F00-\u1FFF]/.test(sample)) return 'gr';
    return 'es';
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

  function transliterateHebrew(word) {
    if (!word) return '—';
    const consonants = {
      'א': '', 'ב': 'b', 'ג': 'g', 'ד': 'd', 'ה': 'h', 'ו': 'v', 'ז': 'z', 'ח': 'j',
      'ט': 't', 'י': 'y', 'כ': 'k', 'ך': 'k', 'ל': 'l', 'מ': 'm', 'ם': 'm', 'נ': 'n',
      'ן': 'n', 'ס': 's', 'ע': "'", 'פ': 'p', 'ף': 'p', 'צ': 'ts', 'ץ': 'ts', 'ק': 'q',
      'ר': 'r', 'ש': 'sh', 'ת': 't'
    };
    const vowelMap = {
      '\u05B0': 'e', '\u05B1': 'e', '\u05B2': 'a', '\u05B3': 'a', '\u05B4': 'i',
      '\u05B5': 'e', '\u05B6': 'e', '\u05B7': 'a', '\u05B8': 'a', '\u05B9': 'o',
      '\u05BB': 'u', '\u05C7': 'o'
    };
    const decomposed = String(word || '').normalize('NFD');
    let output = '';
    for (let i = 0; i < decomposed.length; i += 1) {
      const char = decomposed[i];
      if (!Object.prototype.hasOwnProperty.call(consonants, char)) {
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
        if (!vowel && vowelMap[decomposed[j]]) vowel = vowelMap[decomposed[j]];
        j += 1;
      }
      if (char === 'ש') consonant = hasSinDot ? 's' : 'sh';
      output += consonant + vowel;
      i = j - 1;
    }
    return output || normalizeHebrew(word) || '—';
  }

 

  function installLemmaSummaryPanel() {
    const panel = $(PANEL_IDS.panel);
    if (!panel) return null;
    const header = panel.querySelector('.panel-header');
    if (header) header.textContent = 'Resumen del lema';
    const body = panel.querySelector('.panel-body');
    if (!body) return null;
    body.innerHTML = `
      <div class="d-flex flex-column gap-2">
        <div id="${PANEL_IDS.tags}" class="d-flex flex-wrap gap-2"></div>
        <p id="${PANEL_IDS.summary}" class="mb-2 small muted">Escribe un término para generar el resumen del lema.</p>
        <div>
          <div id="${PANEL_IDS.correspondence}" class="d-grid gap-2 mt-2"></div>
        </div>
        <div id="${PANEL_IDS.examples}" class="d-grid gap-2"></div>
      </div>
    `;
    return {
      tags: $(PANEL_IDS.tags),
      summary: $(PANEL_IDS.summary),
      correspondence: $(PANEL_IDS.correspondence),
      examples: $(PANEL_IDS.examples)
    };
  }

  function ensurePanelNodes() {
    const existing = {
      tags: $(PANEL_IDS.tags),
      summary: $(PANEL_IDS.summary),
      correspondence: $(PANEL_IDS.correspondence),
      examples: $(PANEL_IDS.examples)
    };
    if (existing.tags && existing.summary && existing.correspondence && existing.examples) return existing;
    return installLemmaSummaryPanel();
  }

  function renderTags(tags) {
    const nodes = ensurePanelNodes();
    if (!nodes?.tags) return;
    nodes.tags.innerHTML = '';
    tags.forEach((tag) => {
      const span = document.createElement('span');
      span.className = 'tag';
      span.innerHTML = tag;
      nodes.tags.appendChild(span);
    });
  }

  function renderSummary(html) {
    const nodes = ensurePanelNodes();
    if (nodes?.summary) nodes.summary.innerHTML = html;
  }

  function renderCorrespondence(cards) {
    const nodes = ensurePanelNodes();
    if (!nodes?.correspondence) return;
    nodes.correspondence.innerHTML = '';
    if (!cards.length) {
      nodes.correspondence.innerHTML = '<div class="small muted">Sin correspondencias disponibles.</div>';
      return;
    }
    cards.forEach((card) => {
      const div = document.createElement('div');
      div.className = 'example-card';
      div.innerHTML = card;
      nodes.correspondence.appendChild(div);
    });
  }

  function renderExamples(cards) {
    const nodes = ensurePanelNodes();
    if (!nodes?.examples) return;
    nodes.examples.innerHTML = '';
    cards.forEach((card) => {
      const div = document.createElement('div');
      div.className = 'example-card';
      div.innerHTML = card;
      nodes.examples.appendChild(div);
    });
  }

  function getDisplayRows(matches, rawQuery) {
    if (typeof window.buildDisplayResults === 'function') {
      try {
        return window.buildDisplayResults(matches || [], rawQuery || '');
      } catch (_) {}
    }
    return Array.isArray(matches) ? matches : [];
  }

  function pickPrimaryMatch(matches, rawQuery) {
    const rows = getDisplayRows(matches, rawQuery);
    return rows[0] || matches?.[0] || null;
  }

  function getHebrew(entry) {
    return String(entry?.he || entry?.hebrew || entry?.palabra || '').trim();
  }

  function getGreek(entry) {
    return String(entry?.gr || entry?.equivalencia_griega || entry?.greek || '').trim();
  }

  function getSpanish(entry) {
    return String(
      entry?.es ||
      entry?.equivalencia_espanol ||
      entry?.equivalencia ||
      entry?.glosa ||
      ''
    ).trim();
  }



  function classForLang(lang) {
    if (lang === 'he') return 'hebrew';
    if (lang === 'gr' || lang === 'lxx') return 'greek';
    return '';
  }

  function buildCorrespondenceCard({ title, word, transliteration, detail, lang }) {
    const wordLine = word
      ? `<div class="${classForLang(lang)} fw-semibold">${escapeHtml(word)}</div>`
      : '<div class="small muted">—</div>';
    const translitLine = transliteration
      ? `<div class="small muted">Transliteración: ${escapeHtml(transliteration)}</div>`
      : '';
    const detailLine = detail
      ? `<div class="small muted">${escapeHtml(detail)}</div>`
      : '';
    return `
      <div class="fw-semibold">${escapeHtml(title)}</div>
      ${wordLine}
      ${translitLine}
      ${detailLine}
    `;
  }

  function prettifyBookLabel(book) {
    const raw = String(book || '').replace(/_/g, ' ').trim();
    if (!raw) return '—';
    if (/^[1234][A-Z]/.test(raw) || /^[A-Z][a-z]+/.test(raw)) return raw;
    return raw.replace(/\b\w/g, (m) => m.toUpperCase());
  }

  function formatRef(book, chapter, verse) {
    return `${prettifyBookLabel(book)} ${chapter}:${verse}`;
  }

  async function loadJson(url) {
    if (jsonCache.has(url)) return jsonCache.get(url);
    const promise = fetch(url, { cache: 'force-cache' }).then((res) => {
      if (!res.ok) throw new Error(`No se pudo cargar ${url}`);
      return res.json();
    });
    jsonCache.set(url, promise);
    try {
      return await promise;
    } catch (error) {
      jsonCache.delete(url);
      throw error;
    }
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
    const promise = fetch(`./LXX/${file}`, { cache: 'force-cache' }).then((res) => {
      if (!res.ok) throw new Error(`No se pudo cargar ${file}`);
      return res.json();
    });
    state.lxxFileCache.set(file, promise);
    try {
      return await promise;
    } catch (error) {
      state.lxxFileCache.delete(file);
      throw error;
    }
  }


  function buildDictionaryCard(title, lines = []) {
    const clean = lines.filter(Boolean);
    const content = clean.length
      ? clean.map((line) => `<div class="small">${escapeHtml(line)}</div>`).join('')
      : '<div class="small muted">Sin coincidencias en esta fuente.</div>';
    return `<div class="fw-semibold">${escapeHtml(title)}</div>${content}`;
  }

  async function buildDictionaryCards({ grWord, heWord }) {
    await loadDictionarySources();

    const greekKey = normalizeGreek(grWord || '');
    const greekMasterEntry = state.greekMasterMap.get(greekKey);
    const greekUnifiedGlosses = [...(state.greekUnifiedMap.get(greekKey) || [])].slice(0, 4);

    const greekLines = [];
    if (greekMasterEntry?.lemma) greekLines.push(`Lemma: ${greekMasterEntry.lemma}`);
    if (greekMasterEntry?.['Forma lexica']) greekLines.push(`Transliteración: ${greekMasterEntry['Forma lexica']}`);
    if (greekMasterEntry?.entrada_impresa) greekLines.push(`Entrada: ${greekMasterEntry.entrada_impresa}`);
    if (greekMasterEntry?.definicion) greekLines.push(`Definición: ${greekMasterEntry.definicion}`);
    if (greekUnifiedGlosses.length) greekLines.push(`Glosas (diccionarioG_unificado): ${greekUnifiedGlosses.join('; ')}`);

    const hebrewKey = normalizeHebrew(heWord || '');
    const hebrewEntry = state.hebrewDictMap.get(hebrewKey);
    const hebrewLines = [];
    if (hebrewEntry?.strong_detail?.lemma || hebrewEntry?.hebreo) hebrewLines.push(`Lemma: ${hebrewEntry?.strong_detail?.lemma || hebrewEntry?.hebreo}`);
    if (hebrewEntry?.strong_detail?.transliteracion) hebrewLines.push(`Transliteración: ${hebrewEntry.strong_detail.transliteracion}`);
    if (hebrewEntry?.glosa) hebrewLines.push(`Glosa: ${hebrewEntry.glosa}`);
    if (hebrewEntry?.strong_detail?.definicion) hebrewLines.push(`Definición: ${hebrewEntry.strong_detail.definicion}`);

    return [
      buildDictionaryCard('Diccionario A (Griego)', greekLines),
      buildDictionaryCard('Diccionario B (Hebreo)', hebrewLines)
    ];
  }

  function buildGreekSearchKeys(normalized) {
    if (!normalized) return [];
    const variants = new Set();
    const chars = normalized.split('');
    const swapMap = { β: 'υ', υ: 'β' };
    const walk = (index, current) => {
      if (index >= chars.length) {
        variants.add(current);
        return;
      }
      const ch = chars[index];
      walk(index + 1, `${current}${ch}`);
      if (swapMap[ch]) walk(index + 1, `${current}${swapMap[ch]}`);
    };
    walk(0, '');
    return [...variants];
  }

  function getGreekRefs(normalized, index) {
    if (!normalized) return [];
    const refs = [];
    const seen = new Set();
    buildGreekSearchKeys(normalized).forEach((key) => {
      (index?.tokens?.[key] || []).forEach((ref) => {
        if (seen.has(ref)) return;
        seen.add(ref);
        refs.push(ref);
      });
    });
    return refs;
  }

  function getHebrewRefs(normalized, index) {
    if (!normalized) return [];
    const direct = index?.tokens?.[normalized] || [];
    if (direct.length) return direct;
    const refs = [];
    const seen = new Set();
    Object.entries(index?.tokens || {}).forEach(([token, matches]) => {
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

  async function searchRefsInTextIndex(lang, query, maxRefs = 3) {
    const raw = String(query || '').trim();
    if (!raw) return [];
    const index = await loadIndex(lang);
    let refs = [];
    if (lang === 'gr') {
      refs = getGreekRefs(normalizeGreek(raw), index);
    } else if (lang === 'he') {
      refs = getHebrewRefs(normalizeHebrew(raw), index);
    } else {
      refs = index?.tokens?.[normalizeSpanish(raw).split(/\s+/)[0] || ''] || [];
    }
    return refs.slice(0, maxRefs);
  }

  async function buildSamplesForRefs(refs, lang, max = 3) {
    const samples = [];
    for (const ref of (refs || []).slice(0, max)) {
      const [book, chapterRaw, verseRaw] = String(ref || '').split('|');
      const chapter = Number(chapterRaw);
      const verse = Number(verseRaw);
      if (!book || !Number.isFinite(chapter) || !Number.isFinite(verse)) continue;
      try {
        const verses = await loadChapterText(lang, book, chapter);
        const verseText = verses?.[verse - 1] || '';
        if (!verseText) continue;
        samples.push({ ref: formatRef(book, chapter, verse), text: verseText, lang });
      } catch (_) {
        continue;
      }
    }
    return samples;
  }

  async function buildLxxMatches(normalizedGreek, maxRefs = 3) {
    if (!normalizedGreek) return [];
    if (state.lxxSearchCache.has(normalizedGreek)) return state.lxxSearchCache.get(normalizedGreek);
    const samples = [];
    outer:
    for (const file of LXX_FILES) {
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
              const verseText = (tokens || []).map((token) => token?.w || '').filter(Boolean).join(' ');
              samples.push({
                ref: formatRef(book, chapter, verse),
                text: verseText,
                lang: 'lxx'
              });
              if (samples.length >= maxRefs) break outer;
            }
          }
        }
      } catch (_) {
        continue;
      }
    }
    state.lxxSearchCache.set(normalizedGreek, samples);
    return samples;
  }

  function buildSamplesCard(title, lang, queryWord, samples) {
    const langClass = classForLang(lang);
    const rows = (samples || []).length
      ? samples.map((sample) => `
          <div class="mt-2">
            <div class="small fw-semibold">${escapeHtml(sample.ref)}</div>
            <div class="${langClass}">${escapeHtml(sample.text)}</div>
          </div>
        `).join('')
      : '<div class="small muted">Sin coincidencias en esta fuente.</div>';
    return `
      <div class="fw-semibold">${escapeHtml(title)}</div>
      <div class="small muted">${escapeHtml(queryWord || '—')}</div>
      ${rows}
    `;
  }

  async function buildSourceCards({ esWord, grWord, heWord }) {
    const tasks = [
      (async () => {
const refs = await searchRefsInTextIndex('es', esWord, 3);
        const samples = await buildSamplesForRefs(refs, 'es', 3);
        return buildSamplesCard('RVR1960 (AT/NT)', 'es', esWord, samples);
      })(),
      (async () => {
        const refs = await searchRefsInTextIndex('gr', grWord, 3);
        const samples = await buildSamplesForRefs(refs, 'gr', 3);
        return buildSamplesCard('RKANT (NT)', 'gr', grWord, samples);
      })(),
      (async () => {
        const refs = await searchRefsInTextIndex('he', heWord, 3);
        const samples = await buildSamplesForRefs(refs, 'he', 3);
        return buildSamplesCard('Hebreo (AT)', 'he', heWord, samples);
      })(),
      (async () => {
        const samples = await buildLxxMatches(normalizeGreek(grWord), 3);
        return buildSamplesCard('LXX (AT)', 'lxx', grWord, samples);
      })()
    ];
    const settled = await Promise.allSettled(tasks);
    return settled.map((item, idx) => {
      if (item.status === 'fulfilled') return item.value;
      return buildSamplesCard(['RVR1960 (AT/NT)', 'RKANT (NT)', 'Hebreo (AT)', 'LXX (AT)'][idx], ['es', 'gr', 'he', 'lxx'][idx], '', []);
          });
  }

  async function summarizeEntry(entry, rawQuery) {
    const lang = detectLang(rawQuery);
    const heb = getHebrew(entry);
    const gr = getGreek(entry);
    const es = getSpanish(entry);
    

    const lemmaText =
      lang === 'he' ? (heb || rawQuery) :
      lang === 'gr' ? (gr || rawQuery) :
      (es || rawQuery);

    const transliteration =
      lang === 'he' ? transliterateHebrew(heb || rawQuery) :
      lang === 'gr' ? transliterateGreek(gr || rawQuery) :
      '—';

    renderTags([
      `Lema: <span class="fw-semibold ${classForLang(lang)}">${escapeHtml(lemmaText || '—')}</span>`,
      `Transliteración: <span class="fw-semibold">${escapeHtml(transliteration || '—')}</span>`,
      'Estado: <span class="fw-semibold">Coincidencia localizada</span>'
    ]);

        renderSummary(`Palabra buscada: <span class="fw-semibold">${escapeHtml(rawQuery)}</span>`);

    renderCorrespondence([
      buildCorrespondenceCard({
        title: 'Hebreo',
        word: heb || '—',
        transliteration: heb ? transliterateHebrew(heb) : '',
        detail: heb ? 'Forma hebrea principal encontrada.' : 'Sin forma hebrea visible.',
        lang: 'he'
      }),
      buildCorrespondenceCard({
        title: 'Griego',
        word: gr || '—',
        transliteration: gr ? transliterateGreek(gr) : '',
        detail: gr ? 'Equivalencia griega principal encontrada.' : 'Sin equivalencia griega visible.',        lang: 'gr'      }),
      buildCorrespondenceCard({
        title: 'Español',
        word: es || '—',
        transliteration: '',
        detail: es ? 'Glosa o traducción española principal.' : 'Sin glosa española visible.',
        lang: 'es'
      })
    ]);

    renderExamples([
      '<div class="small muted">Cargando muestras de LXX, texto hebreo, RVR1960 y RKANT…</div>'
    ]);

    const sourceCards = await buildSourceCards({
      esWord: es || rawQuery,
      grWord: gr || (lang === 'gr' ? rawQuery : ''),
      heWord: heb || (lang === 'he' ? rawQuery : '')
    });

        renderExamples(sourceCards);
      }

  function renderEmptySummary(rawQuery, reason = '') {
    renderTags([
      `Entrada: <span class="fw-semibold">${escapeHtml(rawQuery || '—')}</span>`,
      'Estado: <span class="fw-semibold">Sin resultados</span>'
    ]);
    renderSummary(escapeHtml(reason || 'No se encontraron coincidencias para construir el resumen del lema.'));
    renderCorrespondence([]);
    renderExamples([]);
  }

  function runSearch(rawQuery) {
    const query = String(rawQuery || '').trim();
    if (!query) return null;
    const lang = detectLang(query);
    try {
      if (lang === 'he' && typeof window.searchHebrewWord === 'function') return window.searchHebrewWord(query);
      if (lang === 'he' && typeof window.searchHebrewWordSingle === 'function') return window.searchHebrewWordSingle(query);
      if (lang === 'gr' && typeof window.searchGreek === 'function') return window.searchGreek(query);
      if (typeof window.searchSpanish === 'function') return window.searchSpanish(query);
    } catch (_) {
      return null;
    }
    return null;
  }

  async function renderLemmaSummaryForSearch(rawQuery, searchResult) {
    ensurePanelNodes();
    const query = String(rawQuery || '').trim();
    if (!query) {
      renderEmptySummary('', 'Escribe un término para generar el resumen del lema.');
      return null;
    }
    const result = searchResult || runSearch(query);
    const matches = Array.isArray(result?.matches) ? result.matches : [];
    if (!matches.length) {
      renderEmptySummary(query, result?.diag || 'No se encontraron coincidencias para construir el resumen del lema.');
      return result || null;
    }
    const primary = pickPrimaryMatch(matches, query);
    if (!primary) {
      renderEmptySummary(query, 'No fue posible resolver una entrada principal para el resumen.');
      return result || null;
    }
    await summarizeEntry(primary, query);
    return result || null;
  }

  function wrapSearch() {
    if (window.__buscadorLemmaSummaryWrapped) return;
    window.__buscadorLemmaSummaryWrapped = true;

    const originalDoSearch = typeof window.doSearch === 'function' ? window.doSearch : null;
    if (originalDoSearch) {
      window.doSearch = function wrappedDoSearch(...args) {
        const output = originalDoSearch.apply(this, args);
        Promise.resolve().then(() => {
          const query = $('query')?.value || '';
          return renderLemmaSummaryForSearch(query).catch(() => {});
        });
        return output;
      };
    }

    const searchBtn = $('searchBtn');
    if (searchBtn) {
      searchBtn.addEventListener('click', () => {
        const query = $('query')?.value || '';
        setTimeout(() => { renderLemmaSummaryForSearch(query).catch(() => {}); }, 0);
      }, true);
    }

    const queryEl = $('query');
    if (queryEl) {
      queryEl.addEventListener('keydown', (event) => {
        if (event.key !== 'Enter') return;
        setTimeout(() => { renderLemmaSummaryForSearch(queryEl.value).catch(() => {}); }, 0);
      }, true);
    }

    const exampleBtn = $('exampleBtn');
    if (exampleBtn) {
      exampleBtn.addEventListener('click', () => {
        setTimeout(() => {
          const query = $('query')?.value || '';
          if (query) renderLemmaSummaryForSearch(query).catch(() => {});
        }, 0);
      }, true);
    }
  }

  function init() {
    ensurePanelNodes();
    wrapSearch();
  }

  window.BuscadorResumenLema = {
    init,
    installLemmaSummaryPanel,
    renderLemmaSummaryForSearch
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
