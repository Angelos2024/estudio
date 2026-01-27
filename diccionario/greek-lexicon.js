/* diccionario/greek-lexicon.js
   FIX: evita loop del MutationObserver (freeze).
   - Debounce de mutaciones
   - No fetch por mutación
   - Ignora mutaciones mientras decora
   - Cambia de libro cargando el JSON correcto
   - Si no hay JSON para ese libro: restaura texto original (sin spans)
   - Click izquierdo abre popup (NO toca contextmenu)
*/
(function () {
  var DICT_DIR = './diccionario/';

  // Slug de URL (?book=...) -> abbr de archivo (abbr-morphgnt.translit.json)
  var BOOK_SLUG_TO_ABBR = {
    'mateo': 'mt', 'mt': 'mt', 'matt': 'mt', 'matthew': 'mt',
    'marcos': 'mk', 'mc': 'mk', 'mk': 'mk', 'mark': 'mk',
    'lucas': 'lk', 'lc': 'lk', 'lk': 'lk', 'luke': 'lk',
    'juan': 'jn', 'jn': 'jn', 'john': 'jn'
  };

  var morph = null;        // JSON cargado
  var morphKey = null;     // abbr cargada (mt/mk/lk/jn)
  var morphMap = null;     // "ch:v" => tokens
  var observing = false;
  var decorating = false;
  var scheduled = false;
  var scheduleTimer = null;

  // -------------------- utils --------------------
  function esc(s) {
    s = (s == null) ? '' : String(s);
    return s
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function normalizeSlug(s) {
    s = (s || '').toLowerCase().trim();
    s = s.replace(/\s+/g, ' ');
    return s;
  }

  function slugToAbbr(slug) {
    slug = normalizeSlug(slug);
    if (!slug) return null;

    // "1 juan" etc (por ahora no aplica, pero lo dejo bien)
    slug = slug.replace(/^([123])\s+/, '$1');
    slug = slug.replace(/\s+/g, '');

    if (BOOK_SLUG_TO_ABBR.hasOwnProperty(slug)) return BOOK_SLUG_TO_ABBR[slug];
    return null;
  }

  function getMorphUrl(abbr) {
    return DICT_DIR + abbr + '-morphgnt.translit.json';
  }

  function getBookSlug() {
    // No dependemos de URLSearchParams (pero Chrome moderno lo soporta)
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

  // -------------------- build index --------------------
  // Soporta:
  // A) { chapters: [ ... seg arrays ... ] } con idx -> ch:v (100-based)
  // B) [ [ [tokens]... ]... ] (simple)
function buildMorphIndex(data, abbr) {
  // Devuelve un "map-like" con:
  //   { abbr: 'mt'|'mk'|'lk'|'jn', segs: [seg0, seg1, ...] }
  // donde cada seg es un array de versos indexado por fórmula (capítulos en bloques de 10).

  if (!data) return { map: null };

  // Caso típico MorphGNT: { book:'..', meta:{..}, chapters:[ ... ] }
  if (!data.chapters || !Array.isArray(data.chapters)) return { map: null };

  var chapters = data.chapters;

  // Recolecta SOLO los arrays-segmento (los que contienen listas largas de versos)
  var segs = [];
  for (var i = 0; i < chapters.length; i++) {
    if (Array.isArray(chapters[i])) {
      segs.push(chapters[i]);
    }
  }

  if (!segs.length) return { map: null };

  // Devuelve un objeto que luego consume getTokens(ch,v)
  return {
    map: {
      abbr: abbr,
      segs: segs
    }
  };
}



function getTokens(ch, v) {
  if (!morphMap) return null;

  var abbr = morphMap.abbr;
  var segs = morphMap.segs;
  if (!abbr || !segs || !segs.length) return null;

  // Helper: idx para un capítulo dentro de un bloque base
  function idxFor(chNum, baseCh) {
    return ((chNum - baseCh) * 100) + (v - 1);
  }

  // ✅ Rangos reales por libro (Evangelios)
  // Mt: 1–9 | 10–19 | 20–28   (3 segmentos)
  // Mk: 1–9 | 10–16           (2 segmentos)
  // Lk: 1–9 | 10–19 | 20–24   (3 segmentos)
  // Jn: 1–9 | 10–19 | 20–21   (3 segmentos)

  var seg = null;
  var idx = -1;

  if (abbr === 'mt') {
    if (segs.length < 3) return null;
    if (ch >= 1 && ch <= 9) { seg = segs[0]; idx = idxFor(ch, 0); }          // ch*100+(v-1)
    else if (ch >= 10 && ch <= 19) { seg = segs[1]; idx = idxFor(ch, 10); }
    else if (ch >= 20 && ch <= 28) { seg = segs[2]; idx = idxFor(ch, 20); }
  } else if (abbr === 'mk') {
    if (segs.length < 2) return null;
    if (ch >= 1 && ch <= 9) { seg = segs[0]; idx = idxFor(ch, 0); }
    else if (ch >= 10 && ch <= 16) { seg = segs[1]; idx = idxFor(ch, 10); }
  } else if (abbr === 'lk') {
    if (segs.length < 3) return null;
    if (ch >= 1 && ch <= 9) { seg = segs[0]; idx = idxFor(ch, 0); }
    else if (ch >= 10 && ch <= 19) { seg = segs[1]; idx = idxFor(ch, 10); }
    else if (ch >= 20 && ch <= 24) { seg = segs[2]; idx = idxFor(ch, 20); }
  } else if (abbr === 'jn') {
    if (segs.length < 3) return null;
    if (ch >= 1 && ch <= 9) { seg = segs[0]; idx = idxFor(ch, 0); }
    else if (ch >= 10 && ch <= 19) { seg = segs[1]; idx = idxFor(ch, 10); }
    else if (ch >= 20 && ch <= 21) { seg = segs[2]; idx = idxFor(ch, 20); }
  } else {
    // Otros libros: aún no implementado aquí
    return null;
  }

  if (!seg) return null;

  var tokens = seg[idx];
  return Array.isArray(tokens) ? tokens : null;
}

  // -------------------- popup --------------------
  function ensurePopup() {
    if (document.getElementById('gk-lex-popup')) return;

    var st = document.createElement('style');
    st.id = 'gk-lex-style';
    st.textContent = ''
      + '.gk-w{ cursor:pointer; }'
      + '.gk-w:hover{ text-decoration: underline; }'
      + '.gk-lex-popup{ position:fixed; z-index:9997; min-width:260px; max-width:min(420px, calc(100vw - 24px));'
      + ' background:rgba(17,26,46,0.98); border:1px solid rgba(255,255,255,0.10); border-radius:14px;'
      + ' box-shadow:0 20px 50px rgba(0,0,0,0.35); padding:12px; color:#e9eefc; display:none; }'
      + '.gk-lex-popup .t1{ font-weight:700; font-size:14px; margin-bottom:6px; padding-right:18px; }'
      + '.gk-lex-popup .t2{ font-size:13px; opacity:.92; line-height:1.35; }'
      + '.gk-lex-popup .row{ margin-top:6px; }'
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
      + '<div class="t2 row"><span class="lab">Translit:</span><span id="gk-lex-tr"></span></div>';
    document.body.appendChild(box);

    box.querySelector('.close').addEventListener('click', function () {
      hidePopup();
    }, false);

    document.addEventListener('keydown', function (ev) {
      if (ev.key === 'Escape') hidePopup();
    }, false);

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
        // Si quedó decorado pero no hay raw, al menos quita spans -> texto plano
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

    // Reescribe con tokens creando spans (esto dispara mutación; por eso usamos decorating flag + debounce)
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
      var key = morphKey + ':' + ch + ':' + v;
      if (vt.getAttribute('data-gk-done') === key) continue;

      var tokens = getTokens(ch, v);
      if (!tokens) continue;

      decorateVerseText(vt, tokens);
      vt.setAttribute('data-gk-done', key);
    }
  }

  // -------------------- click handler --------------------
  function attachLeftClickHandler(rootEl) {
    if (!rootEl) return;
    if (rootEl.getAttribute('data-gk-leftclick') === '1') return;
    rootEl.setAttribute('data-gk-leftclick', '1');

    rootEl.addEventListener('click', function (ev) {
      if (ev.button !== 0) return;
      if (!morphMap) return;

      var t = ev.target;
      if (!t) return;

      // No chocar con marcas de nota
      if (t.closest && t.closest('.note-mark')) return;

      // Debe ser palabra griega
      if (!t.classList || !t.classList.contains('gk-w')) return;

      // Si hay selección activa (subrayar), no abrir popup
      var sel = window.getSelection ? window.getSelection() : null;
      if (sel && String(sel).trim().length > 0) return;

      var lemma = t.getAttribute('data-lemma') || '';
      var tr = t.getAttribute('data-tr') || '';
      var g = t.textContent || '';

      showPopupNear(t, g, lemma, tr);
    }, false);
  }

  // -------------------- load per book (NO por mutación) --------------------
  function clearMorph() {
    morph = null;
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
          morph = data;
          morphKey = abbr;

          var built = buildMorphIndex(data);
          morphMap = built.map || {};

          // valida que haya algo
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

  // -------------------- scheduler (debounce) --------------------
  function scheduleWork(rootEl) {
    if (decorating) return;

    if (scheduled) return;
    scheduled = true;

    // debounce corto
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
        // Decorar o restaurar según morphMap
        decorateVisibleOrigPanel(rootEl);
        attachLeftClickHandler(rootEl);
      })
      .catch(function () {
        // si algo falla, al menos restaura
        restoreRawGreek(rootEl);
      })
      .finally(function () {
        decorating = false;
      });
  }

  // Polyfill simple para finally (si el navegador no lo tuviera)
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
