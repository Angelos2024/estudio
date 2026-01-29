

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

function abbrevBook(slug){
  // slug = "1co", "juan", etc. Si ya tienes mapping real, mejor.
  // Esto deja algo corto y legible.
  const s = String(slug || "").toLowerCase();

  const map = {
    genesis:"Gn", exodo:"Ex", levitico:"Lv", numeros:"Nm", deuteronomio:"Dt",
    josue:"Jos", jueces:"Jue", rut:"Rt", "1samuel":"1S", "2samuel":"2S",
    "1reyes":"1R", "2reyes":"2R", "1cronicas":"1Cr", "2cronicas":"2Cr",
    esdras:"Esd", nehemias:"Neh", ester:"Est", job:"Job", salmos:"Sal",
    proverbios:"Pr", eclesiastes:"Ecl", cantares:"Cnt", isaias:"Is",
    jeremias:"Jer", lamentaciones:"Lam", ezequiel:"Ez", daniel:"Dn",
    oseas:"Os", joel:"Jl", amos:"Am", abdias:"Abd", jonas:"Jon", miqueas:"Mi",
    nahum:"Nah", habacuc:"Hab", sofonias:"Sof", ageo:"Ag", zacarias:"Zac",
    malaquias:"Mal",
    mateo:"Mt", marcos:"Mr", lucas:"Lc", juan:"Jn", hechos:"Hch",
    romanos:"Ro", "1corintios":"1Co", "2corintios":"2Co", galatas:"Ga",
    efesios:"Ef", filipenses:"Fil", colosenses:"Col", "1tesalonicenses":"1Ts",
    "2tesalonicenses":"2Ts", "1timoteo":"1Ti", "2timoteo":"2Ti", tito:"Tit",
    filemon:"Flm", hebreos:"Heb", santiago:"Stg", "1pedro":"1P", "2pedro":"2P",
    "1juan":"1Jn", "2juan":"2Jn", "3juan":"3Jn", judas:"Jud", apocalipsis:"Ap"
  };

  // si el slug coincide directo
  if(map[s]) return map[s];

  // fallback: toma 3 letras
  return s ? (s.slice(0,3).replace(/^\w/, c => c.toUpperCase())) : "—";
}


  async function getAllNotes(){
    // Fuente: IndexedDB (alias creado en annotations-db.js)
    if (window.NotesDB && typeof window.NotesDB.listAllNotes === "function"){
      const arr = await window.NotesDB.listAllNotes();
      return Array.isArray(arr) ? arr : [];
    }
    return [];
  }

function firstWordFrom(note){
  const anchor = (note.quote || "").trim();
  const base = anchor || (note.text || "").trim();
  if(!base) return "";
  // primera “palabra” sin signos
  const w = base.split(/\s+/)[0] || "";
  return w.replace(/[.,;:!?¿¡()[\]{}"“”'’]/g, "");
}

function buildLabel(note){
  const book = abbrevBook(note.book);
  const ch = Number(note.ch || 0);
  const v  = Number(note.v  || 0);
  const ref = (ch && v) ? `${book} ${ch}:${v}` : book;

  const fw = firstWordFrom(note);
  return { ref, fw };
}


  function renderNotasList(notes){
    const list = document.getElementById("notasList");
    if(!list) return;

    if(!notes.length){
  list.innerHTML = `<div class="text-muted small p-2">No hay notas guardadas.</div>`;
  return;
}


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
