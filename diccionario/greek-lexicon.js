/* diccionario/greek-lexicon.js
   - Palabras griegas clickeables (popup lemma/translit)
   - NO interfiere con click derecho (subrayar/comentar)
   - Evita loop/freeze del MutationObserver (debounce + flags)
   - Carga el JSON correcto según ?book=
   - Si no hay JSON del libro: restaura texto plano (sin spans)
*/
(function () {
  var DICT_DIR = './';
var ABBR_CHAPTERS = {
  mt: 28,
  mk: 16,
  lk: 24,
  jn: 21,
  ac: 28,
  ro: 16,
  '1co': 16,
  '2co': 13,
  ga: 6,

  eph: 6,
  php: 4,
  col: 4,
  '1th': 5,
  '2th': 3,
  '1ti': 6,
  '2ti': 4,
  tit: 3,
   phm: 1,
  heb: 13,
  jas: 5,
  '1pe': 5,
  '2pe': 3,
  '1jn': 5,
  '2jn': 1,
  '3jn': 1,
  jud: 1,
  re: 22
};


  // ?book=...  -> abbr de archivo (abbr-morphgnt.translit.json)
  // Agrega aquí más slugs si los usas en tu proyecto.
  var BOOK_SLUG_TO_ABBR = {
    // Evangelios
    'mateo': 'mt', 'mt': 'mt', 'matt': 'mt', 'matthew': 'mt',
    'marcos': 'mk', 'mc': 'mk', 'mk': 'mk', 'mark': 'mk',
    'lucas': 'lk', 'lc': 'lk', 'lk': 'lk', 'luke': 'lk',
    'juan': 'jn', 'jn': 'jn', 'john': 'jn',

    // Hechos / Romanos / Corintios / Gálatas
    'hechos': 'ac', 'actos': 'ac', 'ac': 'ac', 'acts': 'ac',
    'romanos': 'ro', 'ro': 'ro', 'rom': 'ro', 'romans': 'ro',
    '1corintios': '1co', '1co': '1co', '1cor': '1co', '1corinthians': '1co',
    '2corintios': '2co', '2co': '2co', '2cor': '2co', '2corinthians': '2co',
    'galatas': 'ga', 'gálatas': 'ga', 'ga': 'ga', 'gal': 'ga', 'galatians': 'ga',
      'efesios': 'eph', 'eph': 'eph', 'ephesians': 'eph',

  // Filipenses
  'filipenses': 'php', 'php': 'php', 'philippians': 'php',

  // Colosenses
  'colosenses': 'col', 'col': 'col', 'colossians': 'col',

  // 1 Tesalonicenses
 '1tesalonicenses': '1th',
  '2tesalonicenses': '2th',
  '1timoteo': '1ti',
  '2timoteo': '2ti',

  // abreviaturas opcionales
  '1th': '1th', '2th': '2th',
  '1ti': '1ti', '2ti': '2ti',

  // Tito
  'tito': 'tit', 'tit': 'tit', 'titus': 'tit',
      // ✅ Filemón
  'filemon': 'phm', 'filemón': 'phm', 'phm': 'phm', 'philemon': 'phm',

  // ✅ Hebreos
  'hebreos': 'heb', 'heb': 'heb', 'hebrews': 'heb',

  // ✅ Santiago
  'santiago': 'jas', 'jas': 'jas', 'james': 'jas',

  // ✅ 1–2 Pedro
  '1pedro': '1pe', '2pedro': '2pe',
  '1pe': '1pe', '2pe': '2pe',
  '1peter': '1pe', '2peter': '2pe',

  // ✅ 1–3 Juan
  '1juan': '1jn', '2juan': '2jn', '3juan': '3jn',
  '1jn': '1jn', '2jn': '2jn', '3jn': '3jn',
  '1john': '1jn', '2john': '2jn', '3john': '3jn',

  // ✅ Judas
  'judas': 'jud', 'jud': 'jud', 'jude': 'jud',

  // ✅ Apocalipsis
  'apocalipsis': 're', 'apocalípsis': 're',
  'revelacion': 're', 'revelación': 're',
  're': 're', 'rev': 're', 'revelation': 're'
  };

  var morphKey = null;  // abbr cargada (mt/mk/...)
  var morphMap = null;  // map: "ch:v" => tokens[]
  var observing = false;
  var decorating = false;
  var scheduled = false;
  var scheduleTimer = null;

   function setLexDebug(msg) {
  var el = document.getElementById('gk-lex-debug');
  if (!el) {
    el = document.createElement('div');
    el.id = 'gk-lex-debug';
    el.style.cssText =
      'position:fixed;left:10px;bottom:10px;z-index:99999;' +
      'background:rgba(0,0,0,.75);color:#fff;padding:6px 10px;' +
      'border-radius:10px;font:12px/1.2 system-ui;max-width:60vw';
    document.body.appendChild(el);
  }
  el.textContent = msg;
}
function normalizeTranslit(tr) {
  if (tr == null) return '';

  tr = String(tr);

  // 1) eliminar puntuación adyacente (coma, punto, etc.)
  tr = tr.replace(/[.,;:·]/g, '');

  // 2) normalizar upsilon en diptongos
  tr = tr
    .replace(/ay/g, 'au').replace(/Ay/g, 'Au')
    .replace(/ey/g, 'eu').replace(/Ey/g, 'Eu')
    .replace(/oy/g, 'ou').replace(/Oy/g, 'Ou');

  return tr;
}

  // -------------------- utils --------------------
function normalizeSlug(s) {
  s = (s || '').toLowerCase().trim();
  s = s.replace(/[_-]+/g, ' ');   // ✅ nuevo: "_" y "-" como espacios
  s = s.replace(/\s+/g, ' ');
  return s;
}


  function slugToAbbr(slug) {
    slug = normalizeSlug(slug);
    if (!slug) return null;

    // "1 juan" -> "1juan" (por si luego lo usas)
    slug = slug.replace(/^([123])\s+/, '$1');
    slug = slug.replace(/\s+/g, '');

    if (Object.prototype.hasOwnProperty.call(BOOK_SLUG_TO_ABBR, slug)) {
      return BOOK_SLUG_TO_ABBR[slug];
    }
    return null;
  }

  function getMorphUrl(abbr) {
    return DICT_DIR + abbr + '-morphgnt.translit.json';
  }

function getBookSlug() {
  var qs = window.location.search || '';
  if (!qs) return '';
  if (qs.charAt(0) === '?') qs = qs.slice(1);

  var parts = qs.split('&');
  for (var i = 0; i < parts.length; i++) {
    var kv = parts[i].split('=');
    var k = decodeURIComponent(kv[0] || '');

    var v = (kv[1] || '').replace(/\+/g, ' ');
    v = decodeURIComponent(v);

    if (k === 'book') return (v || '').toLowerCase();
  }
  return '';
}


  // -------------------- build index (robusto, sin rangos hardcodeados) --------------------
  // Lee MorphGNT translit JSON:
  //   { book: 'Mt', chapters: [ null|array, null|array, ... ] }
  //
  // En tu formato, cada "segmento" real es un array grande donde:
  //   idx = chapter*100 + (verse-1)
  //   chapter = floor(idx/100)
  //   verse   = (idx % 100) + 1
  //
  // Construimos: map["ch:v"] = tokens[]
function buildMorphIndex(data, abbr) {
  var segs = [];

  function chunkSlotsToSegs(slots) {
    var CHUNK = 1000; // 10 capítulos * 100 versos “slots”
    for (var i = 0; i < slots.length; i += CHUNK) {
      segs.push(slots.slice(i, i + CHUNK));
    }
  }

  function countArrayItems(a, maxCheck) {
    var c = 0;
    for (var i = 0; i < a.length && i < maxCheck; i++) if (Array.isArray(a[i])) c++;
    return c;
  }

  // Caso A: JSON como arreglo plano
  if (Array.isArray(data)) {
    chunkSlotsToSegs(data);
  }
  // Caso B: JSON como {chapters:[...]}
  else if (data && Array.isArray(data.chapters)) {
    var ch = data.chapters;

    // B1) "Slots directos": chapters es enorme y contiene MUCHOS versos sueltos (Mateo, etc.)
    //     Ej: chapters.length > 1000 y hay bastantes entries que ya son arrays (versos).
    if (ch.length > 1000 && countArrayItems(ch, Math.min(ch.length, 5000)) > 20) {
      chunkSlotsToSegs(ch);
    } else {
      // B2) "Segmento anidado": chapters es pequeño/mediano pero trae 1 array grande dentro (1Pe, etc.)
      //     Ej: la mayoría son null y solo 1 posición es un array grande con slots.
      var inner = null;
      for (var j = 0; j < ch.length; j++) {
        if (Array.isArray(ch[j])) {
          // si ese array interno parece "slots" (muchos null y algunos arrays dentro),
          // lo tomamos como el verdadero contenedor
          if (ch[j].length > 200 && countArrayItems(ch[j], Math.min(ch[j].length, 2000)) > 10) {
            inner = ch[j];
            break;
          }
          // si en vez de slots fueran “segmentos ya listos”, se agregan abajo
        }
      }

      if (inner) {
        chunkSlotsToSegs(inner);
      } else {
        // B3) "Segmentos ya listos": chapters ya viene como [seg0, seg1, ...] (cada seg ~1000)
        for (var k = 0; k < ch.length; k++) {
          if (Array.isArray(ch[k])) segs.push(ch[k]);
        }
      }
    }
  }

  if (!segs.length) return null;

  return {
    abbr: abbr,
    totalCh: (ABBR_CHAPTERS && ABBR_CHAPTERS[abbr]) ? ABBR_CHAPTERS[abbr] : 0,
    segs: segs
  };
}


function getTokens(ch, v) {
  if (!morphMap || !morphMap.segs || !morphMap.segs.length) return null;
  if (ch < 1 || v < 1) return null;

  var segs = morphMap.segs;

  // segmento por bloque de 10 capítulos (1–10 => seg 0, 11–20 => seg 1, etc.)
  var segIndex = Math.floor((ch - 1) / 10);
  if (segIndex < 0 || segIndex >= segs.length) return null;

  var base = segIndex * 10;
  var idx = ((ch - 1 - base) * 100) + (v - 1);

  var tokens = segs[segIndex][idx];
  return Array.isArray(tokens) ? tokens : null;
}



  // ✅ ESTE CIERRE ES OBLIGATORIO

  // -------------------- popup --------------------
  function ensurePopup() {
    if (document.getElementById('gk-lex-popup')) return;

    var st = document.createElement('style');
    st.id = 'gk-lex-style';
    st.textContent =
      '.gk-w{ cursor:pointer; }' +
      '.gk-w:hover{ text-decoration: underline; }' +
      '.gk-lex-popup{ position:fixed; z-index:9997; min-width:260px; max-width:min(420px, calc(100vw - 24px));' +
      ' background:rgba(17,26,46,0.98); border:1px solid rgba(255,255,255,0.10); border-radius:14px;' +
      ' box-shadow:0 20px 50px rgba(0,0,0,0.35); padding:12px; color:#e9eefc; display:none; }' +
      '.gk-lex-popup .t1{ font-weight:700; font-size:14px; margin-bottom:6px; padding-right:18px; }' +
      '.gk-lex-popup .t2{ font-size:13px; opacity:.92; line-height:1.35; }' +
      '.gk-lex-popup .row{ margin-top:6px; }' +
      '.gk-lex-popup .lab{ opacity:.7; margin-right:6px; }' +
      '.gk-lex-popup .close{ position:absolute; right:10px; top:8px; background:transparent; border:0; color:#cbd6ff; cursor:pointer; font-size:16px; }';

    document.head.appendChild(st);

    var box = document.createElement('div');
    box.id = 'gk-lex-popup';
    box.className = 'gk-lex-popup';
    box.innerHTML =
      '<button class="close" aria-label="Cerrar">×</button>' +
      '<div class="t1" id="gk-lex-g"></div>' +
      '<div class="t2"><span class="lab">Lemma:</span><span id="gk-lex-lemma"></span></div>' +
      '<div class="t2 row"><span class="lab">Translit:</span><span id="gk-lex-tr"></span></div>';

    document.body.appendChild(box);

    box.querySelector('.close').addEventListener('click', function () {
      hidePopup();
    }, false);

    document.addEventListener('keydown', function (ev) {
      if (ev.key === 'Escape') hidePopup();
    }, false);

    // click fuera cierra (pero no rompe el click derecho)
    document.addEventListener('click', function (ev) {
      var p = document.getElementById('gk-lex-popup');
      if (!p || p.style.display !== 'block') return;
      if (p.contains(ev.target)) return;
      if (ev.target && ev.target.classList && ev.target.classList.contains('gk-w')) return;
      hidePopup();
    }, false);
  }

  function showPopupNear(anchorEl, g, lemma, tr) {
    ensurePopup();
    var box = document.getElementById('gk-lex-popup');
    if (!box) return;

    document.getElementById('gk-lex-g').textContent = g || '';
    document.getElementById('gk-lex-lemma').textContent = lemma || '—';
document.getElementById('gk-lex-tr').textContent = normalizeTranslit(tr) || '—';


    box.style.display = 'block';

    var r = anchorEl.getBoundingClientRect();
    var pad = 10;

    var bw = box.offsetWidth;
    var bh = box.offsetHeight;

    var left = r.left + (r.width / 2) - (bw / 2);
    var top = r.bottom + 8;

    if (left < pad) left = pad;
    if (left + bw > window.innerWidth - pad) left = window.innerWidth - pad - bw;

    if (top + bh > window.innerHeight - pad) {
      top = r.top - bh - 8;
      if (top < pad) top = pad;
    }

    box.style.left = Math.round(left) + 'px';
    box.style.top = Math.round(top) + 'px';
  }

  function hidePopup() {
    var box = document.getElementById('gk-lex-popup');
    if (!box) return;
    box.style.display = 'none';
  }

  // -------------------- restore/decorate --------------------
  function restoreRawGreek(rootEl) {
    if (!rootEl) return;

    var vts = rootEl.querySelectorAll('.verse-line[data-side="orig"] .verse-text');
    for (var i = 0; i < vts.length; i++) {
      var vt = vts[i];
      var raw = vt.getAttribute('data-raw');
      if (raw != null && raw !== '') {
        vt.textContent = raw;
        vt.removeAttribute('data-raw');
        vt.removeAttribute('data-gk-done');
      } else {
        // Si quedó decorado pero no hay raw, lo dejamos plano
        if (vt.querySelector && vt.querySelector('.gk-w')) {
          vt.textContent = vt.textContent || '';
          vt.removeAttribute('data-gk-done');
        }
      }
    }
    hidePopup();
  }

  function decorateVerseText(vt, tokens) {
    // Guarda raw una vez
    if (!vt.getAttribute('data-raw')) {
      vt.setAttribute('data-raw', vt.textContent || '');
    }

    // Reescribe con tokens creando spans
    while (vt.firstChild) vt.removeChild(vt.firstChild);

    for (var i = 0; i < tokens.length; i++) {
      var t = tokens[i] || {};
      var g = (t.g != null) ? String(t.g) : '';
      if (!g) continue;

      var lemma = (t.lemma != null) ? String(t.lemma) : '';
var tr = normalizeTranslit((t.tr != null) ? String(t.tr) : '');


      var sp = document.createElement('span');
      sp.className = 'gk-w';
      sp.setAttribute('data-lemma', lemma);
      sp.setAttribute('data-tr', tr);
      sp.textContent = g;

      vt.appendChild(sp);
      vt.appendChild(document.createTextNode(' '));
    }

    // quita el último espacio
    if (vt.lastChild && vt.lastChild.nodeType === 3) {
      vt.lastChild.nodeValue = vt.lastChild.nodeValue.replace(/\s+$/, '');
    }
  }

  function decorateVisibleOrigPanel(rootEl) {
    if (!rootEl) return;

    // Si no hay diccionario para el libro actual, restaura
    if (!morphMap) {
      restoreRawGreek(rootEl);
      return;
    }

    var lines = rootEl.querySelectorAll('.verse-line[data-side="orig"][data-ch][data-v]');
    for (var i = 0; i < lines.length; i++) {
      var line = lines[i];
      var ch = parseInt(line.getAttribute('data-ch') || '0', 10);
      var v = parseInt(line.getAttribute('data-v') || '0', 10);
      if (!ch || !v) continue;

      var vt = line.querySelector('.verse-text');
      if (!vt) continue;

      // Marca por libro+verso para no redecorar infinito
      var doneKey = morphKey + ':' + ch + ':' + v;
      if (vt.getAttribute('data-gk-done') === doneKey) continue;

      var tokens = getTokens(ch, v);
      if (!tokens) continue;

      decorateVerseText(vt, tokens);
      vt.setAttribute('data-gk-done', doneKey);
    }
  }

  // -------------------- click handler (SOLO click izquierdo) --------------------
  function attachLeftClickHandler(rootEl) {
    if (!rootEl) return;
    if (rootEl.getAttribute('data-gk-leftclick') === '1') return;
    rootEl.setAttribute('data-gk-leftclick', '1');

rootEl.addEventListener('click', function (ev) {
  if (ev.button !== 0) return;
  if (!morphMap) return;

  var t = ev.target;
  if (!t) return;

  // Debe ser palabra griega
  if (!t.classList || !t.classList.contains('gk-w')) return;

  var sel = window.getSelection ? window.getSelection() : null;
  if (sel && String(sel).trim().length > 0) return;

  var lemma = t.getAttribute('data-lemma') || '';
  var tr = normalizeTranslit(t.getAttribute('data-tr') || '');
  var g = t.textContent || '';

  ev.stopPropagation();
  showPopupNear(t, g, lemma, tr);
}, false);

  }

  // -------------------- load per book (NO por mutación) --------------------
  function clearMorph() {
    morphKey = null;
    morphMap = null;
    hidePopup();
  }

function loadMorphForCurrentBook() {
  var slug = getBookSlug();
  var abbr = slugToAbbr(slug);

  setLexDebug('GreekLexicon: slug=' + slug + ' | abbr=' + (abbr || 'NULL'));

  if (!abbr) {
    clearMorph();
    return Promise.resolve(false);
  }

  if (morphKey === abbr && morphMap) {
    setLexDebug('GreekLexicon: OK (cached) ' + abbr);
    return Promise.resolve(true);
  }

  var url = getMorphUrl(abbr);
  setLexDebug('GreekLexicon: fetching ' + url);

  return fetch(url, { cache: 'no-store' })
    .then(function (res) {
      if (!res.ok) {
        setLexDebug('GreekLexicon: FETCH FAIL ' + res.status + ' ' + url);
        clearMorph();
        return false;
      }
      return res.json().then(function (data) {
        morphKey = abbr;
        morphMap = buildMorphIndex(data, abbr);

        if (!morphMap) {
          setLexDebug('GreekLexicon: morphMap NULL (JSON cargó pero no indexó) ' + abbr);
          clearMorph();
          return false;
        }

        setLexDebug('GreekLexicon: OK ' + abbr + ' (segments=' + morphMap.segs.length + ')');
        return true;
      });
    })
    .catch(function (e) {
      setLexDebug('GreekLexicon: FETCH ERROR ' + (e && e.message ? e.message : e));
      clearMorph();
      return false;
    });
}


  // -------------------- scheduler (debounce) --------------------
  function scheduleWork(rootEl) {
    if (decorating) return;
    if (scheduled) return;

    scheduled = true;
    scheduleTimer = setTimeout(function () {
      scheduled = false;
      runWork(rootEl);
    }, 30);
  }

  function runWork(rootEl) {
    if (decorating) return;
    decorating = true;

    loadMorphForCurrentBook()
      .then(function () {
        decorateVisibleOrigPanel(rootEl);
        attachLeftClickHandler(rootEl);
      })
      .catch(function () {
        restoreRawGreek(rootEl);
      })
      .finally(function () {
        decorating = false;
      });
  }

  // Polyfill simple para finally (por si acaso)
  if (!Promise.prototype.finally) {
    Promise.prototype.finally = function (cb) {
      var P = this.constructor;
      return this.then(
        function (value) { return P.resolve(cb()).then(function () { return value; }); },
        function (reason) { return P.resolve(cb()).then(function () { throw reason; }); }
      );
    };
  }

  // -------------------- observer --------------------
  function observeOrigPanel() {
    if (observing) return;

    var rootEl = document.getElementById('passageTextOrig');
    if (!rootEl) return;

    observing = true;

    var obs = new MutationObserver(function () {
      // Si nosotros mismos estamos decorando, ignorar
      if (decorating) return;
      scheduleWork(rootEl);
    });

    obs.observe(rootEl, { childList: true, subtree: true });

    // primer run
    scheduleWork(rootEl);
  }

  function init() {
    observeOrigPanel();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.GreekLexicon = { init: init };
})();


// Si tu script expone morphMap en global no, pero al menos revisa Network.
// Si Network NO muestra 404 y AÚN así no decora, entonces el problema es tokens/ch-v.

