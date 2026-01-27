// comentarios/comentarios.js
(function(){
  async function ensureCommentsUI(){
    if (document.getElementById('cm-template')) return;

    const res = await fetch('./comentarios/ui.html', { cache: 'no-store' });
    if(!res.ok) throw new Error('No se pudo cargar comentarios/ui.html');

    const html = await res.text();
    const wrap = document.createElement('div');
    wrap.innerHTML = html;

    // Inserta estilos + template en <body> (o al final)
    document.body.appendChild(wrap);
  }

  function esc(s){
    return String(s ?? '').replace(/[&<>"']/g, m => ({
      '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
    }[m]));
  }

  function textToSafeHtml(t){
    // texto plano -> html seguro + saltos
    const normalized = String(t ?? '').replace(/\r\n/g, '\n');
    return esc(normalized).replace(/\n/g, '<br>');
  }

  async function loadChapterComments(bookSlug, chapter){
    // ejemplo: ./comentarios/galatas/1.json
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

    // Busca todos los versos RV renderizados
    const verseNodes = containerEl.querySelectorAll(`.verse-line[data-side="rv"][data-book="${CSS.escape(bookSlug)}"][data-ch="${CSS.escape(String(chapter))}"]`);

    verseNodes.forEach(p => {
      const v = p.getAttribute('data-v');
      if(!v) return;

      const comment = chapterComments[String(v)];
      if(!comment) return; // SOLO crea UI si hay comentario

      // Evita duplicado si re-render
     if (p.querySelector('.cm-details')) return;


     const frag = tpl.content.cloneNode(true);
const body = frag.querySelector('.cm-body');
body.innerHTML = textToSafeHtml(comment);

// ✅ Insertar ANTES del número del versículo
// ✅ Forzar icono + número en el mismo "ancla" inline
const verseNum = p.querySelector('.verse-num');

if (verseNum) {
  // Evita duplicados si re-render
  if (p.querySelector('.cm-anchor')) return;

  const anchor = document.createElement('span');
  anchor.className = 'cm-anchor';

  // Inserta el ancla antes del número
  verseNum.parentNode.insertBefore(anchor, verseNum);

  // Dentro del ancla: primero icono, luego número
  anchor.appendChild(frag);
  anchor.appendChild(verseNum);
} else {
  // fallback
  p.prepend(frag);
}


    });
  }

  // API pública
  window.BibleComments = {
    attachCommentsToRV
  };
})();
