(() => {
  function $(id){ return document.getElementById(id); }

  function show(el){
diff --git a/na28-es-ui.js b/na28-es-ui.js
index 5b58ed1742468c2ee5842468f3f5e86a34f903a2..88616d23e4a6f05a9b92652a9a115c20337e7eb9 100644
--- a/na28-es-ui.js
+++ b/na28-es-ui.js
@@ -5,191 +5,222 @@
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

    const params = new URLSearchParams(window.location.search);
    const RV_BASE = params.get('rvBase') || './librosRV1960/';

    const NA28_BOOKS = [
     'mateo','marcos','lucas','juan','hechos',
      'romanos','1_corintios','2_corintios','galatas','efesios','filipenses','colosenses',
      '1_tesalonicenses','2_tesalonicenses','1_timoteo','2_timoteo','tito','filemon',
      'hebreos','santiago','1_pedro','2_pedro','1_juan','2_juan','3_juan','judas','apocalipsis'
  ];

    const bookCache = new Map();
     let enabled = false;
 
     // Cache del último estado seleccionado
     let lastSel = { book: null, ch: null, v: null };
 
     function setButtonState(){
       // opcional: cambia apariencia cuando está activo
       btn.classList.toggle('btn-primary', enabled);
       btn.classList.toggle('btn-soft', !enabled);
     }
 
    function fillBooks(){
      selBook.innerHTML = NA28_BOOKS.map(b => `<option value="${b}">${b}</option>`).join("");
     }

    async function loadBookData(book){
      if(bookCache.has(book)) return bookCache.get(book);
 

     try{
        const res = await fetch(`${RV_BASE}${book}.json`, { cache: "no-store" });
        if(!res.ok) throw new Error(`No se pudo cargar ${book}.json (HTTP ${res.status})`);
        const data = await res.json();
        if(!Array.isArray(data)) throw new Error(`Formato inválido en ${book}.json`);
        bookCache.set(book, data);
        return data;
      }catch(err){
        console.warn("[NA28-Es]", err);
       bookCache.set(book, null);
       return null;
      }
     }
 

    function fillChapters(bookData){
      const count = Array.isArray(bookData) ? bookData.length : 0;
      selCh.innerHTML = Array.from({ length: count }, (_, i) => {
        const value = String(i + 1);
        return `<option value="${value}">${value}</option>`;
     }).join("");
    }
 

    function fillVerses(bookData, ch){
      const chapterIndex = Number(ch) - 1;
      const verses = Array.isArray(bookData?.[chapterIndex]) ? bookData[chapterIndex] : [];
      selV.innerHTML = verses.map((_, i) => {
        const value = String(i + 1);
        return `<option value="${value}">${value}</option>`;
      }).join("");
     }
 
    async function syncSelection(){
      if(lastSel.book && NA28_BOOKS.includes(lastSel.book)){
         selBook.value = lastSel.book;
       }

      const bookData = await loadBookData(selBook.value);
      fillChapters(bookData);

      if(lastSel.ch && Number(lastSel.ch) <= (bookData?.length || 0)){
         selCh.value = lastSel.ch;
       }
 

      fillVerses(bookData, selCh.value);

     const verseCount = Array.isArray(bookData?.[Number(selCh.value) - 1])
       ? bookData[Number(selCh.value) - 1].length
       : 0;
      if(lastSel.v && Number(lastSel.v) <= verseCount){
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
      fillBooks();

     if(!selBook.value) selBook.value = NA28_BOOKS[0] || "";
     await syncSelection();
 
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
      await syncSelection();
       await renderCurrent();
     });
 
     selCh.addEventListener("change", async () => {

      const bookData = await loadBookData(selBook.value);
      fillVerses(bookData, selCh.value);
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
