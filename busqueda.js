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
const MASTER_DICT_URL = './diccionario/masterdiccionario.json';
/***********************
 * DOM
 ***********************/
const form = document.getElementById('searchForm');
const qEl = document.getElementById('q');
const modeEl = document.getElementById('mode');
const statusEl = document.getElementById('status');
const resultsEl = document.getElementById('results');
const scopeFilterEl = document.getElementById('scopeFilter');

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
let RAW_RESULTS = [];
let manifest = null;
let worker = null;
const loadedIndex = { es:false, gr:false, he:false };
let masterDictIndex = null;
let HIGHLIGHT_QUERY = '';

// cache de packs: key = `${lang}|${slug}|${ch}` -> array de versos
const packCache = new Map();
const ES_TORAH_BOOKS = new Set([
  'genesis','exodo','levitico','numeros','deuteronomio','josue','jueces','rut',
  '1_samuel','2_samuel','1_reyes','2_reyes','1_cronicas','2_cronicas','esdras',
  'nehemias','ester','job','salmos','proverbios','eclesiastes','cantares','isaias',
  'jeremias','lamentaciones','ezequiel','daniel','oseas','joel','amos','abdias',
  'jonas','miqueas','nahum','habacuc','sofonias','hageo','zacarias','malaquias'
]);

const ES_EVANGELIOS_BOOKS = new Set([
  'mateo','marcos','lucas','juan','hechos','romanos','1_corintios','2_corintios',
  'galatas','efesios','filipenses','colosenses','1_tesalonicenses','2_tesalonicenses',
  '1_timoteo','2_timoteo','tito','filemon','hebreos','santiago','1_pedro','2_pedro',
  '1_juan','2_juan','3_juan','judas','apocalipsis'
]);

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
function normalizeKey(s){
  return (s || '')
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/\./g, '')
    .replace(/\s+/g, '')
    .trim();
}

const BOOK_ALIASES = {
  genesis:'genesis',gen:'genesis',gn:'genesis',
  exodo:'exodo',exo:'exodo',ex:'exodo',
  levitico:'levitico',lev:'levitico',lv:'levitico',
  numeros:'numeros',num:'numeros',nm:'numeros',
  deuteronomio:'deuteronomio',deut:'deuteronomio',dt:'deuteronomio',
  josue:'josue',jos:'josue',jueces:'jueces',jue:'jueces',jdg:'jueces',rut:'rut',rt:'rut',
  '1samuel':'1_samuel','1sa':'1_samuel','1sam':'1_samuel','2samuel':'2_samuel','2sa':'2_samuel','2sam':'2_samuel',
  '1reyes':'1_reyes','1rey':'1_reyes','1ki':'1_reyes','2reyes':'2_reyes','2rey':'2_reyes','2ki':'2_reyes',
  '1cronicas':'1_cronicas','1cro':'1_cronicas','1cr':'1_cronicas','2cronicas':'2_cronicas','2cro':'2_cronicas','2cr':'2_cronicas',
  esdras:'esdras',esd:'esdras',ezra:'esdras',nehemias:'nehemias',neh:'nehemias',ester:'ester',est:'ester',
  job:'job',jb:'job',salmos:'salmos',salmo:'salmos',sal:'salmos',ps:'salmos',
  proverbios:'proverbios',prov:'proverbios',pr:'proverbios',eclesiastes:'eclesiastes',ecl:'eclesiastes',ec:'eclesiastes',
  cantares:'cantares',cantar:'cantares',cnt:'cantares',cant:'cantares',isaias:'isaias',isa:'isaias',
  jeremias:'jeremias',jer:'jeremias',lamentaciones:'lamentaciones',lam:'lamentaciones',ezequiel:'ezequiel',eze:'ezequiel',ez:'ezequiel',
  daniel:'daniel',dan:'daniel',oseas:'oseas',os:'oseas',joel:'joel',jl:'joel',amos:'amos',am:'amos',
  abdias:'abdias',abd:'abdias',obadias:'abdias',obad:'abdias',jonas:'jonas',jon:'jonas',miqueas:'miqueas',miq:'miqueas',mic:'miqueas',
  nahum:'nahum',nah:'nahum',habacuc:'habacuc',hab:'habacuc',sofonias:'sofonias',sof:'sofonias',zep:'sofonias',
  hageo:'hageo',hag:'hageo',zacarias:'zacarias',zac:'zacarias',zec:'zacarias',malaquias:'malaquias',mal:'malaquias',
  mateo:'mateo',mt:'mateo',marcos:'marcos',mr:'marcos',mk:'marcos',lucas:'lucas',lc:'lucas',lk:'lucas',
  juan:'juan',jn:'juan',jhn:'juan',hechos:'hechos',hch:'hechos',actos:'hechos',act:'hechos',
  romanos:'romanos',rom:'romanos','1corintios':'1_corintios','1cor':'1_corintios','1co':'1_corintios',
  '2corintios':'2_corintios','2cor':'2_corintios','2co':'2_corintios',galatas:'galatas',gal:'galatas',
  efesios:'efesios',efe:'efesios',eph:'efesios',filipenses:'filipenses',fil:'filipenses',php:'filipenses',
  colosenses:'colosenses',col:'colosenses','1tesalonicenses':'1_tesalonicenses','1tes':'1_tesalonicenses','1th':'1_tesalonicenses',
  '2tesalonicenses':'2_tesalonicenses','2tes':'2_tesalonicenses','2th':'2_tesalonicenses','1timoteo':'1_timoteo','1tim':'1_timoteo',
  '2timoteo':'2_timoteo','2tim':'2_timoteo',tito:'tito',tit:'tito',filemon:'filemon',flm:'filemon',phm:'filemon',
  hebreos:'hebreos',heb:'hebreos',santiago:'santiago',stg:'santiago',jas:'santiago',
  '1pedro':'1_pedro','1pe':'1_pedro','1pet':'1_pedro','2pedro':'2_pedro','2pe':'2_pedro','2pet':'2_pedro',
  '1juan':'1_juan','1jn':'1_juan','1j':'1_juan','2juan':'2_juan','2jn':'2_juan','2j':'2_juan','3juan':'3_juan','3jn':'3_juan','3j':'3_juan',
  judas:'judas',jud:'judas',apocalipsis:'apocalipsis',apo:'apocalipsis',apoc:'apocalipsis',apocal:'apocalipsis',rev:'apocalipsis'
};

function resolveBookSlugFlexible(bookRaw){
  const key = normalizeKey(bookRaw);
  if(!key) return null;
  if(BOOK_ALIASES[key]) return BOOK_ALIASES[key];

  let bestAlias = null;
  for(const alias of Object.keys(BOOK_ALIASES)){
    if(key.startsWith(alias) || alias.startsWith(key)){
      if(!bestAlias || alias.length > bestAlias.length) bestAlias = alias;
    }
  }
  return bestAlias ? BOOK_ALIASES[bestAlias] : null;
}

function parseReferenceQuery(raw){
  const q = String(raw || '').trim();
  if(!/\d/.test(q)) return null;
  const cleaned = q
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\p{L}\p{N}:,;\-\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  let match = cleaned.match(/^(.*?)\s*(\d+)\s*[:.,;]\s*(\d+)(?:\s*-\s*(\d+))?$/);
  if(!match){
    match = cleaned.match(/^(.*?)\s+(\d+)\s+(\d+)(?:\s*-\s*(\d+))?$/);
  }
  if(!match) return null;

  const [, rawBook, chS, vFromS, vToS] = match;
  const slug = resolveBookSlugFlexible(rawBook);
  if(!slug) return null;

  const ch = Number(chS);
  const vFrom = Number(vFromS);
  const vTo = vToS ? Number(vToS) : vFrom;
  if(!Number.isInteger(ch) || !Number.isInteger(vFrom) || !Number.isInteger(vTo)) return null;
  if(ch < 1 || vFrom < 1 || vTo < vFrom) return null;
  return { slug, ch, vFrom, vTo };
}

async function resolveReferenceMatches(mode, query){
  const ref = parseReferenceQuery(query);
  if(!ref) return null;
  await ensureManifest();

  const langs = mode === 'all' ? ['es','gr','he'] : [mode];
  const items = [];
  for(const lang of langs){
    const chapterCounts = manifest?.langs?.[lang]?.chapterCounts || {};
    if(!chapterCounts[ref.slug]) continue;
    if(ref.ch > Number(chapterCounts[ref.slug])) continue;

    const verses = await getChapterPack(lang, ref.slug, ref.ch);
    const maxVerse = verses.length;
    if(!maxVerse) continue;
    const end = Math.min(ref.vTo, maxVerse);
    for(let v = ref.vFrom; v <= end; v++){
      items.push({ lang, ref: `${ref.slug}|${ref.ch}|${v}` });
    }
  }
  return items;
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
    .replace(/[\u0591-\u05AF\u05B0-\u05BC\u05BD\u05BF\u05C1-\u05C2\u05C7]/g,"")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g," ")
    .trim();
}

function getNormalizedQuery(lang, q){
  if(lang === 'gr') return normalizeGreek(q);
  if(lang === 'he') return normalizeHebrew(q);
  return normalizeLatin(q);
}

function hasGreekChars(s){
  return /[\u0370-\u03FF\u1F00-\u1FFF]/.test(s || '');
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
async function ensureMasterDictIndex(){
  if(masterDictIndex) return masterDictIndex;
  const data = await safeFetchJson(MASTER_DICT_URL);
  const items = Array.isArray(data?.items) ? data.items : [];
  const map = new Map();
  for(const item of items){
    const candidates = [item?.lemma, item?.['Forma flexionada del texto'], item?.['Forma lexica']];
    for(const raw of candidates){
      const key = normalizeGreek(raw);
      if(!key) continue;
      if(!map.has(key)) map.set(key, []);
      map.get(key).push(item);
    }
  }
  masterDictIndex = map;
  return masterDictIndex;
}

function extractSpanishTokens(entry){
  const def = String(entry?.definicion || '');
  const norm = normalizeLatin(def);
  const tokens = norm.split(' ').filter(t => /^[a-zñ]+$/i.test(t) && t.length >= 3);
  const stopwords = new Set([
    'lit','nt','lxx','pl','sg','adj','adv','pron','conj','prep','part','indecl',
    'num','m','f','n','prop','pers','rel','dem','interj','fig','met','art'
  ]);
  return tokens.filter(t => !stopwords.has(t));
}

async function getSpanishTokensFromGreekQuery(query){
  const index = await ensureMasterDictIndex();
  if(!index || !index.size) return [];
  const key = normalizeGreek(query);
  if(!key) return [];
  const entries = index.get(key) || [];
  const tokens = [];
  const seen = new Set();
  for(const entry of entries){
    for(const token of extractSpanishTokens(entry)){
      if(seen.has(token)) continue;
      seen.add(token);
      tokens.push(token);
      if(tokens.length >= 5) break;
    }
    if(tokens.length >= 5) break;
  }
  return tokens;
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
function getScopeBySlug(slug){
  if(ES_TORAH_BOOKS.has(slug)) return 'torah';
  if(ES_EVANGELIOS_BOOKS.has(slug)) return 'evangelios';
  return null;
}

function applyScopeFilter(){
  const scope = scopeFilterEl?.value || 'all';
  if(scope === 'all'){
    ALL_RESULTS = [...RAW_RESULTS];
    return;
  }

  ALL_RESULTS = RAW_RESULTS.filter(item => {
    const { slug } = parseRef(item.ref);
    return getScopeBySlug(slug) === scope;
  });
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
       box.innerHTML = highlight(text, HIGHLIGHT_QUERY || qEl.value, lang);
      }
    })().catch(() => {
      const box = card.querySelector('[data-text="1"]');
      if(box) box.textContent = 'No se pudo cargar el texto del verso.';
    });
  }
}
function refreshResultsForCurrentScope(){
  applyScopeFilter();
  PAGE = 1;
  statusEl.textContent = `Listo. ${ALL_RESULTS.length} resultado(s) en ${scopeFilterEl?.selectedOptions?.[0]?.textContent || 'ámbito actual'}.`;
  renderPage(HIGHLIGHT_QUERY || qEl.value);
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
    RAW_RESULTS = [];
    PAGE = 1;
    renderPage('');
    return;
  }

  try{
    statusEl.textContent = 'Preparando búsqueda...';
    HIGHLIGHT_QUERY = q;
 const referenceItems = await resolveReferenceMatches(mode, q);
    if(referenceItems && referenceItems.length){
      RAW_RESULTS = referenceItems;
      applyScopeFilter();
      PAGE = 1;
      statusEl.textContent = `Listo. ${ALL_RESULTS.length} pasaje(s) encontrado(s).`;
      renderPage(q);
      return;
    }
    if(mode === 'es' && hasGreekChars(q)){
      const spanishTokens = await getSpanishTokensFromGreekQuery(q);
      if(spanishTokens.length){
        statusEl.textContent = 'Preparando búsqueda inversa...';
        await ensureIndexLoadedForMode('es');
        statusEl.textContent = `Buscando en RVR1960: ${spanishTokens.join(', ')}...`;

        const resultsByToken = await Promise.all(
          spanishTokens.map(token => searchWithWorker('es', token))
        );
        const merged = [];
        const seen = new Set();
        for(const group of resultsByToken){
          for(const item of group){
            const key = `${item.lang}|${item.ref}`;
            if(seen.has(key)) continue;
            seen.add(key);
            merged.push(item);
          }
        }
        RAW_RESULTS = merged;
        applyScopeFilter();
        PAGE = 1;
        HIGHLIGHT_QUERY = spanishTokens.join(' ');
        statusEl.textContent = `Listo. ${ALL_RESULTS.length} resultado(s).`;
        renderPage(HIGHLIGHT_QUERY);
        return;
      }
    }

    await ensureIndexLoadedForMode(mode);

    statusEl.textContent = 'Buscando...';
    const items = await searchWithWorker(mode, q);

    // items: [{lang, ref}]
     RAW_RESULTS = items;
    applyScopeFilter();
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
scopeFilterEl?.addEventListener('change', () => {
  refreshResultsForCurrentScope();
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
