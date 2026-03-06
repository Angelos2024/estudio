(() => {
  const $ = id => document.getElementById(id);

  const alefatoFilesEl = $("alefatoFiles");
  const clearBtn = $("clearBtn");
  const reloadBtn = $("reloadBtn");
  const loadInfoEl = $("loadInfo");
  const queryEl = $("query");
  const searchBtn = $("searchBtn");
  const exampleBtn = $("exampleBtn");
  const resultsTbodyEl = $("resultsTbody");
  const matchTierEl = $("matchTier");
  const resultCountEl = $("resultCount");
  const diagEl = $("diag");
  const traceEl = $("trace");
  const occurrenceDonutMountEl = $("occurrenceDonutMount");
  const lemmaTagsEl = $("lemmaTags");
  const lemmaSummaryEl = $("lemmaSummary");
  const lemmaCorrespondenceEl = $("lemmaCorrespondence");
  const lemmaExamplesEl = $("lemmaExamples");
  const deepLexicalCorrespondenceEl = $("deepLexicalCorrespondence");
  const deepLexicalAnalysisEl = $("deepLexicalAnalysis");
  const resultsLoadingIndicatorEl = $("resultsLoadingIndicator");
  const resultsLoadingStageEl = $("resultsLoadingStage");

  // Compatibilidad con funciones extraídas del comparador
  const normalizeEl = $("normalize");
  const splitHyphenatedEl = $("splitHyphenated");

  // Regex y constantes (tomadas del comparador)
  const RE_HEB = /[\u0590-\u05FF]/;
  const RE_DIAC = /[\u0591-\u05BD\u05BF\u05C1-\u05C2\u05C4-\u05C7]/g;
  const RE_INVIS = /[\u200E\u200F\u202A-\u202E\u2066-\u2069\u200C\u200D\uFEFF]/g;
  const RE_PUNCT = /[׃׀״׳.,;:!?(){}\[\]<>\\"'“”‘’…/\\|+=_*~`@#$%^&]/g;
  const RE_SPACES = /[\s\u00A0]+/g;
  const PREFIX_LETTERS = new Set(["ו","ה","ב","ל","כ","מ","ש"]);
  const PREP_PREFIX_LETTERS = new Set(["ב","ל","כ"]);
  const MIN_PREFIX_LETTER = "מ";
  const CONJ_PREFIX_LETTER = "ו";

  // ===== Funciones extraídas del comparador =====
  function normalizeText(s){
    let x = String(s ?? "");
    x = x.replace(RE_INVIS, "");
    try { x = x.normalize("NFKD"); } catch(_){}
    if (splitHyphenatedEl && splitHyphenatedEl.checked) x = x.replace(/[\u05BE\-‐‑‒–—]/g, " "); // maqaf/guiones => espacio
    else x = x.replace(/\u05BE/g, " "); // maqaf => espacio
    if (normalizeEl.checked) x = x.replace(RE_DIAC, "");
    x = x.replace(RE_PUNCT, " ");
    x = x.replace(/\s+/g, " ").trim();
    return x;
  }

  function preprocessBracketPairs(line){
    // Si aparece "X [Y]", conservar Y (útil cuando hay normalización/glosa bracket)
    return String(line).replace(/(^|\s)\S+\s+\[([^\]]+)\]/g, (m, sp, inside) => sp + inside);
  }

  function tokenizeHebrew(line){
    const prepared = preprocessBracketPairs(line);
    const t = normalizeText(prepared);
    if (!t) return [];
    return t.split(RE_SPACES).filter(Boolean).filter(x => RE_HEB.test(x));
  }

  function stripLeadingHebrewMarks(s){
    return String(s || "").replace(/^[\u0591-\u05C7]+/, "");
  }

  function stripHebrewMarksAnywhere(s){
    return String(s || "").replace(/[\u0591-\u05C7]/g, "");
  }

  function pushCandidate(cands, s){
    const raw = String(s || "");
    if (!raw) return;
    cands.add(raw);
    const n = normalizeText(raw);
    if (n) cands.add(n);
    const noMarks = stripHebrewMarksAnywhere(raw);
    if (noMarks) cands.add(noMarks);
    const noMarksNorm = normalizeText(noMarks);
    if (noMarksNorm) cands.add(noMarksNorm);
  }

  function expandMorphologyCandidates(input){
    const out = new Set();
    const base = stripHebrewMarksAnywhere(String(input || ""));
    if (!base || !/[א-ת]/.test(base)) return out;

    // Función para corregir Letras Finales (Sofiyot)
    const fixFinal = (str) => {
      const map = { 'כ':'ך', 'מ':'ם', 'נ':'ן', 'פ':'ף', 'צ':'ץ' };
      const last = str[str.length-1];
      return map[last] ? str.slice(0,-1) + map[last] : str;
    };

    const push = (x) => { 
      if (x && /[א-ת]/.test(x)) {
        out.add(x); 
        const fixed = fixFinal(x);
        if(fixed !== x) out.add(fixed);

        // Inteligencia de Ortografía Plena vs Defectiva en la raíz resultante
        if (fixed.length >= 4) {
          if (fixed[fixed.length - 2] === 'ו' || fixed[fixed.length - 2] === 'י') {
            const defectiva = fixed.slice(0, -2) + fixed.slice(-1);
            out.add(defectiva);
            out.add(fixFinal(defectiva));
          }
        }
        // Inteligencia para Participios Activos
        if (fixed.length >= 4 && fixed[1] === 'ו') {
          const sinVav = fixed[0] + fixed.slice(2);
          out.add(sinVav);
          out.add(fixFinal(sinVav));
        }
      }
    };

    push(base);

    // 1. Sufijos pronominales y verbales unidos
    const suffixes = ["יהם","יהן","יכם","יכן","ינו","מו","הו","ני","נה","יה","יו","יך","יכ","כם","כן","הם","הן","נו","תם","תן","תי","ם","ן","ו","י","ך","ה","ת"];
    for (const suf of suffixes){
      if (base.length > suf.length && base.endsWith(suf)) {
        const stem = base.slice(0, -suf.length);
        if (stem.length > 1) {
          push(stem);
          if (stem.endsWith("ת")) push(stem.slice(0,-1) + "ה");
          if (stem.endsWith("י")) { 
            push(stem + "ם"); push(stem + "ים"); push(stem + "ות"); 
            push(stem.slice(0,-1) + "ה"); 
          }
          // Restauración automática si la raíz quedó en 2 letras
          if (stem.length === 2 && ["ו","ם","ן","ת","י","נה","ני","הו"].includes(suf)) {
            push(stem + "ה"); 
            push("י" + stem); 
            push("נ" + stem); 
          }
          push(stem + "ים"); push(stem + "ות");
        } else if (stem.length === 1 && ["ב","כ","ל","מ","ש","ה","ו"].includes(stem)) {
          push(stem); 
        }
      }
    }

    // 2. Constructos, plurales y femeninos
    if (base.endsWith("י") && base.length > 2){
      const stem = base.slice(0,-1);
      push(stem); push(stem + "ים"); push(stem + "ות"); push(stem + "ה");
    }
    if (base.endsWith("ת") && base.length > 2){
      const stem = base.slice(0,-1);
      push(stem); push(stem + "ה"); push(stem + "ות");
      if (!stem.includes("ו")) push(stem + "ו" + "ת");
    }
    if (base.endsWith("ים") && base.length > 3) push(base.slice(0,-2));
    if (base.endsWith("ות") && base.length > 3) {
      push(base.slice(0,-2)); push(base.slice(0,-2) + "ה");
    }
    // 3. Terminación Aramea Definitiva
    if (base.endsWith("א") && base.length > 2) {
      const stem = base.slice(0,-1);
      push(stem);
      push(stem + "ה");
    }

    return out;
  }

  function generatePureWordCandidates(tok, depth = 0, seen = new Set()){
    const IRREGULARS = {
      "ערים": "עיר", "ערי": "עיר",      
      "נשים": "אשה", "נשי": "אשה",      
      "אבות": "אב", "אבותי": "אב",      
      "בנים": "בן", "בני": "בן",        
      "בנות": "בת",                     
      "לתת": "נתן", "תת": "נתן", "תתי": "נתן",       
      "ויך": "נכה", "יך": "נכה", "ונך": "נכה",       
      "ממך": "מן", "ממנו": "מן", "ממני": "מן", 
      "מות": "מת", "מותו": "מת",
      "קח": "לקח", "קחו": "לקח", "קחי": "לקח", "קחת": "לקח", "ויקחהו": "לקח",
      "יודע": "ידע", "יודעים": "ידע", "יודעי": "ידע", "נודע": "ידע", "דע": "ידע",
      "שתחו": "שחה", "שתחוה": "שחה", "שתחוו": "שחה", "להשתחות": "שחה",
      "צא": "יצא", "צאו": "יצא", "לצאת": "יצא", "מוצא": "יצא", "יוצא": "יצא", "ויוצא": "יצא", "הוציא": "יצא", "להוציא": "יצא", "תוציא": "יצא",
      "רד": "ירד", "רדו": "ירד", "לרדת": "ירד", "יורד": "ירד", "הוריד": "ירד", "להוריד": "ירד",
      "שא": "נשא", "שאו": "נשא", "לשאת": "נשא", "שאת": "נשא",
      "קם": "קום", "וקם": "קום", "יקם": "קום", "הקים": "קום", "מקים": "קום",
      "סר": "סור", "וסר": "סור", "יסר": "סור", "הסיר": "סור", "מסיר": "סור",
      "מושיע": "ישע", "הושיע": "ישע", "להושיע": "ישע", "יושיע": "ישע", "ויושיעם": "ישע",
      "מציל": "נצל", "הציל": "נצל", "להציל": "נצל", "יציל": "נצל", "יצילנו": "נצל", "תציל": "נצל",
      "ויט": "נטה", "יט": "נטה", "ויטו": "נטה", "יטו": "נטה",
      "ויסב": "סבב", "יסב": "סבב", "סב": "סבב", "ונסב": "סבב",
      "וירץ": "רוץ", "ירץ": "רוץ", "רץ": "רוץ",
      "ויגידו": "נגד", "יגידו": "נגד", "הגידו": "נגד", "מגיד": "נגד", "תגידו": "נגד",
      "קראתו": "קרא", "לקראתו": "קרא", "לקראת": "קרא", "לקראתנו": "קרא",
      "שימו": "שום", "ישימו": "שום", "תשימו": "שום", "וישימו": "שום",
      "נורא": "ירא", "והנורא": "ירא",
      "מגיע": "נגע",
      "פה": "פה", "פיהו": "פה", "פי": "פה", "פיו": "פה", "פיך": "פה", "פיהם": "פה",
      "ויעש": "עשה", "ותעש": "עשה", "יעש": "עשה", "תעש": "עשה", "אעש": "עשה", "נעש": "עשה",
      "וירא": "ראה", "ירא": "ראה", "תרא": "ראה", "ארא": "ראה", "נרא": "ראה",
      "ויצו": "צוה", "יצו": "צוה", "ויבך": "בכה", "יבך": "בכה"
    };

    const cands = new Set();
    const raw = String(tok || "");

    if (IRREGULARS[raw]) cands.add(IRREGULARS[raw]);
    const rawNoPrefix = raw.replace(/^[והבלכמש]/, "");
    if (IRREGULARS[rawNoPrefix]) cands.add(IRREGULARS[rawNoPrefix]);

    if (!raw || depth > 3) return cands;
    if (seen.has(raw + "|" + depth)) return cands;
    seen.add(raw + "|" + depth);

    pushCandidate(cands, raw);
    for (const m of expandMorphologyCandidates(raw)) pushCandidate(cands, m);

    const m = raw.match(/^([א-ת])([\s\S]*)$/);
    if (!m) return cands;
    const first = m[1];
    let tail = stripLeadingHebrewMarks(m[2] || "");
    if (!/[א-ת]/.test(tail)) return cands;

    if (PREP_PREFIX_LETTERS.has(first)) {
      pushCandidate(cands, tail);         
      for (const m of expandMorphologyCandidates(tail)) pushCandidate(cands, m);
      pushCandidate(cands, "ה" + tail);   
      const tailNoMarks = stripHebrewMarksAnywhere(tail);
      if (/^ה[א-ת]/.test(tailNoMarks)) pushCandidate(cands, tailNoMarks.slice(1)); 
      for (const sub of generatePureWordCandidates(tail, depth + 1, seen)) cands.add(sub);
      return cands;
    }

    if (first === MIN_PREFIX_LETTER) {
      pushCandidate(cands, tail);         
      for (const m of expandMorphologyCandidates(tail)) pushCandidate(cands, m);
      pushCandidate(cands, "ה" + tail);   
      const tailNoMarks = stripHebrewMarksAnywhere(tail);
      if (/^ה[א-ת]/.test(tailNoMarks)) pushCandidate(cands, tailNoMarks.slice(1));
      for (const sub of generatePureWordCandidates(tail, depth + 1, seen)) cands.add(sub);
      return cands;
    }

    if (first === CONJ_PREFIX_LETTER) {
      pushCandidate(cands, tail); 
      for (const m of expandMorphologyCandidates(tail)) pushCandidate(cands, m);
      for (const sub of generatePureWordCandidates(tail, depth + 1, seen)) cands.add(sub);
      return cands;
    }

    const eitanAndBinyanim = new Set(["א","י","ת","נ","ה"]);
    if (eitanAndBinyanim.has(first) && tail.length >= 2) {
      pushCandidate(cands, tail);

      if (tail.startsWith("ת") && tail.length > 2) {
        pushCandidate(cands, tail.slice(1));
        for (const m of expandMorphologyCandidates(tail.slice(1))) pushCandidate(cands, m);
      }

      if (tail.length === 2 || tail.length === 3) {
         pushCandidate(cands, "נ" + tail);
         pushCandidate(cands, "י" + tail);
         pushCandidate(cands, "ה" + tail);
         if (tail.length === 2) pushCandidate(cands, tail + "ה"); 
      }

      for (const m of expandMorphologyCandidates(tail)) {
        pushCandidate(cands, m);
        if (m.length === 2) {
          pushCandidate(cands, "נ" + m); 
          pushCandidate(cands, "י" + m); 
          pushCandidate(cands, "ה" + m);
          pushCandidate(cands, m + "ה");
        }
      }
      for (const sub of generatePureWordCandidates(tail, depth + 1, seen)) cands.add(sub);
    }

    return cands;
  }

  function parseAlefatoJsonFlexible(txt){
    const s = String(txt||"").replace(/^\uFEFF/, "");
    try { return JSON.parse(s); } catch (_) {}

    const objs = [];
    let depth = 0, inStr = false, esc = false, start = -1;
    for (let i = 0; i < s.length; i++) {
      const ch = s[i];
      if (inStr) {
        if (esc) { esc = false; continue; }
        if (ch === '\\') { esc = true; continue; }
        if (ch === '"') inStr = false;
        continue;
      }
      if (ch === '"') { inStr = true; continue; }
      if (ch === '{') {
        if (depth === 0) start = i;
        depth++;
      } else if (ch === '}') {
        if (depth > 0) depth--;
        if (depth === 0 && start !== -1) {
          const frag = s.slice(start, i + 1);
          try { objs.push(JSON.parse(frag)); } catch (_) {}
          start = -1;
        }
      }
    }
    if (objs.length) return objs;

    const lines = s.split(/\r?\n/).map(x => x.trim()).filter(Boolean);
    const hebOnly = lines.filter(x => /[\u0590-\u05FF]/.test(x) && !/[\[\]{}:,]/.test(x));
    if (hebOnly.length) return hebOnly.map((h, idx) => ({ id: idx + 1, texto_hebreo: h }));

    throw new Error('JSON inválido (ni parseo normal ni rescate flexible)');
  }

  let entries = []; 
  let loadedFiles = 0;
  let loadedRemote = 0;
  let lastSearchResult = null;
  const occurrenceDonut = window.AnalisisOccurrenceDonut?.create?.(occurrenceDonutMountEl) || null;

  const ALEFATO_DATA_BASE = (window.ALEFATO_DATA_BASE || 'https://raw.githubusercontent.com/Angelos2024/estudio/main/dic/trilingue/').replace(/\/?$/, '/');
  const DEFAULT_REMOTE_FILES = [
    { book:'Génesis', category:'torah', urls:[
      `${ALEFATO_DATA_BASE}01genesis.json`,
      'https://raw.githubusercontent.com/Angelos2024/estudio/main/dic/trilingue/01genesis.json'
    ]},
    { book:'Éxodo', category:'torah', urls:[
      `${ALEFATO_DATA_BASE}02Éxodo.json`,
      'https://raw.githubusercontent.com/Angelos2024/estudio/main/dic/trilingue/02%C3%89xodo.json'
    ]},
    { book:'Levítico', category:'torah', urls:[
      `${ALEFATO_DATA_BASE}03Levítico.json`,
      'https://raw.githubusercontent.com/Angelos2024/estudio/main/dic/trilingue/03Lev%C3%ADtico.json'
    ]},
    { book:'Números', category:'torah', urls:[
      `${ALEFATO_DATA_BASE}04Números.json`,
      'https://raw.githubusercontent.com/Angelos2024/estudio/main/dic/trilingue/04N%C3%BAmeros.json'
    ]},
    { book:'Deuteronomio', category:'torah', urls:[
      `${ALEFATO_DATA_BASE}05Deuteronomio.json`,
      'https://raw.githubusercontent.com/Angelos2024/estudio/main/dic/trilingue/05Deuteronomio.json'
    ]}
  ];

  const indexExact = new Map();       
  const indexNorm = new Map();        
  const indexNoVowels = new Map();    

  function nfc(s) {
    try { return String(s ?? "").normalize("NFC"); } catch(_) { return String(s ?? ""); }
  }

  function addToIndex(map, key, idx) {
    if (!key) return;
    let arr = map.get(key);
    if (!arr) { arr = []; map.set(key, arr); }
    arr.push(idx);
  }

  function isPrefixToken(tok){
    const letters = (String(tok).match(/[א-ת]/g) || []);
    if (!letters.length || letters.length > 2) return false;
    return letters.every(ch => PREFIX_LETTERS.has(ch));
  }

  function addTokenAndComposites(tokens, outSet){
    const add = (x) => {
      const v = nfc(String(x || '').trim());
      if (!v) return;
      outSet.add(v);
      const compact = nfc(v.replace(/[\s־\-‐‑‒–—]+/g, ''));
      if (compact && compact !== v) outSet.add(compact);
    };

    for (let i=0; i<tokens.length; i++){
      const t0 = tokens[i];
      if (!t0) continue;
      add(t0);
      const t1 = tokens[i+1];
      const t2 = tokens[i+2];
      if (isPrefixToken(t0) && t1) add(t0 + t1);
      if (t1) add(t0 + t1);
      if (isPrefixToken(t0) && isPrefixToken(t1) && t2) {
        add(t0 + t1 + t2);
        add(t0 + (t1 + t2));
      }
      if (isPrefixToken(t0) && t1 && t2) {
        add(t0 + t1 + t2);
        add(t1 + t2);
      }
    }
  }

  function buildHebrewAliases(rawText) {
    const aliases = new Set();
    const raw = nfc(String(rawText || '').trim());
    if (!raw) return aliases;
    aliases.add(raw);
    const compactRaw = nfc(raw.replace(/[\s־\-‐‑‒–—]+/g, ''));
    if (compactRaw && compactRaw !== raw) aliases.add(compactRaw);
    const toks = tokenizeHebrew(raw);
    if (toks.length) addTokenAndComposites(toks, aliases);
    const noMarksRaw = nfc(stripHebrewMarksAnywhere(raw));
    if (noMarksRaw) aliases.add(noMarksRaw);
    const normRaw = nfc(normalizeText(raw));
    if (normRaw) aliases.add(normRaw);
    return aliases;
  }

  function clearIndexes() {
    indexExact.clear();
    indexNorm.clear();
    indexNoVowels.clear();
  }

  function rebuildIndexes() {
    clearIndexes();
    entries.forEach((e, i) => {
      e.heExactKey = nfc(e.he);
      e.heNormKey = normalizeText(e.he);
      e.heNoVowelsKey = normalizeText(stripHebrewMarksAnywhere(e.he));
      addToIndex(indexExact, e.heExactKey, i);
      addToIndex(indexNorm, e.heNormKey, i);
      addToIndex(indexNoVowels, e.heNoVowelsKey, i);

      const aliases = buildHebrewAliases(e.he);
      for (const a of aliases) {
        const aExact = nfc(a);
        const aNorm = normalizeText(a);
        const aNoV = normalizeText(stripHebrewMarksAnywhere(a));
        addToIndex(indexExact, aExact, i);
        addToIndex(indexNorm, aNorm, i);
        addToIndex(indexNoVowels, aNoV, i);
      }
    });
  }

  function isObj(x) { return x && typeof x === 'object' && !Array.isArray(x); }

  function pickSpanish(obj) {
    if (!obj || typeof obj !== 'object') return '';
    const cands = Array.isArray(obj.candidatos) ? obj.candidatos : [];
    const cand1 = cands.length ? String(cands[0] ?? '').trim() : '';
    const eq = [
      obj.equivalencia_espanol,
      obj['equivalencia_español'],
      obj.equivalencia,
      obj.espanol,
      obj['español']
    ].find(v => typeof v === 'string' && v.trim());
    return cand1 || (typeof eq === 'string' ? eq.trim() : '');
  }

  function pickHebrew(obj) {
    if (!obj || typeof obj !== 'object') return '';
    const keys = ['texto_hebreo','hebreo','forma_hebrea','forma','lemma','lexema','word','token'];
    for (const k of keys) {
      const v = obj[k];
      if (typeof v === 'string' && RE_HEB.test(v)) return v.trim();
    }
    return '';
  }

  function collectAlefatoEntries(node, sourceName, out, seenObjects = new WeakSet()) {
    if (node == null) return;
    if (Array.isArray(node)) {
      for (const item of node) collectAlefatoEntries(item, sourceName, out, seenObjects);
      return;
    }
    if (!isObj(node)) return;
    if (seenObjects.has(node)) return;
    seenObjects.add(node);

    const he = pickHebrew(node);
    if (he) {
      const es = pickSpanish(node);
      out.push({ he: nfc(he), es: es || '', source: sourceName });
    }

    for (const v of Object.values(node)) {
      if (Array.isArray(v) || isObj(v)) collectAlefatoEntries(v, sourceName, out, seenObjects);
    }
  }

  function dedupeEntries(list) {
    const seen = new Set();
    const out = [];
    for (const e of list) {
      const key = `${e.he}\u0000${e.es}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(e);
    }
    return out;
  }

  function renderLoadInfo() {
    const hebCount = entries.length;
    loadInfoEl.textContent = `Fuentes listas: ${loadedFiles.toLocaleString()} · remotas: ${loadedRemote.toLocaleString()} · entradas deduplicadas: ${hebCount.toLocaleString()}`;
    searchBtn.disabled = hebCount === 0;
  }

  function setTierBadge(text, ok=false) {
    matchTierEl.textContent = text;
    matchTierEl.className = 'badge ' + (ok ? 'ok' : 'warn');
  }

  function escapeHtml(s) {
    return String(s ?? '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  }

  const ES_PRON_SUFFIX_RULES = [
    { suf:'יהם', poss:'de ellos', kind:'post' },
    { suf:'יהן', poss:'de ellas', kind:'post' },
    { suf:'יכם', poss:'vuestro/a(s)', kind:'pre' },
    { suf:'יכן', poss:'vuestra(s)', kind:'pre' },
    { suf:'ינו', poss:'nuestro/a(s)', kind:'pre' },
    { suf:'יה',  poss:'su', kind:'pre' },
    { suf:'יו',  poss:'su', kind:'pre' },
    { suf:'יך',  poss:'tu', kind:'pre' },
    { suf:'יכ',  poss:'tu', kind:'pre' },
    { suf:'כם',  poss:'vuestro/a(s)', kind:'pre' },
    { suf:'כן',  poss:'vuestra(s)', kind:'pre' },
    { suf:'הם',  poss:'de ellos', kind:'post' },
    { suf:'הן',  poss:'de ellas', kind:'post' },
    { suf:'נו',  poss:'nuestro/a(s)', kind:'pre' },
    { suf:'תי',  poss:'mi', kind:'pre' },
    { suf:'ני',  poss:'me', kind:'obj' },
    { suf:'מו',  poss:'de ellos', kind:'post' }, 
    { suf:'הו',  poss:'lo/su', kind:'obj_or_poss' },
    { suf:'ם',   poss:'de ellos', kind:'post', low:true },
    { suf:'ן',   poss:'de ellas', kind:'post', low:true },
    { suf:'ו',   poss:'su', kind:'pre', low:true },
    { suf:'י',   poss:'mi', kind:'pre', low:true },
    { suf:'ך',   poss:'tu', kind:'pre', low:true },
    { suf:'ה',   poss:'su', kind:'pre', low:true }
  ];

  const ES_SPECIAL_FORM_ENHANCERS = new Map([
    ['בטרם', (es) => {
      const t = normalizeSpanishSpaces(es || '');
      if (!t) return t;
      if (/^antes(?:\s+de)?$/i.test(t)) return /de$/i.test(t) ? t : (t + ' de');
      if (/^antes\b/i.test(t) && !/\bde\b/i.test(t)) return t + ' de';
      return t;
    }]
  ]);

  function normalizeSpanishSpaces(s) {
    return String(s || '').replace(/\s+/g, ' ').trim();
  }

  function hasHiddenArticle(queryRaw, prefixLetter) {
    if (!queryRaw || !['ב','כ','ל'].includes(prefixLetter)) return false;
    const regex = new RegExp(prefixLetter + '[\u0591-\u05BD\u05BF\u05C1-\u05C2\u05C4-\u05C7]*([\u05B7\u05B8])');
    const match = String(queryRaw).match(regex);
    return match !== null;
  }

  function validateMinPreposition(queryRaw) {
    if (!queryRaw) return { ok: false };
    const cleanQ = String(queryRaw).replace(/[\u200e\u200f\u202a-\u202e\u2066-\u2069\u200c\u200d\ufeff\s]/g, "");
    if (!cleanQ.startsWith('מ')) return { ok: false };
    if (/^מ[֑-ֽֿׁ-ׇ]*ֵ[֑-ֽֿׁ-ׇ]*[אהחער]/.test(cleanQ)) return { ok: true, rule: 'ALARGAMIENTO_COMPENSATORIO' };
    if (/^מ[֑-ֽֿׁ-ׇ]*ִ[֑-ֽֿׁ-ׇ]*[א-ת][֑-ֽֿׁ-ׇ]*ּ/.test(cleanQ)) return { ok: true, rule: 'ASIMILACION_FUERTE' };
    if (/^מ[֑-ֽֿׁ-ׇ]*ִ[֑-ֽֿׁ-ׇ]*[חה]/.test(cleanQ)) return { ok: true, rule: 'DUPLICACION_VIRTUAL' };
    return { ok: false };
  }

  function validateVavConjunction(queryRaw) {
    if (!queryRaw) return { ok: false };
    const cleanQ = String(queryRaw).replace(/[\u200e\u200f\u202a-\u202e\u2066-\u2069\u200c\u200d\ufeff\s]/g, "");
    if (!cleanQ.startsWith('ו')) return { ok: false };
    if (/^ו[֑-ֻֽֿׁ-ׇ]*ּ/.test(cleanQ)) return { ok: true, rule: 'SHUREK_ANTE_LABIAL_O_SHEVA' };
    if (/^ו[֑-ֽֿׁ-ׇ]*ְ/.test(cleanQ)) return { ok: true, rule: 'VAV_DEFAULT_SHEVA' };
    if (/^ו[֑-ֽֿׁ-ׇ]*[ֶַָ]/.test(cleanQ)) return { ok: true, rule: 'VAV_ANTE_CHATEF_O_TONICA' };
    return { ok: false };
  }

  function stripSpanishLeadingArticle(es) {
    return String(es || '').replace(/^(el|la|los|las|un|una|unos|unas)\s+/i, '').trim();
  }

  function spanishHasPossessive(es, poss) {
    const t = normalizeSpanishSpaces(es).toLowerCase();
    const p = String(poss || '').toLowerCase();
    return !!(t && p && t.includes(p));
  }

  function compactHebrewWithMarks(s) {
    return nfc(String(s || '').replace(/[\s־\-‐‑‒–—]+/g, ''));
  }

  function compactHebrewNoMarks(s) {
    return normalizeText(stripHebrewMarksAnywhere(compactHebrewWithMarks(s)));
  }

  function renderPrefixGloss(prefixLetters, opts = {}) {
    const letters = Array.isArray(prefixLetters) ? prefixLetters.slice() : [];
    const suppressArticle = !!opts.suppressArticle;
    const queryRaw = opts.queryRaw || ''; 
    if (!letters.length) return '';

    const out = [];
    let i = 0;

    if (letters[i] === 'ו') {
      out.push('y');
      i++;
    }

    while (i < letters.length) {
      const cur = letters[i];
      const next = letters[i+1];

      if ((cur === 'ב' || cur === 'כ' || cur === 'ל' || cur === 'מ' || cur === 'ש') && next === 'ה') {
        if (cur === 'ב') out.push(suppressArticle ? 'en' : 'en el/la');
        else if (cur === 'ל') out.push(suppressArticle ? 'a/para' : 'al/la');
        else if (cur === 'כ') out.push(suppressArticle ? 'como' : 'como el/la');
        else if (cur === 'מ') out.push(suppressArticle ? 'de/desde' : 'del/de la');
        else if (cur === 'ש') out.push(suppressArticle ? 'que' : 'que el/la');
        i += 2;
        continue;
      }

      const isHiddenArticle = hasHiddenArticle(queryRaw, cur);

      if (cur === 'ב') out.push((isHiddenArticle && !suppressArticle) ? 'en el/la' : 'en');
      else if (cur === 'כ') out.push((isHiddenArticle && !suppressArticle) ? 'como el/la' : 'como');
      else if (cur === 'ל') out.push((isHiddenArticle && !suppressArticle) ? 'al/la' : 'a/para');
      else if (cur === 'מ') out.push('de/desde');
      else if (cur === 'ש') out.push('que');
      else if (cur === 'ה') { if (!suppressArticle) out.push('el/la'); }
      else if (cur === 'ו') out.push('y');
      i++;
    }

    return normalizeSpanishSpaces(out.join(' '));
  }

  function tryMatchCoreToLemma(core, lemmaNo) {
    core = String(core || '');
    lemmaNo = String(lemmaNo || '');
    if (!core || !lemmaNo) return null;
    if (core === lemmaNo) return { kind:'exact', score: 100 };
    if ((core + 'ה') === lemmaNo) return { kind:'restore-he', score: 108 };
    if ((core + 'ת') === lemmaNo) return { kind:'restore-tav', score: 96 };
    if (lemmaNo.endsWith('ה') && core === lemmaNo.slice(0,-1)) return { kind:'core-minus-he', score: 106 };
    if (lemmaNo.endsWith('ת') && core === lemmaNo.slice(0,-1)) return { kind:'core-minus-tav', score: 94 };
    if (lemmaNo.endsWith('ים') && core === lemmaNo.slice(0,-2)) return { kind:'core-minus-im', score: 90 };
    if (lemmaNo.endsWith('ות') && core === lemmaNo.slice(0,-2)) return { kind:'core-minus-ot', score: 90 };
    return null;
  }

  function parseCandidatePrefixes(prefixStr) {
    const s = String(prefixStr || '');
    if (!s) return { letters: [], ok: true };
    const letters = [...s];
    if (letters.some(ch => !'ובכלמשה'.includes(ch))) return { letters: [], ok: false };
    return { letters, ok: true };
  }

  function analyzeAffixCompositionForEntry(entry, queryRaw) {
    const qNo = compactHebrewNoMarks(queryRaw);
    const lNo = compactHebrewNoMarks(entry?.he || '');
    if (!qNo || !lNo) return null;

    if (qNo === lNo) {
      return { qNo, lNo, prefixes: [], suffix: null, coreMatch:{kind:'exact', score:100}, exact:true };
    }

    let best = null;
    const maxPrefix = Math.min(4, Math.max(0, qNo.length - 1));

    const suffixCandidates = [null, ...ES_PRON_SUFFIX_RULES];

    for (const sfx of suffixCandidates) {
      const suf = sfx ? sfx.suf : '';
      if (suf && !qNo.endsWith(suf)) continue;
      const qMinusSuffix = suf ? qNo.slice(0, -suf.length) : qNo;

      for (let pLen = 0; pLen <= maxPrefix; pLen++) {
        if (qMinusSuffix.length - pLen < 2) continue;
        const prefixStr = qMinusSuffix.slice(0, pLen);
        const core = qMinusSuffix.slice(pLen);
        const pref = parseCandidatePrefixes(prefixStr);
        if (!pref.ok) continue;

        const coreMatch = tryMatchCoreToLemma(core, lNo);
        if (!coreMatch) continue;

        let score = coreMatch.score;
        score += pref.letters.length * 2;
        if (sfx) score += (sfx.low ? 1 : 4);

        if (hasHebrewMarks(queryRaw)) {
          if (pref.letters.includes('מ')) {
             const minPhonetics = validateMinPreposition(queryRaw);
             if (minPhonetics.ok) score += 15; 
             else score -= 20; 
          }
          if (pref.letters.includes('ו')) {
             const vavPhonetics = validateVavConjunction(queryRaw);
             if (vavPhonetics.ok) score += 12; 
             else score -= 15; 
          }
        } else {
           if (pref.letters.includes('ו')) score -= 1;
        }

        const cand = { qNo, lNo, prefixes: pref.letters, suffix: sfx || null, core, coreMatch, exact:false, score };
        if (!best || cand.score > best.score) best = cand;
      }
    }
    return best;
  }

  function applySuffixPossessiveToSpanish(baseEs, suffixRule) {
    const es0 = normalizeSpanishSpaces(baseEs || '');
    if (!suffixRule || !es0) return es0;
    if (suffixRule.kind === 'obj' || suffixRule.kind === 'obj_or_poss') return es0;
    if (spanishHasPossessive(es0, suffixRule.poss)) return es0;
    if (suffixRule.kind === 'pre') {
      const naked = stripSpanishLeadingArticle(es0) || es0;
      return normalizeSpanishSpaces(`${suffixRule.poss} ${naked}`);
    }
    if (suffixRule.kind === 'post') {
      return normalizeSpanishSpaces(`${es0} ${suffixRule.poss}`);
    }
    return es0;
  }

  function applySpecialSpanishEnhancers(qNo, lNo, es) {
    const fn = ES_SPECIAL_FORM_ENHANCERS.get(qNo) || ES_SPECIAL_FORM_ENHANCERS.get(lNo);
    if (!fn) return normalizeSpanishSpaces(es);
    try { return normalizeSpanishSpaces(fn(es)); } catch { return normalizeSpanishSpaces(es); }
  }

  function composeSpanishGlossForDisplay(entry, queryRaw) {
    const baseEs = normalizeSpanishSpaces(entry?.es || '');
    if (!baseEs) return '—';

    const queryPart = String(queryRaw || '').trim();
    if (!queryPart || !RE_HEB.test(queryPart)) return baseEs;

    const analysis = analyzeAffixCompositionForEntry(entry, queryPart);
    const qNo = compactHebrewNoMarks(queryPart);
    const lNo = compactHebrewNoMarks(entry?.he || '');

    let outEs = applySpecialSpanishEnhancers(qNo, lNo, baseEs);

    if (!analysis) return outEs;

    const suffixRule = analysis.suffix && !analysis.suffix.low ? analysis.suffix : analysis.suffix;
    if (suffixRule) outEs = applySuffixPossessiveToSpanish(outEs, suffixRule);

    const suppressArticle = !!(suffixRule && suffixRule.kind === 'pre'); 
    const prefGloss = renderPrefixGloss(analysis.prefixes || [], { suppressArticle, queryRaw: queryPart });
    if (prefGloss) {
      if (!(qNo === 'בטרם' && /\bantes de\b/i.test(outEs) && (analysis.prefixes || []).includes('ב'))) {
        outEs = normalizeSpanishSpaces(`${prefGloss} ${outEs}`);
      }
    }

    return outEs || baseEs;
  }

  function buildDisplayResults(items, rawQuery) {
    const out = [];
    const seen = new Set();
    for (const e of (items || [])) {
      if (!e) continue;
      const qPart = e._queryPart || rawQuery || '';
      const esDisplay = composeSpanishGlossForDisplay(e, qPart);
      const row = { ...e, es: esDisplay };
      const k = `${row.he || ''}\u0000${row.es || ''}`;
      if (seen.has(k)) continue;
      seen.add(k);
      out.push(row);
    }
    return out;
  }

  function renderResults(items, rawQuery = '') {
    const displayItems = buildDisplayResults(items, rawQuery);
    if (!displayItems || !displayItems.length) {
      resultsTbodyEl.innerHTML = '<tr><td colspan="2" class="muted">Sin resultados.</td></tr>';
      return;
    }
    resultsTbodyEl.innerHTML = displayItems.map(e => {
      // Indicador visual en caso de que sea compuesto/parte
      const marker = e._queryPart ? 'data-partial="true"' : '';
      return `\n<tr ${marker}><td class="he">${escapeHtml(e.he)}</td><td class="es">${escapeHtml(e.es || '—')}</td></tr>`;
    }).join('');
  }

  function getEntriesFromIndices(indices) {
    const seen = new Set();
    const out = [];
    for (const idx of indices) {
      if (seen.has(idx)) continue;
      seen.add(idx);
      out.push(entries[idx]);
    }
    out.sort((a,b) => a.he.localeCompare(b.he, 'he') || a.es.localeCompare(b.es, 'es'));
    return out;
  }

  function extractHebrewQuerySpan(s) {
    const txt = String(s || '');
    const m = txt.match(/[֐-׿][֐-׿\s־\-‐‑‒–—]*/);
    if (!m) return '';
    return nfc(String(m[0]).trim());
  }

  function buildQueryForms(rawInput) {
    const span = extractHebrewQuerySpan(rawInput) || nfc(String(rawInput || '').trim());
    const aliases = buildHebrewAliases(span);
    const exactKeys = uniqueSortedShort([...aliases].map(x => nfc(x)).filter(Boolean), 500);
    const normKeys = uniqueSortedShort([...aliases].map(x => normalizeText(x)).filter(Boolean), 500);
    const noVKeys = uniqueSortedShort([...aliases].map(x => normalizeText(stripHebrewMarksAnywhere(x))).filter(Boolean), 500);
    const tokens = tokenizeHebrew(span);
    return { span, tokens, exactKeys, normKeys, noVKeys };
  }

  function uniqueSortedShort(arr, limit=120) {
    const seen = new Set();
    const out = [];
    for (const x of arr) {
      const k = String(x || '');
      if (!k || seen.has(k)) continue;
      seen.add(k);
      out.push(k);
      if (out.length >= limit) break;
    }
    out.sort((a,b)=>a.length-b.length || a.localeCompare(b,'he'));
    return out;
  }

  function collectByIndexKey(map, keys) {
    const idxs = [];
    for (const key of keys) {
      const arr = map.get(key);
      if (!arr) continue;
      for (const idx of arr) idxs.push(idx);
    }
    return idxs;
  }

  function hebLettersOnly(s) {
    return String(stripHebrewMarksAnywhere(String(s || ''))).replace(/[^א-ת]/g, '');
  }

  function hasHebrewMarks(s) {
    return /[\u0591-\u05C7]/.test(String(s || ''));
  }

  function preferMarkedEntriesIfQueryHasMarks(items, queryHasMarks) {
    const arr = Array.isArray(items) ? items : [];
    if (!queryHasMarks || !arr.length) return arr;
    const marked = arr.filter(e => hasHebrewMarks(e?.he));
    return marked.length ? marked : arr;
  }

  const STRICT_PREFIX_LETTERS = new Set(['ו','ב','כ','ל','ה','ש','א','י','ת','נ']);
  const STRICT_SUFFIXES = [
    'יהם','יהן','יכם','יכן','ינו','תם','תן','תי','יה','יו','יך','יכ','כם','כן','הם','הן',
    'נו','מו','הו','ני','נה','ים','ות','ם','ן','ו','י','ך','ה','ת'
  ];

  function addScoredMorphCandidate(scoreMap, cand, score) {
    const raw = hebLettersOnly(cand);
    if (!raw || raw.length < 1) return;
    const norm = normalizeText(raw);
    const prev = scoreMap.get(norm);
    if (prev == null || score > prev) scoreMap.set(norm, score);
  }

  function addStrictSuffixHeuristics(seedNo, scoreMap, prefixPenalty = 0) {
    for (const suf of STRICT_SUFFIXES) {
      if (!(seedNo.length > suf.length) || !seedNo.endsWith(suf)) continue;
      const stem = seedNo.slice(0, -suf.length);
      if (!stem) continue;

      addScoredMorphCandidate(scoreMap, stem, 78 - prefixPenalty);

      if (stem.length >= 2 && stem.endsWith('ת')) {
        addScoredMorphCandidate(scoreMap, stem.slice(0, -1) + 'ה', 99 - prefixPenalty);
      }

      if (stem.length >= 3 && ['י','יך','יכ','יו','יה','יהם','יהן','יכם','יכן','כם','כן','הם','הן','ני','נו','תם','תן','תי'].includes(suf)) {
        addScoredMorphCandidate(scoreMap, stem + 'ה', 92 - prefixPenalty);
      }

      if (suf === 'ים' && stem.length >= 2) {
        addScoredMorphCandidate(scoreMap, stem, 90 - prefixPenalty);
      }
      if (suf === 'ות' && stem.length >= 2) {
        addScoredMorphCandidate(scoreMap, stem, 88 - prefixPenalty);
        addScoredMorphCandidate(scoreMap, stem + 'ה', 89 - prefixPenalty);
      }
    }
  }

  function buildStrictMorphScoreMap(rawSpan, q) {
    const scoreMap = new Map();
    const seedSet = new Set();

    for (const t of (q?.tokens || [])) {
      const h = hebLettersOnly(t);
      if (h) seedSet.add(h);
    }
    const compactSeed = hebLettersOnly(String(rawSpan || '').replace(/[\s־\-‐‑‒–—]+/g, ''));
    if (compactSeed) seedSet.add(compactSeed);
    for (const alias of (q?.exactKeys || [])) {
      if (/[\s־\-‐‑‒–—]/.test(alias)) continue;
      const h = hebLettersOnly(alias);
      if (h) seedSet.add(h);
    }

    const processed = new Set();
    function processSeed(seedNo, opts = {}) {
      const s = hebLettersOnly(seedNo);
      if (!s || processed.has(`${s}|${opts.prefixPenalty||0}`)) return;
      processed.add(`${s}|${opts.prefixPenalty||0}`);

      const prefixPenalty = Number(opts.prefixPenalty || 0);

      addScoredMorphCandidate(scoreMap, s, 60 - prefixPenalty);
      addStrictSuffixHeuristics(s, scoreMap, prefixPenalty);

      for (const cand of expandMorphologyCandidates(s)) {
        const c = hebLettersOnly(cand);
        if (!c) continue;
        let score = 74 - prefixPenalty;

        if (c[0] === s[0]) score += 8;
        if (s.startsWith(c) && s.length > c.length) score += 6;

        if (s.endsWith('תי') && c === s.slice(0, -2) + 'ה') score = 100 - prefixPenalty;
        else if (s.endsWith('תי') && c === s.slice(0, -2)) score = 86 - prefixPenalty;

        addScoredMorphCandidate(scoreMap, c, score);
      }
    }

    for (const s of seedSet) {
      processSeed(s, { prefixPenalty: 0 });

      if (s.length >= 3 && STRICT_PREFIX_LETTERS.has(s[0])) {
        processSeed(s.slice(1), { prefixPenalty: 14 });

        if (s.length >= 4 && STRICT_PREFIX_LETTERS.has(s[1])) {
          processSeed(s.slice(2), { prefixPenalty: 24 });
        }
      }
    }

    return scoreMap;
  }

  function collectTopMorphMatches(scoreMap, qNorm, qNoVowels) {
    const matched = [];
    for (const [normKey, score] of scoreMap.entries()) {
      if (!normKey) continue;
      const idxs = indexNorm.get(normKey);
      if (!idxs || !idxs.length) continue;
      matched.push({ normKey, score, idxs });
    }
    if (!matched.length) return { matches: [], debug: [] };

    matched.sort((a,b) => b.score - a.score || b.normKey.length - a.normKey.length || a.normKey.localeCompare(b.normKey, 'he'));
    const topScore = matched[0].score;

    const keep = matched.filter(m => m.score === topScore);
    const idxSet = new Set();
    for (const m of keep) for (const idx of m.idxs) idxSet.add(idx);

    let candidates = getEntriesFromIndices([...idxSet]);

    if (candidates.length > 1) {
      const qNo = hebLettersOnly(qNoVowels || '');
      const scoredEntries = candidates.map(e => {
        const heNo = hebLettersOnly(e.he);
        let s = 0;
        if (qNo && heNo && qNo[0] === heNo[0]) s += 3;
        if (qNo && heNo && qNo.startsWith(heNo)) s += 2;
        if (qNo && heNo && heNo.endsWith('ה')) s += 1; 
        s += heNo.length * 0.01;
        return { e, s };
      });
      scoredEntries.sort((a,b) => b.s - a.s);
      const best = scoredEntries[0].s;
      candidates = scoredEntries.filter(x => x.s === best).map(x => x.e);
    }

    return {
      matches: candidates,
      debug: matched.slice(0, 20).map(m => `${m.normKey}:${m.score}`)
    };
  }

  // Ahora esta función maneja la búsqueda unitaria (completa/literal)
  function searchHebrewWordSingle(rawInput) {
    const q = buildQueryForms(rawInput);
    const rawSpan = q.span;
    const rawToken = q.tokens[0] || rawSpan;
    const qNorm = q.normKeys[0] || normalizeText(rawSpan);
    const qNoVowels = q.noVKeys[0] || normalizeText(stripHebrewMarksAnywhere(rawSpan));
    const queryHasMarks = hasHebrewMarks(rawSpan);

    const trace = [];
    trace.push(`Consulta original: ${rawInput || ''}`);
    trace.push(`Filtro 1a (exacto literal): Buscando forma precisa...`);

    if (!rawSpan || !RE_HEB.test(rawSpan)) {
      return { ok:false, tier:'Sin token hebreo', matches:[], trace, diag:'No se detectó una palabra hebrea.' };
    }

    const rawExactIdxs = collectByIndexKey(indexExact, [nfc(rawSpan)]);
    if (rawExactIdxs.length) {
      const rawExactMatches = preferMarkedEntriesIfQueryHasMarks(getEntriesFromIndices(rawExactIdxs), queryHasMarks);
      trace.push(`Filtro 1a: ${rawExactMatches.length} coincidencia(s).`);
      return { ok:true, tier:'Filtro 1: exacto tal cual', matches:rawExactMatches, trace, diag:'Se encontró coincidencia exacta.' };
    }

    const exactIdxs = collectByIndexKey(indexExact, q.exactKeys);
    if (exactIdxs.length) {
      let exactMatches = getEntriesFromIndices(exactIdxs);
      exactMatches = preferMarkedEntriesIfQueryHasMarks(exactMatches, queryHasMarks);
      trace.push(`Filtro 1b: ${exactMatches.length} coincidencia(s).`);
      return { ok:true, tier:'Filtro 1: exacto compuesto', matches:exactMatches, trace, diag:'Coincidencia exacta (compuesta).' };
    }

    if (q.normKeys.length) {
      const normIdxs = collectByIndexKey(indexNorm, q.normKeys);
      if (normIdxs.length) {
        let normMatches = getEntriesFromIndices(normIdxs);
        normMatches = preferMarkedEntriesIfQueryHasMarks(normMatches, queryHasMarks);
        trace.push(`Filtro 2 (normalizado): ${normMatches.length} coincidencia(s).`);
        return { ok:true, tier:'Filtro 2: exacto normalizado', matches:normMatches, trace, diag:'Coincidencia por normalización.' };
      }
    }

    const strictMorphScoreMap = buildStrictMorphScoreMap(rawSpan, q);
    if (qNorm) strictMorphScoreMap.delete(qNorm);
    if (rawToken) strictMorphScoreMap.delete(normalizeText(hebLettersOnly(rawToken)));
    if (rawSpan) strictMorphScoreMap.delete(normalizeText(hebLettersOnly(rawSpan)));

    const strictMorphKeys = uniqueSortedShort([...strictMorphScoreMap.keys()], 1200);
    if (strictMorphKeys.length) {
      const morphTop = collectTopMorphMatches(strictMorphScoreMap, qNorm, qNoVowels);
      if (morphTop.matches.length) {
        trace.push(`Filtro 3 (morfológico): ${morphTop.matches.length} coincidencia(s).`);
        return { ok:true, tier:'Filtro 3: morfológico', matches:morphTop.matches, trace, diag:'Coincidencia morfológica.' };
      }
    }

    const rootNoVowelsKeys = uniqueSortedShort([
      ...q.noVKeys,
      ...strictMorphKeys.map(k => normalizeText(stripHebrewMarksAnywhere(k)))
    ].filter(Boolean), 1200);
    if (rootNoVowelsKeys.length) {
      const noVIdxs = collectByIndexKey(indexNoVowels, rootNoVowelsKeys);
      if (noVIdxs.length) {
        trace.push(`Filtro 4 (sin vocales): ${noVIdxs.length} coincidencia(s).`);
        return { ok:true, tier:'Filtro 4: raíz sin vocales', matches:getEntriesFromIndices(noVIdxs), trace, diag:'Coincidencia por consonantes sin vocales.' };
      }
    }

    return { ok:false, tier:'Sin resultados', matches:[], trace, diag:'No hubo coincidencias tras los 4 filtros.' };
  }

  function hasCompoundConnector(span) {
    return /[־\-‐‑‒–—]/.test(String(span || ''));
  }

  function compactHebrewNoVowels(s) {
    return normalizeText(stripHebrewMarksAnywhere(String(s || '').replace(/[\s־\-‐‑‒–—]+/g, '')));
  }

  const KNOWN_LEXICALIZED_COMPOUND_SPLITS = (() => {
    const raw = [
      ['בארשבע', ['באר', 'שבע']],
      ['באר-שבע', ['באר', 'שבע']],
      ['ביתספר', ['בית', 'ספר']],
      ['בןאדם', ['בן', 'אדם']],
      ['קריתארבע', ['קרית', 'ארבע']],
      ['ביתאל', ['בית', 'אל']],
      ['ביתלחם', ['בית', 'לחם']]
    ];
    const m = new Map();
    for (const [whole, parts] of raw) {
      const k = compactHebrewNoVowels(whole);
      const normParts = (parts || []).map(compactHebrewNoVowels).filter(Boolean);
      if (!k || normParts.length < 2) continue;
      if (!m.has(k)) m.set(k, []);
      m.get(k).push(normParts);
    }
    return m;
  })();

  function scoreCompoundSplit(parts, wholeKey) {
    const lens = parts.map(p => p.length);
    const minLen = Math.min(...lens);
    const maxLen = Math.max(...lens);
    const diff = maxLen - minLen;
    const joined = parts.join('');
    const joinedPenalty = (joined === wholeKey ? 0 : 5);
    const shortPenalty = lens.reduce((acc, n) => acc + (n < 2 ? 20 : 0), 0);
    const oneLetterPenalty = lens.reduce((acc, n) => acc + (n === 1 ? 100 : 0), 0);
    const partsPenalty = (parts.length - 2) * 4;
    return oneLetterPenalty + shortPenalty + partsPenalty + diff + joinedPenalty;
  }

  function dedupeSplitPlans(plans) {
    const seen = new Set();
    const out = [];
    for (const p of (plans || [])) {
      const parts = Array.isArray(p?.parts) ? p.parts.map(String).filter(Boolean) : [];
      if (parts.length < 2) continue;
      const key = parts.join('+');
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({
        kind: p.kind || 'heuristic',
        parts,
        score: Number.isFinite(p.score) ? p.score : 999
      });
    }
    out.sort((a,b) => {
      const kindRank = (x) => x.kind === 'known' ? 0 : 1;
      return kindRank(a) - kindRank(b) || a.score - b.score || a.parts.length - b.parts.length;
    });
    return out;
  }

  function findLexicalizedCompoundPlans(rawSpan) {
    const plans = [];
    const wholeKey = compactHebrewNoVowels(rawSpan);
    if (!wholeKey || wholeKey.length < 4) return plans;

    const known = KNOWN_LEXICALIZED_COMPOUND_SPLITS.get(wholeKey) || [];
    for (const parts of known) {
      plans.push({ kind:'known', parts, score: scoreCompoundSplit(parts, wholeKey) });
    }

    const wholeExists = indexNoVowels.has(wholeKey);

    for (let i = 2; i <= wholeKey.length - 2; i++) {
      const a = wholeKey.slice(0, i);
      const b = wholeKey.slice(i);
      if (a.length < 2 || b.length < 2) continue;
      if (!indexNoVowels.has(a) || !indexNoVowels.has(b)) continue;
      if (wholeExists && !known.length) continue; 
      const parts = [a, b];
      plans.push({ kind:'heuristic', parts, score: scoreCompoundSplit(parts, wholeKey) });
    }

    if (wholeKey.length >= 6) {
      for (let i = 2; i <= wholeKey.length - 4; i++) {
        for (let j = i + 2; j <= wholeKey.length - 2; j++) {
          const a = wholeKey.slice(0, i);
          const b = wholeKey.slice(i, j);
          const c = wholeKey.slice(j);
          if (a.length < 2 || b.length < 2 || c.length < 2) continue;
          if (!indexNoVowels.has(a) || !indexNoVowels.has(b) || !indexNoVowels.has(c)) continue;
          if (wholeExists && !known.length) continue;
          const parts = [a, b, c];
          plans.push({ kind:'heuristic', parts, score: scoreCompoundSplit(parts, wholeKey) + 3 });
        }
      }
    }

    return dedupeSplitPlans(plans).slice(0, 8);
  }

  function resolveBySeparatedParts(parts, rawSpan, label, options = {}) {
    const requireAllParts = options.requireAllParts !== false; 
    const allMatches = [];
    const partsTrace = [];
    const partsFound = [];
    const partsMissing = [];

    for (const part of (parts || [])) {
      const sub = searchHebrewWordSingle(part);
      partsTrace.push(`\n[Parte: ${part}]`);
      partsTrace.push(...sub.trace);
      
      if (sub.ok && sub.matches.length) {
        allMatches.push(...sub.matches.map(m => ({ ...m, _queryPart: part })));
        partsFound.push(`${part} → ${sub.tier} (${sub.matches.length})`);
      } else {
        partsMissing.push(part);
      }
    }

    if (requireAllParts && partsMissing.length) {
      return null;
    }

    const merged = dedupeResultEntries(allMatches);
    if (!merged.length) return null;

    const trace = [
      `${label}: ${rawSpan}`,
      `Se divide en partes: ${parts.join(' + ')}`,
      ...(partsFound.length ? [`Partes con resultado: ${partsFound.join(' | ')}`] : []),
      ...(partsMissing.length ? [`Partes sin resultado: ${partsMissing.join(' | ')}`] : []),
      ...partsTrace
    ];

    return {
      ok: true,
      tier: 'Compuesto segmentado',
      matches: merged,
      trace,
      diag: `Se dividió el término en ${parts.length} componente(s) para su búsqueda separada.`
    };
  }

  function dedupeResultEntries(list) {
    const seen = new Set();
    const out = [];
    for (const e of (list || [])) {
      if (!e) continue;
      const k = `${e.he || ''}\u0000${e.es || ''}`;
      if (seen.has(k)) continue;
      seen.add(k);
      out.push(e);
    }
    out.sort((a,b) => String(a.he||'').localeCompare(String(b.he||''), 'he') || String(a.es||'').localeCompare(String(b.es||''), 'es'));
    return out;
  }

  // ===== NUEVO FLUJO PRINCIPAL DE BÚSQUEDA =====
  function searchHebrewWord(rawInput) {
    const q = buildQueryForms(rawInput);
    const rawSpan = q.span;

    if (!rawSpan || !RE_HEB.test(rawSpan)) {
      return searchHebrewWordSingle(rawInput);
    }

    // 1. PRIMER INTENTO: Literal / Completo (Respeta checkboxes del usuario)
    const fullMatch = searchHebrewWordSingle(rawInput);
    if (fullMatch.ok && fullMatch.matches.length > 0) {
      return fullMatch;
    }

    // 2. SEGUNDO INTENTO: Segmentación automática por fallo
    // Si hay un guion (maqaf) o espacio, forzamos la división aunque no esté marcado el check.
    const hasConnector = hasCompoundConnector(rawSpan) || rawSpan.includes(' ');
    
    if (hasConnector) {
      // Obtenemos los tokens divididos (limpios de conectores)
      const parts = rawSpan.split(/[\s־\-‐‑‒–—]+/).filter(Boolean);
      
      if (parts.length >= 2) {
        const resParts = resolveBySeparatedParts(parts, rawSpan, 'Segmentación automática por falta de unidad completa', { 
          requireAllParts: false 
        });
        
        if (resParts && resParts.matches.length > 0) {
          // Inyectamos una bandera para identificar que es un resultado combinado
          resParts._isCompound = true;
          return resParts;
        }
      }
    }

    // 3. Respaldo para compuestos lexicalizados sin guion (ej. בארשבע)
    if (!hasConnector && q.tokens.length === 1) {
      const plans = findLexicalizedCompoundPlans(rawSpan);
      if (plans.length) {
        for (const plan of plans) {
          const resParts = resolveBySeparatedParts(plan.parts, rawSpan, `Lexicalizado (${plan.kind})`, { requireAllParts:true });
          if (resParts) {
            resParts._isCompound = true;
            return resParts;
          }
        }
      }
    }

    return fullMatch; // Si nada funcionó, devolvemos el fallo original
  }

  async function handleFiles(fileList) {
    const files = Array.from(fileList || []);
    if (!files.length) return;

    const collected = [];
    let okFiles = 0;
    const errs = [];

    for (const f of files) {
      try {
        const txt = await f.text();
        const data = parseAlefatoJsonFlexible(txt);
        const tmp = [];
        collectAlefatoEntries(data, f.name, tmp);
        if (!tmp.length) throw new Error('No se detectaron objetos con texto hebreo');
        collected.push(...tmp);
        okFiles++;
      } catch (e) {
        errs.push(`${f.name}: ${e?.message || e}`);
      }
    }

    if (collected.length) {
      entries = dedupeEntries(entries.concat(collected));
      loadedFiles += okFiles;
      rebuildIndexes();
    }

    renderLoadInfo();

    if (errs.length) {
      diagEl.textContent = 'Errores de carga en algunos archivos: ' + errs.join(' | ');
    } else if (collected.length) {
      diagEl.textContent = `Carga correcta: +${collected.length.toLocaleString()} entradas detectadas (antes de deduplicar).`;
    }
  }

  function escapeAttr(s) {
    return String(s ?? '').replace(/"/g, '&quot;');
  }

  function setLoadingState(on, label = 'Cargando análisis.') {
    if (resultsLoadingIndicatorEl) resultsLoadingIndicatorEl.hidden = !on;
    if (resultsLoadingStageEl) resultsLoadingStageEl.hidden = !on;
    if (resultsLoadingStageEl && on) {
      const textNode = resultsLoadingStageEl.querySelector('.fw-semibold');
      if (textNode) textNode.textContent = label;
    }
  }

  function sourceLabel(source) {
    const raw = String(source || '');
    const clean = raw.split('/').pop() || raw;
    return clean.replace(/\.json$/i, '').replace(/[_-]+/g, ' ');
  }

  function uniqueNonEmpty(arr, limit = 8) {
    const seen = new Set();
    const out = [];
    for (const item of arr || []) {
      const val = String(item || '').trim();
      if (!val || seen.has(val)) continue;
      seen.add(val);
      out.push(val);
      if (out.length >= limit) break;
    }
    return out;
  }

  function updateDonutFromEntries(scopeEntries) {
    if (!occurrenceDonut) return;
    const list = Array.isArray(scopeEntries) && scopeEntries.length ? scopeEntries : entries;
    const counter = new Map();
    for (const e of list) {
      const key = sourceLabel(e?.source || 'base');
      const prev = counter.get(key) || { book: key, label: key, count: 0 };
      prev.count += 1;
      counter.set(key, prev);
    }
    const rows = [...counter.values()];
    occurrenceDonut.setData({
      es: rows,
      he: rows,
      gr: []
    });
  }

  function renderLemmaTags(tags) {
    if (!lemmaTagsEl) return;
    const list = Array.isArray(tags) ? tags.filter(Boolean) : [];
    lemmaTagsEl.innerHTML = list.length
      ? list.map(t => `<span class="mini-pill">${escapeHtml(t)}</span>`).join('')
      : '<span class="mini-pill">Sin etiquetas</span>';
  }

  function renderLemmaCorrespondence(matches) {
    if (!lemmaCorrespondenceEl) return;
    const trans = uniqueNonEmpty((matches || []).map(m => m.es), 6);
    lemmaCorrespondenceEl.innerHTML = trans.length
      ? trans.map((t, i) => `<div class="corr-card"><div class="corr-card-title">Correspondencia ${i+1}</div><div>${escapeHtml(t)}</div></div>`).join('')
      : '<div class="corr-card"><div class="corr-card-title">Correspondencia</div><div>—</div></div>';
  }

  function renderLemmaExamples(matches) {
    if (!lemmaExamplesEl) return;
    const examples = uniqueNonEmpty((matches || []).map(m => m.he), 6);
    lemmaExamplesEl.innerHTML = examples.length
      ? examples.map((t, i) => `<div class="example-card"><div class="example-card-title">Forma hebrea ${i+1}</div><div class="hebrew">${escapeHtml(t)}</div></div>`).join('')
      : '<div class="example-card"><div class="example-card-title">Ejemplo</div><div>—</div></div>';
  }

  function renderDeepAnalysis(res, rawQuery) {
    if (!deepLexicalAnalysisEl) return;
    const qSpan = extractHebrewQuerySpan(rawQuery) || rawQuery || '—';
    const first = (res?.matches || [])[0] || null;
    const matchSources = uniqueNonEmpty((res?.matches || []).map(m => sourceLabel(m.source)), 8);
    
    // Lógica para glosa sugerida combinada (ej: "Todo + Pueblo")
    let glossValue = first?.es || '—';
    if (res?._isCompound) {
      const matches = res.matches || [];
      const uniqueParts = [...new Set(matches.map(m => m._queryPart).filter(Boolean))];
      const combinedGloss = uniqueParts.map(part => {
        const bestForPart = matches.find(m => m._queryPart === part);
        return bestForPart ? (bestForPart.es.split('(')[0].trim()) : '';
      }).filter(Boolean).join(' + ');
      
      if (combinedGloss) glossValue = combinedGloss;
    }

    const cards = [
      { label:'Consulta introducida', value:qSpan || '—' },
      { label:'Forma normalizada', value:normalizeText(qSpan) || '—' },
      { label:'Coincidencia principal', value: res?._isCompound ? 'Análisis por partes segmentadas' : (first?.he || '—') },
      { label:'Glosa sugerida', value: glossValue },
      { label:'Nivel de filtro', value:res?.tier || '—' },
      { label:'Resultados', value:String((res?.matches || []).length || 0) },
      { label:'Fuentes', value:matchSources.join(' · ') || '—' },
      { label:'Sin vocales', value:normalizeText(stripHebrewMarksAnywhere(qSpan)) || '—' }
    ];
    
    deepLexicalAnalysisEl.innerHTML = cards.map(card => `
      <article class="metric-card">
        <div class="label">${escapeHtml(card.label)}</div>
        <div class="value ${(card.label !== 'Glosa sugerida' && card.label !== 'Coincidencia principal' && /[א-ת]/.test(card.value)) ? 'hebrew' : ''}">${escapeHtml(card.value)}</div>
      </article>
    `).join('');
  }

  function updateAnalysisPanels(res, rawQuery) {
    const matches = res?.matches || [];
    const first = matches[0] || null;
    const qSpan = extractHebrewQuerySpan(rawQuery) || rawQuery || '';
    renderLemmaTags([
      `Filtro: ${res?.tier || '—'}`,
      `Resultados: ${matches.length}`,
      qSpan ? `Consulta: ${qSpan}` : '',
      first?.source ? `Fuente: ${sourceLabel(first.source)}` : ''
    ]);
    if (lemmaSummaryEl) {
      lemmaSummaryEl.textContent = first
        ? `La búsqueda se resolvió con ${matches.length} coincidencia(s).`
        : 'No se encontraron coincidencias para la consulta actual.';
    }
    if (deepLexicalCorrespondenceEl) {
      const firstEs = first?.es || '—';
      deepLexicalCorrespondenceEl.textContent = `Correspondencias idiomáticas: Filtro aplicado → ${res?.tier || '—'}`;
    }
    renderLemmaCorrespondence(matches);
    renderLemmaExamples(matches);
    renderDeepAnalysis(res, rawQuery);
    updateDonutFromEntries(matches.length ? matches : entries);
  }

  async function fetchFirstAvailable(urls) {
    let lastError = null;
    for (const url of (urls || [])) {
      try {
        const resp = await fetch(url, { cache: 'no-store' });
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const txt = await resp.text();
        return { url, text: txt };
      } catch (err) {
        lastError = err;
      }
    }
    throw lastError || new Error('Sin URL disponible');
  }

  async function loadRemoteSources() {
    setLoadingState(true, 'Cargando base remota.');
    diagEl.textContent = 'Cargando diccionario desde el repositorio…';
    const sources = Array.isArray(window.ALEFATO_REMOTE_FILES) && window.ALEFATO_REMOTE_FILES.length
      ? window.ALEFATO_REMOTE_FILES
      : DEFAULT_REMOTE_FILES;

    entries = [];
    loadedFiles = 0;
    loadedRemote = 0;
    clearIndexes();

    const collected = [];
    const errs = [];

    for (const src of sources) {
      try {
        const fetched = await fetchFirstAvailable(src.urls || []);
        const data = parseAlefatoJsonFlexible(fetched.text);
        const tmp = [];
        collectAlefatoEntries(data, src.book || fetched.url, tmp);
        if (!tmp.length) throw new Error('No se detectaron objetos con texto hebreo');
        for (const row of tmp) {
          row.source = src.book || fetched.url;
          collected.push(row);
        }
        loadedFiles += 1;
        loadedRemote += 1;
      } catch (e) {
        errs.push(`${src.book || 'fuente'}: ${e?.message || e}`);
      }
    }

    if (collected.length) {
      entries = dedupeEntries(collected);
      rebuildIndexes();
    }

    renderLoadInfo();
    updateDonutFromEntries(entries);

    if (errs.length && !entries.length) {
      diagEl.textContent = 'No se pudo cargar el diccionario del repositorio. Revisa las rutas de los JSON.';
      traceEl.textContent = errs.join('\n');
      setTierBadge('Sin base remota', false);
    } else if (errs.length) {
      diagEl.textContent = `Base parcial cargada. Fallaron ${errs.length} libro(s).`;
      traceEl.textContent = errs.join('\n');
      setTierBadge('Base parcial', true);
    } else {
      diagEl.textContent = `Diccionario cargado correctamente con ${entries.length.toLocaleString()} entradas deduplicadas.`;
      traceEl.textContent = 'Carga automática completada.';
      setTierBadge('Base lista', true);
    }

    setLoadingState(false);
  }

  function doSearch() {
    if (!entries.length) {
      setTierBadge('Sin base cargada', false);
      diagEl.textContent = 'La base aún no está disponible. Intenta recargar el diccionario.';
      updateAnalysisPanels({ ok:false, tier:'Sin base cargada', matches:[], diag:'La base aún no está disponible.', trace:['Sin base cargada.'] }, queryEl.value);
      return;
    }
    setLoadingState(true, 'Construyendo análisis léxico.');
    const res = searchHebrewWord(queryEl.value);
    lastSearchResult = res;
    renderResults(res.matches, queryEl.value);
    resultCountEl.textContent = `${res.matches.length.toLocaleString()} resultado(s)`;
    setTierBadge(res.tier, !!res.ok);
    diagEl.textContent = res.diag;
    traceEl.textContent = res.trace.join('\n');
    setLoadingState(false);
  }

  function clearAll() {
    renderResults([]);
    lastSearchResult = null;
    setTierBadge(entries.length ? 'Base lista' : 'Sin búsqueda', !!entries.length);
    resultCountEl.textContent = '0 resultados';
    diagEl.textContent = entries.length ? 'Resultados limpiados. La base permanece cargada.' : 'Base limpiada.';
    traceEl.textContent = '—';
    queryEl.value = '';
    updateAnalysisPanels({ ok:false, tier:'Sin búsqueda', matches:[], diag:'Resultados limpiados.', trace:['—'] }, '');
    updateDonutFromEntries(entries);
  }

  clearBtn?.addEventListener('click', clearAll);
  reloadBtn?.addEventListener('click', loadRemoteSources);
  searchBtn?.addEventListener('click', doSearch);
  exampleBtn?.addEventListener('click', () => { queryEl.value = 'כָּל-עַם'; doSearch(); });
  queryEl?.addEventListener('keydown', (e) => { if (e.key === 'Enter') doSearch(); });

  normalizeEl?.addEventListener('change', () => { if (entries.length) rebuildIndexes(); if (queryEl.value.trim()) doSearch(); });
  splitHyphenatedEl?.addEventListener('change', () => { if (entries.length) rebuildIndexes(); if (queryEl.value.trim()) doSearch(); });

  renderLoadInfo();
  updateAnalysisPanels({ ok:false, tier:'Esperando consulta', matches:[], diag:'Esperando consulta.', trace:['—'] }, '');
  updateDonutFromEntries([]);
  searchBtn.disabled = true;
  loadRemoteSources();
})();