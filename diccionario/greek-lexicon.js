/* diccionario/greek-lexicon.js
   - Palabras griegas clickeables (popup lemma/translit + masterdiccionario)
   - NO interfiere con click derecho (subrayar/comentar)
   - Evita loop/freeze del MutationObserver (debounce + flags)
   - Carga el JSON correcto según ?book=
   - Si no hay JSON del libro: restaura texto plano (sin spans)
*/
(function () {
  var DICT_DIR = './diccionario/';
  var MASTER_DICT_URL = DICT_DIR + 'masterdiccionario.json';
  var masterDictIndex = null;   // Map<lemma, item>
  var masterDictLoaded = false;

  var ABBR_CHAPTERS = {
    mt: 28, mr: 16, lu: 24, joh: 21,
    ac: 28, ro: 16, '1co': 16, '2co': 13,
    ga: 6, eph: 6, php: 4, col: 4,
    '1th': 5, '2th': 3, '1ti': 6, '2ti': 4,
    tit: 3, phm: 1, heb: 13, jas: 5,
    '1pe': 5, '2pe': 3, '1jo': 5, '2jo': 1,
    '3jo': 1, jud: 1, re: 22
  };

  // Mapeo slug (query ?book=) -> abbr MorphGNT
  // Ajusta si tus slugs difieren.
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
  var morphKey = null;
  var morphMap = null;

  // observer flags
  var observing = false;
  var decorating = false;
  var scheduled = false;
  var scheduleTimer = null;

  // -------------------- util --------------------
  function normalizeTranslit(s) {
    if (!s) return '';
    // normalización mínima (puedes expandir si necesitas)
    return String(s)
      .replace(/\s+/g, ' ')
      .trim();
  }

  function slugToAbbr(slug) {
    slug = (slug || '').toLowerCase().trim();
    if (!slug) return null;
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
  function buildMorphIndex(data, abbr) {
    if (!data || !data.chapters || !Array.isArray(data.chapters)) return null;

    var segs = [];
    for (var i = 0; i < data.chapters.length; i++) {
      if (Array.isArray(data.chapters[i])) segs.push(data.chapters[i]);
    }
    if (!segs.length) return null;

    var totalCh = ABBR_CHAPTERS[abbr] || 0;

    return {
      abbr: abbr,
      totalCh: totalCh,
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

    var segIndex = 0;
    if (ch >= 10) segIndex = 1 + Math.floor((ch - 10) / 10);
    if (segIndex < 0 || segIndex >= segs.length) return null;

    var base = segIndex * 10;
    var idx;

    if (segIndex === 0) idx = (ch * 100) + (v - 1);
    else idx = ((ch - base) * 100) + (v - 1);

    var tokens = segs[segIndex][idx];

    // (opcional) fallback, si lo quieres conservar:
    if (!Array.isArray(tokens) && segIndex === 0) {
      idx = ((ch - 0) * 100) + (v - 1);
      tokens = segs[segIndex][idx];
    }

    return Array.isArray(tokens) ? tokens : null;
  } // ✅ ESTE CIERRE ES OBLIGATORIO

  // -------------------- masterdiccionario (index por lemma) --------------------
  function sanitizeLooseJson(text) {
    // Quita comas finales antes de } o ] (tu masterdiccionario no es JSON estricto)
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

    var formaLexEl = document.getElementById('gk-lex-forma-lex');
    var entradaEl = document.getElementById('gk-lex-entrada');
    var defEl = document.getElementById('gk-lex-def');

    // Si aún no cargó masterdiccionario, dispara carga y muestra estado
    if (!masterDictIndex) {
      loadMasterDictionaryOnce().then(function () {
        var p = document.getElementById('gk-lex-popup');
        if (p && p.style.display === 'block') {
          showPopupNear(anchorEl, g, lemma, tr);
        }
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
        // Solo lo que pediste:
        if (formaLexEl) formaLexEl.textContent = ent['Forma lexica'] || '—';
        if (entradaEl) entradaEl.textContent = ent['entrada_impresa'] || '—';
        if (defEl) defEl.textContent = ent['definicion'] || '—';
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

  // -------------------- restore/decorate --------------------
  function restoreRawGreek(rootEl) {
    if (!rootEl) return;

    var vts = rootEl.querySelectorAll('.verse-line[data-side="orig"] .verse-text');
    for (var i = 0; i < vts.length; i++) {
      var vt = vts[i];
      // si ya hay spans, restaurar a texto puro
      var spans = vt.querySelectorAll('span.gk-w');
      if (spans && spans.length) {
        // reconstruye el texto original desde spans + nodos
        // (para evitar pérdida, usa textContent)
        vt.textContent = vt.textContent;
      }
    }
  }

  function decorateVerseText(vt, ch, v) {
    if (!vt) return;

    // evita redecorar
    if (vt.getAttribute('data-gk-decorated') === '1') return;

    var tokens = getTokens(ch, v);
    if (!tokens || !tokens.length) return;

    // token shape esperado:
    // { g: '...', lemma: '...', tr: '...' }
    // Nota: tu JSON puede variar levemente; aquí usamos los nombres vistos.
    var html = '';
    for (var i = 0; i < tokens.length; i++) {
      var t = tokens[i];
      if (!t) continue;

      var g = (t.g != null) ? String(t.g) : '';
      var lemma = (t.lemma != null) ? String(t.lemma) : '';
      var tr = (t.tr != null) ? String(t.tr) : '';

      // preserva separadores/espacios si vienen en el token
      // si el token viene vacío, lo deja tal cual
      if (!g) continue;

      html += '<span class="gk-w" data-lemma="' + escAttr(lemma) + '" data-tr="' + escAttr(tr) + '">' +
        escHtml(g) + '</span>';
    }

    if (html) {
      vt.innerHTML = html;
      vt.setAttribute('data-gk-decorated', '1');
    }
  }

  function decorateVisibleOrigPanel(rootEl) {
    if (!rootEl) return;

    // ubica líneas del panel original (griego)
    var lines = rootEl.querySelectorAll('.verse-line[data-side="orig"]');
    if (!lines || !lines.length) return;

    for (var i = 0; i < lines.length; i++) {
      var line = lines[i];
      var ch = parseInt(line.getAttribute('data-chapter') || '0', 10);
      var v = parseInt(line.getAttribute('data-verse') || '0', 10);
      if (!ch || !v) continue;

      var vt = line.querySelector('.verse-text');
      if (!vt) continue;

      decorateVerseText(vt, ch, v);
    }
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

  // -------------------- handlers --------------------
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
    // Carga masterdiccionario una sola vez (no depende del libro)
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
