/*
 * Anímales — Editor en la propia página (modo administrador). Versión 2.
 *
 * Se abre con 4 clics en el logo y la contraseña 1411. La web se ve igual; en
 * "modo administrador" se puede:
 *   · Editar cualquier texto (clic y escribir).
 *   · Cambiar imágenes (clic y elegir archivo).
 *   · Arrastrar/reordenar bloques (secciones y tarjetas).
 *   · Duplicar, eliminar y agregar secciones.
 *
 * Al Guardar, publica automáticamente en GitHub (API con token) — la web se
 * actualiza sola en ~1 minuto. También hay guardado local (carpeta) opcional.
 *
 * Todo se persiste como una capa de contenido en assets/data/contenido.json,
 * que se aplica sobre la página al cargar para TODOS los visitantes.
 *
 * Modelo de identidad estable:
 *   - data-ed-id  (e0, e1…): elementos de contenido (texto/imagen/fondo).
 *   - data-ed-cid (c0, c1…): contenedores ordenables (main y filas .row).
 *   - data-ed-bid (b0, b1…): bloques movibles (hijos directos de un contenedor).
 *   Los IDs se asignan sobre el DOM "prístino" (HTML + render de main.js) antes
 *   de aplicar cambios, por lo que son estables entre recargas.
 */
(function () {
  'use strict';

  var PAGINA = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  if (!PAGINA) PAGINA = 'index.html';

  var CLAVE = '1411';
  var RUTA_CONTENIDO = 'assets/data/contenido.json';
  var CARPETA_IMAGENES = 'imagenes';

  var OVER = {};
  var imagenesPend = {};
  var hayCambios = false;
  var adminOn = false;
  var iniciado = false;
  var dirHandle = null;
  var arrastrando = null;

  /* =================================================================
     Selección de elementos editables
     ================================================================= */
  var SEL_TEXTO =
    'h1,h2,h3,h4,h5,h6,p,li,blockquote,figcaption,dt,dd,' +
    '.an-antetitulo,.lead,.an-footer-marca,.an-etiqueta,.an-enlace';

  // Nota: la marquesina (.an-carril) SÍ es editable; los textos dentro de
  // enlaces (tarjetas "Cuatro caminos") también. Sólo se excluyen la barra de
  // administración, la navegación, los formularios, los modales y los botones
  // flotantes.
  var ZONAS_EXCLUIDAS = '.an-admin-ui,nav,form,.modal,.an-flotantes';

  function esEditableTexto(el) {
    if (el.closest(ZONAS_EXCLUIDAS)) return false;
    if (el.closest('button')) return false;
    if (el.matches('[data-sitio],[data-wa],[data-red]')) return false;
    if (el.querySelector('[data-sitio],[data-wa],[data-red]')) return false;
    if (el.querySelector(SEL_TEXTO)) return false;
    if (el.tagName === 'LI' && el.querySelector('a')) return false;
    return !!(el.textContent && el.textContent.trim());
  }

  function esImagenValida(el) {
    return !el.closest('.an-admin-ui,.modal,.an-flotantes');
  }

  // Fondos editables: SÓLO bloques de imagen pequeños (cabeceras de tarjeta),
  // NO secciones/encabezados grandes (que contienen títulos o textos). Así se
  // evita el overlay que oscurecía la portada y dificultaba editar el texto.
  function esFondoEditable(el) {
    if (!esImagenValida(el)) return false;
    var t = el.tagName;
    if (t === 'SECTION' || t === 'HEADER' || t === 'MAIN' || t === 'BODY' || t === 'FOOTER') return false;
    if (el.classList.contains('an-hero')) return false;
    if (el.querySelector('h1,h2,h3,h4,h5,h6,.an-antetitulo,.lead,p')) return false;
    return true;
  }

  // Íconos editables (Bootstrap Icons), salvo los de zonas de UI/flotantes y los
  // que están dentro de un texto editable (para no anidar edición).
  function esIconoEditable(el) {
    if (el.closest('.an-admin-ui,.modal,.an-flotantes')) return false;
    var leaf = el.closest(SEL_TEXTO);
    if (leaf && esEditableTexto(leaf)) return false;
    return true;
  }

  /* =================================================================
     Asignación de IDs estables sobre el DOM prístino
     ================================================================= */
  function marcarContenido() {
    var sel = SEL_TEXTO + ',img,[style*="background-image"],i[class*="bi-"]';
    var i = 0;
    document.querySelectorAll(sel).forEach(function (el) {
      if (el.hasAttribute('data-ed-id')) return;
      var tipo = null;
      if (el.tagName === 'IMG') { if (esImagenValida(el)) tipo = 'img'; }
      else if (el.tagName === 'I' && /\bbi-/.test(el.className)) { if (esIconoEditable(el)) tipo = 'icon'; }
      else if (el.matches('[style*="background-image"]')) { if (esFondoEditable(el)) tipo = 'bg'; }
      else if (esEditableTexto(el)) { tipo = 't'; }
      if (!tipo) return;
      el.setAttribute('data-ed-id', 'e' + (i++));
      el.setAttribute('data-ed-tipo', tipo);
    });
    emparejarCarril();
  }

  // La marquesina duplica sus tarjetas (copia + copia) para el bucle. Emparejo
  // cada elemento editable con su gemelo para que al editar uno, se actualice el
  // otro y la marquesina se vea consistente.
  function emparejarCarril() {
    document.querySelectorAll('.an-carril__pista').forEach(function (pista) {
      var eds = pista.querySelectorAll('[data-ed-id]');
      var n = eds.length, mitad = n / 2;
      if (!n || mitad !== Math.floor(mitad)) return;
      for (var k = 0; k < mitad; k++) {
        eds[k].setAttribute('data-ed-twin', eds[k + mitad].getAttribute('data-ed-id'));
        eds[k + mitad].setAttribute('data-ed-twin', eds[k].getAttribute('data-ed-id'));
      }
    });
  }

  function marcarContenedores() {
    var contenedores = [];
    var main = document.querySelector('main');
    if (main) contenedores.push(main);
    (main || document).querySelectorAll('.row').forEach(function (r) {
      if (!r.closest('.an-carril') && !r.closest('form')) contenedores.push(r);
    });

    var c = 0, b = 0;
    contenedores.forEach(function (cont) {
      if (cont.hasAttribute('data-ed-cid')) return;
      var cid = 'c' + (c++);
      cont.setAttribute('data-ed-cid', cid);
      Array.prototype.forEach.call(cont.children, function (hijo) {
        if (hijo.nodeType !== 1) return;
        if (hijo.closest('.an-admin-ui')) return;
        hijo.setAttribute('data-ed-bid', 'b' + (b++));
        hijo.setAttribute('data-ed-cont', cid);
      });
    });
  }

  /* =================================================================
     Aplicar overrides (estructura y contenido) para TODOS
     ================================================================= */
  function datosPag() {
    OVER[PAGINA] = OVER[PAGINA] || {};
    var d = OVER[PAGINA];
    d.content = d.content || {};
    d.order = d.order || {};
    d.added = d.added || [];
    d.removed = d.removed || [];
    return d;
  }

  function aplicarEstructura() {
    if (!OVER[PAGINA]) return;
    var d = OVER[PAGINA];

    (d.removed || []).forEach(function (bid) {
      var el = document.querySelector('[data-ed-bid="' + bid + '"]');
      if (el) el.remove();
    });

    (d.added || []).forEach(function (a) {
      if (document.querySelector('[data-ed-bid="' + a.bid + '"]')) return;
      var cont = document.querySelector('[data-ed-cid="' + a.cid + '"]');
      if (!cont) return;
      var tmp = document.createElement('div');
      tmp.innerHTML = a.html;
      var el = tmp.firstElementChild;
      if (!el) return;
      el.setAttribute('data-ed-bid', a.bid);
      el.setAttribute('data-ed-cont', a.cid);
      cont.appendChild(el);
    });

    Object.keys(d.order || {}).forEach(function (cid) {
      var cont = document.querySelector('[data-ed-cid="' + cid + '"]');
      if (!cont) return;
      (d.order[cid] || []).forEach(function (bid) {
        var el = cont.querySelector(':scope > [data-ed-bid="' + bid + '"]');
        if (el) cont.appendChild(el);
      });
    });
  }

  function aplicarIcono(el, nombre) {
    el.className = el.className.replace(/\bbi-[a-z0-9-]+/g, '').replace(/\s+/g, ' ').trim();
    if (!/(^|\s)bi(\s|$)/.test(el.className)) el.className = ('bi ' + el.className).trim();
    if (nombre) el.classList.add(nombre);
  }

  function aplicarUno(el, o) {
    if (o.t != null) el.innerHTML = o.t;
    else if (o.img != null) { el.src = o.img; el.removeAttribute('srcset'); }
    else if (o.bg != null) el.style.backgroundImage = "url('" + o.bg + "')";
    else if (o.icon != null) aplicarIcono(el, o.icon);
  }

  // Fija un override para un elemento y, si es de la marquesina, replica en su
  // gemelo para que ambas copias se vean iguales.
  function fijarOverride(el, o) {
    var id = el.getAttribute('data-ed-id');
    if (id) datosPag().content[id] = o;
    aplicarUno(el, o);
    var tw = el.getAttribute('data-ed-twin');
    if (tw) {
      var g = document.querySelector('[data-ed-id="' + tw + '"]');
      if (g) { datosPag().content[tw] = o; aplicarUno(g, o); }
    }
    marcarCambios(true);
  }

  function aplicarContenido() {
    if (!OVER[PAGINA]) return;
    var c = OVER[PAGINA].content || {};
    Object.keys(c).forEach(function (id) {
      var el = document.querySelector('[data-ed-id="' + id + '"]');
      if (el) aplicarUno(el, c[id]);
    });
  }

  async function cargarOverrides() {
    try {
      var r = await fetch(RUTA_CONTENIDO + '?ts=' + Date.now(), { cache: 'no-store' });
      if (r.ok) OVER = await r.json();
    } catch (e) { /* sin archivo aún */ }
  }

  /* =================================================================
     Utilidades de bloques (limpiar / clonar / IDs nuevos)
     ================================================================= */
  function nuevoId(pref) {
    return pref + Date.now().toString(36) + Math.floor(Math.random() * 1e4).toString(36);
  }

  function limpiarClon(root) {
    root.querySelectorAll('.an-admin-ui').forEach(function (n) { n.remove(); });
    var todos = [root].concat(Array.prototype.slice.call(root.querySelectorAll('*')));
    todos.forEach(function (n) {
      n.removeAttribute && n.removeAttribute('contenteditable');
      n.removeAttribute && n.removeAttribute('spellcheck');
      n.removeAttribute && n.removeAttribute('data-ed-twin');
      if (n.classList) {
        ['an-ed', 'an-ed-t', 'an-ed-img', 'an-ed-bg', 'an-ed-icono', 'an-ed-bloque', 'an-arrastrando'].forEach(function (c) {
          n.classList.remove(c);
        });
      }
    });
  }

  function reasignarIds(root) {
    root.querySelectorAll('[data-ed-id]').forEach(function (el) {
      el.setAttribute('data-ed-id', nuevoId('n'));
    });
  }

  function htmlLimpio(bloque) {
    var clon = bloque.cloneNode(true);
    limpiarClon(clon);
    return clon.outerHTML;
  }

  /* =================================================================
     Modo administrador: activar / desactivar
     ================================================================= */
  function onTextoInput(e) {
    var el = e.currentTarget;
    var id = el.getAttribute('data-ed-id');
    if (!id) return;
    var o = { t: el.innerHTML.trim() };
    datosPag().content[id] = o;
    var tw = el.getAttribute('data-ed-twin');
    if (tw) {
      var g = document.querySelector('[data-ed-id="' + tw + '"]');
      if (g) { datosPag().content[tw] = o; g.innerHTML = o.t; }
    }
    marcarCambios(true);
  }

  function onClicImagen(e) {
    if (!adminOn) return;
    var el = e.currentTarget;
    if (el.dataset.edt === 'bg' && e.target !== el) return;
    e.preventDefault();
    e.stopPropagation();
    elegirImagen(el);
  }

  function onClicIcono(e) {
    if (!adminOn) return;
    e.preventDefault();
    e.stopPropagation();
    abrirSelectorIcono(e.currentTarget);
  }

  function bloquearEnlaces(e) {
    if (!adminOn) return;
    var a = e.target.closest('a');
    if (a && !a.closest('.an-admin-ui')) e.preventDefault();
  }

  function activarContenido(scope) {
    scope.querySelectorAll('[data-ed-id]').forEach(function (el) {
      if (el._edC) return; el._edC = true;
      var tipo = el.getAttribute('data-ed-tipo') ||
        (el.tagName === 'IMG' ? 'img' : (el.tagName === 'I' ? 'icon' : (el.matches('[style*="background-image"]') ? 'bg' : 't')));
      el.setAttribute('data-ed-tipo', tipo);
      if (tipo === 't') {
        el.classList.add('an-ed', 'an-ed-t');
        el.setAttribute('contenteditable', 'true');
        el.setAttribute('spellcheck', 'false');
        el.addEventListener('input', onTextoInput);
      } else if (tipo === 'icon') {
        el.classList.add('an-ed', 'an-ed-icono');
        el.setAttribute('title', 'Clic para cambiar el ícono');
        el.addEventListener('click', onClicIcono);
      } else {
        el.classList.add('an-ed', tipo === 'img' ? 'an-ed-img' : 'an-ed-bg');
        el.dataset.edt = tipo;
        if (tipo === 'img') el.setAttribute('title', 'Clic para cambiar la imagen');
        el.addEventListener('click', onClicImagen);
      }
    });
  }

  function guardarOrden(cont) {
    if (!cont) return;
    var cid = cont.getAttribute('data-ed-cid');
    if (!cid) return;
    var ids = [];
    Array.prototype.forEach.call(cont.children, function (ch) {
      var b = ch.getAttribute && ch.getAttribute('data-ed-bid');
      if (b) ids.push(b);
    });
    datosPag().order[cid] = ids;
  }

  function esAdded(bid) {
    return (datosPag().added || []).some(function (a) { return a.bid === bid; });
  }

  function activarBloque(bloque) {
    if (bloque._edB) return; bloque._edB = true;
    bloque.classList.add('an-ed-bloque');

    var tools = document.createElement('div');
    tools.className = 'an-admin-ui an-bloque-tools';
    tools.innerHTML =
      '<span class="an-bloque-mover" draggable="true" title="Arrastrar para reordenar"><i class="bi bi-arrows-move"></i></span>' +
      '<button class="an-bloque-btn" type="button" data-acc="dup" title="Duplicar"><i class="bi bi-files"></i></button>' +
      '<button class="an-bloque-btn an-bloque-btn--del" type="button" data-acc="del" title="Eliminar"><i class="bi bi-trash"></i></button>';
    bloque.appendChild(tools);

    var mover = tools.querySelector('.an-bloque-mover');
    mover.addEventListener('dragstart', function (e) {
      arrastrando = bloque;
      bloque.classList.add('an-arrastrando');
      e.dataTransfer.effectAllowed = 'move';
      try { e.dataTransfer.setData('text/plain', 'bloque'); } catch (_) {}
    });
    mover.addEventListener('dragend', function () {
      var cont = arrastrando ? arrastrando.parentElement : null;
      if (arrastrando) arrastrando.classList.remove('an-arrastrando');
      arrastrando = null;
      if (cont) { guardarOrden(cont); marcarCambios(true); }
    });
    tools.querySelector('[data-acc="dup"]').addEventListener('click', function (e) {
      e.preventDefault(); e.stopPropagation(); duplicarBloque(bloque);
    });
    tools.querySelector('[data-acc="del"]').addEventListener('click', function (e) {
      e.preventDefault(); e.stopPropagation(); eliminarBloque(bloque);
    });
  }

  function activarBloques(scope) {
    scope.querySelectorAll('[data-ed-bid]').forEach(activarBloque);
  }

  function duplicarBloque(bloque) {
    var tmp = document.createElement('div');
    tmp.innerHTML = htmlLimpio(bloque);
    var clon = tmp.firstElementChild;
    if (!clon) return;
    reasignarIds(clon);
    var cid = bloque.getAttribute('data-ed-cont');
    var bid = nuevoId('nb');
    clon.setAttribute('data-ed-bid', bid);
    clon.setAttribute('data-ed-cont', cid);
    bloque.after(clon);

    activarContenido(clon);
    activarBloque(clon);

    datosPag().added.push({ bid: bid, cid: cid, html: htmlLimpio(clon) });
    guardarOrden(clon.parentElement);
    marcarCambios(true);
    aviso('Bloque duplicado. Editá su contenido y guardá para publicar.', true);
  }

  function eliminarBloque(bloque) {
    if (!confirm('¿Eliminar este bloque?')) return;
    var bid = bloque.getAttribute('data-ed-bid');
    var cont = bloque.parentElement;
    var d = datosPag();
    if (esAdded(bid)) {
      d.added = d.added.filter(function (a) { return a.bid !== bid; });
    } else if (bid && d.removed.indexOf(bid) === -1) {
      d.removed.push(bid);
    }
    bloque.remove();
    guardarOrden(cont);
    marcarCambios(true);
  }

  function agregarSeccion() {
    var main = document.querySelector('main');
    if (!main) { aviso('No hay dónde agregar la sección en esta página.', false); return; }
    var cid = main.getAttribute('data-ed-cid');
    var bid = nuevoId('nb');
    var idT = nuevoId('n'), idP = nuevoId('n');
    var sec = document.createElement('section');
    sec.className = 'an-seccion-nueva py-5';
    sec.setAttribute('data-ed-bid', bid);
    sec.setAttribute('data-ed-cont', cid);
    sec.innerHTML =
      '<div class="container">' +
      '  <h2 class="mb-3" data-ed-id="' + idT + '" data-ed-tipo="t">Nueva sección</h2>' +
      '  <p class="mb-0" data-ed-id="' + idP + '" data-ed-tipo="t">Hacé clic para editar este texto. Podés duplicar, mover o eliminar esta sección con los controles de la esquina.</p>' +
      '</div>';
    main.appendChild(sec);

    activarContenido(sec);
    activarBloque(sec);

    datosPag().added.push({ bid: bid, cid: cid, html: htmlLimpio(sec) });
    guardarOrden(main);
    marcarCambios(true);
    sec.scrollIntoView({ behavior: 'smooth', block: 'center' });
    aviso('Sección agregada al final de la página.', true);
  }

  // En modo administrador la marquesina se muestra completa (todas las tarjetas
  // visibles, en filas, sin animación) y se oculta la copia duplicada, para
  // poder editar también las que normalmente quedan fuera de pantalla.
  function prepararCarrilAdmin() {
    document.querySelectorAll('.an-carril__pista').forEach(function (pista) {
      var cards = pista.children;
      var n = cards.length;
      if (n < 2) return;
      var mitad = Math.floor(n / 2);
      for (var k = mitad; k < n; k++) cards[k].classList.add('an-carril-dup');
    });
  }

  function activarAdmin() {
    if (adminOn) return;
    adminOn = true;
    document.body.classList.add('an-admin');
    prepararCarrilAdmin();
    activarContenido(document);
    activarBloques(document);
    document.addEventListener('click', bloquearEnlaces, true);
    document.addEventListener('dragover', onDragOver);
    window.addEventListener('beforeunload', avisoSalida);
    mostrarBarra();
  }

  function onDragOver(e) {
    if (!arrastrando) return;
    var cont = arrastrando.parentElement;
    var over = e.target.closest ? e.target.closest('[data-ed-bid]') : null;
    if (!over || over === arrastrando) return;
    if (over.parentElement !== cont) return;
    e.preventDefault();
    var r = over.getBoundingClientRect();
    var antes = (e.clientY - r.top) < r.height / 2;
    cont.insertBefore(arrastrando, antes ? over : over.nextSibling);
  }

  function avisoSalida(e) {
    if (!hayCambios) return;
    e.preventDefault();
    e.returnValue = '';
    return '';
  }

  /* =================================================================
     Cambiar imagen
     ================================================================= */
  function nombreSeguro(nombre) {
    var punto = nombre.lastIndexOf('.');
    var base = (punto > 0 ? nombre.slice(0, punto) : nombre)
      .toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'imagen';
    var ext = (punto > 0 ? nombre.slice(punto + 1) : 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
    return base.slice(0, 40) + '-' + Date.now().toString(36) + '.' + ext;
  }

  function elegirImagen(el) {
    var input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.style.display = 'none';
    document.body.appendChild(input);
    input.addEventListener('change', function () {
      var f = input.files && input.files[0];
      input.remove();
      if (!f) return;
      var ruta = CARPETA_IMAGENES + '/' + nombreSeguro(f.name);
      var url = URL.createObjectURL(f);
      var esBg = el.dataset.edt === 'bg';
      // Se muestra con blob local; el override guarda la ruta final del archivo.
      if (esBg) el.style.backgroundImage = "url('" + url + "')";
      else { el.src = url; el.removeAttribute('srcset'); }
      fijarOverride(el, esBg ? { bg: ruta } : { img: ruta });
      // El gemelo (marquesina) también debe mostrar la imagen local al instante.
      var tw = el.getAttribute('data-ed-twin');
      if (tw) {
        var g = document.querySelector('[data-ed-id="' + tw + '"]');
        if (g) { if (esBg) g.style.backgroundImage = "url('" + url + "')"; else { g.src = url; g.removeAttribute('srcset'); } }
      }
      imagenesPend[ruta] = f;
    });
    input.click();
  }

  /* =================================================================
     Cambiar ícono (Bootstrap Icons)
     ================================================================= */
  function abrirSelectorIcono(el) {
    if (document.getElementById('an-admin-icono')) return;
    var actual = (el.className.match(/bi-[a-z0-9-]+/) || ['bi-star'])[0];
    var modal = document.createElement('div');
    modal.id = 'an-admin-icono';
    modal.className = 'an-admin-ui an-admin-modal';
    modal.innerHTML =
      '<div class="an-admin-modal__caja">' +
      '  <h3 class="an-admin-modal__titulo">Cambiar ícono</h3>' +
      '  <p class="an-admin-modal__texto">Escribí el nombre del ícono (Bootstrap Icons). Ej.: <b>bi-heart</b>, <b>bi-star</b>, <b>bi-tree</b>.</p>' +
      '  <input id="an-icono-input" class="an-admin-modal__input an-admin-modal__input--txt" type="text" autocomplete="off" value="' + actual + '">' +
      '  <div class="an-admin-iconos" id="an-icono-sugeridos"></div>' +
      '  <p class="an-admin-modal__texto"><a href="https://icons.getbootstrap.com/" target="_blank" rel="noopener">Ver todos los íconos disponibles</a></p>' +
      '  <div class="an-admin-modal__acciones">' +
      '    <button class="an-admin-btn" id="an-icono-cancelar" type="button">Cancelar</button>' +
      '    <button class="an-admin-btn an-admin-btn--ok" id="an-icono-ok" type="button">Aplicar</button>' +
      '  </div>' +
      '</div>';
    document.body.appendChild(modal);

    var input = document.getElementById('an-icono-input');
    var prev = document.getElementById('an-icono-sugeridos');
    var sugeridos = ['bi-heart', 'bi-star', 'bi-tree', 'bi-sun', 'bi-flower1', 'bi-people',
      'bi-people-fill', 'bi-house-heart', 'bi-gift', 'bi-mortarboard', 'bi-diagram-3',
      'bi-heart-pulse', 'bi-stars', 'bi-emoji-smile', 'bi-award', 'bi-compass'];
    prev.innerHTML = sugeridos.map(function (n) {
      return '<button type="button" class="an-icono-chip" data-i="' + n + '" title="' + n + '"><i class="bi ' + n + '"></i></button>';
    }).join('');
    prev.querySelectorAll('.an-icono-chip').forEach(function (chip) {
      chip.addEventListener('click', function () { input.value = chip.getAttribute('data-i'); });
    });

    function cerrar() { modal.remove(); }
    function aplicar() {
      var nombre = input.value.trim();
      if (nombre && nombre.indexOf('bi-') !== 0) nombre = 'bi-' + nombre;
      if (!nombre) { cerrar(); return; }
      fijarOverride(el, { icon: nombre });
      var tw = el.getAttribute('data-ed-twin');
      if (tw) { var g = document.querySelector('[data-ed-id="' + tw + '"]'); if (g) aplicarIcono(g, nombre); }
      cerrar();
    }
    document.getElementById('an-icono-ok').addEventListener('click', aplicar);
    document.getElementById('an-icono-cancelar').addEventListener('click', cerrar);
    input.addEventListener('keydown', function (e) { if (e.key === 'Enter') aplicar(); if (e.key === 'Escape') cerrar(); });
    modal.addEventListener('click', function (e) { if (e.target === modal) cerrar(); });
    input.focus();
  }

  /* =================================================================
     Publicar en GitHub (API con token)
     ================================================================= */
  function ghConfig() {
    return {
      token: localStorage.getItem('an_gh_token') || '',
      owner: localStorage.getItem('an_gh_owner') || 'Angelos2024',
      repo: localStorage.getItem('an_gh_repo') || 'estudio',
      branch: localStorage.getItem('an_gh_branch') || 'main'
    };
  }

  function b64utf8(str) { return btoa(unescape(encodeURIComponent(str))); }

  async function b64file(file) {
    var buf = await file.arrayBuffer();
    var bytes = new Uint8Array(buf);
    var bin = '', paso = 0x8000;
    for (var i = 0; i < bytes.length; i += paso) {
      bin += String.fromCharCode.apply(null, bytes.subarray(i, i + paso));
    }
    return btoa(bin);
  }

  async function ghCommit(cfg, archivos) {
    var base = 'https://api.github.com/repos/' + cfg.owner + '/' + cfg.repo;
    var H = {
      'Authorization': 'Bearer ' + cfg.token,
      'Accept': 'application/vnd.github+json',
      'Content-Type': 'application/json'
    };
    async function api(url, opt) {
      var r = await fetch(url, opt || { headers: H });
      if (!r.ok) {
        var t = await r.text();
        var msg = r.status;
        try { msg = (JSON.parse(t).message) || r.status; } catch (_) {}
        throw new Error(msg + (r.status === 401 || r.status === 403 ? ' (revisá el token y sus permisos)' : ''));
      }
      return r.json();
    }

    var ref = await api(base + '/git/ref/heads/' + cfg.branch, { headers: H });
    var baseSha = ref.object.sha;
    var baseCommit = await api(base + '/git/commits/' + baseSha, { headers: H });
    var treeSha = baseCommit.tree.sha;

    var entries = [];
    for (var i = 0; i < archivos.length; i++) {
      var a = archivos[i];
      var content = a.file ? await b64file(a.file) : b64utf8(a.contenido);
      var blob = await api(base + '/git/blobs', {
        method: 'POST', headers: H,
        body: JSON.stringify({ content: content, encoding: 'base64' })
      });
      entries.push({ path: a.path, mode: '100644', type: 'blob', sha: blob.sha });
    }

    var tree = await api(base + '/git/trees', {
      method: 'POST', headers: H,
      body: JSON.stringify({ base_tree: treeSha, tree: entries })
    });
    var commit = await api(base + '/git/commits', {
      method: 'POST', headers: H,
      body: JSON.stringify({ message: 'Editor web: actualizar contenido del sitio', tree: tree.sha, parents: [baseSha] })
    });
    await api(base + '/git/refs/heads/' + cfg.branch, {
      method: 'PATCH', headers: H,
      body: JSON.stringify({ sha: commit.sha, force: false })
    });
    return commit;
  }

  // Guardado unificado: escribe en la carpeta local, publica en GitHub y, con
  // eso, la web se actualiza sola. Todo con un solo botón.
  async function guardarTodo() {
    var boton = document.getElementById('an-btn-guardar');
    var jsonStr = JSON.stringify(OVER, null, 2);
    var imgs = [];
    for (var r in imagenesPend) if (imagenesPend.hasOwnProperty(r)) imgs.push({ path: r, file: imagenesPend[r] });

    var msgs = [], algo = false;
    if (boton) { boton.disabled = true; boton.textContent = 'Guardando…'; }

    // 1) Carpeta local del equipo.
    try {
      var raiz = await handleParaGuardar();
      await escribir(raiz, RUTA_CONTENIDO, jsonStr);
      for (var i = 0; i < imgs.length; i++) await escribir(raiz, imgs[i].path, imgs[i].file);
      msgs.push('Local ✓'); algo = true;
    } catch (e) {
      msgs.push('Local ✗ (' + ((e && e.name === 'AbortError') ? 'sin carpeta' : (e && e.message) || e) + ')');
    }

    // 2) GitHub (y con eso, la web).
    var cfg = ghConfig();
    if (cfg.token) {
      try {
        var archivos = [{ path: RUTA_CONTENIDO, contenido: jsonStr }];
        for (var j = 0; j < imgs.length; j++) archivos.push({ path: imgs[j].path, file: imgs[j].file });
        await ghCommit(cfg, archivos);
        msgs.push('GitHub + web ✓'); algo = true;
      } catch (e) {
        msgs.push('GitHub ✗ (' + ((e && e.message) || e) + ')');
      }
    } else {
      msgs.push('GitHub ✗ (falta el token en ⚙)');
    }

    if (algo) { imagenesPend = {}; marcarCambios(false); }
    var todoOk = msgs.every(function (m) { return m.indexOf('✓') > -1; });
    aviso('Guardado — ' + msgs.join('  ·  ') + (todoOk ? '. La web se actualiza en ~1 minuto.' : ''), todoOk);
    if (!cfg.token) setTimeout(abrirAjustes, 400);
    if (boton) { boton.disabled = false; boton.textContent = 'Guardar'; }
  }

  async function vincularCarpeta() {
    try {
      dirHandle = await pedirCarpeta();
      aviso('Carpeta del proyecto vinculada. Ya podés Guardar (local + GitHub + web).', true);
    } catch (e) {
      if (!e || e.name !== 'AbortError') aviso((e && e.message) || 'No se pudo vincular la carpeta.', false);
    }
  }

  /* =================================================================
     Guardado local opcional (File System Access API)
     ================================================================= */
  var IDB_DB = 'animales-admin', IDB_STORE = 'handles';
  function idb() {
    return new Promise(function (res, rej) {
      var req = indexedDB.open(IDB_DB, 1);
      req.onupgradeneeded = function () { req.result.createObjectStore(IDB_STORE); };
      req.onsuccess = function () { res(req.result); };
      req.onerror = function () { rej(req.error); };
    });
  }
  async function idbGuardar(k, v) {
    var db = await idb();
    return new Promise(function (res, rej) {
      var tx = db.transaction(IDB_STORE, 'readwrite');
      tx.objectStore(IDB_STORE).put(v, k);
      tx.oncomplete = function () { res(); };
      tx.onerror = function () { rej(tx.error); };
    });
  }
  async function idbLeer(k) {
    var db = await idb();
    return new Promise(function (res) {
      var tx = db.transaction(IDB_STORE, 'readonly');
      var req = tx.objectStore(IDB_STORE).get(k);
      req.onsuccess = function () { res(req.result || null); };
      req.onerror = function () { res(null); };
    });
  }
  async function permisoOk(h, esc) {
    var op = { mode: esc ? 'readwrite' : 'read' };
    if ((await h.queryPermission(op)) === 'granted') return true;
    return (await h.requestPermission(op)) === 'granted';
  }
  async function pedirCarpeta() {
    if (!window.showDirectoryPicker) throw new Error('Tu navegador no permite guardado local. Usá Chrome o Edge.');
    var h = await window.showDirectoryPicker({ mode: 'readwrite' });
    try { await h.getFileHandle('index.html'); }
    catch (e) { throw new Error('Elegí la carpeta del proyecto (donde está index.html).'); }
    await idbGuardar('dir', h);
    return h;
  }
  async function handleParaGuardar() {
    if (dirHandle && (await permisoOk(dirHandle, true))) return dirHandle;
    var g = await idbLeer('dir');
    if (g && (await permisoOk(g, true))) { dirHandle = g; return dirHandle; }
    dirHandle = await pedirCarpeta();
    return dirHandle;
  }
  async function carpetaAnidada(raiz, partes) {
    var actual = raiz;
    for (var k = 0; k < partes.length; k++) actual = await actual.getDirectoryHandle(partes[k], { create: true });
    return actual;
  }
  async function escribir(raiz, ruta, contenido) {
    var partes = ruta.split('/');
    var archivo = partes.pop();
    var carpeta = partes.length ? await carpetaAnidada(raiz, partes) : raiz;
    var fh = await carpeta.getFileHandle(archivo, { create: true });
    var w = await fh.createWritable();
    await w.write(contenido);
    await w.close();
  }
  /* =================================================================
     Interfaz
     ================================================================= */
  function marcarCambios(v) {
    hayCambios = v;
    var e = document.getElementById('an-admin-estado');
    if (e) e.textContent = v ? 'Cambios sin guardar' : 'Todo guardado';
    var barra = document.getElementById('an-admin-barra');
    if (barra) barra.classList.toggle('an-admin-barra--sucio', v);
  }

  function mostrarBarra() {
    if (document.getElementById('an-admin-barra')) return;
    var barra = document.createElement('div');
    barra.id = 'an-admin-barra';
    barra.className = 'an-admin-ui an-admin-barra';
    barra.innerHTML =
      '<span class="an-admin-barra__marca"><i class="bi bi-pencil-square"></i> Modo administrador</span>' +
      '<span id="an-admin-estado" class="an-admin-barra__estado">Todo guardado</span>' +
      '<button id="an-btn-seccion" class="an-admin-btn" type="button"><i class="bi bi-plus-lg"></i> Sección</button>' +
      '<button id="an-btn-guardar" class="an-admin-btn an-admin-btn--ok" type="button">Guardar</button>' +
      '<button id="an-btn-ajustes" class="an-admin-btn" type="button" title="Configurar GitHub y carpeta"><i class="bi bi-gear"></i></button>' +
      '<button id="an-btn-salir" class="an-admin-btn" type="button">Salir</button>';
    document.body.appendChild(barra);
    document.getElementById('an-btn-seccion').addEventListener('click', agregarSeccion);
    document.getElementById('an-btn-guardar').addEventListener('click', guardarTodo);
    document.getElementById('an-btn-ajustes').addEventListener('click', abrirAjustes);
    document.getElementById('an-btn-salir').addEventListener('click', function () {
      if (hayCambios && !confirm('Tenés cambios sin publicar. ¿Salir de todos modos?')) return;
      location.reload();
    });
  }

  function aviso(texto, ok) {
    var el = document.getElementById('an-admin-aviso');
    if (!el) {
      el = document.createElement('div');
      el.id = 'an-admin-aviso';
      el.className = 'an-admin-ui an-admin-aviso';
      document.body.appendChild(el);
    }
    el.textContent = texto;
    el.classList.toggle('an-admin-aviso--error', ok === false);
    el.classList.add('an-admin-aviso--visible');
    clearTimeout(el._t);
    el._t = setTimeout(function () { el.classList.remove('an-admin-aviso--visible'); }, 6000);
  }

  function abrirAjustes() {
    if (document.getElementById('an-admin-ajustes')) return;
    var cfg = ghConfig();
    var modal = document.createElement('div');
    modal.id = 'an-admin-ajustes';
    modal.className = 'an-admin-ui an-admin-modal';
    modal.innerHTML =
      '<div class="an-admin-modal__caja">' +
      '  <h3 class="an-admin-modal__titulo">Publicar en GitHub</h3>' +
      '  <p class="an-admin-modal__texto">Pegá un <b>token de acceso</b> con permiso de escritura en el repositorio. Se guarda solo en este navegador.</p>' +
      '  <label class="an-admin-campo">Token<input id="an-cfg-token" class="an-admin-modal__input an-admin-modal__input--txt" type="password" autocomplete="off" placeholder="github_pat_…"></label>' +
      '  <div class="an-admin-fila">' +
      '    <label class="an-admin-campo">Usuario<input id="an-cfg-owner" class="an-admin-modal__input an-admin-modal__input--txt" type="text" value="' + cfg.owner + '"></label>' +
      '    <label class="an-admin-campo">Repo<input id="an-cfg-repo" class="an-admin-modal__input an-admin-modal__input--txt" type="text" value="' + cfg.repo + '"></label>' +
      '    <label class="an-admin-campo">Rama<input id="an-cfg-branch" class="an-admin-modal__input an-admin-modal__input--txt" type="text" value="' + cfg.branch + '"></label>' +
      '  </div>' +
      '  <p class="an-admin-modal__texto"><a href="https://github.com/settings/personal-access-tokens/new" target="_blank" rel="noopener">Crear un token (fine-grained)</a> → permiso <b>Contents: Read and write</b> sobre el repositorio <b>' + cfg.owner + '/' + cfg.repo + '</b>.</p>' +
      '  <p class="an-admin-modal__texto">Carpeta local del proyecto (para guardar también en tu equipo):</p>' +
      '  <button class="an-admin-btn an-admin-btn--bloque" id="an-cfg-carpeta" type="button"><i class="bi bi-folder2-open"></i> Vincular carpeta del proyecto</button>' +
      '  <div class="an-admin-modal__error" id="an-cfg-error"></div>' +
      '  <div class="an-admin-modal__acciones">' +
      '    <button class="an-admin-btn" id="an-cfg-cancelar" type="button">Cancelar</button>' +
      '    <button class="an-admin-btn an-admin-btn--ok" id="an-cfg-guardar" type="button">Guardar</button>' +
      '  </div>' +
      '</div>';
    document.body.appendChild(modal);
    var tok = document.getElementById('an-cfg-token');
    if (cfg.token) tok.placeholder = '•••••• (ya configurado, dejalo vacío para no cambiarlo)';
    function cerrar() { modal.remove(); }
    document.getElementById('an-cfg-carpeta').addEventListener('click', vincularCarpeta);
    document.getElementById('an-cfg-cancelar').addEventListener('click', cerrar);
    modal.addEventListener('click', function (e) { if (e.target === modal) cerrar(); });
    document.getElementById('an-cfg-guardar').addEventListener('click', function () {
      if (tok.value.trim()) localStorage.setItem('an_gh_token', tok.value.trim());
      localStorage.setItem('an_gh_owner', document.getElementById('an-cfg-owner').value.trim());
      localStorage.setItem('an_gh_repo', document.getElementById('an-cfg-repo').value.trim());
      localStorage.setItem('an_gh_branch', document.getElementById('an-cfg-branch').value.trim() || 'main');
      cerrar();
      aviso('Configuración de GitHub guardada.', true);
    });
  }

  function pedirClave() {
    if (sessionStorage.getItem('an_admin') === '1') { activarAdmin(); return; }
    if (document.getElementById('an-admin-modal-clave')) return;
    var modal = document.createElement('div');
    modal.id = 'an-admin-modal-clave';
    modal.className = 'an-admin-ui an-admin-modal';
    modal.innerHTML =
      '<div class="an-admin-modal__caja">' +
      '  <h3 class="an-admin-modal__titulo">Acceso administrador</h3>' +
      '  <p class="an-admin-modal__texto">Ingresá la contraseña para editar la página.</p>' +
      '  <input id="an-admin-clave" class="an-admin-modal__input" type="password" inputmode="numeric" autocomplete="off" placeholder="Contraseña">' +
      '  <div class="an-admin-modal__error" id="an-admin-clave-error"></div>' +
      '  <div class="an-admin-modal__acciones">' +
      '    <button class="an-admin-btn" id="an-admin-cancelar" type="button">Cancelar</button>' +
      '    <button class="an-admin-btn an-admin-btn--ok" id="an-admin-entrar" type="button">Entrar</button>' +
      '  </div>' +
      '</div>';
    document.body.appendChild(modal);
    var input = document.getElementById('an-admin-clave');
    var error = document.getElementById('an-admin-clave-error');
    input.focus();
    function cerrar() { modal.remove(); }
    function intentar() {
      if (input.value === CLAVE) {
        sessionStorage.setItem('an_admin', '1');
        cerrar();
        activarAdmin();
        aviso('Modo administrador activado. Clic en un texto para editarlo, en una imagen para cambiarla, o arrastrá los bloques.', true);
      } else { error.textContent = 'Contraseña incorrecta.'; input.value = ''; input.focus(); }
    }
    document.getElementById('an-admin-entrar').addEventListener('click', intentar);
    document.getElementById('an-admin-cancelar').addEventListener('click', cerrar);
    input.addEventListener('keydown', function (e) { if (e.key === 'Enter') intentar(); if (e.key === 'Escape') cerrar(); });
    modal.addEventListener('click', function (e) { if (e.target === modal) cerrar(); });
  }

  function conectarLogo() {
    var marca = document.querySelector('.navbar-brand');
    if (!marca) return;
    var clics = 0, temporizador = null;
    marca.addEventListener('click', function (e) {
      e.preventDefault();
      clics++;
      clearTimeout(temporizador);
      if (clics >= 4) { clics = 0; pedirClave(); return; }
      temporizador = setTimeout(function () {
        if (clics < 4) { var d = marca.getAttribute('href'); if (d) location.href = d; }
        clics = 0;
      }, 450);
    });
  }

  /* =================================================================
     Arranque
     ================================================================= */
  async function arranque() {
    if (iniciado) return; iniciado = true;
    conectarLogo();
    await cargarOverrides();
    marcarContenido();
    marcarContenedores();
    aplicarEstructura();
    aplicarContenido();
    if (sessionStorage.getItem('an_admin') === '1') activarAdmin();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { setTimeout(arranque, 0); });
  } else {
    setTimeout(arranque, 0);
  }
})();
