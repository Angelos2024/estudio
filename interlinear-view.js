(function(){
  const HEBREW_DICT_PATH = './diccionario/diccionario_unificado.min.json';
  const GREEK_DICT_PATH = './diccionario/masterdiccionario.json';

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

  function cleanGreekDefinition(def){
    const raw = String(def || '')
      .replace(/[\u202a-\u202e\u2066-\u2069]/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    if(!raw) return '-';
    const compact = raw.split(/[.;:]/)[0].trim();
    return compact || raw || '-';
  }

  async function loadJson(path){
    const response = await fetch(path, { cache: 'force-cache' });
    if(!response.ok){
      throw new Error(`No se pudo cargar ${path} (HTTP ${response.status})`);
    }
    return response.json();
  }

  function buildHebrewMap(rows){
    const map = new Map();

    for(const row of rows || []){
      const gloss = takeFirstGloss(row?.glosas);
      const variants = new Set();
      if(row?.hebreo) variants.add(row.hebreo);
      if(row?.forma) variants.add(row.forma);
      if(Array.isArray(row?.formas)){
        for(const form of row.formas) variants.add(form);
      }

      for(const variant of variants){
        const key = normalizeToken(variant, true);
        if(!key || map.has(key)) continue;
        map.set(key, gloss);
      }
    }

    return map;
  }

  function buildGreekMap(payload){
    const map = new Map();
    const rows = Array.isArray(payload?.items) ? payload.items : [];

    for(const row of rows){
      const gloss = cleanGreekDefinition(row?.definicion);
      const variants = [row?.lemma, row?.['Forma flexionada del texto'], row?.['Forma lexica']];

      for(const variant of variants){
        const key = normalizeToken(variant, false);
        if(!key || map.has(key)) continue;
        map.set(key, gloss);
      }
    }

    return map;
  }

  async function getDictionaries(){
    if(dictionariesPromise) return dictionariesPromise;

    dictionariesPromise = Promise.all([
      loadJson(HEBREW_DICT_PATH),
      loadJson(GREEK_DICT_PATH)
    ]).then(([hebrewRows, greekPayload]) => ({
      hebrewMap: buildHebrewMap(hebrewRows),
      greekMap: buildGreekMap(greekPayload)
    }));

    return dictionariesPromise;
  }

  function splitTokens(text){
    return String(text || '')
      .replace(/\s+/g, ' ')
      .trim()
      .split(' ')
      .filter(Boolean);
  }

  function mapTokenToSpanish(token, map, isHebrew){
    const key = normalizeToken(token, isHebrew);
    if(!key) return '-';
    return map.get(key) || '-';
  }

  async function buildInterlinearRows(originalText, isGreek){
    const { hebrewMap, greekMap } = await getDictionaries();
    const dictionaryMap = isGreek ? greekMap : hebrewMap;
    const tokens = splitTokens(originalText);

    const spanish = tokens.map((token) => mapTokenToSpanish(token, dictionaryMap, !isGreek));

    return {
      originalLine: tokens.join(' '),
      spanishLine: spanish.join(' ')
    };
  }

  window.InterlinearView = {
    buildInterlinearRows
  };
})();
