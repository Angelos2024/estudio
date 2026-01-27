/* diccionario/greek-lexicon.js
   - Hace cada palabra griega clickeable (click IZQUIERDO) para mostrar lemma + translit.
   - NO interfiere con click DERECHO (subrayar / comentar): no usa preventDefault/stopPropagation en contextmenu.
   - Se auto-reaplica si el DOM cambia (MutationObserver), para convivir con subrayados/notas.
   - Carga el diccionario según el libro actual (?book=...).
*/
(function () {
  // -----------------------------
  // Config
  // -----------------------------
  var DICT_DIR = './diccionario/';

  // Mapea el slug de tu URL (?book=mateo, ?book=marcos, etc.) al prefijo de archivo
  // para que solo tengas que subir: diccionario/<abbr>-morphgnt.translit.json
  // (Puedes ir ampliando; ya dejo varios comunes).
  var BOOK_SLUG_TO_ABBR = {
    // Evangelios
    'mateo': 'mt', 'mt': 'mt', 'matt': 'mt', 'matthew': 'mt',
    'marcos': 'mk', 'mc': 'mk', 'mk': 'mk', 'mark': 'mk',
    'lucas': 'lk', 'lc': 'lk', 'lk': 'lk', 'luke': 'lk',
    'juan': 'jn', 'jn': 'jn', 'john': 'jn',

    // Puedes ir subiendo y listo (solo agrega el json con el abbr correspondiente)
    // Ejemplos típicos:
    'hechos': 'ac', 'actos': 'ac', 'acts': 'ac', 'ac': 'ac',
    'romanos': 'ro', 'rom': 'ro', 'ro': 'ro',
    '1corintios': '1co', 'i corintios': '1co', '1co': '1co',
    '2corintios': '2co', 'ii corintios': '2co', '2co': '2co',
    'galatas': 'ga', 'gálatas': 'ga', 'ga': 'ga',
    'efesios': 'eph', 'ephesios': 'eph', 'eph': 'eph',
    'filipenses': 'php', 'php': 'php',
    'colosenses': 'col', 'col': 'col',
    '1tesalonicenses': '1th', '1th': '1th',
    '2tesalonicenses': '2th', '2th': '2th',
    '1timoteo': '1ti', '1ti': '1ti',
    '2timoteo': '2ti', '2ti': '2ti',
    'tito': 'tit', 'tit': 'tit',
    'filemon': 'phm', 'phm': 'phm',
    'hebreos': 'heb', 'heb': 'heb',
    'santiago': 'jas', 'jacobo': 'jas', 'jas': 'jas',
    '1pedro': '1pe', '1pe': '1pe',
    '2pedro': '2pe', '2pe': '2pe',
    '1juan': '1jn', '1jn': '1jn',
    '2juan': '2jn', '2jn': '2jn',
    '3juan': '3jn', '3jn': '3jn',
    'judas': 'jud', 'jud': 'jud',
    'apocalipsis': 'rev', 'revelacion': 'rev', 'revelación': 'rev', 'rev': 'rev'
  };

  // -----------------------------
  // Estado
  // -----------------------------
  var morph = null;            // JSON cargado (por libro)
  var morphKey = null;         // abbr actual (mt/mk/lk/jn/...)
  var morphMap = null;         // índice "ch:v" -> tokens
  var observing = false;

  // -----------------------------
  // Utils
  // -----------------------------
  function esc(s) {
    s = (s == null) ? '' : String(s);
    return s
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function getBookSlug() {
    var p = new URLSearchParams(window.location.search);
    var b = (p.get('book') || p.get('name') || '').toLowerCase().trim();
    return b;
  }

  function normalizeSlug(s) {
    s = (s || '').toLowerCase().trim();
    // quita espacios dobles
    s = s.replace(/\s+/g, ' ');
    return s;
  }

  function slugToAbbr(slug) {
    slug = normalizeSlug(slug);

    if (!slug) return null;

    // normaliza variantes con números pegados: "1 corintios" -> "1corintios"
    slug = slug.replace(/^([123])\s+/, '$1');
    slug = slug.replace(/\s+/g, ''); // "i corintios" se mantiene como "icorintios" (lo mapeamos si quieres)

    if (BOOK_SLUG_TO_ABBR.hasOwnProperty(slug)) return BOOK_SLUG_TO_ABBR[slug];

    // si viene ya como abreviatura conocida (mt/mk/lk/jn)
    if (slug.length <= 4 && BOOK_SLUG_TO_ABBR.hasOwnProperty(slug)) return BOOK_SLUG_TO_ABBR[slug];

    return null;
  }

  function getMorphUrl(abbr) {
    return DICT_DIR + abbr + '-morphgnt.translit.json';
  }

  // Construye un índice robusto para diferentes estructuras (segmentadas o no)
  // Resultado: morphMap["ch:v"] = [ {g,tr,lemma}, ... ]
  function buildMorphIndex(data) {
    // Muchos de tus JSON vienen como:
    // { book:'Mt', chapters:[ ... segment arrays ... ] }
    // y dentro de chapters hay arrays muy grandes indexadas por ch*100+(v-1) (o variante).
    var chapters = null;

    if (!data) return { map: {}, scheme: 'none' };

    if (Array.isArray(data)) {
      // estructura simple: [ [verses] ... ]
      // (por compatibilidad, aunque no es la típica de tus nuevos archivos)
      var m1 = {};
      for (var c = 0; c < data.length; c++) {
        if (!Array.isArray(data[c])) continue;
        for (var v = 0; v < data[c].length; v++) {
          if (!Array.isArray(data[c][v])) continue;
          m1[(c + 1) + ':' + (v + 1)] = data[c][v];
        }
      }
      return { map: m1, scheme: 'simple' };
    }

    chapters = data.chapters;
    if (!Array.isArray(chapters)) return { map: {}, scheme: 'none' };

    // recoge segmentos (arrays) dentro de chapters
    var segs = [];
    for (var i = 0; i < chapters.length; i++) {
      if (Array.isArray(chapters[i])) segs.push(chapters[i]);
    }
    if (!segs.length) return { map: {}, scheme: 'none' };

    // Vamos a detectar si el índice de capítulo es 0-based o 1-based.
    // Probamos dos esquemas:
    // A) ch = floor(idx/100),     v = idx%100 + 1   (ch empieza en 1 para idx>=100)
    // B) ch = floor(idx/100) + 1, v = idx%100 + 1
    // Elegimos el que produzca más pares (ch,v) plausibles.
    var scoreA = 0, scoreB = 0;
    var maxChGuess = (data.meta && data.meta.chapters) ? Number(data.meta.chapters) : null;

    function scoreScheme(chVal) {
      if (maxChGuess && (chVal < 1 || chVal > maxChGuess)) return false;
      if (chVal < 1 || chVal > 150) return false; // límite conservador
      return true;
    }

    for (var s = 0; s < segs.length; s++) {
      var seg = segs[s];
      for (var idx = 0; idx < seg.length; idx++) {
        if (!Array.isArray(seg[idx])) continue;
        var v1 = (idx % 100) + 1;
        var chA = Math.floor(idx / 100);
        var chB = chA + 1;

        if (scoreScheme(chA) && v1 >= 1 && v1 <= 99) scoreA++;
        if (scoreScheme(chB) && v1 >= 1 && v1 <= 99) scoreB++;
      }
    }

    var useB = (scoreB >= scoreA); // si empatan, preferimos B (más común)
    var out = {};

    for (var s2 = 0; s2 < segs.length; s2++) {
      var seg2 = segs[s2];
      for (var idx2 = 0; idx2 < seg2.length; idx2++) {
        var tokens = seg2[idx2];
        if (!Array.isArray(tokens)) continue;

        var v2 = (idx2 % 100) + 1;
        var chBase = Math.floor(idx2 / 100);
        var ch2 = useB ? (chBase + 1) : chBase;

        if (ch2 < 1) continue;
        if (maxChGuess && ch2 > maxChGuess) continue;

        out[ch2 + ':' + v2] = tokens;
      }
    }

    return { map: out, scheme: useB ? 'B' : 'A' };
  }

  function getTokens(ch, v) {
    if (!morphMap) return null;
    return morphMap[ch + ':' + v] || null;
  }

  // -----------------------------
  // Popup UI
  // -----------------------------
  function ensurePopup() {
    if (document.getElementById('gk-lex-popup')) return;

    var st = document.createElement('style');
    st.id = 'gk-lex-style';
    st.textContent = ''
      + '.gk-w{ cursor:pointer; }'
      + '.gk-w:hover{ text-decoration: underline; }'
      + '.gk-lex-popup{'
      + ' position:fixed; z-index:9997;'
      + ' min-width:260px; max-width:min(420px, calc(100vw - 24px));'
      + ' background:rgba(17,26,46,0.98); border:1px solid rgba(255,255,255,0.10);'
      + ' border-radius:14px; box-shadow:0 20px 50px rgba(0,0,0,0.35);'
      + ' padding:12px; color:#e9eefc; display:none;'
      + '}'
      + '.gk-lex-popup .t1{ font-weight:700; font-size:14px; margin-bottom:6px; padding-right:18px; }'
      + '.gk-lex-popup .t2{ font-size:13px; opacity:.92; }'
      + '.gk-lex-popup .row{ margin-top:6px; font-size:13px; }'
      + '.gk-lex-popup .lab{ opacity:.7; margin-right:6px; }'
      + '.gk-lex-popup .close{ position:absolute; right:10px; top:8px; background:transparent; border:0; color:#cbd6ff; cursor:pointer; font-size:16px; }';

    document.head.appendChild(st);

    var box = document.createElement('div');
    box.id = 'gk-lex-popup';
    box.className = 'gk-lex-popup';
    box.innerHTML = ''
      + '<button class="close" aria-label="Cerrar">×</button>'
      + '<div class="t1" id="gk-lex-g"></div>'
      + '<div class="t2"><span class="lab">Lemma:</span><span id="gk-lex-lemma"></span></div>'
      + '<div class="row"><span class="lab">Translit:</span><span id="gk-lex-tr"></span></div>';

    document.body.appendChild(box);

    box.querySelector('.close').addEventListener('click', function () {
      hidePopup();
    }, false);

    document.addEventListener('keydown', function (ev) {
      if (ev.key === 'Escape') hidePopup();
    }, false);

    document.addEventListener('click', function (ev) {
      // click fuera del popup lo cierra (pero no bloquea nada)
      var p = document.getElementById('gk-lex-popup');
      if (!p) return;
      if (p.style.display !== 'block') return;
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
    document.getElementById('gk-lex-tr').textContent = tr || '—';

    var r = anchorEl.getBoundingClientRect();
    var pad = 10;

    box.style.display = 'block';
    // medir luego de mostrar
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

  // -----------------------------
  // Decoración del panel griego
  // -----------------------------
  function restoreRawGreek(rootEl) {
    // Devuelve el texto original guardado en data-raw, eliminando spans previos
    var lines = rootEl.querySelectorAll('.verse-line[data-side="orig"] .verse-text');
    for (var i = 0; i < lines.length; i++) {
      var vt = lines[i];
      var raw = vt.getAttribute('data-raw');
      if (raw != null && raw !== '') {
        vt.textContent = raw;
        vt.removeAttribute('data-raw');
      }
    }
  }

  function decorateVerseText(vt, tokens) {
    // Guardar raw una vez
    if (!vt.getAttribute('data-raw')) {
      vt.setAttribute('data-raw', vt.textContent || '');
    }

    // Limpia y reescribe usando tokens (solo la parte griega)
    vt.textContent = '';

    for (var i = 0; i < tokens.length; i++) {
      var t = tokens[i] || {};
      var g = (t.g != null) ? String(t.g) : '';
      var lemma = (t.lemma != null) ? String(t.lemma) : '';
      var tr = (t.tr != null) ? String(t.tr) : '';

      // separación original: respetamos el "g" tal cual venga del JSON
      // Si el token viene vacío, lo omitimos
      if (!g) continue;

      var sp = document.createElement('span');
      sp.className = 'gk-w';
      sp.setAttribute('data-lemma', lemma);
      sp.setAttribute('data-tr', tr);
      sp.textContent = g;

      vt.appendChild(sp);

      // añade un espacio normal entre tokens
      vt.appendChild(document.createTextNode(' '));
    }

    // limpia espacio final extra
    if (vt.lastChild && vt.lastChild.nodeType === 3) {
      vt.lastChild.nodeValue = vt.lastChild.nodeValue.replace(/\s+$/, '');
    }
  }

  function decorateVisibleOrigPanel(rootEl) {
    if (!rootEl) return;

    // Si no hay diccionario para este libro, restaura a texto plano y sal
    if (!morphMap) {
      restoreRawGreek(rootEl);
      return;
    }

    var lines = rootEl.querySelectorAll('.verse-line[data-side="orig"]');

    for (var i = 0; i < lines.length; i++) {
      var line = lines[i];
      var ch = Number(line.getAttribute('data-ch') || '0');
      var v = Number(line.getAttribute('data-v') || '0');

      if (!ch || !v) continue;

      var vt = line.querySelector('.verse-text');
      if (!vt) continue;

      // No decorar si ya tiene spans de tus notas (respetamos estructura),
      // PERO sí redecoramos si el contenido actual no tiene spans gk-w
      // (tu subrayado puede envolver texto; por eso redecoramos completo con tokens).
      var tokens = getTokens(ch, v);
      if (!tokens) {
        // si no hay tokens para ese verso, deja como esté (o restaura si guardaste raw)
        continue;
      }

      decorateVerseText(vt, tokens);
    }
  }

  // -----------------------------
  // Click izquierdo (diccionario)
  // -----------------------------
  function attachLeftClickHandler(rootEl) {
    if (!rootEl) return;
    if (rootEl.getAttribute('data-gk-leftclick') === '1') return;

    rootEl.setAttribute('data-gk-leftclick', '1');

    rootEl.addEventListener('click', function (ev) {
      // Solo click izquierdo
      if (ev.button !== 0) return;

      // Si no hay diccionario cargado para este libro, no hacemos nada
      if (!morphMap) return;

      // Evitar chocar con UI de notas / marcas (si tu sistema usa .note-mark)
      var t = ev.target;
      if (t && t.closest && t.closest('.note-mark')) return;

      // Debe ser palabra griega clickeable
      if (!t || !t.classList || !t.classList.contains('gk-w')) return;

      var lemma = t.getAttribute('data-lemma') || '';
      var tr = t.getAttribute('data-tr') || '';
      var g = t.textContent || '';

      showPopupNear(t, g, lemma, tr);
    }, false);
  }

  // -----------------------------
  // Carga dinámica por libro
  // -----------------------------
  function clearMorph() {
    morph = null;
    morphKey = null;
    morphMap = null;
    hidePopup();
  }

  function loadMorphForCurrentBook() {
    var slug = getBookSlug();
    var abbr = slugToAbbr(slug);

    // Si no sabemos qué libro es, deshabilitar diccionario
    if (!abbr) {
      clearMorph();
      return Promise.resolve(false);
    }

    // Si ya está cargado ese mismo, ok
    if (morphKey === abbr && morphMap) return Promise.resolve(true);

    // Intentar cargar JSON
    var url = getMorphUrl(abbr);

    return fetch(url, { cache: 'no-store' })
      .then(function (res) {
        if (!res.ok) {
          // No existe aún ese diccionario => deshabilitar y NO dejar pegado el anterior
          clearMorph();
          return false;
        }
        return res.json().then(function (data) {
          morph = data;
          morphKey = abbr;

          var built = buildMorphIndex(data);
          morphMap = built.map || {};

          // Si el índice quedó vacío, mejor deshabilitar
          var hasAny = false;
          for (var k in morphMap) {
            if (Object.prototype.hasOwnProperty.call(morphMap, k)) { hasAny = true; break; }
          }
          if (!hasAny) {
            clearMorph();
            return false;
          }
          return true;
        });
      })
      .catch(function () {
        clearMorph();
        return false;
      });
  }

  // -----------------------------
  // Observer + init
  // -----------------------------
  function observeOrigPanel() {
    if (observing) return;

    var rootEl = document.getElementById('passageTextOrig');
    if (!rootEl) return;

    observing = true;

    var obs = new MutationObserver(function () {
      try {
        // si cambió el libro, recarga diccionario
        loadMorphForCurrentBook().then(function () {
          decorateVisibleOrigPanel(rootEl);
          attachLeftClickHandler(rootEl);
        });
      } catch (err) {
        console.warn('[GreekLexicon] observer error:', err);
      }
    });

    obs.observe(rootEl, { childList: true, subtree: true });

    // primer intento
    loadMorphForCurrentBook().then(function () {
      decorateVisibleOrigPanel(rootEl);
      attachLeftClickHandler(rootEl);
    });
  }

  function init() {
    observeOrigPanel();
  }

  // auto init
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.GreekLexicon = { init: init };
})();
