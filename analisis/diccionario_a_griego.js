(function () {

  const state = {
    loaded: false,
    loadPromise: null,
    masterByLemma: new Map()
  };

  function normalizeGreek(value) {
    return String(value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[⸀⸂⸃]/g, '')
      .replace(/[.,;:!?“”"(){}\[\]<>«»]/g, '')
      .replace(/[\u2019\u02BC']/g, '’')
      .toLowerCase()
      .replace(/ς/g, 'σ')
      .trim();
  }

  function splitGreekTokens(text) {
    const raw = String(text || '').replace(/[·/]/g, ' ');
    return raw.split(/\s+/).map(x => x.trim()).filter(Boolean);
  }

  async function fetchJson(url) {
    const response = await fetch(url, { cache: 'no-store' });
    if (!response.ok) throw new Error(`No se pudo cargar ${url}`);
    return response.json();
  }

  function pickMasterDefinition(item) {
    return item?.definicion || item?.definición || item?.entrada_impresa || '';
  }

  async function loadMasterDictionary() {
    const payload = await fetchJson('../diccionario/masterdiccionario.json');
    const items = Array.isArray(payload?.items) ? payload.items : [];
    items.forEach(item => {
      const lemma = item?.lemma;
      const key = normalizeGreek(lemma);
      if (!key || state.masterByLemma.has(key)) return;
      state.masterByLemma.set(key, {
        lemma: lemma || item?.['Forma lexica'] || '—',
        formaLexica: item?.['Forma lexica'] || '—',
        formaTexto: item?.['Forma flexionada del texto'] || '—',
        definicion: pickMasterDefinition(item) || 'Sin definición disponible.'
      });
    });
  }

  
  function ensureLoaded() {
    if (state.loaded) return Promise.resolve();
    if (state.loadPromise) return state.loadPromise;

    state.loadPromise = Promise.all([
            loadMasterDictionary()
    ]).then(() => {
      state.loaded = true;
    }).catch(error => {
      console.error('[diccionario_a_griego] Error cargando recursos griegos', error);
    });

    return state.loadPromise;
  }

  function lookupGreekWord(rawGreek) {
    const token = splitGreekTokens(rawGreek)[0] || String(rawGreek || '').trim();
    const key = normalizeGreek(token);
    if (!key) return null;

    const master = state.masterByLemma.get(key) || null;
        return { token, key, master };
  }

  function esc(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  function renderGreekDictionaryCell(rawGreek, rawQuery) {
    const result = lookupGreekWord(rawGreek);

    if (!result) {
      return `<div class="comparison-pre comparison-pre--greek">Sin término griego utilizable para consulta.</div>`;
    }

    const masterBlock = result.master
            ? `<div class="trilingual-brief mt-3 dict-entry">
          <div class="dict-entry-header">
            <div class="dict-entry-kicker">Diccionario A</div>
            <div class="dict-entry-title greek">${esc(result.master.lemma)}</div>
          </div>
          <div class="trilingual-line"><strong>Lema:</strong> <span class="greek">${esc(result.master.lemma)}</span></div>
          <div class="trilingual-line"><strong>Forma léxica:</strong> <span class="greek">${esc(result.master.formaLexica)}</span></div>
          <div class="trilingual-line mt-2"><strong>Definición:</strong> ${esc(result.master.definicion)}</div>
        </div>`
    : '<div class="trilingual-brief mt-3"><div class="dict-entry-kicker">Diccionario A</div><div class="muted">Sin entrada directa para este término.</div></div>';

        return masterBlock;
  }

  window.AnalisisDiccionarioAGriego = {
    ensureLoaded,
    renderGreekDictionaryCell
  };
})();
