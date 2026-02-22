
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

  function getCorporaForScope(scope) {
    const s = String(scope || 'auto').toLowerCase();
    if (s === 'gr') return ['gr', 'lxx'];
    if (s === 'he') return ['he'];
    if (s === 'es') return ['es'];
    if (s === 'all') return ['es', 'he', 'gr', 'lxx'];
    return ['es', 'he', 'gr', 'lxx'];
  }

  // ---------------------------------------
  //  Alias Candidates (fallback liviano)
  // ---------------------------------------
  function _normEs(s) {
    try { if (typeof window.normalizeSpanish === 'function') return window.normalizeSpanish(s); } catch (_) {}
    return String(s || '').toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }
  function _normHe(s) {
    try { if (typeof window.normalizeHebrew === 'function') return window.normalizeHebrew(s); } catch (_) {}
    return String(s || '').trim().replace(/[\u0591-\u05BD\u05BF\u05C1-\u05C2\u05C4-\u05C7]/g, '');
  }
  function _normGr(s) {
    try { if (typeof window.normalizeGreek === 'function') return window.normalizeGreek(s); } catch (_) {}
    return String(s || '').toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }

  function getAliasCandidates(term, langHint = detectLang(term)) {
    const out = { es: [], he: [], gr: [], lxx: [] };
    const raw = String(term || '').trim();
    if (!raw) return out;

    const tokens = raw.split(/\s+/).filter(Boolean);
    const tokenSet = new Set();
    if (langHint === 'he') tokens.forEach(t => tokenSet.add(_normHe(t)));
    else if (langHint === 'gr' || langHint === 'lxx') tokens.forEach(t => tokenSet.add(_normGr(t)));
    else tokens.forEach(t => tokenSet.add(_normEs(t)));

    const groups = Array.isArray(window.SEARCH_EQUIVALENCE_GROUPS) ? window.SEARCH_EQUIVALENCE_GROUPS : [];
    if (!groups.length) return out;

    const es = new Set(), he = new Set(), gr = new Set();
    for (const g of groups) {
      if (!g) continue;
      const gEs = (g.es || []).map(_normEs).filter(Boolean);
      const gHe = (g.he || []).map(_normHe).filter(Boolean);
      const gGr = (g.gr || []).map(_normGr).filter(Boolean);

      const match =
        (langHint === 'he' && gHe.some(v => tokenSet.has(v))) ||
        ((langHint === 'gr' || langHint === 'lxx') && gGr.some(v => tokenSet.has(v))) ||
        (langHint === 'es' && gEs.some(v => tokenSet.has(v)));

      if (!match) continue;

      gEs.forEach(v => es.add(v));
      gHe.forEach(v => he.add(v));
      gGr.forEach(v => gr.add(v));
    }

    out.es = Array.from(es);
    out.he = Array.from(he);
    out.gr = Array.from(gr);
    out.lxx = Array.from(gr);
    return out;
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

  function _addEquivalence(esTerm, heTerm, grTerm) {
    const esN = _normEs(esTerm);
    const heN = _normHe(heTerm);
    const grN = _normGr(grTerm);

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

  // Heurística para arrays: detecta si el orden es [es,he,gr] o [he,es,gr], etc.
  function _classifyToken(x) {
    const s = String(x || '');
    if (/[\u0590-\u05FF\uFB1D-\uFB4F]/.test(s)) return 'he';
    if (/[\u0370-\u03FF\u1F00-\u1FFF]/.test(s)) return 'gr';
    return 'es';
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
      try { data = await fetchJson(localUrl); }
      catch (e1) { data = await fetchJson(rawUrl); }

      TRI.byEs.clear(); TRI.byHe.clear(); TRI.byGr.clear();

      if (Array.isArray(data)) {
        for (const row of data) {
          if (!row) continue;

          // Caso: array => intentamos autodetectar orden
          if (Array.isArray(row)) {
            const a = row[0], b = row[1], c = row[2];
            const ca = _classifyToken(a), cb = _classifyToken(b), cc = _classifyToken(c);

            // Preferimos asignar por script (he/gr/es) si es claro
            let esTerm = '', heTerm = '', grTerm = '';
            const triples = [
              { v: a, k: ca },
              { v: b, k: cb },
              { v: c, k: cc }
            ];

            for (const t of triples) {
              if (t.k === 'he' && !heTerm) heTerm = t.v;
              else if (t.k === 'gr' && !grTerm) grTerm = t.v;
              else if (t.k === 'es' && !esTerm) esTerm = t.v;
            }

            // Si no quedó claro (por ejemplo todo es latín), usa el orden clásico [es,he,gr]
            if (!esTerm && !heTerm && !grTerm) {
              esTerm = a; heTerm = b; grTerm = c;
            } else {
              if (!esTerm) esTerm = a; // fallback suave
              if (!heTerm) heTerm = b;
              if (!grTerm) grTerm = c;
            }

            _addEquivalence(esTerm, heTerm, grTerm);
            continue;
          }

          // Caso: objeto con llaves
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
      const key = _normEs(t);
      const entry = TRI.byEs.get(key);
      if (entry) {
        out.he = Array.from(entry.he);
        out.gr = Array.from(entry.gr);
        out.lxx = Array.from(entry.gr);
      }
      return out;
    }

    if (lang === 'he') {
      const key = _normHe(t);
      const esSet = TRI.byHe.get(key);
      if (esSet) out.es = Array.from(esSet);
      return out;
    }

    if (lang === 'gr' || lang === 'lxx') {
      const key = _normGr(t);
      const esSet = TRI.byGr.get(key);
      if (esSet) out.es = Array.from(esSet);
      return out;
    }

    return out;
  }

  window.detectLang = detectLang;
  window.getLanguageScope = getLanguageScope;
  window.getCorporaForScope = getCorporaForScope;
  window.getAliasCandidates = getAliasCandidates;
  window.loadTrilingualEquivalences = loadTrilingualEquivalences;
  window.getEquivalenceSearchTerms = getEquivalenceSearchTerms;
  window.__BX_TRILINGUAL = TRI;
})();
