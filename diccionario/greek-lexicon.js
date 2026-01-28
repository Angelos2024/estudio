/* diccionario/greek-lexicon.js
   - Palabras griegas clickeables (popup lemma/translit)
   - NO interfiere con click derecho (subrayar/comentar)
   - Evita loop/freeze del MutationObserver (debounce + flags)
   - Carga el JSON correcto según ?book=
   - Si no hay JSON del libro: restaura texto plano (sin spans)
*/
(function () {
  var DICT_DIR = './diccionario/';

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
    'galatas': 'ga', 'gálatas': 'ga', 'ga': 'ga', 'gal': 'ga', 'galatians': 'ga'
  };

  var morphKey = null;  // abbr cargada (mt/mk/...)
  var morphMap = null;  // map: "ch:v" => tokens[]
  var observing = false;
  var decorating = false;
  var scheduled = false;
  var scheduleTimer = null;

  // -------------------- utils --------------------
  function normalizeSlug(s) {
    s = (s || '').toLowerCase().trim();
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
      var v = decodeURIComponent(kv[1] || '');
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
  function buildMorphIndex(data) {
    if (!data || !data.chapters || !Array.isArray(data.chapters)) return null;

    var out = Object.create(null);

    for (var s = 0; s < data.chapters.length; s++) {
      var seg = data.chapters[s];
      if (!Array.isArray(seg)) continue;

      for (var idx = 0; idx < seg.length; idx++) {
        var tokens = seg[idx];
        if (!Array.isArray(tokens) || tokens.length === 0) continue;

        var ch = Math.floor(idx / 100);
        var v = (idx % 100) + 1;

        // Algunos idx pueden ser 0..99 (ch=0) por padding; los ignoramos.
        if (ch <= 0 || v <= 0) continue;

        out[ch + ':' + v] = tokens;
      }
    }

    // Si no hay nada, devuelve null
    for (var k in out) {
      if (Object.prototype.hasOwnProperty.call(out, k)) return out;
    }
    return null;
  }

  function getTokens(ch, v) {
    if (!morphMap) return null;
    var key = ch + ':' + v;
    var t = morphMap[key];
    return Array.isArray(t) ? t : null;
  }

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
    document.getElementById('gk-lex-tr').textContent = tr || '—';

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
      var tr = (t.tr != null) ? String(t.tr) : '';

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
      // SOLO botón izquierdo
      if (ev.button !== 0) return;
      if (!morphMap) return;

      var t = ev.target;
      if (!t) return;

      // Si tu UI de notas usa .note-mark, evitamos choque
      if (t.closest && t.closest('.note-mark')) return;

      // Debe ser palabra griega
      if (!t.classList || !t.classList.contains('gk-w')) return;

      // Si hay selección activa (para subrayar), no abrimos popup
      var sel = window.getSelection ? window.getSelection() : null;
      if (sel && String(sel).trim().length > 0) return;

      var lemma = t.getAttribute('data-lemma') || '';
      var tr = t.getAttribute('data-tr') || '';
      var g = t.textContent || '';

      // Importante: NO preventDefault en general (no tocamos contextmenu).
      // Solo evitamos burbujeo para no disparar handlers de click globales raros.
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

    // si no sabemos el libro => sin diccionario
    if (!abbr) {
      clearMorph();
      return Promise.resolve(false);
    }

    // si ya está cargado => ok
    if (morphKey === abbr && morphMap) return Promise.resolve(true);

    var url = getMorphUrl(abbr);

    return fetch(url, { cache: 'no-store' })
      .then(function (res) {
        if (!res.ok) {
          clearMorph();
          return false;
        }
        return res.json().then(function (data) {
          morphKey = abbr;
          morphMap = buildMorphIndex(data);

          if (!morphMap) {
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
