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
      const gloss = takeFirstGloss(row?.glosa || row?.glosas);
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



  async function getDictionaries(){
    if(dictionariesPromise) return dictionariesPromise;
    dictionariesPromise = loadJson(HEBREW_DICT_PATH).then((hebrewRows) => ({
      hebrewMap: buildHebrewMap(hebrewRows)
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

 async function buildInterlinearRows(originalText){
    const { hebrewMap } = await getDictionaries();
    const tokens = splitTokens(originalText);
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
