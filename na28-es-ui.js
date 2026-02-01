(() => {
  function $(id){ return document.getElementById(id); }

  function show(el){
if(!el) return;
    el.classList.remove('d-none');
    el.style.display = '';
  }
  function hide(el){
    if(!el) return;
    el.classList.add('d-none');
    el.style.display = 'none';
  }
 
   async function initNA28(){
     const btn = $("btnNA28Es");
     const na28Panel = $("na28Panel");
     const biblePanel = $("biblePanel"); // ✅ lo agregaste en tu panel-body
     const selBook = $("na28Book");
     const selCh = $("na28Chapter");
     const selV = $("na28Verse");
     const viewer = $("na28Viewer");
 
     // Si aún no están en el DOM, no hacemos nada (evita errores silenciosos)
     if(!btn || !na28Panel || !biblePanel || !selBook || !selCh || !selV || !viewer){
       console.warn("[NA28-Es] Faltan elementos en el DOM. Revisa ids: btnNA28Es, biblePanel, na28Panel, na28Book, na28Chapter, na28Verse, na28Viewer");
       return;
     }

   

    const NA28_BOOKS = [
     'mateo','marcos','lucas','juan','hechos',
      'romanos','1_corintios','2_corintios','galatas','efesios','filipenses','colosenses',
      '1_tesalonicenses','2_tesalonicenses','1_timoteo','2_timoteo','tito','filemon',
      'hebreos','santiago','1_pedro','2_pedro','1_juan','2_juan','3_juan','judas','apocalipsis'
  ];


     let enabled = false;
      const INDEX_PATH = './NA28/out/index.json';
    let na28Index = null;
 
     // Cache del último estado seleccionado
     let lastSel = { book: null, ch: null, v: null };
 
     function setButtonState(){
       // opcional: cambia apariencia cuando está activo
       btn.classList.toggle('btn-primary', enabled);
       btn.classList.toggle('btn-soft', !enabled);
     }
 
   

   async function loadIndex(){
      try{
        const res = await fetch(`${INDEX_PATH}?v=${Date.now()}`, { cache: "no-store" });
        if(!res.ok) throw new Error(`No se pudo cargar index.json (HTTP ${res.status})`);
        const data = await res.json();
        if(!data || typeof data !== "object") throw new Error("Formato inválido en index.json");
        return data;
      }catch(err){
        console.warn("[NA28-Es]", err);
     return null;
      }
   
function getAvailableBooks(index){
      const available = index ? Object.keys(index) : [];
      return NA28_BOOKS.filter(book => available.includes(book));
    }
       function numericKeys(obj){
      return Object.keys(obj || {}).sort((a, b) => Number(a) - Number(b));
    }
 
 function fillBooks(){
      const books = getAvailableBooks(na28Index);
      if(books.length === 0){
        selBook.innerHTML = `<option value="">No hay libros disponibles</option>`;
        return;
      }
      selBook.innerHTML = books.map(b => `<option value="${b}">${b}</option>`).join("");
    }

    function fillChapters(book){
      const chapters = numericKeys(na28Index?.[book]);
      if(chapters.length === 0){
        selCh.innerHTML = `<option value="">No hay capítulos</option>`;
        return;
      }
      selCh.innerHTML = chapters.map(value => `<option value="${value}">${value}</option>`).join("");
    }

    function fillVerses(book, ch){
      const verses = numericKeys(na28Index?.[book]?.[ch]);
      if(verses.length === 0){
        selV.innerHTML = `<option value="">No hay versos</option>`;
        return;
      }
      selV.innerHTML = verses.map(value => `<option value="${value}">${value}</option>`).join("");
    }

    async function syncSelection(useLastSelection = false){
      if(useLastSelection && lastSel.book && na28Index?.[lastSel.book]){
        selBook.value = lastSel.book;
      }

       if(!selBook.value){
        selCh.innerHTML = "";
        selV.innerHTML = "";
        return;
      }

     fillChapters(selBook.value);
      if(useLastSelection && lastSel.ch && na28Index?.[selBook.value]?.[lastSel.ch]){
        selCh.value = lastSel.ch;
      }

      fillVerses(selBook.value, selCh.value);
      if(useLastSelection && lastSel.v && na28Index?.[selBook.value]?.[selCh.value]?.[lastSel.v]){
        selV.value = lastSel.v;
      }
    }
   function buildNA28Paths(book, ch, v){
      return [
        `./NA28/out/libros/${book}/${ch}/${ch}_${v}.html`,
        `./NA28/out/libros/${book}/${ch}/${v}.html`
      ];
    }

 async function renderCurrent(){
   const book = selBook.value;
   const ch = selCh.value;
   const v = selV.value;
 
   lastSel = { book, ch, v };
    if(!book || !ch || !v){
    viewer.innerHTML = `<div class="text-muted">No hay selección disponible.</div>`;
    return;
  }

  const candidates = buildNA28Paths(book, ch, v);
  let htmlText = null;
  let lastError = null;

  for(const path of candidates){
    try{
      const res = await fetch(`${path}?v=1`, { cache: "no-store" });
      if(res.ok){
       htmlText = await res.text();
       break;
      }
      if(res.status !== 404){
        lastError = `HTTP ${res.status}`;
        break;
      }
    }catch(err){
      lastError = err?.message || String(err);
      break;
   }
   }
 

  if(!htmlText){
    const detail = lastError ? ` (${lastError})` : "";
    viewer.innerHTML = `<div class="text-muted">No hay archivo para ${book} ${ch}:${v}${detail}</div>`;
    return;
  }
 
   // 🔒 Encapsular para que el CSS NA28-Es aplique solo aquí
   viewer.innerHTML = `<div class="na28es-container">${htmlText}</div>`;
 
   // 🧹 Quitar doctype si llega como texto (algunos HTML lo traen)
   const wrap = viewer.querySelector(".na28es-container");
   if (wrap) {
     wrap.innerHTML = wrap.innerHTML.replace(/<!doctype[^>]*>/ig, "");
   }
 }
 
 
     async function enable(){
        na28Index = await loadIndex();
      fillBooks();
 const availableBooks = getAvailableBooks(na28Index);
     if(!selBook.value) selBook.value = availableBooks[0] || "";
    await syncSelection(true);
 
       // mostrar NA28 y ocultar Biblia normal
       hide(biblePanel);
       show(na28Panel);
 
       enabled = true;
       setButtonState();
 
       await renderCurrent();
     }
 
     function disable(){
       hide(na28Panel);
       show(biblePanel);
 
       enabled = false;
       setButtonState();
     }
 
     // Eventos UI
     btn.addEventListener("click", async () => {
       try{
         if(!enabled) await enable();
         else disable();
       }catch(e){
         console.error(e);
         viewer.innerHTML = `<div class="text-danger">No se pudo activar NA28-Es. Revisa consola.</div>`;
       }
     });
 
     selBook.addEventListener("change", async () => {
      await syncSelection(false);
       await renderCurrent();
     });
 
     selCh.addEventListener("change", async () => {
      fillVerses(selBook.value, selCh.value);
       await renderCurrent();
     });
 
     selV.addEventListener("change", renderCurrent);
 
     // Estado inicial del botón
     setButtonState();
   }
 
   // ✅ Garantiza que los elementos existan aunque el script esté en <head>
   if(document.readyState === "loading"){
     document.addEventListener("DOMContentLoaded", initNA28);
   } else {
     initNA28();
   }
 })();
;
