// listanotas.js (COMPLETO) — IndexedDB
// Panel "Notas" (global) — NO confundir con comentarios de Eric
(function () {

  function escapeHtml(str){
    return String(str ?? "")
      .replaceAll("&","&amp;")
      .replaceAll("<","&lt;")
      .replaceAll(">","&gt;")
      .replaceAll('"',"&quot;")
      .replaceAll("'","&#039;");
  }

  function prettyBookName(slug){
    return String(slug || '').replace(/_/g,' ').replace(/\b\w/g, c => c.toUpperCase());
  }

  async function getAllNotes(){
    // Fuente: IndexedDB (alias creado en annotations-db.js)
    if (window.NotesDB && typeof window.NotesDB.listAllNotes === "function"){
      const arr = await window.NotesDB.listAllNotes();
      return Array.isArray(arr) ? arr : [];
    }
    return [];
  }

  function buildLabel(note){
    // Tus notas usan book/ch/v (no chapter/verse)
    const book = note.book ? prettyBookName(note.book) : "—";
    const ch = Number(note.ch || 0);
    const v  = Number(note.v  || 0);
    const ref = (ch && v) ? `${book} ${ch}:${v}` : book;

    // No tienes lemma/word en NotesUI; usa quote como “ancla”
    const anchor = (note.quote || "").trim();

    return { ref, anchor };
  }

  function renderNotasList(notes){
    const list = document.getElementById("notasList");
    if(!list) return;

    if(!notes.length){
      list.innerHTML = `<div class="text-muted small p-2">No hay notas guardadas.</div>`;
      return;
    }

    // Tus notas usan updated_at (snake_case)
    notes.sort((a,b)=> (b.updated_at || b.created_at || 0) - (a.updated_at || a.created_at || 0));

    list.innerHTML = notes.map(n=>{
      const { ref, anchor } = buildLabel(n);
      const preview = (n.text || "").toString().trim().slice(0, 140);
      const id = (n.id != null) ? String(n.id) : "";

      return `
        <button type="button"
          class="list-group-item list-group-item-action notas-item"
          data-note-id="${escapeHtml(id)}">
          <div><strong>${escapeHtml(ref)}</strong>${anchor ? " · " + escapeHtml(anchor) : ""}</div>
          <small>${escapeHtml(preview)}</small>
        </button>
      `;
    }).join("");

    list.querySelectorAll("[data-note-id]").forEach(btn=>{
      btn.addEventListener("click", async (ev)=>{
        ev.preventDefault();
        ev.stopPropagation();

        const id = btn.dataset.noteId;
        if(!id) return;

        // Abrir ventana real de nota (lo tienes en annotations-ui.js)
        if(window.openNoteById){
          window.openNoteById(id);
        }
      });
    });
  }

  async function refreshNotasListIfOpen(){
    const panel = document.getElementById("notasPanel");
    if(!panel) return;

    const isOpen = !panel.classList.contains("d-none");
    if(!isOpen) return;

    const search = document.getElementById("notasSearch");
    const q = (search ? search.value.trim().toLowerCase() : "");

    const all = await getAllNotes();

    if(!q){
      renderNotasList(all);
      return;
    }

    renderNotasList(
      all.filter(n=>{
        const { ref, anchor } = buildLabel(n);
        const text = (n.text || "").toLowerCase();
        return (
          ref.toLowerCase().includes(q) ||
          anchor.toLowerCase().includes(q) ||
          text.includes(q)
        );
      })
    );
  }

  async function toggleNotasPanel(force){
    const panel = document.getElementById("notasPanel");
    if(!panel) return;

    const open = !panel.classList.contains("d-none");
    const next = (typeof force === "boolean") ? force : !open;

    panel.classList.toggle("d-none", !next);

    if(next){
      await refreshNotasListIfOpen();
      const s = document.getElementById("notasSearch");
      if(s) s.focus();
    }
  }

  function initNotasUI(){
    const btn = document.getElementById("btnNotas");
    const search = document.getElementById("notasSearch");

    if(btn){
      btn.disabled = false;
      btn.addEventListener("click", (ev)=>{
        ev.preventDefault();
        toggleNotasPanel();
      });
    }

    if(search){
      search.addEventListener("input", ()=>{
        refreshNotasListIfOpen();
      });
    }
  }

  // API para que annotations-ui.js avise “guardé/eliminé”
  window.refreshNotasList = function(){ refreshNotasListIfOpen(); };
  window.dispatchNotasChanged = function(){
    window.dispatchEvent(new CustomEvent("notas:changed"));
  };
  window.addEventListener("notas:changed", () => { refreshNotasListIfOpen(); });

  document.addEventListener("DOMContentLoaded", initNotasUI);

})();
