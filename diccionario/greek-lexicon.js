/* diccionario/greek-lexicon.js
   - Palabras griegas clickeables (popup lemma/translit + masterdiccionario)
   - Robusto: soporta distintos DOM/atributos para capítulo/verso
   - No interfiere con click derecho (subrayar/comentar)
   - Evita loop/freeze del MutationObserver (debounce + flags)
   - Carga el JSON correcto según ?book=
   - masterdiccionario.json en ./diccionario/
*/
(function () {
  var DICT_DIR = './diccionario/';
  var MASTER_DICT_URL = DICT_DIR + 'masterdiccionario.json';
  var masterDictIndex = null;   // Map<lemma, item>
  var masterDictLoaded = false;

  // Cantidad de capítulos por libro MorphGNT abbr
  var ABBR_CHAPTERS = {
    mt: 28, mr: 16, lu: 24, joh: 21,
    ac: 28, ro: 16, '1co': 16, '2co': 13,
    ga: 6, eph: 6, php: 4, col: 4,
    '1th': 5, '2th': 3, '1ti': 6, '2ti': 4,
    tit: 3, phm: 1, heb: 13, jas: 5,
    '1pe': 5, '2pe': 3, '1jo': 5, '2jo': 1,
    '3jo': 1, jud: 1, re: 22
  };

  // Mapeo slug (?book=) -> abbr MorphGNT
  var BOOK_SLUG_TO_ABBR = {
    mateo: 'mt', mat: 'mt', mt: 'mt',
    marcos: 'mr', mc: 'mr', mr: 'mr',
    lucas: 'lu', lc: 'lu', lu: 'lu',
    juan: 'joh', jn: 'joh', joh: 'joh',

    hechos: 'ac', ac: 'ac',

    romanos: 'ro', ro: 'ro',
    '1corintios': '1co', '1co': '1co',
    '2corintios': '2co', '2co': '2co',
    galatas: 'ga', ga: 'ga',
    efesios: 'eph', eph: 'eph',
    filipenses: 'php', php: 'php',
    colosenses: 'col', col: 'col',
    '1tesalonicenses': '1th', '1th': '1th',
    '2tesalonicenses': '2th', '2th': '2th',
    '1timoteo': '1ti', '1ti': '1ti',
    '2timoteo': '2ti', '2ti': '2ti',
    tito: 'tit', tit: 'tit',
    filemon: 'phm', phm: 'phm',
    hebreos: 'heb', heb: 'heb',
    santiago: 'jas', jas: 'jas',
    '1pedro': '1pe', '1pe': '1pe',
    '2pedro': '2pe', '2pe': '2pe',
    '1juan': '1jo', '1jo': '1jo',
    '2juan': '2jo', '2jo': '2jo',
    '3juan': '3jo', '3jo': '3jo',
    judas: 'jud', jud: 'jud',
    apocalipsis: 're', re: 're'
  };

  // estado morph
  var morphKey = null; // abbr
  var morphMap = null; // {abbr,totalCh,segs}

  // observer flags
  var observing = false;
  var decorating = false;
  var scheduled = false;
  var scheduleTimer = null;

  // -------------------- util --------------------
  function normalizeTranslit(s) {
    if (!s) return '';
    return String(s).replace(/\s+/g, ' ').trim();
  }

  function slugToAbbr(slug) {
    slug = (slug || '').toLowerCase().trim().replace(/\s+/g, '');
    if (!slug) return null;
    if (Object.prototype.hasOwnProperty.call(BOOK_SLUG_TO_ABBR, slug)) return BOOK_SLUG_TO_ABBR[slug];
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

  function escHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  function escAttr(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  // -------------------- build morph index --------------------
  // JSON: { book, chapters:[ ... ] }
  // En tu formato:
  //  - Solo algunos índices de "chapters" son arrays (segmentos)
  //  - tokens en seg[idx] donde idx = chapter*100 + (verse-1) (para seg0)
  //  - seg1 arranca en 0 para cap 10, etc.
  function buildMorphIndex(data, abbr) {
    if (!data || !data.chapters || !Array.isArray(data.chapters)) return null;

    var segs = [];
    for (var i = 0; i < data.chapters.length; i++) {
      if (Array.isArray(data.chapters[i])) segs.push(data.chapters[i]);
    }
    if (!segs.length) return null;

    return {
      abbr: abbr,
      totalCh: ABBR_CHAPTERS[abbr] || 0,
      segs: segs
    };
  }

  function getTokens(ch, v) {
    if (!morphMap) return null;

    var segs = morphMap.segs;
    var totalCh = morphMap.totalCh || 0;
    if (!segs || !segs.length) return null;

    if (ch < 1 || v < 1) return null;
    if (totalCh && ch > totalCh) return null;

    // segIndex: 0 -> caps 1-9, 1 -> 10-19, etc.
    var segIndex = 0;
    if (ch >= 10) segIndex = 1 + Math.floor((ch - 10) / 10);
    if (segIndex < 0 || segIndex >= segs.length) return null;

    var base = segIndex * 10;
    var idx = (segIndex === 0)
      ? (ch * 100) + (v - 1)
      : ((ch - base) * 100) + (v - 1);

    var tokens = segs[segIndex][idx];
    return Array.isArray(tokens) ? tokens : null;
  }

  // -------------------- masterdiccionario (index por lemma) --------------------
  function sanitizeLooseJson(text) {
    return String(text || '')
      .replace(/,\s*([}\]])/g, '$1')
      .replace(/^\uFEFF/, '');
  }

  function buildMasterIndex(masterObj) {
    if (!masterObj || !Array.isArray(masterObj.items)) return null;
    var m = new Map();
    for (var i = 0; i < masterObj.items.length; i++) {
      var it = masterObj.items[i];
      if (!it || !it.lemma) continue;
      m.set(it.lemma, it);
    }
    return m;
  }

  function loadMasterDictionaryOnce() {
    if (masterDictLoaded) return Promise.resolve(masterDictIndex);
    masterDictLoaded = true;

    return fetch(MASTER_DICT_URL, { cache: 'no-store' })
      .then(function (r) {
        if (!r.ok) throw new Error('No se pudo cargar masterdiccionario.json (' + r.status + ')');
        return r.text();
      })
      .then(function (txt) {
        var clean = sanitizeLooseJson(txt);
        var obj = JSON.parse(clean);
        masterDictIndex = buildMasterIndex(obj);
        return masterDictIndex;
      })
      .catch(function (e) {
        console.warn('[masterdiccionario] fallo:', e);
        masterDictIndex = null;
        return null;
      });
  }

  function getMasterEntryByLemma(lemma) {
    if (!lemma || !masterDictIndex) return null;
    return masterDictIndex.get(lemma) || null;
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
      '.gk-lex-popup .sep{ border:0; border-top:1px solid rgba(255,255,255,.12); margin:10px 0; }' +
      '.gk-lex-popup .def{ margin-top:6px; line-height:1.35; max-height:180px; overflow:auto; }' +
      '.gk-lex-popup .close{ position:absolute; right:10px; top:8px; background:transparent; border:0; color:#cbd6ff; cursor:pointer; font-size:16px; }';

    document.head.appendChild(st);

    var box = document.createElement('div');
    box.id = 'gk-lex-popup';
    box.className = 'gk-lex-popup';
    box.innerHTML =
      '<button class="close" aria-label="Cerrar">×</button>' +
      '<div class="t1" id="gk-lex-g"></div>' +
      '<div class="t2"><span class="lab">Lemma:</span><span id="gk-lex-lemma"></span></div>' +
      '<div class="t2 row"><span class="lab">Translit:</span><span id="gk-lex-tr"></span></div>' +
      '<hr class="sep"/>' +
      '<div class="t2 row"><span class="lab">Forma léxica:</span><span id="gk-lex-forma-lex"></span></div>' +
      '<div class="t2 row"><span class="lab">Entrada impresa:</span><span id="gk-lex-entrada"></span></div>' +
      '<div class="t2"><span class="lab">Definición:</span><div id="gk-lex-def" class="def"></div></div>';

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
    document.getElementById('gk-lex-tr').textContent = normalizeTranslit(tr) || '—';

    var formaLexEl = document.getElementById('gk-lex-forma-lex');
    var entradaEl = document.getElementById('gk-lex-entrada');
    var defEl = document.getElementById('gk-lex-def');

    if (!masterDictIndex) {
      loadMasterDictionaryOnce().then(function () {
        var p = document.getElementById('gk-lex-popup');
        if (p && p.style.display === 'block') showPopupNear(anchorEl, g, lemma, tr);
      });

      if (formaLexEl) formaLexEl.textContent = '…';
      if (entradaEl) entradaEl.textContent = '…';
      if (defEl) defEl.textContent = 'Cargando diccionario…';
    } else {
      var ent = getMasterEntryByLemma(lemma);

      if (!ent) {
        if (formaLexEl) formaLexEl.textContent = '—';
        if (entradaEl) entradaEl.textContent = '—';
        if (defEl) defEl.textContent = 'No hay entrada para este lemma en masterdiccionario.';
      } else {
        // Solo lo pedido, pero tolerante a variaciones de clave
        var formaLex = ent['Forma lexica'] || ent['forma_lexica'] || ent['formaLexica'] || '—';
        var entrada = ent['entrada_impresa'] || ent['entrada impresa'] || ent['entrada'] || '—';
        var definicion = ent['definicion'] || ent['definición'] || ent['def'] || '—';

        if (formaLexEl) formaLexEl.textContent = formaLex;
        if (entradaEl) entradaEl.textContent = entrada;
        if (defEl) defEl.textContent = definicion;
      }
    }

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

  // -------------------- DOM robust: localizar versos + extraer capítulo/verso --------------------
  function parseRefString(s) {
    // soporta "1:1", "juan 1:1", "Jn 1:1", "1.1", etc.
    if (!s) return null;
    s = String(s).trim();

    // busca patrón capítulo:verso
    var m = s.match(/(\d{1,3})\s*[:.]\s*(\d{1,3})/);
    if (!m) return null;

    var ch = parseInt(m[1], 10);
    var v = parseInt(m[2], 10);
    if (!ch || !v) return null;

    return { ch: ch, v: v };
  }

  function getChVFromElement(lineEl) {
    if (!lineEl) return null;

    // intenta varias claves
    var ds = lineEl.dataset || {};

    var ch =
      parseInt(ds.chapter || ds.ch || ds.c || lineEl.getAttribute('data-chapter') || lineEl.getAttribute('data-ch') || lineEl.getAttribute('data-c') || '0', 10);

    var v =
      parseInt(ds.verse || ds.v || lineEl.getAttribute('data-verse') || lineEl.getAttribute('data-v') || '0', 10);

    if (ch && v) return { ch: ch, v: v };

    // intenta data-ref / data-vref / id / aria-label
    var ref =
      ds.ref || ds.vref || lineEl.getAttribute('data-ref') || lineEl.getAttribute('data-vref') ||
      lineEl.id || lineEl.getAttribute('aria-label') || '';

    var parsed = parseRefString(ref);
    if (parsed) return parsed;

    // si el elemento .verse-text trae el ref en parent/ancestro
    var p = lineEl.parentElement;
    while (p && p !== document.body) {
      var pds = p.dataset || {};
      var pref = pds.ref || pds.vref || p.getAttribute('data-ref') || p.getAttribute('data-vref') || p.id || '';
      parsed = parseRefString(pref);
      if (parsed) return parsed;
      p = p.parentElement;
    }

    return null;
  }

  function findGreekLines(rootEl) {
    // intenta varios selectores comunes
    var selectors = [
      '.verse-line[data-side="orig"]',
      '.verse-line[data-side="gr"]',
      '.verse-line.orig',
      '.verse-line.greek',
      '.verse[data-side="orig"]',
      '.verse.orig',
      '.verse.greek',
      '.verse-line',
      '.verse'
    ];

    for (var i = 0; i < selectors.length; i++) {
      var list = rootEl.querySelectorAll(selectors[i]);
      if (list && list.length) return list;
    }
    return [];
  }

  function findVerseTextNode(lineEl) {
    if (!lineEl) return null;
    // intenta varios contenedores típicos del texto
    return lineEl.querySelector('.verse-text') ||
           lineEl.querySelector('.text') ||
           lineEl.querySelector('[data-role="verse-text"]') ||
           lineEl;
  }

  // -------------------- decorate --------------------
  function decorateVerseText(vt, ch, v) {
    if (!vt) return;

    // evita redecorar
    if (vt.getAttribute('data-gk-decorated') === '1') return;

    var tokens = getTokens(ch, v);
    if (!tokens || !tokens.length) return;

    // Construye HTML preservando espacios básicos:
    // - Separa por espacio entre tokens de letras
    // - No agrega espacio antes de signos comunes
    var html = '';
    var prevWasWord = false;

    for (var i = 0; i < tokens.length; i++) {
      var t = tokens[i];
      if (!t) continue;

      var g = (t.g != null) ? String(t.g) : '';
      var lemma = (t.lemma != null) ? String(t.lemma) : '';
      var tr = (t.tr != null) ? String(t.tr) : '';

      if (!g) continue;

      var isPunct = /^[··.,;:!?·…—–“”"'\)\]\}]+$/.test(g);
      var isOpenPunct = /^[\(\[\{“"']+$/.test(g);

      if (html) {
        if (!isPunct && !isOpenPunct && prevWasWord) html += ' ';
        if (isOpenPunct && prevWasWord) html += ' ';
      }

      html += '<span class="gk-w" data-lemma="' + escAttr(lemma) + '" data-tr="' + escAttr(tr) + '">' +
        escHtml(g) + '</span>';

      prevWasWord = !isPunct;
    }

    if (html) {
      vt.innerHTML = html;
      vt.setAttribute('data-gk-decorated', '1');
    }
  }

  function decorateVisibleOrigPanel(rootEl) {
    if (!rootEl) return;

    var lines = findGreekLines(rootEl);
    if (!lines || !lines.length) return;

    for (var i = 0; i < lines.length; i++) {
      var line = lines[i];
      var ref = getChVFromElement(line);
      if (!ref) continue;

      var vt = findVerseTextNode(line);
      if (!vt) continue;

      decorateVerseText(vt, ref.ch, ref.v);
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

  // -------------------- load per book --------------------
  function clearMorph() {
    morphKey = null;
    morphMap = null;
    hidePopup();
  }

  function loadMorphForCurrentBook() {
    var slug = getBookSlug();
    var abbr = slugToAbbr(slug);

    if (!abbr) {
      clearMorph();
      return Promise.resolve(false);
    }

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
          morphMap = buildMorphIndex(data, abbr);
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
        // si algo falla, al menos no rompe la UI
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
      if (decorating) return;
      scheduleWork(rootEl);
    });

    obs.observe(rootEl, { childList: true, subtree: true });

    // primer run
    scheduleWork(rootEl);
  }

  function init() {
    // Carga masterdiccionario 1 vez
    loadMasterDictionaryOnce();
    observeOrigPanel();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.GreekLexicon = { init: init };
})();
