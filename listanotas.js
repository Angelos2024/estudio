// =======================
// LISTA GLOBAL DE NOTAS
// (NO confundir con comentarios de Eric)
// =======================

(function () {

  const NOTES_LS_KEY = "bible_notes_v1";

  function getAllNotes(){
    try{
      const raw = localStorage.getItem(NOTES_LS_KEY);
      const arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr : [];
    }catch(e){
      return [];
    }
  }

  function escapeHtml(str){
    return String(str)
      .replaceAll("&","&amp;")
      .replaceAll("<","&lt;")
      .replaceAll(">","&gt;")
      .replaceAll('"',"&quot;")
      .replaceAll("'","&#039;");
  }

  function buildNoteLabel(n){
    const ref = n.refText || `${n.book || ""} ${n.chapter || ""}:${n.verse || ""}`.trim();
    const w = (n.word || n.lemma || "").trim();
    return { ref, w };
  }

  function renderNotasList(notes){
    const list = document.getElementById("notasList");
    if(!list) return;

    if(!notes.length){
      list.innerHTML = `<div class="text-muted small p-2">No hay notas guardadas.</div>`;
      return;
    }

    notes.sort((a,b)=> (b.updatedAt||0) - (a.updatedAt||0));

    list.innerHTML = notes.map(n=>{
      const { ref, w } = buildNoteLabel(n);
      const preview = (n.preview || n.text || "").toString().trim().slice(0,120);

      return `
        <button type="button"
          class="list-group-item list-group-item-action notas-item"
          data-note-id="${escapeHtml(n.id)}">
          <div><strong>${escapeHtml(ref || "—")}</strong>${w ? " · "+escapeHtml(w) : ""}</div>
          <small>${escapeHtml(preview)}</small>
        </button>
      `;
    }).join("");

    list.querySelectorAll("[data-note-id]").forEach(btn=>{
      btn.addEventListener("click", ev=>{
        ev.preventDefault();
        ev.stopPropagation();

        const id = btn.dataset.noteId;
        const note = getAllNotes().find(n => String(n.id) === String(id));
        if(!note) return;

        if(window.openNoteById){
          window.openNoteById(note.id, note);
        }
      });
    });
  }

  function toggleNotasPanel(force){
    const panel = document.getElementById("notasPanel");
    if(!panel) return;

    const open = !panel.classList.contains("d-none");
    const next = typeof force === "boolean" ? force : !open;

    panel.classList.toggle("d-none", !next);

    if(next){
      renderNotasList(getAllNotes());
      const s = document.getElementById("notasSearch");
      if(s) s.focus();
    }
  }

  function initNotasUI(){
    const btn = document.getElementById("btnNotas");
    const search = document.getElementById("notasSearch");

    if(btn){
      btn.disabled = false;
      btn.addEventListener("click", ev=>{
        ev.preventDefault();
        toggleNotasPanel();
      });
    }

    if(search){
      search.addEventListener("input", ()=>{
        const q = search.value.trim().toLowerCase();
        const all = getAllNotes();

        if(!q){
          renderNotasList(all);
          return;
        }

        renderNotasList(
          all.filter(n=>{
            const { ref, w } = buildNoteLabel(n);
            const text = (n.text || n.preview || "").toLowerCase();
            return (
              (ref || "").toLowerCase().includes(q) ||
              (w || "").toLowerCase().includes(q) ||
              text.includes(q)
            );
          })
        );
      });
    }
  }

  document.addEventListener("DOMContentLoaded", initNotasUI);

})();
