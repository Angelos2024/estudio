/* diccionario/greek-lexicon.js  (ES5 puro)
   - Solo decora Mateo usando mt-morphgnt.translit.json
   - Si NO es Mateo, restaura el texto original renderizado por tu app
   - Click izquierdo abre popup
   - NO toca contextmenu (click derecho intacto)
*/
(function () {
  var MORPH_URL = './diccionario/mt-morphgnt.translit.json';

  var morph = null;
  var observing = false;

  function esc(s) {
    s = String(s == null ? '' : s);
    return s
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function loadMorphOnce() {
    if (morph) return Promise.resolve(morph);
    return fetch(MORPH_URL, { cache: 'no-store' })
      .then(function (res) {
        if (!res.ok) throw new Error('No pude cargar ' + MORPH_URL + ' (' + res.status + ')');
        return res.json();
      })
      .then(function (json) {
        morph = json;
        return morph;
      });
  }

  // Parse ES5 del querystring sin URLSearchParams
  function getQueryParam(name) {
    var qs = window.location.search || '';
    if (!qs) return '';
    if (qs.charAt(0) === '?') qs = qs.slice(1);
    var parts = qs.split('&');
    for (var i = 0; i < parts.length; i++) {
      var kv = parts[i].split('=');
      var k = decodeURIComponent(kv[0] || '');
      if (k === name) return decodeURIComponent(kv[1] || '');
    }
    return '';
  }

  function isMateoNow() {
    var b = (getQueryParam('book') || '').toLowerCase();
    // en tu site usas ?book=mateo
    if (b === 'mateo') return true;
    if (b === 'mt') return true;
    // por si en algún momento usas inglés
    if (b.indexOf('matt') !== -1) return true;
    return false;
  }

  // Restaura el texto original (sin spans), usando lo que guardamos en data-raw
  function restoreRawGreek(rootEl) {
    if (!rootEl) return;
    var vts = rootEl.querySelectorAll('.verse-line[data-side="orig"] .verse-text');
    for (var i = 0; i < vts.length; i++) {
      var vt = vts[i];
      var raw = vt.getAttribute('data-raw');
      if (raw != null && raw !== '') {
        vt.textContent = raw;        // vuelve a texto plano
        vt.removeAttribute('data-raw');
      } else {
        // Si no había data-raw pero sí quedaron spans, lo dejamos en texto plano del contenido actual
        if (vt.querySelector && vt.querySelector('.gk-w')) {
          vt.textContent = vt.textContent || '';
        }
      }
    }
  }

  // Tu JSON de Mt está segmentado en chapters[9/10/11] con índice por 100
  function getMtTokens(ch, v) {
    if (!morph) return null;

    var chapters = morph.chapters || morph;
    if (!chapters) return null;

    var seg = null;
    if (ch <= 9) seg = chapters[9];
    else if (ch <= 19) seg = chapters[10];
    else seg = chapters[11];

    if (!seg) return null;

    var idx = 0;
    if (ch <= 9) idx = (ch * 100 + (v - 1));
    else if (ch <= 19) idx = ((ch - 10) * 100 + (v - 1));
    else idx = ((ch - 20) * 100 + (v - 1));

    var tokens = seg[idx];
    if (Array.isArray(tokens)) return tokens;
    return null;
  }

  function ensurePopup() {
    if (document.getElementById('gk-lex-popup')) return;

    var st = document.createElement('style');
    st.id = 'gk-lex-style';
    st.textContent = [
      '.gk-w{ cursor:pointer; }',
      '.gk-w:hover{ text-decoration: underline; }',
      '.gk-lex-popup{',
      '  position: fixed; z-index: 9999;',
      '  min-width: 260px; max-width: min(420px, calc(100vw - 24px));',
      '  background: rgba(17,26,46,.98);',
      '  border: 1px solid rgba(255,255,255,.10);',
      '  border-radius: 14px;',
      '  box-shadow: 0 20px 50px rgba(0,0,0,.35);',
      '  padding: 12px;',
      '  color: #e9eefc;',
      '  display:none;',
      '}',
      '.gk-lex-popup .t1{ font-weight:700; font-size:14px; margin-bottom:6px; padding-right:18px; }',
      '.gk-lex-popup .t2{ font-size:13px; opacity:.92; line-height:1.35; }',
      '.gk-lex-popup .lab{ opacity:.70; margin-right:6px; }',
      '.gk-lex-popup .close{ position:absolute; right:10px; top:8px; background:transparent; border:0; color:#cbd6ff; cursor:pointer; font-size:16px; }'
    ].join('\n');
    document.head.appendChild(st);

    var pop = document.createElement('div');
    pop.id = 'gk-lex-popup';
    pop.className = 'gk-lex-popup';
    pop.innerHTML =
      '<button class="close" type="button" aria-label="Cerrar">×</button>' +
      '<div class="t1" id="gk-lex-title"></div>' +
      '<div class="t2" id="gk-lex-body"></div>';

    document.body.appendChild(pop);

    pop.querySelector('.close').addEventListener('click', function () {
      pop.style.display = 'none';
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') pop.style.display = 'none';
    });

    document.addEventListener('click', function (e) {
      var p = document.getElementById('gk-lex-popup');
      if (!p || p.style.display === 'none') return;
      if (p.contains(e.target)) return;
      if (e.target && e.target.closest && e.target.closest('.gk-w')) return;
      p.style.display = 'none';
    }, false);
  }

  function showPopupNear(anchorEl, g, lemma, tr) {
    ensurePopup();

    var pop = document.getElementById('gk-lex-popup');
    var title = document.getElementById('gk-lex-title');
    var body = document.getElementById('gk-lex-body');

    title.textContent = g || '';

    var html = '';
    if (lemma) html += '<div><span class="lab">Lema:</span><b>' + esc(lemma) + '</b></div>';
    if (tr) html += '<div><span class="lab">Translit:</span>' + esc(tr) + '</div>';
    if (!html) html = '<div class="lab">Sin datos</div>';

    body.innerHTML = html;

    var r = anchorEl.getBoundingClientRect();
    var x = r.left;
    var y = r.bottom + 8;

    if (x < 12) x = 12;
    if (y < 12) y = 12;

    pop.style.left = x + 'px';
    pop.style.top = y + 'px';
    pop.style.display = 'block';
  }

  // ✅ Decora SOLO cuando el libro actual es Mateo.
  // ✅ Si no es Mateo, restaura y sale.
  function decorateVisibleOrigPanel(rootEl) {
    if (!rootEl) return;
    if (!rootEl.classList || !rootEl.classList.contains('greek')) return;

    if (!isMateoNow()) {
      restoreRawGreek(rootEl);
      return;
    }

    var lines = rootEl.querySelectorAll('.verse-line[data-side="orig"][data-ch][data-v]');
    if (!lines || !lines.length) return;

    for (var i = 0; i < lines.length; i++) {
      var line = lines[i];
      var ch = parseInt(line.getAttribute('data-ch'), 10);
      var v = parseInt(line.getAttribute('data-v'), 10);
      if (isNaN(ch) || isNaN(v)) continue;

      var verseText = line.querySelector('.verse-text');
      if (!verseText) continue;

      // Guardar texto original antes de tocar el DOM (solo 1 vez)
      if (!verseText.getAttribute('data-raw')) {
        verseText.setAttribute('data-raw', verseText.textContent || '');
      }

      // ya decorado
      if (verseText.querySelector && verseText.querySelector('.gk-w')) continue;

      var tokens = getMtTokens(ch, v);
      if (!tokens) continue;

      var out = [];
      for (var t = 0; t < tokens.length; t++) {
        var tok = tokens[t] || {};
        var g = tok.g ? String(tok.g) : '';
        var lemma = tok.lemma ? String(tok.lemma) : '';
        var tr = tok.tr ? String(tok.tr) : '';
        out.push(
          '<span class="gk-w" data-lemma="' + esc(lemma) + '" data-tr="' + esc(tr) + '">' +
          esc(g) +
          '</span>'
        );
      }

      verseText.innerHTML = out.join(' ');
    }
  }

  function attachLeftClickHandler(rootEl) {
    if (!rootEl || rootEl.__gkLexClickBound) return;
    rootEl.__gkLexClickBound = true;

    rootEl.addEventListener('click', function (e) {
      // solo click izquierdo
      if (e.button !== 0) return;

      // si no es Mateo, no abrir nada
      if (!isMateoNow()) return;

      var w = e.target && e.target.closest ? e.target.closest('.gk-w') : null;
      if (!w) return;

      // si hay selección (para subrayar), no abrir popup
      var sel = window.getSelection ? window.getSelection() : null;
      if (sel && String(sel).trim().length > 0) return;

      var lemma = w.getAttribute('data-lemma') || '';
      var tr = w.getAttribute('data-tr') || '';
      var g = w.textContent || '';
      showPopupNear(w, g, lemma, tr);
    }, false);
  }

  function observeOrigPanel() {
    if (observing) return;

    var rootEl = document.getElementById('passageTextOrig');
    if (!rootEl) return;

    observing = true;

    var obs = new MutationObserver(function () {
      try {
        decorateVisibleOrigPanel(rootEl);
        attachLeftClickHandler(rootEl);
      } catch (err) {
        console.warn('[GreekLexicon] observer error:', err);
      }
    });

    obs.observe(rootEl, { childList: true, subtree: true });

    // primer intento
    decorateVisibleOrigPanel(rootEl);
    attachLeftClickHandler(rootEl);
  }

  function init() {
    loadMorphOnce()
      .then(function () {
        observeOrigPanel();
      })
      .catch(function (err) {
        console.warn('[GreekLexicon] init error:', err);
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.GreekLexicon = { init: init };
})();
