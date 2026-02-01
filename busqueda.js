/***********************
 * Rutas nuevas de búsqueda
 ***********************/
const SEARCH_BASE = './search/';
const MANIFEST_URL = `${SEARCH_BASE}manifestv1.json`;
const INDEX_URLS = {
  es: `${SEARCH_BASE}index-es.json`,
  gr: `${SEARCH_BASE}index-gr.json`,
  he: `${SEARCH_BASE}index-he.json`
};
const TEXT_PACK_BASE = `${SEARCH_BASE}texts/`; // texts/<lang>/<slug>/<ch>.json

/***********************
 * DOM
 ***********************/
const form = document.getElementById('searchForm');
const qEl = document.getElementById('q');
const modeEl = document.getElementById('mode');
const statusEl = document.getElementById('status');
const resultsEl = document.getElementById('results');

const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const pageNowEl = document.getElementById('pageNow');
const pageTotalEl = document.getElementById('pageTotal');
const showingCountEl = document.getElementById('showingCount');
const totalCountEl = document.getElementById('totalCount');

/***********************
 * Estado
 ***********************/
const PAGE_SIZE = 10;
let PAGE = 1;
let ALL_RESULTS = [];
let manifest = null;
let worker = null;
const loadedIndex = { es:false, gr:false, he:false };

// cache de packs: key = `${lang}|${slug}|${ch}` -> array de versos
const packCache = new Map();

/***********************
 * Helpers
 ***********************/
function esc(s){
  return (s ?? '')
    .replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;')
    .replaceAll('"','&quot;').replaceAll("'","&#39;");
}

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

function getNormalizedQuery(lang, q){
  if(lang === 'gr') return normalizeGreek(q);
  if(lang === 'he') return normalizeHebrew(q);
  return normalizeLatin(q);
}

function buildTokenRegex(token, lang){
  const escaped = token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  if(lang === 'es'){
    return new RegExp(escaped, 'gi');
  }

  const letters = [];
  for(const ch of escaped){
    if(ch === '\\') continue;
    if(lang === 'gr' && ch === 'σ'){
      letters.push('[σς]');
    }else{
      letters.push(ch);
    }
  }
  const pattern = letters.map(letter => `${letter}\\p{M}*`).join('');
  return new RegExp(pattern, 'giu');
}

function highlight(text, q, lang){
  const raw = String(text ?? '');
  const query = String(q ?? '').trim();
  if(!raw || !query) return esc(raw);

  const safe = esc(raw);
const normalized = getNormalizedQuery(lang, query);
  const tokens = normalized.split(' ').map(t => t.trim()).filter(t => t.length >= 2);
  if(!tokens.length) return safe;

  let output = safe;
  for(const token of tokens){
    const re = buildTokenRegex(token, lang);
    output = output.replace(re, (m) => `<mark>${m}</mark>`);
  }
  return output;
}

function prettyBookName(slug){
  return (slug || '').replace(/_/g,' ').replace(/\b\w/g, c => c.toUpperCase());
}

function buildReaderLink(slug, bookName, chapter, v){
  const search = `${bookName} ${chapter}:${v}`;
  const p = new URLSearchParams();
  p.set('book', slug);
  p.set('name', bookName);
  p.set('search', search);
  p.set('version', 'RVR1960');
  p.set('orig', '1');
  return `./index.html?${p.toString()}`;
}

async function safeFetchJson(url){
  const r = await fetch(url, { cache:'force-cache' });
  if(!r.ok) return null;
  try{ return await r.json(); }catch{ return null; }
}

function ensureWorker(){
  if(worker) return worker;
  worker = new Worker(`${SEARCH_BASE}worker-search.js?v=1`);
  return worker;
}

async function ensureManifest(){
  if(manifest) return manifest;
  statusEl.textContent = 'Cargando manifest...';
  manifest = await safeFetchJson(MANIFEST_URL);
  if(!manifest) throw new Error('No se pudo cargar manifestv1.json');
  return manifest;
}

async function ensureIndexLoadedForMode(mode){
  ensureWorker();
  await ensureManifest();

  const langs = (mode === 'all') ? ['es','gr','he'] : [mode];
  const jobs = [];

  for(const lang of langs){
    if(loadedIndex[lang]) continue;
    statusEl.textContent = `Cargando índice ${lang.toUpperCase()}...`;

    jobs.push(new Promise((resolve, reject) => {
      const onMsg = (ev) => {
        const m = ev.data || {};
        if(m.type === 'loaded' && m.lang === lang){
          worker.removeEventListener('message', onMsg);
          loadedIndex[lang] = true;
          resolve(true);
        }else if(m.type === 'error'){
          worker.removeEventListener('message', onMsg);
          reject(new Error(m.message || 'Error en worker'));
        }
      };
      worker.addEventListener('message', onMsg);
      const absUrl = new URL(INDEX_URLS[lang], window.location.href).toString();
      worker.postMessage({ type:'load', lang, url: absUrl });
    }));
  }

  await Promise.all(jobs);
}

async function searchWithWorker(mode, query){
  ensureWorker();

  return await new Promise((resolve, reject) => {
    const onMsg = (ev) => {
      const m = ev.data || {};
      if(m.type === 'results'){
        worker.removeEventListener('message', onMsg);
        resolve(m.items || []);
      }else if(m.type === 'error'){
        worker.removeEventListener('message', onMsg);
        reject(new Error(m.message || 'Error en worker'));
      }
    };
    worker.addEventListener('message', onMsg);
    worker.postMessage({ type:'search', mode, query });
  });
}

function parseRef(ref){
  // "slug|ch|v"
  const [slug, chS, vS] = String(ref).split('|');
  return { slug, ch: Number(chS), v: Number(vS) };
}

async function getChapterPack(lang, slug, ch){
  const key = `${lang}|${slug}|${ch}`;
  if(packCache.has(key)) return packCache.get(key);

  const url = `${TEXT_PACK_BASE}${lang}/${slug}/${ch}.json`;
  const data = await safeFetchJson(url);
  const verses = Array.isArray(data) ? data : [];
  packCache.set(key, verses);
  return verses;
}

function renderPage(q){
  resultsEl.innerHTML = '';

  const total = ALL_RESULTS.length;
  const pageTotal = Math.max(1, Math.ceil(total / PAGE_SIZE));
  PAGE = Math.min(Math.max(1, PAGE), pageTotal);

  const start = (PAGE - 1) * PAGE_SIZE;
  const end = Math.min(total, start + PAGE_SIZE);
  const slice = ALL_RESULTS.slice(start, end);

  pageNowEl.textContent = String(PAGE);
  pageTotalEl.textContent = String(pageTotal);
  showingCountEl.textContent = String(slice.length);
  totalCountEl.textContent = String(total);

  prevBtn.disabled = (PAGE <= 1);
  nextBtn.disabled = (PAGE >= pageTotal);

  if(total === 0){
    resultsEl.innerHTML = `<div class="text-muted">Sin resultados.</div>`;
    return;
  }

  // Render “skeleton” primero (rápido) y luego llenamos textos async
  for(const item of slice){
    const { lang, ref } = item;
    const { slug, ch, v } = parseRef(ref);
    const bookName = prettyBookName(slug);

    const card = document.createElement('div');
    card.className = `hit lang-${lang}`;

    card.innerHTML = `
      <div class="d-flex justify-content-between align-items-start gap-2">
        <div>
          <div class="fw-semibold">${esc(bookName)} <span class="text-muted">${esc(lang.toUpperCase())}</span></div>
          <div class="small text-muted">${esc(slug)} · cap ${ch} · v ${v}</div>
        </div>
        <a class="btn btn-sm btn-outline-primary" href="${esc(buildReaderLink(slug, bookName, ch, v))}">Abrir</a>
      </div>
      <div class="mt-2 smallish mono" data-text="1">Cargando...</div>
    `;
    resultsEl.appendChild(card);

    // cargar texto del verso desde pack
    (async () => {
      const verses = await getChapterPack(lang, slug, ch);
      const text = String(verses[v-1] ?? '');
      const box = card.querySelector('[data-text="1"]');
      if(box){
        box.innerHTML = highlight(text, qEl.value, lang);
      }
    })().catch(() => {
      const box = card.querySelector('[data-text="1"]');
      if(box) box.textContent = 'No se pudo cargar el texto del verso.';
    });
  }
}

/***********************
 * Eventos
 ***********************/
async function runSearch(){
  const q = String(qEl.value || '').trim();
  const mode = modeEl.value;

  if(!q){
    statusEl.textContent = 'Escribe una palabra o frase.';
    resultsEl.innerHTML = '';
    ALL_RESULTS = [];
    PAGE = 1;
    renderPage('');
    return;
  }

  try{
    statusEl.textContent = 'Preparando búsqueda...';
    await ensureIndexLoadedForMode(mode);

    statusEl.textContent = 'Buscando...';
    const items = await searchWithWorker(mode, q);

    // items: [{lang, ref}]
    ALL_RESULTS = items;
    PAGE = 1;
    statusEl.textContent = `Listo. ${ALL_RESULTS.length} resultado(s).`;
    renderPage(q);
  }catch(err){
    statusEl.textContent = `Error: ${String(err?.message || err)}`;
  }
  }

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  await runSearch();
});

prevBtn.addEventListener('click', () => {
  PAGE--;
  renderPage(qEl.value);
});
nextBtn.addEventListener('click', () => {
  PAGE++;
  renderPage(qEl.value);
});

// Inicial
(async () => {
  try{
    await ensureManifest();
    statusEl.textContent = 'Listo para buscar.';
  }catch{
    statusEl.textContent = 'Falta generar search/manifestv1.json (ejecuta el builder).';
  }
})();
// Auto-búsqueda desde parámetros
(() => {
  const p = new URLSearchParams(window.location.search);
  const qParam = (p.get('q') || '').trim();
  const modeParam = (p.get('mode') || '').trim();
  if(modeParam && ['es','gr','he','all'].includes(modeParam)){
    modeEl.value = modeParam;
  }
  if(qParam){
    qEl.value = qParam;
    runSearch();
  }
})();
