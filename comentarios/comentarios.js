// comentarios/comentarios.js
(function(){
  async function ensureCommentsUI(){
    if (document.getElementById('cm-template')) return;

    const res = await fetch('./comentarios/ui.html', { cache: 'no-store' });
    if(!res.ok) throw new Error('No se pudo cargar comentarios/ui.html');

    const html = await res.text();
    const wrap = document.createElement('div');
    wrap.innerHTML = html;

    // Inserta estilos + template en <body>
    document.body.appendChild(wrap);
  }

  function esc(s){
    return String(s ?? '').replace(/[&<>"']/g, m => ({
      '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
    }[m]));
  }

  function textToSafeHtml(t){
    const normalized = String(t ?? '').replace(/\r\n/g, '\n');
    return esc(normalized).replace(/\n/g, '<br>');
  }

  async function loadChapterComments(bookSlug, chapter){
    const url = `./comentarios/${encodeURIComponent(bookSlug)}/${encodeURIComponent(String(chapter))}.json`;
    const res = await fetch(url, { cache: 'no-store' });
    if(!res.ok) return null;
    try{
      const data = await res.json();
      if(!data || typeof data !== 'object') return null;
      return data;
    }catch{
      return null;
    }
  }

  async function attachCommentsToRV(containerEl, bookSlug, chapter){
    await ensureCommentsUI();

    const chapterComments = await loadChapterComments(bookSlug, chapter);
    if(!chapterComments) return;

    const tpl = document.getElementById('cm-template');
    if(!tpl) return;

    const verseNodes = containerEl.querySelectorAll(
      `.verse-line[data-side="rv"][data-book="${CSS.escape(bookSlug)}"][data-ch="${CSS.escape(String(chapter))}"]`
    );

    verseNodes.forEach(p => {
      const v = p.getAttribute('data-v');
      if(!v) return;

      const comment = chapterComments[String(v)];
      if(!comment) return; // solo versos con comentario

      // ✅ Anti-duplicado: si ya hay un details justo debajo, no reinserta
      const next = p.nextElementSibling;
      if (next && next.classList && next.classList.contains('cm-details')) return;

      const frag = tpl.content.cloneNode(true);
      const details = frag.querySelector('.cm-details');
      const body = frag.querySelector('.cm-body');
      body.innerHTML = textToSafeHtml(comment);

      // ✅ Insertar el details COMPLETO debajo del verso
      p.after(details);
    });
  }

  window.BibleComments = { attachCommentsToRV };
})();
