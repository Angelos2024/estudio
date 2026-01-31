/***********************
 * Rutas (iguales al lector)
 ***********************/
const RV_BASE = './librosRV1960/';
const GRIEGO_PATH = './IdiomaORIGEN/Bgriega.json';
const HEBREO_BOOK_BASE = './IdiomaORIGEN/';

/***********************
 * Canon (para “escritos presentes”)
 ***********************/
const ALL_SLUGS = [
  // AT
  'genesis','exodo','levitico','numeros','deuteronomio',
  'josue','jueces','rut','1_samuel','2_samuel','1_reyes','2_reyes',
  '1_cronicas','2_cronicas','esdras','nehemias','ester',
  'job','salmos','proverbios','eclesiastes','cantares',
  'isaias','jeremias','lamentaciones','ezequiel','daniel',
  'oseas','joel','amos','abdias','jonas','miqueas','nahum','habacuc','sofonias','hageo','zacarias','malaquias',
  // NT
  'mateo','marcos','lucas','juan','hechos',
  'romanos','1_corintios','2_corintios','galatas','efesios','filipenses','colosenses',
  '1_tesalonicenses','2_tesalonicenses','1_timoteo','2_timoteo','tito','filemon',
  'hebreos','santiago','1_pedro','2_pedro','1_juan','2_juan','3_juan','judas','apocalipsis'
];

const NT_SLUGS = new Set([
  'mateo','marcos','lucas','juan','hechos',
  'romanos','1_corintios','2_corintios','galatas','efesios','filipenses','colosenses',
  '1_tesalonicenses','2_tesalonicenses','1_timoteo','2_timoteo','tito','filemon',
  'hebreos','santiago','1_pedro','2_pedro','1_juan','2_juan','3_juan','judas','apocalipsis'
]);

const NT_TR_BOOKNAME = {
  mateo: 'Matthew', marcos: 'Mark', lucas: 'Luke', juan: 'John', hechos: 'Acts',
  romanos: 'Romans', '1_corintios': '1 Corinthians', '2_corintios': '2 Corinthians',
  galatas: 'Galatians', efesios: 'Ephesians', filipenses: 'Philippians', colosenses: 'Colossians',
  '1_tesalonicenses': '1 Thessalonians', '2_tesalonicenses': '2 Thessalonians',
  '1_timoteo': '1 Timothy', '2_timoteo': '2 Timothy', tito: 'Titus', filemon: 'Philemon',
  hebreos: 'Hebrews', santiago: 'James', '1_pedro': '1 Peter', '2_pedro': '2 Peter',
  '1_juan': '1 John', '2_juan': '2 John', '3_juan': '3 John', judas: 'Jude', apocalipsis: 'Revelation'
};
const EN_TO_SLUG = Object.fromEntries(Object.entries(NT_TR_BOOKNAME).map(([slug,en]) => [en, slug]));

/***********************
 * DOM
 ***********************/
const form = document.getElementById('searchForm');
const qEl = document.getElementById('q');
const modeEl = document.getElementById('mode');
const exactEl = document.getElementById('exact');
const statusEl = document.getElementById('status');
const resultsEl = document.getElementById('results');

// paginación
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const pageNowEl = document.getElementById('pageNow');
const pageTotalEl = document.getElementById('pageTotal');
const showingCountEl = document.getElementById('showingCount');
const totalCountEl = document.getElementById('totalCount');

/***********************
 * Estado global de resultados/paginación
 ***********************/
const PAGE_SIZE = 10;
let ALL_RESULTS = [];
let PAGE = 1;

/***********************
 * Caches
 ***********************/
const cacheES = {};      // slug -> chapters[][]
const cacheHE = {};      // slug -> chapters[][]
let greekData = null;    // { verses: [...] }
let present = null;

/***********************
 * Helpers
 ***********************/
function esc(s){
  return (s ?? '')
    .replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;')
    .replaceAll('"','&quot;').replaceAll("'","&#39;");
}
function prettyBookName(slug){
  return (slug || '').replace(/_/g,' ').replace(/\b\w/g, c => c.toUpperCase());
}
function normalizeLatin(s){
  return (s || '')
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g,'') // acentos
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')               // quita puntuación/símbolos
    .replace(/\s+/g,' ')
    .trim();
}

function normalizeGreek(s){
  return (s || '')
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g,'') // diacríticos
    .replace(/ς/g, 'σ')                              // sigma final -> sigma
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')               // quita puntuación
    .replace(/\s+/g,' ')
    .trim();
}

function normalizeHebrew(s){
  return (s || '')
    .normalize('NFD')
    .replace(/[\u0591-\u05C7]/g,'')                 // nikkud + cantillation
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')              // quita puntuación
    .replace(/\s+/g,' ')
    .trim();
}


async function safeFetchJson(path){
  const r = await fetch(path, { cache: 'no-store' });
  if(!r.ok) return null;
  try { return await r.json(); } catch { return null; }
}

function buildReaderLink(slug, bookName, chapter, v1, v2){
  const search = `${bookName} ${chapter}:${v1}${(v2 && v2!==v1)?'-'+v2:''}`;
  const p = new URLSearchParams();
  p.set('book', slug);
  p.set('name', bookName);
  p.set('search', search);
  p.set('version', 'RVR1960');
  p.set('orig', '1');
  return `./index.html?${p.toString()}`;
}

// resaltado simple (exacto)
function highlightExact(text, needle){
  const t = String(text ?? '');
  const n = String(needle ?? '');
  if(!n) return esc(t);
  const i = t.indexOf(n);
  if(i < 0) return esc(t);
  return esc(t.slice(0,i)) + '<mark>' + esc(t.slice(i,i+n.length)) + '</mark>' + esc(t.slice(i+n.length));
}

/***********************
 * “Escritos presentes”: indexa solo lo que existe
 ***********************/
async function getPresentBooks(){
  statusEl.textContent = 'Detectando escritos presentes...';

  // Español
  for(const slug of ALL_SLUGS){
    const ok = await safeFetchJson(`${RV_BASE}${slug}.json`);
    if(ok) cacheES[slug] = ok;
  }

  // Hebreo (solo AT)
  for(const slug of ALL_SLUGS){
    if(NT_SLUGS.has(slug)) continue;
    const he = await safeFetchJson(`${HEBREO_BOOK_BASE}${slug}.json`);
    if(he && Array.isArray(he.text)) {
      cacheHE[slug] = he.text.map(ch => Array.isArray(ch) ? ch.map(v => (v ?? '')) : []);
    }
  }

  greekData = await safeFetchJson(GRIEGO_PATH);

  const esN = Object.keys(cacheES).length;
  const heN = Object.keys(cacheHE).length;
  const grOk = !!(greekData && Array.isArray(greekData.verses));

  statusEl.textContent = `Listo. ES: ${esN} libros · HE: ${heN} libros · GR: ${grOk ? 'sí' : 'no'}`;

  return { esN, heN, grOk };
}

/***********************
 * Motores de búsqueda
 ***********************/
function searchSpanish(q, exact){
  const out = [];
  const needle = exact ? q : normalizeLatin(q);

  for(const slug of Object.keys(cacheES)){
    const chapters = cacheES[slug];
    if(!Array.isArray(chapters)) continue;

    for(let ch=1; ch<=chapters.length; ch++){
      const verses = chapters[ch-1] || [];
      for(let v=1; v<=verses.length; v++){
        const t = String(verses[v-1] ?? '');
        if(!t) continue;

        const hay = exact ? t.includes(q) : normalizeLatin(t).includes(needle);
        if(hay){
          out.push({ lang:'ES', slug, book: prettyBookName(slug), ch, v, text: t });
        }
      }
    }
  }
  return out;
}

function searchHebrew(q, exact){
  const out = [];
  const needle = exact ? q : normalizeHebrew(q);

  for(const slug of Object.keys(cacheHE)){
    const chapters = cacheHE[slug];
    if(!Array.isArray(chapters)) continue;

    for(let ch=1; ch<=chapters.length; ch++){
      const verses = chapters[ch-1] || [];
      for(let v=1; v<=verses.length; v++){
        const t = String(verses[v-1] ?? '');
        if(!t) continue;

        const hay = exact ? t.includes(q) : normalizeHebrew(t).includes(needle);
        if(hay){
          out.push({ lang:'HE', slug, book: prettyBookName(slug), ch, v, text: t });
        }
      }
    }
  }
  return out;
}

function searchGreek(q, exact){
  const out = [];
  if(!greekData || !Array.isArray(greekData.verses)) return out;

  const needle = exact ? q : normalizeGreek(q);

  for(const row of greekData.verses){
    if(!row || !row.book_name) continue;
    const slug = EN_TO_SLUG[row.book_name];
    if(!slug) continue;

    const t = String(row.text ?? '');
    if(!t) continue;

    const hay = exact ? t.includes(q) : normalizeGreek(t).includes(needle);
    if(hay){
      out.push({
        lang:'GR',
        slug,
        book: prettyBookName(slug),
        ch: Number(row.chapter),
        v: Number(row.verse),
        text: t
      });
    }
  }
  return out;
}

/***********************
 * Render paginado
 ***********************/
function renderPage(){
  resultsEl.innerHTML = '';

  const total = ALL_RESULTS.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  if(PAGE > totalPages) PAGE = totalPages;
  if(PAGE < 1) PAGE = 1;

  const start = (PAGE - 1) * PAGE_SIZE;
  const end = Math.min(start + PAGE_SIZE, total);
  const slice = ALL_RESULTS.slice(start, end);

  totalCountEl.textContent = String(total);
  showingCountEl.textContent = String(slice.length);
  pageNowEl.textContent = String(PAGE);
  pageTotalEl.textContent = String(totalPages);

  prevBtn.disabled = PAGE <= 1;
  nextBtn.disabled = PAGE >= totalPages;

  if(total === 0){
    resultsEl.innerHTML = `<div class="muted">Sin resultados.</div>`;
    return;
  }

  for(const r of slice){
    const link = buildReaderLink(r.slug, r.book, r.ch, r.v, r.v);

    // snippet corto
    let snippet = r.text;
    if(snippet.length > 220) snippet = snippet.slice(0, 220) + '…';

    const badge = r.lang === 'ES' ? 'Español' : (r.lang === 'GR' ? 'Griego' : 'Hebreo');
    const hitHtml = exactEl.checked ? highlightExact(snippet, qEl.value.trim()) : esc(snippet);

    const el = document.createElement('div');
    el.className = 'hit';
    el.innerHTML = `
      <div class="d-flex flex-wrap justify-content-between gap-2 align-items-center">
        <div>
          <span class="badge text-bg-secondary">${badge}</span>
          <span class="ms-2 fw-semibold">${esc(r.book)} ${r.ch}:${r.v}</span>
          <span class="muted smallish ms-2">${esc(r.slug)}</span>
        </div>
        <a class="btn btn-sm btn-outline-primary" href="${link}">Abrir en lector</a>
      </div>
      <div class="mt-2 smallish">${hitHtml}</div>
    `;
    resultsEl.appendChild(el);
  }
}

/***********************
 * Eventos
 ***********************/
prevBtn.addEventListener('click', () => {
  PAGE = Math.max(1, PAGE - 1);
  renderPage();
});

nextBtn.addEventListener('click', () => {
  const totalPages = Math.max(1, Math.ceil(ALL_RESULTS.length / PAGE_SIZE));
  PAGE = Math.min(totalPages, PAGE + 1);
  renderPage();
});

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const q = (qEl.value || '').trim();
  if(!q){
    ALL_RESULTS = [];
    PAGE = 1;
    renderPage();
    statusEl.textContent = 'Escribe una palabra o frase.';
    return;
  }

  if(!present) present = await getPresentBooks();

  statusEl.textContent = 'Buscando...';
  const exact = !!exactEl.checked;
  const mode = modeEl.value;

  let res = [];
  if(mode === 'all' || mode === 'es') res = res.concat(searchSpanish(q, exact));
  if(mode === 'all' || mode === 'gr') res = res.concat(searchGreek(q, exact));
  if(mode === 'all' || mode === 'he') res = res.concat(searchHebrew(q, exact));

  // orden simple: ES, GR, HE y luego por libro/cap/verso
  const langOrder = { ES: 0, GR: 1, HE: 2 };
  res.sort((a,b) => {
    const la = langOrder[a.lang] ?? 9;
    const lb = langOrder[b.lang] ?? 9;
    if(la !== lb) return la - lb;
    if(a.slug !== b.slug) return a.slug.localeCompare(b.slug);
    if(a.ch !== b.ch) return a.ch - b.ch;
    return a.v - b.v;
  });

  ALL_RESULTS = res;
  PAGE = 1;

  statusEl.textContent = `Resultados: ${ALL_RESULTS.length}`;
  renderPage();
});

/***********************
 * Boot
 ***********************/
/***********************
 * Boot
 ***********************/
(async function boot(){
  // render vacío inicial
  ALL_RESULTS = [];
  PAGE = 1;
  renderPage();

  // ✅ AUTOCARGA DESDE index.html (?q=...)
  const p = new URLSearchParams(location.search);
  const q = p.get('q');
  const mode = p.get('mode');
  const exact = p.get('exact');

  if(mode && document.getElementById('mode')){
    document.getElementById('mode').value = mode;
  }
  if(exact && document.getElementById('exact')){
    document.getElementById('exact').checked = (exact === '1');
  }

  if(q && document.getElementById('q')){
    document.getElementById('q').value = q;

    // dispara búsqueda automáticamente
    const f = document.getElementById('searchForm');
    if(f){
      f.dispatchEvent(new Event('submit', { cancelable: true }));
    }
  }
})();


document.getElementById('backToReader')?.addEventListener('click', () => {
  // Si venimos del lector, back conserva estado (scroll + cache) en la mayoría de navegadores
  if (document.referrer && document.referrer.includes('index.html')) {
    history.back();
  } else {
    location.href = './index.html';
  }
});


