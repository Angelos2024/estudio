/* Web Worker: búsqueda por índice invertido (sin bloquear UI) */

let indices = {
  es: null,
  gr: null,
  he: null
};

function normalizeLatin(s){
  return (s || "")
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g,"")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g," ")
    .trim();
}
function normalizeGreek(s){
  return (s || "")
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g,"")
    .replace(/ς/g,"σ")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g," ")
    .trim();
}
function normalizeHebrew(s){
  return (s || "")
    .normalize("NFD")
    .replace(/[\u0591-\u05C7]/g,"")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g," ")
    .trim();
}
function tokenize(norm){
  if(!norm) return [];
  return norm.split(" ").map(t => t.trim()).filter(t => t.length >= 2);
}

function intersectLists(a, b){
  // a y b son arrays de refs (strings). Intersección eficiente usando Set del menor.
  if(!a || !b) return [];
  if(a.length === 0 || b.length === 0) return [];
  const small = a.length <= b.length ? a : b;
  const big = a.length <= b.length ? b : a;
  const set = new Set(small);
  const out = [];
  for(const x of big){
    if(set.has(x)) out.push(x);
  }
  return out;
}

async function loadIndex(lang, url){
  const r = await fetch(url, { cache: "force-cache" });
  if(!r.ok) throw new Error(`No se pudo cargar índice ${lang}`);
  const data = await r.json();
  if(!data || !data.tokens) throw new Error(`Índice inválido ${lang}`);
  indices[lang] = data;
  return true;
}

function searchOne(lang, query){
  const idx = indices[lang];
  if(!idx) return [];

  let norm = "";
  if(lang === "es") norm = normalizeLatin(query);
  else if(lang === "gr") norm = normalizeGreek(query);
  else norm = normalizeHebrew(query);

  const toks = tokenize(norm);
  if(toks.length === 0) return [];

  // AND lógico: intersectar listas de cada token
  let hits = null;
  for(const tok of toks){
    const arr = idx.tokens[tok] || [];
    hits = (hits === null) ? arr.slice() : intersectLists(hits, arr);
    if(hits.length === 0) break;
  }

  // score simple: cantidad de tokens coincididos (si quieres ranking real, se puede)
  // aquí ya es AND, así que score no añade mucho. Lo dejamos estable.
  return hits.map(ref => ({ lang, ref }));
}

function searchMode(mode, query){
  if(mode === "es") return searchOne("es", query);
  if(mode === "gr") return searchOne("gr", query);
  if(mode === "he") return searchOne("he", query);

  // all
  const a = searchOne("es", query);
  const b = searchOne("gr", query);
  const c = searchOne("he", query);
  return a.concat(b, c);
}

self.onmessage = async (ev) => {
  const msg = ev.data || {};
  try{
    if(msg.type === "load"){
      const { lang, url } = msg;
      await loadIndex(lang, url);
      self.postMessage({ type:"loaded", lang });
      return;
    }

    if(msg.type === "search"){
      const { mode, query } = msg;
      const items = searchMode(mode, query);
      self.postMessage({ type:"results", mode, total: items.length, items });
      return;
    }

    self.postMessage({ type:"error", message:"Mensaje desconocido" });
  }catch(err){
    self.postMessage({ type:"error", message: String(err?.message || err) });
  }
};
