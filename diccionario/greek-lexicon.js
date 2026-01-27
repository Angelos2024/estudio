/* diccionario/greek-lexicon.js
   - Convierte cada palabra griega en <span class="gk-w">...</span>
   - Click izquierdo abre popup (NO interfiere con click derecho)
*/
(function () {
  // ✅ tu JSON está dentro de /diccionario
  var MORPH_URL = './diccionario/mt-morphgnt.translit.json';

  var morph = null; // estructura del JSON
  var observing = false;
  var decorating = false;

  function esc(s) {
    s = String(s == null ? '' : s);
    return s
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function safeText(x) {
    return (x == null) ? '' : String(x);
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

  // mt-morphgnt.translit.json (Mt) viene segmentado:
  // - chapters[9]  => caps 1–9    index = ch*100 + (v-1)
  // - chapters[10] => caps 10–19  index = (ch-10)*100 + (v-1)
  // - chapters[11] => caps 20–28  index = (ch-20)*100 + (v-1)
  function getMtTokens(ch, v) {
    if (!morph) return null;

    // algunas versiones traen book:"Mt", otras no; lo dejamos flexible
    var chapters = morph.chapters || morph;
    if (!chapters) return null;

    var seg = null;
    if (ch <= 9) seg = chapters[9];
    else if (ch <= 19) seg = chapters[10];
    else seg = chapters[11];

    if (!seg) return null;

    var idx;
    if (ch <= 9) idx = (ch * 100 + (v - 1));
    else if (ch <= 19) idx = ((ch - 10) * 100 + (v - 1));
    else idx = ((ch - 20) * 100 + (v - 1));

    var tokens = seg[idx];
    return Array.isArray(tokens) ? tokens : null;
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
      '  padding: 12px 12px;',
      '  color: #e9eefc;',
      '  display:none;',
      '}',
      '.gk-lex-popup .t1{ font-weight: 700; font-size: 14px; margin-bottom: 6px; }',
      '.gk-lex-popup .t2{ font-size: 13px; opacity: .92; line-height: 1.35; }',
      '.gk-lex-popup .lab{ opacity: .70; margin-right: 6px; }',
      '.gk-lex-popup .close{',
      '  position:absolute; right:10px; top:8px;',
      '  background: transparent; border:0; color:#cbd6ff; cursor:pointer;',
      '  font-size: 16px; line-height: 1;',
      '}'
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

    // click fuera cierra (sin interferir con tu UI)
    document.addEventListener('click', function (e) {
      var p = document.getElementById('gk-lex-popup');
      if (!p || p.style.display === 'none') return;
      if (p.contains(e.target)) return;
      p.style.display = 'none';
    }, false);
  }

  function showPopupNear(anchorEl, g, lemma, tr) {
    ensurePopup();

    var pop = document.getElementById('gk-lex-popup');
    var title = document.getElementById('gk-lex-title');
    var body = document.getElementById('gk-lex-body');

    title.textContent = safeText(g);

    var html = '';
    if (lemma) html += '<div><span class="lab">Lema:</span><b>' + esc(lemma) + '</b></div>';
    if (tr) html += '<div><span class="lab">Translit:</span>' + esc(tr) + '</div>';
    if (!html) html = '<div class="lab">Sin datos</div>';

    body.innerHTML = html;

    var r = anchorEl.getBoundingClientRect();
    var x = Math.min(r.left, window.innerWidth - 24 - 420);
    var y = r.bottom + 8;

    pop.style.left = Math.max(12, x) + 'px';
    pop.style.top = Math.max(12, y) + 'px';
    pop.style.display = 'block';
  }

  function decorateMatthewRange(rootEl, ch, v1, v2) {
    // Solo si el panel realmente está en modo griego
    if (!rootEl.classList || !rootEl.classList.contains('greek')) return;

    var lines = rootEl.querySelectorAll('.verse-line[data-side="orig"][data-ch][data-v]');
    if (!lines || !lines.length) return;

    for (var i = 0; i < lines.length; i++) {
      var line = lines[i];
      var v = parseInt(line.getAttribute('data-v'), 10);
      var chLine = parseInt(line.getAttribute('data-ch'), 10);
      if (isNaN(v) || isNaN(chLine)) continue;
      if (chLine !== ch) continue;
      if (v < v1 || v > v2) continue;

      var verseText = line.querySelector('.verse-text');
      if (!verseText) continue;

      // ya decorado
      if (verseText.querySelector('.gk-w')) continue;

      var tokens = getMtTokens(ch, v);
      if (!tokens) continue;

      var out = [];
      for (var t = 0; t < tokens.length; t++) {
        var tok = tokens[t] || {};
        var g = tok.g ? safeText(tok.g) : '';
        var lemma = tok.lemma ? safeText(tok.lemma) : '';
        var tr = tok.tr ? safeText(tok.tr) : '';
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
      // SOLO click izquierdo; no tocamos click derecho
      if (e.button !== 0) return;

      var target = e.target;
      if (!target) return;

      var w = (target.closest ? target.closest('.gk-w') : null);
      if (!w) return;

      // Si hay selección activa (usuario marcando para subrayar), NO abrir popup
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
      if (decorating) return;
      try {
        decorating = true;

        var first = rootEl.querySelector('.verse-line[data-side="orig"][data-ch][data-v]');
        var last = rootEl.querySelector('.verse-line[data-side="orig"][data-ch][data-v]:last-of-type');
        if (!first) return;

        // por ahora solo Mateo (tu JSON es Mt)
        var ch = parseInt(first.getAttribute('data-ch'), 10);
        var v1 = parseInt(first.getAttribute('data-v'), 10);
        var v2 = last ? parseInt(last.getAttribute('data-v'), 10) : v1;

        if (!isNaN(ch) && !isNaN(v1) && !isNaN(v2)) {
          decorateMatthewRange(rootEl, ch, v1, v2);
          attachLeftClickHandler(rootEl);
        }
      } catch (err) {
        console.warn('[GreekLexicon] observer error:', err);
      } finally {
        decorating = false;
      }
    });

    obs.observe(rootEl, { childList: true, subtree: true });
  }

  function init() {
    loadMorphOnce()
      .then(function () {
        observeOrigPanel();

        // intento inmediato (por si ya había contenido renderizado)
        var rootEl = document.getElementById('passageTextOrig');
        if (!rootEl) return;

        setTimeout(function () {
          var first = rootEl.querySelector('.verse-line[data-side="orig"][data-ch][data-v]');
          var last = rootEl.querySelector('.verse-line[data-side="orig"][data-ch][data-v]:last-of-type');
          if (!first) return;

          var ch = parseInt(first.getAttribute('data-ch'), 10);
          var v1 = parseInt(first.getAttribute('data-v'), 10);
          var v2 = last ? parseInt(last.getAttribute('data-v'), 10) : v1;

          if (!isNaN(ch) && !isNaN(v1) && !isNaN(v2)) {
            decorateMatthewRange(rootEl, ch, v1, v2);
            attachLeftClickHandler(rootEl);
          }
        }, 0);
      })
      .catch(function (err) {
        console.warn('[GreekLexicon] init error:', err);
      });
  }

  // auto-init
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.GreekLexicon = { init: init };
})();
