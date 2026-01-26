// annotations-db.js
(() => {
  const DB_NAME = 'biblia_annotations_db';
  const DB_VERSION = 1;

  const STORE_HL = 'highlights';
  const STORE_NOTES = 'notes';

  let _dbPromise = null;

  function openDB() {
    if (_dbPromise) return _dbPromise;

    _dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);

      req.onupgradeneeded = (e) => {
        const db = e.target.result;

        // Highlights: subrayados parciales
        if (!db.objectStoreNames.contains(STORE_HL)) {
          const st = db.createObjectStore(STORE_HL, { keyPath: 'id', autoIncrement: true });

          // Para buscar por verso
          st.createIndex('by_ref', ['side', 'book', 'ch', 'v'], { unique: false });

          // Para buscar por rango (pasaje)
          st.createIndex('by_book_ch_v', ['side', 'book', 'ch', 'v'], { unique: false });
        }

        // Notes: anotaciones de texto
        if (!db.objectStoreNames.contains(STORE_NOTES)) {
          const stN = db.createObjectStore(STORE_NOTES, { keyPath: 'id', autoIncrement: true });
          stN.createIndex('by_ref', ['side', 'book', 'ch', 'v'], { unique: false });
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
    const req = store.add(h);
    const id = await reqToPromise(req);
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
    const req = idx.getAll([side, book, ch, v]);
    const rows = await reqToPromise(req);
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
  // NOTES
  // -----------------------------
  async function addNote(n) {
    const db = await openDB();
    const store = tx(db, STORE_NOTES, 'readwrite');
    const id = await reqToPromise(store.add(n));
    return id;
  }

  async function getNotesForVerse(side, book, ch, v) {
    const db = await openDB();
    const store = tx(db, STORE_NOTES, 'readonly');
    const idx = store.index('by_ref');
    const rows = await reqToPromise(idx.getAll([side, book, ch, v]));
    return rows || [];
  }

  // Exponer API global (simple)
  window.AnnotationsDB = {
    openDB,
    addHighlight,
    deleteHighlight,
    getHighlightsForVerse,
    getHighlightsForPassage,

    addNote,
    getNotesForVerse
  };
})();
