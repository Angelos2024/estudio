diff --git a/analisis/diccionario_a_griego.js b/analisis/diccionario_a_griego.js
new file mode 100644
index 0000000000000000000000000000000000000000..151bc76c2e2379b4e72ce9d88e945eb44f301107
--- /dev/null
+++ b/analisis/diccionario_a_griego.js
@@ -0,0 +1,191 @@
+(function () {
+  const MORPH_FILES = [
+    'mt', 'mk', 'lk', 'jn', 'ac', 'ro', '1co', '2co', 'ga', 'eph', 'php', 'col',
+    '1th', '2th', '1ti', '2ti', 'tit', 'phm', 'heb', 'jas', '1pe', '2pe', '1jn', '2jn', '3jn', 'jud', 're'
+  ].map(code => `../diccionario/${code}-morphgnt.translit.json`);
+
+  const state = {
+    loaded: false,
+    loadPromise: null,
+    masterByLemma: new Map(),
+    glossByWord: new Map(),
+    morphByWord: new Map()
+  };
+
+  function normalizeGreek(value) {
+    return String(value || '')
+      .normalize('NFD')
+      .replace(/[\u0300-\u036f]/g, '')
+      .replace(/[⸀⸂⸃]/g, '')
+      .replace(/[.,;:!?“”"(){}\[\]<>«»]/g, '')
+      .replace(/[\u2019\u02BC']/g, '’')
+      .toLowerCase()
+      .replace(/ς/g, 'σ')
+      .trim();
+  }
+
+  function splitGreekTokens(text) {
+    const raw = String(text || '').replace(/[·/]/g, ' ');
+    return raw.split(/\s+/).map(x => x.trim()).filter(Boolean);
+  }
+
+  async function fetchJson(url) {
+    const response = await fetch(url, { cache: 'no-store' });
+    if (!response.ok) throw new Error(`No se pudo cargar ${url}`);
+    return response.json();
+  }
+
+  function pickMasterDefinition(item) {
+    return item?.definicion || item?.definición || item?.entrada_impresa || '';
+  }
+
+  async function loadMasterDictionary() {
+    const payload = await fetchJson('../diccionario/masterdiccionario.json');
+    const items = Array.isArray(payload?.items) ? payload.items : [];
+    items.forEach(item => {
+      const lemma = item?.lemma;
+      const key = normalizeGreek(lemma);
+      if (!key || state.masterByLemma.has(key)) return;
+      state.masterByLemma.set(key, {
+        lemma: lemma || item?.['Forma lexica'] || '—',
+        formaLexica: item?.['Forma lexica'] || '—',
+        formaTexto: item?.['Forma flexionada del texto'] || '—',
+        definicion: pickMasterDefinition(item) || 'Sin definición disponible.'
+      });
+    });
+  }
+
+  async function loadUnifiedGreekDictionary() {
+    const rows = await fetchJson('../diccionario/diccionarioG_unificado.min.json');
+    if (!Array.isArray(rows)) return;
+    rows.forEach(row => {
+      if (!Array.isArray(row) || row.length < 2) return;
+      const key = normalizeGreek(row[0]);
+      const gloss = String(row[1] || '').trim();
+      if (!key || !gloss) return;
+      if (!state.glossByWord.has(key)) state.glossByWord.set(key, new Set());
+      state.glossByWord.get(key).add(gloss);
+    });
+  }
+
+  function consumeMorphWord(word, bookCode) {
+    if (!word || typeof word !== 'object') return;
+    const greek = String(word.g || '').trim();
+    const lemma = String(word.lemma || '').trim();
+    const translit = String(word.tr || '').trim();
+    const key = normalizeGreek(greek || lemma);
+    if (!key) return;
+    if (!state.morphByWord.has(key)) state.morphByWord.set(key, []);
+    const bucket = state.morphByWord.get(key);
+    if (bucket.some(entry => normalizeGreek(entry.lemma) === normalizeGreek(lemma) && entry.translit === translit)) return;
+    bucket.push({ lemma: lemma || greek, translit: translit || '—', book: bookCode.toUpperCase() });
+  }
+
+  function loadMorphBook(payload, bookCode) {
+    const chapters = payload?.chapters;
+    if (!Array.isArray(chapters)) return;
+    chapters.forEach(chapter => {
+      if (!Array.isArray(chapter)) return;
+      chapter.forEach(verse => {
+        if (!Array.isArray(verse)) return;
+        verse.forEach(word => consumeMorphWord(word, bookCode));
+      });
+    });
+  }
+
+  async function loadMorphIndexes() {
+    await Promise.all(MORPH_FILES.map(async url => {
+      try {
+        const payload = await fetchJson(url);
+        const bookCode = (payload?.book || '').toLowerCase() || url.split('/').pop().split('-')[0];
+        loadMorphBook(payload, bookCode);
+      } catch (error) {
+        console.warn('[diccionario_a_griego] No se pudo cargar', url, error);
+      }
+    }));
+  }
+
+  function ensureLoaded() {
+    if (state.loaded) return Promise.resolve();
+    if (state.loadPromise) return state.loadPromise;
+
+    state.loadPromise = Promise.all([
+      loadMasterDictionary(),
+      loadUnifiedGreekDictionary(),
+      loadMorphIndexes()
+    ]).then(() => {
+      state.loaded = true;
+    }).catch(error => {
+      console.error('[diccionario_a_griego] Error cargando recursos griegos', error);
+    });
+
+    return state.loadPromise;
+  }
+
+  function lookupGreekWord(rawGreek) {
+    const token = splitGreekTokens(rawGreek)[0] || String(rawGreek || '').trim();
+    const key = normalizeGreek(token);
+    if (!key) return null;
+
+    const master = state.masterByLemma.get(key) || null;
+    const glosses = Array.from(state.glossByWord.get(key) || []).slice(0, 8);
+    const morph = (state.morphByWord.get(key) || []).slice(0, 6);
+
+    let resolvedMaster = master;
+    if (!resolvedMaster && morph.length) {
+      const lemmaKey = normalizeGreek(morph[0].lemma);
+      resolvedMaster = state.masterByLemma.get(lemmaKey) || null;
+    }
+
+    return { token, key, master: resolvedMaster, glosses, morph };
+  }
+
+  function esc(value) {
+    return String(value || '')
+      .replace(/&/g, '&amp;')
+      .replace(/</g, '&lt;')
+      .replace(/>/g, '&gt;');
+  }
+
+  function renderGreekDictionaryCell(rawGreek, rawQuery) {
+    const result = lookupGreekWord(rawGreek);
+    const safeGreek = esc(rawGreek || '—');
+
+    if (!result) {
+      return `<div class="comparison-pre comparison-pre--greek">Sin término griego utilizable para consulta.</div>`;
+    }
+
+    const masterBlock = result.master
+      ? `<div class="mb-3">
+          <div class="fw-bold mb-1">A1. masterdiccionario</div>
+          <div><strong>Lema:</strong> ${esc(result.master.lemma)}</div>
+          <div><strong>Forma léxica:</strong> ${esc(result.master.formaLexica)}</div>
+          <div class="mt-2">${esc(result.master.definicion)}</div>
+        </div>`
+      : '<div class="mb-3"><div class="fw-bold mb-1">A1. masterdiccionario</div><div class="muted">Sin entrada directa para este término.</div></div>';
+
+    const glossBlock = result.glosses.length
+      ? `<div class="mb-3"><div class="fw-bold mb-1">A2. diccionarioG_unificado.min.json</div><div class="d-flex flex-wrap gap-2">${result.glosses.map(g => `<span class="tag">${esc(g)}</span>`).join('')}</div></div>`
+      : '<div class="mb-3"><div class="fw-bold mb-1">A2. diccionarioG_unificado.min.json</div><div class="muted">Sin glosas coincidentes.</div></div>';
+
+    const morphBlock = result.morph.length
+      ? `<div><div class="fw-bold mb-1">A3. MorphGNT transliterado</div>${result.morph.map(item => `<div class="small">${esc(item.book)} · <span class="greek">${esc(item.lemma)}</span> · ${esc(item.translit)}</div>`).join('')}</div>`
+      : '<div><div class="fw-bold mb-1">A3. MorphGNT transliterado</div><div class="muted">Sin ocurrencias indexadas.</div></div>';
+
+    return `
+      <div class="trilingual-brief mb-3">
+        <div class="trilingual-title">Candidato trilingüe seleccionado</div>
+        <div class="trilingual-line"><strong>Consulta:</strong> ${esc(rawQuery || '—')}</div>
+        <div class="trilingual-line"><strong>Griego seleccionado:</strong> <span class="greek">${safeGreek}</span></div>
+      </div>
+      ${masterBlock}
+      ${glossBlock}
+      ${morphBlock}
+    `;
+  }
+
+  window.AnalisisDiccionarioAGriego = {
+    ensureLoaded,
+    renderGreekDictionaryCell
+  };
+})();
