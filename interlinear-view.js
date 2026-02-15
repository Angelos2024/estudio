(function(){
  const HEBREW_DICT_PATH = './diccionario/diccionario_unificado.min.json';
    const GREEK_DICT_PATH = './diccionario/diccionarioG_unificado.min.json';

  let dictionariesPromise = null;

  function normalizeToken(token, isHebrew, isGreek = false){
    let clean = String(token || '').trim();
     // Quita primero marcas invisibles para que no bloqueen la limpieza de puntuación final/inicial.
    clean = clean.replace(/[\u200c-\u200f\u202a-\u202e\u2066-\u2069\ufeff]/g, '');
    clean = clean
 .replace(/^[\s.,;:!?¡¿()\[\]{}"'“”‘’«»··;᾽᾿ʼʹʽ\-‐‑‒–—―]+|[\s.,;:!?¡¿()\[\]{}"'“”‘’«»··;᾽᾿ʼʹʽ\-‐‑‒–—―]+$/g, '');
    clean = clean.replace(/[\u200c-\u200f\u202a-\u202e\u2066-\u2069\ufeff]/g, '');    
    
    if(isHebrew){
      clean = clean.replace(/[\u0591-\u05AF\u05B0-\u05BC\u05BD\u05BF\u05C1-\u05C2\u05C7]/g, '');
      clean = clean.replace(/[\u05BE\u05C0\u05C3\u05C6\u05F3\u05F4]/g, '');
    }

     if(isGreek){
      clean = clean.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    }
    
    return clean.toLowerCase();
  }

  function takeFirstGloss(value){
    if(!value) return '-';
    if(Array.isArray(value)){
      const first = value.find((item) => String(item || '').trim());
      return first ? String(first).trim() : '-';
    }
    return String(value).trim() || '-';
  }
function normalizeGloss(gloss){
    const clean = String(gloss || '').replace(/\s+/g, ' ').trim();
    if(!clean) return '-';
    return clean;
  }
 

  async function loadJson(path){
    const response = await fetch(path, { cache: 'force-cache' });
    if(!response.ok){
      throw new Error(`No se pudo cargar ${path} (HTTP ${response.status})`);
    }
    return response.json();
  }
function setGlossCandidate(map, key, gloss, score, usage, exactLemmaMatch = false){
  if(!key) return;
    const normalizedGloss = normalizeGloss(gloss);
    if(!normalizedGloss || normalizedGloss === '-') return;
      const prev = map.get(key);

   if(
      !prev ||
      score > prev.score ||
      (score === prev.score && Number(exactLemmaMatch) > Number(prev.exactLemmaMatch)) ||
      (score === prev.score && exactLemmaMatch === prev.exactLemmaMatch && usage > prev.usage)
    ){
      map.set(key, { gloss: normalizedGloss, score, usage, exactLemmaMatch });
    }
  }
  function buildHebrewMap(rows){
    const map = new Map();

    for(const row of rows || []){
      const usage = Number(row?.stats?.tokens) || 0;
      const fallbackGloss = takeFirstGloss(row?.glosas || row?.glosa || row?.strong_detail?.def_rv);
      const normalizedLemma = normalizeToken(row?.hebreo, true);
      if(Array.isArray(row?.formas) && Array.isArray(row?.glosas)){
        const limit = Math.min(row.formas.length, row.glosas.length);
        for(let i = 0; i < limit; i++){
          const formKey = normalizeToken(row.formas[i], true);
          setGlossCandidate(map, formKey, row.glosas[i], 4, usage, formKey === normalizedLemma);
        }
      }

    const primaryFormKey = normalizeToken(row?.forma, true);
     setGlossCandidate(map, primaryFormKey, row?.glosa || fallbackGloss, 3, usage, primaryFormKey === normalizedLemma);
      setGlossCandidate(map, normalizedLemma, fallbackGloss, 2, usage, true);

      if(Array.isArray(row?.formas)){
        for(const form of row.formas){
          const formKey = normalizeToken(form, true);
          setGlossCandidate(map, formKey, fallbackGloss, 1, usage, formKey === normalizedLemma);
        }
      }
    }

    const plainMap = new Map();
    for(const [key, value] of map.entries()){
      plainMap.set(key, value.gloss);
    }

    return plainMap;
  }

  function buildGreekMap(rows){
    const map = new Map();

    for(const row of rows || []){
       if(Array.isArray(row)){
        const lemma = normalizeToken(row[0], false, true);
        const gloss = takeFirstGloss(row[1]);
        setGlossCandidate(map, lemma, gloss, 2, 0, true);
        continue;
      }

      if(!row || typeof row !== 'object') continue;
      const usage = Number(row?.stats?.tokens) || 0;
      const fallbackGloss = takeFirstGloss(row?.glosas || row?.glosa || row?.strong_detail?.def_rv);
      const normalizedLemma = normalizeToken(row?.griego, false, true);

      if(Array.isArray(row?.formas) && Array.isArray(row?.glosas)){
        const limit = Math.min(row.formas.length, row.glosas.length);
        for(let i = 0; i < limit; i++){
          const formKey = normalizeToken(row.formas[i], false, true);
          setGlossCandidate(map, formKey, row.glosas[i], 4, usage, formKey === normalizedLemma);
        }
      }

      const primaryFormKey = normalizeToken(row?.forma, false, true);
      setGlossCandidate(map, primaryFormKey, row?.glosa || fallbackGloss, 3, usage, primaryFormKey === normalizedLemma);
      setGlossCandidate(map, normalizedLemma, fallbackGloss, 2, usage, true);

      if(Array.isArray(row?.formas)){
        for(const form of row.formas){
          const formKey = normalizeToken(form, false, true);
          setGlossCandidate(map, formKey, fallbackGloss, 1, usage, formKey === normalizedLemma);
        }
      }

      if(Array.isArray(row?.griegos)){
        for(const variant of row.griegos){
          const variantKey = normalizeToken(variant, false, true);
          setGlossCandidate(map, variantKey, fallbackGloss, 1, usage, variantKey === normalizedLemma);
        }
      }
    }

    const plainMap = new Map();
    for(const [key, value] of map.entries()){
      plainMap.set(key, value.gloss);
    }

    return plainMap;
  }
  function splitTokens(text){
    return String(text || '')
      .replace(/[\u05BE]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .split(' ')
      .filter(Boolean);
  }

  function splitHebrewPrefixClusters(token, map){
    const parts = [];
    let remaining = String(token || '');
    const prefixLetters = new Set(['ו', 'ב', 'כ', 'ל', 'מ', 'ה', 'ש']);

    while(remaining){
      const matches = remaining.match(/[\u05D0-\u05EA]/g) || [];
      if(matches.length <= 1 || parts.length >= 2) break;

      if(map && map.has(normalizeToken(remaining, true))) break;

const head = remaining.match(/^([\u05D0-\u05EA][\u0591-\u05AF\u05B0-\u05BC\u05BD\u05BF\u05C1-\u05C2\u05C7]*)/);
      if(!head) break;

      const baseLetter = head[1].charAt(0);
      if(!prefixLetters.has(baseLetter)) break;
      if(map && !map.has(normalizeToken(head[1], true))) break;

      parts.push(head[1]);
      remaining = remaining.slice(head[1].length);
    }

    if(parts.length === 0) return [token];
    if(remaining) parts.push(remaining);
    return parts;
  }

  function expandTokenForLookup(token, map){
    const directKey = normalizeToken(token, true);
    if(map.has(directKey)) return [token];

    const segmented = splitHebrewPrefixClusters(token, map);
    return segmented.length > 1 ? segmented : [token];
  }



  async function getDictionaries(){
    if(dictionariesPromise) return dictionariesPromise;
    dictionariesPromise = Promise.all([
      loadJson(HEBREW_DICT_PATH),
      loadJson(GREEK_DICT_PATH)
    ]).then(([hebrewRows, greekRows]) => ({
      hebrewMap: buildHebrewMap(hebrewRows),
      greekMap: buildGreekMap(greekRows)
    }));

    return dictionariesPromise;
  }


  function mapTokenToSpanish(token, map, isHebrew, isGreek = false){
    const key = normalizeToken(token, isHebrew, isGreek);
    if(!key) return '-';
    return map.get(key) || '-';
  }

async function buildInterlinearRows(originalText, options = {}){
    const { isGreek = false } = options;
    const { hebrewMap, greekMap } = await getDictionaries();
    const targetMap = isGreek ? greekMap : hebrewMap;
    const tokens = splitTokens(originalText)
     .flatMap((token) => (isGreek ? [token] : expandTokenForLookup(token, hebrewMap)));
const spanish = tokens.map((token) => mapTokenToSpanish(token, targetMap, !isGreek, isGreek));
    return {
      tokens,
      spanishTokens: spanish,
      originalLine: tokens.join(' '),
      spanishLine: spanish.join(' ')
    };
  }

  window.InterlinearView = {
    buildInterlinearRows
  };
})();
