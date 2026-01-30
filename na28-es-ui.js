(() => {
  const btn = document.getElementById("btnNA28Es");
  const panel = document.getElementById("na28Panel");
  const selBook = document.getElementById("na28Book");
  const selCh = document.getElementById("na28Chapter");
  const selV = document.getElementById("na28Verse");
  const viewer = document.getElementById("na28Viewer");

  // Ajusta estos ids a TU layout real:
  // contenedores donde hoy muestras la biblia (RVR + original)
  const bibleLeft = document.getElementById("passageTextRV");
  const bibleRight = document.getElementById("passageTextOrig");

  let index = null;
  let na28Enabled = false;

  function setVisible(el, on){
    if(!el) return;
    el.style.display = on ? "" : "none";
  }

  async function loadIndex(){
    if(index) return index;
    const res = await fetch("./NA28/out/index.json?v=1", { cache: "no-cache" });
    if(!res.ok) throw new Error("No se pudo cargar index.json");
    index = await res.json();
    return index;
  }

  function fillBooks(idx){
    const books = Object.keys(idx).sort();
    selBook.innerHTML = books.map(b => `<option value="${b}">${b}</option>`).join("");
  }

  function fillChapters(book){
    const chs = Object.keys(index[book] || {})
      .map(n => Number(n))
      .sort((a,b)=>a-b)
      .map(n => String(n));
    selCh.innerHTML = chs.map(c => `<option value="${c}">${c}</option>`).join("");
  }

  function fillVerses(book, ch){
    const vs = Object.keys((index[book] && index[book][ch]) || {})
      .map(n => Number(n))
      .sort((a,b)=>a-b)
      .map(n => String(n));
    selV.innerHTML = vs.map(v => `<option value="${v}">${v}</option>`).join("");
  }

  async function renderCurrent(){
    const book = selBook.value;
    const ch = selCh.value;
    const v = selV.value;

    const rel = index?.[book]?.[ch]?.[v];
    if(!rel){
      viewer.innerHTML = `<div class="text-muted">No hay archivo para ${book} ${ch}:${v}</div>`;
      return;
    }

    viewer.innerHTML = `<div class="text-muted">Cargando...</div>`;
    const res = await fetch(`./NA28/out/${rel}?v=1`, { cache: "no-cache" });
    if(!res.ok){
      viewer.innerHTML = `<div class="text-danger">Error cargando ${book} ${ch}:${v}</div>`;
      return;
    }
    const html = await res.text();
    viewer.innerHTML = html;
  }

  async function enableNA28(){
    await loadIndex();
    fillBooks(index);
    fillChapters(selBook.value);
    fillVerses(selBook.value, selCh.value);
    await renderCurrent();

    // Oculta textos bíblicos normales
    setVisible(bibleLeft, false);
    setVisible(bibleRight, false);

    // Muestra NA28 panel
    setVisible(panel, true);

    na28Enabled = true;
  }

  function disableNA28(){
    setVisible(panel, false);
    setVisible(bibleLeft, true);
    setVisible(bibleRight, true);
    na28Enabled = false;
  }

  // Eventos
  btn?.addEventListener("click", async () => {
    try{
      if(!na28Enabled) await enableNA28();
      else disableNA28();
    }catch(e){
      console.error(e);
      viewer.innerHTML = `<div class="text-danger">No se pudo activar NA28-Es. Revisa consola.</div>`;
    }
  });

  selBook?.addEventListener("change", async () => {
    fillChapters(selBook.value);
    fillVerses(selBook.value, selCh.value);
    await renderCurrent();
  });

  selCh?.addEventListener("change", async () => {
    fillVerses(selBook.value, selCh.value);
    await renderCurrent();
  });

  selV?.addEventListener("change", renderCurrent);
})();
