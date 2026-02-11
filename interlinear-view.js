(function(){
  const HEBREW_DICT_PATH = './diccionario/diccionario_unificado.min.json';

  let dictionariesPromise = null;

  function normalizeToken(token, isHebrew){
    let clean = String(token || '').trim();
    clean = clean
      .replace(/^[\s.,;:!?¡¿()\[\]{}"'“”‘’«»·]+|[\s.,;:!?¡¿()\[\]{}"'“”‘’«»·]+$/g, '');

    if(isHebrew){
      clean = clean.replace(/[\u0591-\u05C7]/g, '');
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
function setGlossCandidate(map, key, gloss, score, usage){
    if(!key) return;
    const normalizedGloss = normalizeGloss(gloss);
    if(!normalizedGloss || normalizedGloss === '-') return;

    const prev = map.get(key);
    if(!prev || score > prev.score || (score === prev.score && usage > prev.usage)){
      map.set(key, { gloss: normalizedGloss, score, usage });
    }
  }
  function buildHebrewMap(rows){
    const map = new Map();

    for(const row of rows || []){
      const usage = Number(row?.stats?.tokens) || 0;
      const fallbackGloss = takeFirstGloss(row?.glosas || row?.glosa || row?.strong_detail?.def_rv);

      if(Array.isArray(row?.formas) && Array.isArray(row?.glosas)){
        const limit = Math.min(row.formas.length, row.glosas.length);
        for(let i = 0; i < limit; i++){
          const formKey = normalizeToken(row.formas[i], true);
          setGlossCandidate(map, formKey, row.glosas[i], 4, usage);
        }
      }

     setGlossCandidate(map, normalizeToken(row?.forma, true), row?.glosa || fallbackGloss, 3, usage);
      setGlossCandidate(map, normalizeToken(row?.hebreo, true), fallbackGloss, 2, usage);

      if(Array.isArray(row?.formas)){
        for(const form of row.formas){
          setGlossCandidate(map, normalizeToken(form, true), fallbackGloss, 1, usage);
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

      const head = remaining.match(/^([\u05D0-\u05EA][\u0591-\u05C7]*)/);
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
    dictionariesPromise = loadJson(HEBREW_DICT_PATH).then((hebrewRows) => ({
      hebrewMap: buildHebrewMap(hebrewRows)
    }));

    return dictionariesPromise;
  }


  function mapTokenToSpanish(token, map, isHebrew){
    const key = normalizeToken(token, isHebrew);
    if(!key) return '-';
    return map.get(key) || '-';
  }

 async function buildInterlinearRows(originalText){
    const { hebrewMap } = await getDictionaries();
     const tokens = splitTokens(originalText)
      .flatMap((token) => expandTokenForLookup(token, hebrewMap));
    const spanish = tokens.map((token) => mapTokenToSpanish(token, hebrewMap, true));
    return {
      originalLine: tokens.join(' '),
      spanishLine: spanish.join(' ')
    };
  }

  window.InterlinearView = {
    buildInterlinearRows
  };
})();
