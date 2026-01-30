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

    let index = null;
    let enabled = false;

    // Cache del último estado seleccionado
    let lastSel = { book: null, ch: null, v: null };

    function setButtonState(){
      // opcional: cambia apariencia cuando está activo
      btn.classList.toggle('btn-primary', enabled);
      btn.classList.toggle('btn-soft', !enabled);
    }

    async function loadIndex(){
      if(index) return index;
      const res = await fetch("./NA28/out/index.json?v=1", { cache: "no-store" });
      if(!res.ok) throw new Error(`No se pudo cargar ./NA28/out/index.json (HTTP ${res.status})`);
      index = await res.json();
      return index;
    }

    function fillBooks(idx){
      const books = Object.keys(idx || {}).sort();
      selBook.innerHTML = books.map(b => `<option value="${b}">${b}</option>`).join("");
    }

    function fillChapters(book){
      const chs = Object.keys(index?.[book] || {})
        .map(n => Number(n))
        .filter(n => Number.isFinite(n))
        .sort((a,b)=>a-b)
        .map(String);

      selCh.innerHTML = chs.map(c => `<option value="${c}">${c}</option>`).join("");
    }

    function fillVerses(book, ch){
      const vs = Object.keys(index?.[book]?.[ch] || {})
        .map(n => Number(n))
        .filter(n => Number.isFinite(n))
        .sort((a,b)=>a-b)
        .map(String);

      selV.innerHTML = vs.map(v => `<option value="${v}">${v}</option>`).join("");
    }

    function tryRestoreSelection(){
      if(lastSel.book && index?.[lastSel.book]){
        selBook.value = lastSel.book;
      }
      fillChapters(selBook.value);

      if(lastSel.ch && index?.[selBook.value]?.[lastSel.ch]){
        selCh.value = lastSel.ch;
      }
      fillVerses(selBook.value, selCh.value);

      if(lastSel.v && index?.[selBook.value]?.[selCh.value]?.[lastSel.v]){
        selV.value = lastSel.v;
      }
    }

    async function renderCurrent(){
      const book = selBook.value;
      const ch = selCh.value;
      const v = selV.value;

      lastSel = { book, ch, v };

      const rel = index?.[book]?.[ch]?.[v];
      if(!rel){
        viewer.innerHTML = `<div class="text-muted">No hay archivo para ${book} ${ch}:${v}</div>`;
        return;
      }

      viewer.innerHTML = `<div class="text-muted">Cargando...</div>`;
      const res = await fetch(`./NA28/out/${rel}?v=1`, { cache: "no-store" });
      if(!res.ok){
        viewer.innerHTML = `<div class="text-danger">Error cargando ${book} ${ch}:${v} (HTTP ${res.status})</div>`;
        return;
      }
const html = await res.text();

// 🔒 Encapsular para que el CSS NA28-Es aplique solo aquí
viewer.innerHTML = `<div class="na28es-container">${html}</div>`;

// 🧹 Si por error llega un HTML completo, eliminar head/body/doctype visibles
// (no es obligatorio, pero evita basura incrustada)
const wrap = viewer.querySelector(".na28es-container");
if (wrap) {
  // quitar doctype si llega como texto
  wrap.innerHTML = wrap.innerHTML.replace(/<!doctype[^>]*>/ig, "");

  // si vienen <html>, <head>, <body>, dejarlos fuera (mantener solo lo útil)
  const bodyMatch = wrap.querySelector("body");
  if (bodyMatch) {
    wrap.innerHTML = bodyMatch.innerHTML;
  }
}

    }

    async function enable(){
      await loadIndex();

      // preparar selects
      fillBooks(index);
      tryRestoreSelection();

      // si no había selección previa, forzar primera opción válida
      if(!selBook.value) selBook.value = Object.keys(index)[0] || "";
      if(selBook.value){
        fillChapters(selBook.value);
        if(!selCh.value) selCh.value = Object.keys(index[selBook.value] || {})[0] || "";
        if(selCh.value){
          fillVerses(selBook.value, selCh.value);
          if(!selV.value) selV.value = Object.keys(index[selBook.value]?.[selCh.value] || {})[0] || "";
        }
      }

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
      fillChapters(selBook.value);
      fillVerses(selBook.value, selCh.value);
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
