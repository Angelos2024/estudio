// annotations-db.js (COMPLETO corregido)
// Cambios clave:
// - DB_VERSION sube a 2 (para ejecutar upgrade)
// - Notes: índice único by_anchor (side,book,ch,v,offset,length)
// - Notes: CRUD completo + getNoteByAnchor
(() => {
  const DB_NAME = 'biblia_annotations_db';
  const DB_VERSION = 2; // <-- IMPORTANTE: subir versión para que corra onupgradeneeded

  const STORE_HL = 'highlights';
  const STORE_NOTES = 'notes';

  let _dbPromise = null;

  function openDB() {
    if (_dbPromise) return _dbPromise;

    _dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);

      req.onupgradeneeded = (e) => {
        const db = e.target.result;

        // -----------------------------
        // Highlights: subrayados parciales
        // -----------------------------
        let stHL;
        if (!db.objectStoreNames.contains(STORE_HL)) {
          stHL = db.createObjectStore(STORE_HL, { keyPath: 'id', autoIncrement: true });

          // Para buscar por verso
          stHL.createIndex('by_ref', ['side', 'book', 'ch', 'v'], { unique: false });

          // Para buscar por rango (pasaje)
          stHL.createIndex('by_book_ch_v', ['side', 'book', 'ch', 'v'], { unique: false });
        } else {
          stHL = e.target.transaction.objectStore(STORE_HL);
          // En caso de upgrades futuros, aquí podrías crear índices faltantes
          if (!stHL.indexNames.contains('by_ref')) {
            stHL.createIndex('by_ref', ['side', 'book', 'ch', 'v'], { unique: false });
          }
          if (!stHL.indexNames.contains('by_book_ch_v')) {
            stHL.createIndex('by_book_ch_v', ['side', 'book', 'ch', 'v'], { unique: false });
          }
        }

        // -----------------------------
        // Notes: anotaciones de texto
        // -----------------------------
        let stN;
        if (!db.objectStoreNames.contains(STORE_NOTES)) {
          stN = db.createObjectStore(STORE_NOTES, { keyPath: 'id', autoIncrement: true });
          stN.createIndex('by_ref', ['side', 'book', 'ch', 'v'], { unique: false });

          // ✅ Índice único por ancla exacta (para evitar duplicados y reabrir por selección)
          stN.createIndex(
            'by_anchor',
            ['side', 'book', 'ch', 'v', 'offset', 'length'],
            { unique: true }
          );
        } else {
          stN = e.target.transaction.objectStore(STORE_NOTES);

          if (!stN.indexNames.contains('by_ref')) {
            stN.createIndex('by_ref', ['side', 'book', 'ch', 'v'], { unique: false });
          }

          // ✅ Si vienes de DB_VERSION 1, este índice no existe: crearlo en upgrade
          if (!stN.indexNames.contains('by_anchor')) {
            stN.createIndex(
              'by_anchor',
              ['side', 'book', 'ch', 'v', 'offset', 'length'],
              { unique: true }
            );
          }
        }
      };

      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });

    return _dbPromise;
  }

  function tx(db, storeName, mode = 'readonly') {
    return db.transaction(storeName, mode).objectStore(storeName);
  }

  function reqToPromise(req) {
    return new Promise((resolve, reject) => {
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  // -----------------------------
  // HIGHLIGHTS
  // -----------------------------
  async function addHighlight(h) {
    const db = await openDB();
    const store = tx(db, STORE_HL, 'readwrite');
    const id = await reqToPromise(store.add(h));
    return id;
  }

  async function deleteHighlight(id) {
    const db = await openDB();
    const store = tx(db, STORE_HL, 'readwrite');
    await reqToPromise(store.delete(id));
    return true;
  }

  async function getHighlightsForVerse(side, book, ch, v) {
    const db = await openDB();
    const store = tx(db, STORE_HL, 'readonly');
    const idx = store.index('by_ref');
    const rows = await reqToPromise(idx.getAll([side, book, ch, v]));
    return rows || [];
  }

  async function getHighlightsForPassage(side, book, ch, vStart, vEnd) {
    const out = [];
    const db = await openDB();
    const store = tx(db, STORE_HL, 'readonly');
    const idx = store.index('by_book_ch_v');

    const lower = [side, book, ch, vStart];
    const upper = [side, book, ch, vEnd];

    const range = IDBKeyRange.bound(lower, upper);
    return new Promise((resolve, reject) => {
      const cursorReq = idx.openCursor(range);
      cursorReq.onsuccess = () => {
        const cur = cursorReq.result;
        if (!cur) return resolve(out);
        out.push(cur.value);
        cur.continue();
      };
      cursorReq.onerror = () => reject(cursorReq.error);
    });
  }

  // -----------------------------
  // NOTES (CRUD completo)
  // Estructura esperada de nota:
  // { side, book, ch, v, offset, length, quote, text, created_at, updated_at }
  // -----------------------------
  async function addNote(n) {
    const db = await openDB();
    const store = tx(db, STORE_NOTES, 'readwrite');
    const id = await reqToPromise(store.add(n));
    return id;
  }

  async function updateNote(n) {
    const db = await openDB();
    const store = tx(db, STORE_NOTES, 'readwrite');
    await reqToPromise(store.put(n));
    return true;
  }

  async function deleteNote(id) {
    const db = await openDB();
    const store = tx(db, STORE_NOTES, 'readwrite');
    await reqToPromise(store.delete(id));
    return true;
  }

  async function getNote(id) {
    const db = await openDB();
    const store = tx(db, STORE_NOTES, 'readonly');
    const note = await reqToPromise(store.get(id));
    return note || null;
  }

  async function getNotesForVerse(side, book, ch, v) {
    const db = await openDB();
    const store = tx(db, STORE_NOTES, 'readonly');
    const idx = store.index('by_ref');
    const rows = await reqToPromise(idx.getAll([side, book, ch, v]));
    return rows || [];
  }

  async function getNoteByAnchor(side, book, ch, v, offset, length) {
    const db = await openDB();
    const store = tx(db, STORE_NOTES, 'readonly');
    const idx = store.index('by_anchor');
    const note = await reqToPromise(idx.get([side, book, ch, v, offset, length]));
    return note || null;
  }

  // Exponer API global
  window.AnnotationsDB = {
    openDB,

    // highlights
    addHighlight,
    deleteHighlight,
    getHighlightsForVerse,
    getHighlightsForPassage,

    // notes
    addNote,
    updateNote,
    deleteNote,
    getNote,
    getNoteByAnchor,
    getNotesForVerse
  };
})();
