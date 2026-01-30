import fs from "fs";
import path from "path";

const ROOT = process.cwd();

// Entradas/salidas (ajustadas a tu estructura)
const INPUT_DIR = path.join(ROOT, "NA28", "libros");
const OUT_DIR   = path.join(ROOT, "NA28", "out");

// CSS central (se carga 1 sola vez)
const CSS = `
/* NA28-Es: estilos centralizados */
.na28es-container{
  background:#fff;
  padding:10px;
  border-radius:6px;
  box-shadow: 0 0 10px rgba(0,0,0,0.12);
}
.na28es-container .greek{
  font-family: "Times New Roman", serif;
  font-size: 1.4em;
  color:#444;
}
.na28es-container table{
  width:100%;
  border-collapse: collapse;
  margin-top:10px;
}
.na28es-container th, .na28es-container td{
  border:1px solid #ddd;
  padding:8px;
}
.na28es-container th{ background:#f4f4f4; }
.na28es-container .crossrefs{ color:#06c; }
`;

// Utilidades
function ensureDir(p){ fs.mkdirSync(p, { recursive: true }); }
function readUtf8(fp){ return fs.readFileSync(fp, "utf8"); }
function writeUtf8(fp, content){
  ensureDir(path.dirname(fp));
  fs.writeFileSync(fp, content, "utf8");
}

function listDirs(dir){
  return fs.readdirSync(dir, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name);
}

function listFiles(dir){
  return fs.readdirSync(dir, { withFileTypes: true })
    .filter(d => d.isFile())
    .map(d => d.name);
}

// Extrae <div class="container"> ... </div> (robusto ante HTML truncado)
function extractContainer(html){
  const start = html.search(/<div\s+class=["']container["']\s*>/i);
  if (start === -1) return null;

  const from = html.slice(start);

  // cortar antes de </body> o </html> si existen
  const cutAtBody = from.search(/<\/body\s*>/i);
  const cutAtHtml = from.search(/<\/html\s*>/i);

  let end = -1;
  if (cutAtBody !== -1) end = cutAtBody;
  else if (cutAtHtml !== -1) end = cutAtHtml;

  const containerBlock = (end !== -1) ? from.slice(0, end) : from;

  // envolver en clase propia (evita choques con Bootstrap y estilos globales)
  return `<div class="na28es-container">\n${containerBlock}\n</div>`;
}

// Parse filename: <libro><cap>_<verso>.html  (ej. galatas5_12.html)
function parseRefFromFilename(book, filename){
  const re = new RegExp(`^${book}(\\d+)_([0-9]+)\\.html$`, "i");
  const m = filename.match(re);
  if(!m) return null;
  return { ch: String(Number(m[1])), v: String(Number(m[2])) };
}

function main(){
  if(!fs.existsSync(INPUT_DIR)){
    console.error("No existe:", INPUT_DIR);
    process.exit(1);
  }

  ensureDir(OUT_DIR);

  // 1) CSS
  writeUtf8(path.join(OUT_DIR, "na28-es.css"), CSS.trim() + "\n");

  // 2) Recorrer libros y construir index.json
  const index = {};
  const books = listDirs(INPUT_DIR);

  let processed = 0;
  const problems = [];

  for(const book of books){
    const bookDir = path.join(INPUT_DIR, book);
    const files = listFiles(bookDir).filter(f => f.toLowerCase().endsWith(".html"));

    index[book] = index[book] || {};

    for(const f of files){
      const ref = parseRefFromFilename(book, f);
      if(!ref){
        problems.push(`[SKIP] ${book}/${f} (nombre no coincide con ${book}<cap>_<verso>.html)`);
        continue;
      }

      const inPath = path.join(bookDir, f);
      const raw = readUtf8(inPath);
      const frag = extractContainer(raw);

      if(!frag){
        problems.push(`[BAD] ${book}/${f} (no encontró <div class="container">)`);
        continue;
      }

      // salida: NA28/out/libros/<book>/<cap>/<verso>.html
      const outRel = path.join("libros", book, ref.ch, `${ref.v}.html`);
      const outPath = path.join(OUT_DIR, outRel);
      writeUtf8(outPath, frag + "\n");

      index[book][ref.ch] = index[book][ref.ch] || {};
      index[book][ref.ch][ref.v] = outRel.replaceAll("\\", "/"); // para Windows

      processed++;
    }
  }

  writeUtf8(path.join(OUT_DIR, "index.json"), JSON.stringify(index, null, 2) + "\n");

  console.log("=== NA28-Es build ===");
  console.log("INPUT :", INPUT_DIR);
  console.log("OUTPUT:", OUT_DIR);
  console.log("LIBROS:", books.length);
  console.log("PROCESADOS:", processed);
  console.log("PROBLEMAS:", problems.length);
  if(problems.length){
    console.log("\nDetalles:");
    problems.slice(0, 200).forEach(p => console.log(" -", p));
    if(problems.length > 200) console.log(" ... (mostrando solo 200)");
  }
  console.log("\nOK: NA28/out/index.json y NA28/out/na28-es.css generados.");
}

main();
