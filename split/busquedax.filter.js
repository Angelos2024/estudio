
;(() => {
  'use strict';

  // -----------------------------
  //  Detección de idioma (simple)
  // -----------------------------
  function detectLang(input) {
    const s = String(input || '');
    const hasHebrew = /[\u0590-\u05FF\uFB1D-\uFB4F]/.test(s);
    const hasGreek  = /[\u0370-\u03FF\u1F00-\u1FFF]/.test(s);
    if (hasHebrew && !hasGreek) return 'he';
    if (hasGreek && !hasHebrew) return 'gr';
    if (hasGreek && hasHebrew) return 'mixed';
    return 'es';
  }

  // -----------------------------
  //  Scope / idioma seleccionado
  // -----------------------------
  function getLanguageScope(term) {
    const el = document.getElementById('bxLanguageScope');
    const selected = el ? String(el.value || 'auto') : 'auto';
    if (selected !== 'auto') return selected;
    return detectLang(term);
  }

  // MAIN espera esto:
  // getCorporaForScope('gr') -> ['gr','lxx']
  // getCorporaForScope('he') -> ['he']
  // getCorporaForScope('es') -> ['es']
  // getCorporaForScope('all')-> ['es','he','gr','lxx']
  // getCorporaForScope('auto')-> decide luego; aquí devolvemos todos para que main haga su lógica.
  function getCorporaForScope(scope) {
    const s = String(scope || 'auto').toLowerCase();
    if (s === 'gr') return ['gr', 'lxx'];
    if (s === 'he') return ['he'];
    if (s === 'es') return ['es'];
    if (s === 'all') return ['es', 'he', 'gr', 'lxx'];
    return ['es', 'he', 'gr', 'lxx'];
  }

  // ---------------------------------------
  //  Equivalencias trilingües (JSON externo)
  // ---------------------------------------
  const TRI = {
    loaded: false,
    loading: null,
    byEs: new Map(), // es -> {he:Set, gr:Set}
    byHe: new Map(), // he -> Set(es)
    byGr: new Map()  // gr -> Set(es)
  };

  function _safeNormalizeEs(s) {
    s = String(s || '').trim().toLowerCase();
    try { if (typeof window.normalizeSpanish === 'function') return window.normalizeSpanish(s); } catch (_) {}
    return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }

  function _safeNormalizeHe(s) {
    s = String(s || '').trim();
    try { if (typeof window.normalizeHebrew === 'function') return window.normalizeHebrew(s); } catch (_) {}
    return s.replace(/[\u0591-\u05BD\u05BF\u05C1-\u05C2\u05C4-\u05C7]/g, '');
  }

  function _safeNormalizeGr(s) {
    s = String(s || '').trim().toLowerCase();
    try { if (typeof window.normalizeGreek === 'function') return window.normalizeGreek(s); } catch (_) {}
    return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }

  function _addEquivalence(esTerm, heTerm, grTerm) {
    const esN = _safeNormalizeEs(esTerm);
    const heN = _safeNormalizeHe(heTerm);
    const grN = _safeNormalizeGr(grTerm);

    if (esN) {
      if (!TRI.byEs.has(esN)) TRI.byEs.set(esN, { he: new Set(), gr: new Set() });
      const entry = TRI.byEs.get(esN);
      if (heN) entry.he.add(heN);
      if (grN) entry.gr.add(grN);
    }
    if (heN && esN) {
      if (!TRI.byHe.has(heN)) TRI.byHe.set(heN, new Set());
      TRI.byHe.get(heN).add(esN);
    }
    if (grN && esN) {
      if (!TRI.byGr.has(grN)) TRI.byGr.set(grN, new Set());
      TRI.byGr.get(grN).add(esN);
    }
  }

  async function loadTrilingualEquivalences(options = {}) {
    if (TRI.loaded) return TRI;
    if (TRI.loading) return TRI.loading;

    const signal = options.signal;

    TRI.loading = (async () => {
      const localUrl = './diccionario/equivalencias_trilingue.min.json';
      const rawUrl = 'https://raw.githubusercontent.com/Angelos2024/estudio/refs/heads/main/diccionario/equivalencias_trilingue.min.json';

      async function fetchJson(url) {
        const res = await fetch(url, { cache: 'no-cache', signal });
        if (!res.ok) throw new Error(`No se pudo cargar ${url} (${res.status})`);
        return await res.json();
      }

      let data;
      try {
        data = await fetchJson(localUrl);
      } catch (e1) {
        data = await fetchJson(rawUrl);
      }

      TRI.byEs.clear(); TRI.byHe.clear(); TRI.byGr.clear();

      // soporta array/objeto de varias formas
      if (Array.isArray(data)) {
        for (const row of data) {
          if (!row) continue;
          if (Array.isArray(row)) {
            const [esTerm, heTerm, grTerm] = row;
            _addEquivalence(esTerm, heTerm, grTerm);
            continue;
          }
          const esVals = row.es ?? row.espanol ?? row.spanish ?? row.ES;
          const heVals = row.he ?? row.hebreo ?? row.hebrew ?? row.HE;
          const grVals = row.gr ?? row.griego ?? row.greek ?? row.GR;
          const esList = Array.isArray(esVals) ? esVals : (esVals ? [esVals] : []);
          const heList = Array.isArray(heVals) ? heVals : (heVals ? [heVals] : []);
          const grList = Array.isArray(grVals) ? grVals : (grVals ? [grVals] : []);
          for (const esTerm of esList) {
            if (!heList.length && !grList.length) continue;
            if (!heList.length) for (const grTerm of grList) _addEquivalence(esTerm, '', grTerm);
            else if (!grList.length) for (const heTerm of heList) _addEquivalence(esTerm, heTerm, '');
            else for (const heTerm of heList) for (const grTerm of grList) _addEquivalence(esTerm, heTerm, grTerm);
          }
        }
      } else if (data && typeof data === 'object') {
        for (const [esTerm, v] of Object.entries(data)) {
          if (!v) continue;
          const heList = Array.isArray(v.he) ? v.he : (v.he ? [v.he] : (Array.isArray(v.hebreo) ? v.hebreo : (v.hebreo ? [v.hebreo] : [])));
          const grList = Array.isArray(v.gr) ? v.gr : (v.gr ? [v.gr] : (Array.isArray(v.griego) ? v.griego : (v.griego ? [v.griego] : [])));
          if (!heList.length && !grList.length) continue;
          if (!heList.length) for (const grTerm of grList) _addEquivalence(esTerm, '', grTerm);
          else if (!grList.length) for (const heTerm of heList) _addEquivalence(esTerm, heTerm, '');
          else for (const heTerm of heList) for (const grTerm of grList) _addEquivalence(esTerm, heTerm, grTerm);
        }
      }

      TRI.loaded = true;
      return TRI;
    })();

    return TRI.loading;
  }

  function getEquivalenceSearchTerms(term, lang) {
    const out = { es: [], he: [], gr: [], lxx: [] };
    const t = String(term || '').trim();
    if (!t || !TRI.loaded) return out;

    if (lang === 'es') {
      const key = _safeNormalizeEs(t);
      const entry = TRI.byEs.get(key);
      if (entry) {
        out.he = Array.from(entry.he);
        out.gr = Array.from(entry.gr);
        out.lxx = Array.from(entry.gr);
      }
      return out;
    }

    if (lang === 'he') {
      const key = _safeNormalizeHe(t);
      const esSet = TRI.byHe.get(key);
      if (esSet) out.es = Array.from(esSet);
      return out;
    }

    if (lang === 'gr' || lang === 'lxx') {
      const key = _safeNormalizeGr(t);
      const esSet = TRI.byGr.get(key);
      if (esSet) out.es = Array.from(esSet);
      return out;
    }

    return out;
  }

  // -----------------------------
  // Exponer globals esperados
  // -----------------------------
  window.detectLang = detectLang;
  window.getLanguageScope = getLanguageScope;
  window.getCorporaForScope = getCorporaForScope;
  window.loadTrilingualEquivalences = loadTrilingualEquivalences;
  window.getEquivalenceSearchTerms = getEquivalenceSearchTerms;
  window.__BX_TRILINGUAL = TRI;
})();
