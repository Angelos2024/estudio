(function(){
  const KEY = 'lectorIntroTourV1';
  const page = document.body?.dataset?.tourPage || (location.pathname.includes('busqueda') ? 'busqueda' : location.pathname.includes('analisis/') ? 'analisis' : 'index');

  const steps = [
    {id:'welcome', page:'index', center:true, text:'Bienvenido al espacio de estudio bíblico. ¿Deseas realizar un recorrido guiado por las funciones del sitio?', start:true},
    {id:'warning', page:'index', text:'Solo en caso de iniciar el recorrido. Si decides omitirlo, el tutorial se perderá y ya no volverá a aparecer; solo se muestra a usuarios nuevos.', target:'#searchInput'},
    {id:'menuLibros', page:'index', text:'Aquí podrás encontrar los libros disponibles, organizados por libro y capítulo.', target:'#bookMenuToggle'},
    {id:'searchRefs', page:'index', text:'También podrás introducir abreviaturas o referencias de versículos, como: Gen 1, Génesis 1, Génesis 1:1, Génesis 1:1-4.', target:'#searchInput'},
    {id:'searchWords', page:'index', text:'Además de versículos, podrás realizar búsquedas de palabras, frases o textos en hebreo, griego y español.', target:'#searchInput'},
    {id:'searchDios', page:'index', text:'Se introduce automáticamente la palabra “Dios” y se indica dar clic en “Buscar”.', target:'#searchForm button[type="submit"]', action:'searchDios'},
    {id:'busquedaAbrir', page:'busqueda', text:'Podrás visualizar las coincidencias de los textos introducidos en hebreo, griego y español, para acceder más rápido a los resultados.', target:'.btn.btn-primary.btn-sm, a.btn.btn-primary.btn-sm', action:'openFirstResult'},
    {id:'hebrewWord', page:'index', text:'Podrás consultar diccionarios al dar clic en palabras en hebreo o griego, según corresponda. Se hará clic automáticamente en el botón “Expandir” para mostrar el contenido.', target:'#passageTextOrig .verse-line[data-side="orig"]', action:'openHebrewLexicon'},
    {id:'textosCruzados', page:'index', text:'Podrás añadir textos cruzados de relación para cada texto que desees agregar.', target:'.xrefs-add'},
    {id:'clickDerecho', page:'index', text:'Podrás, al hacer clic derecho, remarcar palabras o agregar notas propias. Estas se almacenan en tu dispositivo.', target:'#passageTextRV .verse-line[data-side="rv"]'},
    {id:'notasBtn', page:'index', text:'Aquí podrás ver y buscar toda la lista de tus notas agregadas.', target:'#btnNotas'},
    {id:'comentariosBtn', page:'index', text:'Al dar clic aquí, podrás ver los comentarios del texto conforme a los aportes del Hno. Eric de Jesús Rodríguez Mendoza.', target:'.cm-summary, .cm-icon'},
    {id:'respaldo', page:'index', text:'Aquí podrás compartir o realizar un respaldo de tus notas, textos cruzados y subrayados de cada palabra o versículo.', target:'#backupPanelMount .panel-header'},
    {id:'almacenamiento', page:'index', text:'En este sitio, los datos se almacenan en tu dispositivo, por lo que no se volverá lento por añadir más contenido. Sin embargo, si se borra el historial del navegador, podrías perder tus avances. Por ello, es recomendable tener respaldos y evitar eliminar el historial del navegador.', target:'#backupPanelMount'},
    {id:'aparato', page:'index', text:'Se dará clic automáticamente para mostrar el aparato crítico. Aquí podrás ver el aparato crítico del griego al español del Nuevo Testamento. Algunos libros aún están en proceso de finalizarse.', target:'#btnRKANTEs', action:'openAparato'},
    {id:'analisisBtn', page:'index', text:'Aquí podrás consultar palabras para obtener información de más diccionarios.', target:'a[href="analisis/buscador_comparativo.html"]', action:'goAnalysis'},
    {id:'analisisInput', page:'analisis', text:'Aquí podrás introducir palabras en hebreo, griego o español. Solo se aceptan entradas de palabras; pueden ser compuestas o incluir sufijos y prefijos del hebreo y del griego.', target:'#query', action:'backToIndex'},
    {id:'final', page:'index', text:'Se regresará a index.html, donde finalizará el recorrido. Aquí podrás ver la Biblia interlineal o paralela.', target:'#btnViewMode', action:'finish'}
  ];

  function readState(){
    try{ return JSON.parse(localStorage.getItem(KEY)) || {status:'idle', step:0}; }catch{ return {status:'idle', step:0}; }
  }
  function writeState(s){ localStorage.setItem(KEY, JSON.stringify(s)); }
  function qs(sel){ return document.querySelector(sel); }

  function findTarget(step){
    if(!step.target) return null;
    const sel = step.target.split(',').map(s=>s.trim());
    for(const s of sel){ const el = qs(s); if(el) return el; }
    return null;
  }

  function clearUI(){
    document.querySelector('.intro-tour-overlay')?.remove();
    document.querySelector('.intro-tour-bubble')?.remove();
    document.querySelectorAll('.intro-tour-highlight').forEach(el => el.classList.remove('intro-tour-highlight'));
  }

  function bubbleFor(step, target, handlers){
    clearUI();
    const overlay = document.createElement('div');
    overlay.className = 'intro-tour-overlay';
    document.body.appendChild(overlay);

    const bubble = document.createElement('div');
    bubble.className = 'intro-tour-bubble';
    if(step.center) bubble.classList.add('intro-tour-center');
    bubble.innerHTML = `<p>${step.text}</p>`;
    const actions = document.createElement('div');
    actions.className = 'intro-tour-actions';

    if(step.start){
      const startBtn = document.createElement('button');
      startBtn.textContent = 'Iniciar recorrido';
      startBtn.onclick = handlers.onStart;
      const skipBtn = document.createElement('button');
      skipBtn.className = 'intro-tour-skip';
      skipBtn.textContent = 'Omitir';
      skipBtn.onclick = handlers.onSkip;
      actions.append(startBtn, skipBtn);
    } else {
      const closeBtn = document.createElement('button');
      closeBtn.textContent = 'Cerrar';
      closeBtn.onclick = handlers.onClose;
      actions.append(closeBtn);
    }
    bubble.appendChild(actions);
    document.body.appendChild(bubble);

    if(!step.center && target){
      target.classList.add('intro-tour-highlight');
      target.scrollIntoView({behavior:'smooth', block:'center'});
      setTimeout(() => {
        const r = target.getBoundingClientRect();
        const top = Math.min(window.innerHeight - 180, r.bottom + 12 + window.scrollY);
        const left = Math.max(12, Math.min(window.innerWidth - 380, r.left + window.scrollX));
        bubble.style.top = `${top}px`;
        bubble.style.left = `${left}px`;
      }, 40);
    }
  }

  function advance(withAction){
    const state = readState();
    const step = steps[state.step];
    state.step += 1;
    writeState(state);
    clearUI();
    if(withAction && step?.action) runAction(step.action);
    setTimeout(renderCurrent, 120);
  }

  function runAction(action){
    if(action === 'searchDios'){
      const input = qs('#searchInput');
      const btn = qs('#searchForm button[type="submit"]');
      if(input) input.value = 'Dios';
      btn?.click();
    }
    if(action === 'openFirstResult'){
      const firstOpen = qs('button.btn.btn-primary.btn-sm, a.btn.btn-primary.btn-sm');
      firstOpen?.click();
    }
    if(action === 'openHebrewLexicon'){
      const line = qs('#passageTextOrig .verse-line[data-side="orig"]');
      if(line){
        const textNode = Array.from(line.childNodes).find(n => n.nodeType === 3 && /בְּרֵאשִׁית|בראשית/.test(n.nodeValue || ''));
        if(textNode){
          const txt = textNode.nodeValue || '';
          const idx = Math.max(0, txt.indexOf('בְּרֵאשִׁית'));
          const range = document.createRange();
          range.setStart(textNode, idx);
          range.setEnd(textNode, Math.min(txt.length, idx + 8));
          const rect = range.getBoundingClientRect();
          const target = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2) || line;
          target.dispatchEvent(new MouseEvent('click', {bubbles:true, clientX:rect.left + rect.width / 2, clientY:rect.top + rect.height / 2, button:0}));
        }
      }
      setTimeout(() => { qs('#he-lex-toggle, #gr-lex-toggle')?.click(); }, 600);
    }
    if(action === 'openAparato') qs('#btnRKANTEs')?.click();
    if(action === 'goAnalysis') setTimeout(() => { location.href = './analisis/buscador_comparativo.html'; }, 220);
    if(action === 'backToIndex') setTimeout(() => { location.href = '../index.html?search=G%C3%A9nesis%201%3A1&book=genesis&name=G%C3%A9nesis&version=RVR1960&orig=1'; }, 220);
    if(action === 'finish'){
      const state = readState();
      state.status = 'done';
      writeState(state);
    }
  }

  function renderCurrent(){
    const state = readState();
    if(state.status === 'done') return;
    const step = steps[state.step];
    if(!step) return;
    if(step.page !== page) return;

    if(step.start){
      bubbleFor(step, null, {
        onStart: () => { writeState({status:'active', step:1}); renderCurrent(); },
        onSkip: () => { writeState({status:'done', step:steps.length}); clearUI(); }
      });
      return;
    }

    if(state.status !== 'active') return;
    let target = findTarget(step);
    if(!target){
      if(['comentariosBtn','textosCruzados','busquedaAbrir','hebrewWord'].includes(step.id)){
        setTimeout(renderCurrent, 700);
        return;
      }
      advance(false);
      return;
    }

    bubbleFor(step, target, { onClose: () => advance(true) });
  }

  window.addEventListener('DOMContentLoaded', () => setTimeout(renderCurrent, 500));
})();
