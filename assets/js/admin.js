/*
 * Anímales — Editor en la propia página (modo administrador). Versión 3.
 *
 * Se abre con 4 clics en el logo y la contraseña 1411. La web se ve igual; en
 * "modo administrador" se puede:
 *   · Editar cualquier texto (clic y escribir).
 *   · Cambiar imágenes existentes (clic y elegir archivo).
 *   · Agregar imagen en espacios vacíos (.an-placeholder).
 *   · Reordenar bloques con ▲/▼, duplicar, eliminar y agregar secciones.
 *
 * Al Guardar, publica automáticamente en GitHub (API con token) — la web se
 * actualiza sola en ~1 minuto. También hay guardado local (carpeta) opcional.
 *
 * Todo se persiste como una capa de contenido en assets/data/contenido.json,
 * que se aplica sobre la página al cargar para TODOS los visitantes.
 *
 * Modelo de identidad estable:
 *   - data-ed-id  (e0, e1…): elementos de contenido (texto/imagen/fondo/slot).
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
  var publicando = false;       // mutex: un solo commit / publish a la vez
  var pubTimer = null;
  var pubGen = 0;
  var PUB_KEY = 'an_pub_estado';
  var PUB_MAX_MS = 4 * 60 * 1000; // tope de espera a Pages (~4 min)

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
  var ZONAS_EXCLUIDAS = '.an-admin-ui,nav,form,.modal,.an-flotantes,.an-galeria,.an-tarjeta__fotos';

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
    // El logo del menú no se edita como imagen: se usa para abrir el admin (4 clics).
    return !el.closest('.an-admin-ui,.modal,.an-flotantes,.an-galeria,.an-tarjeta__fotos,.an-flotante-card__icono,.navbar-brand,nav');
  }

  // Fondos editables: la PORTADA grande (.an-hero) de cada página SÍ se puede
  // cambiar (con un botón dedicado para no interferir con el texto encima), y las
  // cabeceras de tarjeta. Se excluyen las demás secciones/encabezados grandes.
  function esFondoEditable(el) {
    if (!esImagenValida(el)) return false;
    if (el.classList.contains('an-hero')) return true;
    var t = el.tagName;
    if (t === 'SECTION' || t === 'HEADER' || t === 'MAIN' || t === 'BODY' || t === 'FOOTER') return false;
    if (el.querySelector('h1,h2,h3,h4,h5,h6,.an-antetitulo,.lead,p')) return false;
    return true;
  }

  // Íconos editables (Bootstrap Icons), salvo los de zonas de UI/flotantes y los
  // que están dentro de un texto editable (para no anidar edición).
  function esIconoEditable(el) {
    if (el.closest('.an-admin-ui,.modal,.an-flotantes,.an-galeria,.an-tarjeta__fotos')) return false;
    var leaf = el.closest(SEL_TEXTO);
    if (leaf && esEditableTexto(leaf)) return false;
    return true;
  }

  // Espacios vacíos (.an-placeholder) o marcos de imagen sin <img>.
  function esSlotImagen(el) {
    if (!el || el.closest('.an-admin-ui,.modal,.an-flotantes,.an-galeria')) return false;
    if (el.classList.contains('an-placeholder')) return true;
    if (el.classList.contains('an-imagen-marco') &&
        !el.querySelector('img') &&
        !el.querySelector('.an-placeholder')) return true;
    return false;
  }

  function altDesdeSlot(el) {
    var t = (el.getAttribute('data-ed-alt') || el.textContent || '').trim();
    t = t.split('\n')[0].replace(/\s*assets\/.*/i, '').trim();
    return t || 'Imagen';
  }

  function reemplazarSlotPorImg(el, src) {
    var img = document.createElement('img');
    img.src = src;
    img.alt = altDesdeSlot(el);
    img.loading = 'lazy';
    var id = el.getAttribute('data-ed-id');
    if (id) {
      img.setAttribute('data-ed-id', id);
      img.setAttribute('data-ed-tipo', 'img');
    }
    var twin = el.getAttribute('data-ed-twin');
    if (twin) img.setAttribute('data-ed-twin', twin);

    // Si el slot es el marco vacío, insertar la img dentro; si es el
    // placeholder, reemplazarlo (queda dentro del .an-imagen-marco).
    if (el.classList.contains('an-imagen-marco')) {
      el.innerHTML = '';
      el.appendChild(img);
    } else {
      el.replaceWith(img);
    }
    return img;
  }

  /* =================================================================
     Asignación de IDs estables sobre el DOM prístino
     ================================================================= */
  function marcarContenido() {
    var sel = SEL_TEXTO + ',img,[style*="background-image"],i[class*="bi-"],.an-placeholder,.an-imagen-marco';
    var i = 0;
    document.querySelectorAll(sel).forEach(function (el) {
      if (el.hasAttribute('data-ed-id')) return;
      var tipo = null;
      if (el.tagName === 'IMG') { if (esImagenValida(el)) tipo = 'img'; }
      else if (el.tagName === 'I' && /\bbi-/.test(el.className)) { if (esIconoEditable(el)) tipo = 'icon'; }
      else if (el.matches('[style*="background-image"]')) { if (esFondoEditable(el)) tipo = 'bg'; }
      else if (el.classList.contains('an-imagen-marco')) {
        // Solo el marco vacío es un slot; si ya tiene img o placeholder, no es texto.
        if (el.querySelector('img, .an-placeholder')) return;
        if (esSlotImagen(el)) tipo = 'ph';
      }
      else if (el.classList.contains('an-placeholder')) { if (esSlotImagen(el)) tipo = 'ph'; }
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
    if (!el || !o) return el;
    if (o.t != null) { el.innerHTML = o.t; return el; }
    if (o.img != null) {
      if (el.tagName === 'IMG') {
        el.src = o.img;
        el.removeAttribute('srcset');
        return el;
      }
      if (el.getAttribute('data-ed-tipo') === 'ph' || esSlotImagen(el)) {
        return reemplazarSlotPorImg(el, o.img);
      }
      return el;
    }
    if (o.bg != null) { el.style.backgroundImage = "url('" + o.bg + "')"; return el; }
    if (o.icon != null) { aplicarIcono(el, o.icon); return el; }
    return el;
  }

  // Guarda el override. Si applyVisual es true, también pinta el DOM (íconos /
  // textos). Para imágenes con blob local se pasa false y el caller pinta.
  function fijarOverride(el, o, applyVisual) {
    if (applyVisual === undefined) applyVisual = true;
    var id = el.getAttribute('data-ed-id');
    if (id) datosPag().content[id] = o;
    if (applyVisual) el = aplicarUno(el, o) || el;
    var tw = el.getAttribute('data-ed-twin');
    if (tw) {
      datosPag().content[tw] = o;
      if (applyVisual) {
        var g = document.querySelector('[data-ed-id="' + tw + '"]');
        if (g) aplicarUno(g, o);
      }
    }
    marcarCambios(true);
    return el;
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
        ['an-ed', 'an-ed-t', 'an-ed-img', 'an-ed-bg', 'an-ed-ph', 'an-ed-icono', 'an-ed-bloque'].forEach(function (c) {
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
    var tipo = el.getAttribute('data-ed-tipo') || el.dataset.edt;
    // En fondos, ignorar clics que caen en hijos (texto/CTA de la portada).
    if (tipo === 'bg' && e.target !== el && !e.target.closest('.an-ed-bg-btn')) return;
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

  // Botón visible para fondos y para slots vacíos (placeholders).
  function agregarBotonImagen(el, etiqueta) {
    if (el.querySelector('.an-ed-bg-btn, .an-ed-ph-btn')) return;
    var esHero = el.classList.contains('an-hero');
    var esPh = el.getAttribute('data-ed-tipo') === 'ph' || el.classList.contains('an-placeholder');
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'an-admin-ui ' + (esPh ? 'an-ed-ph-btn' : ('an-ed-bg-btn' + (esHero ? ' an-ed-bg-btn--hero' : '')));
    btn.innerHTML = '<i class="bi bi-image"></i> ' + (etiqueta || (esHero ? 'Cambiar foto de portada' : 'Cambiar imagen'));
    btn.addEventListener('click', function (e) {
      e.preventDefault(); e.stopPropagation(); elegirImagen(el);
    });
    el.appendChild(btn);
  }

  // Enlaces del menú / pie / logo: permiten cambiar de página sin salir del
  // modo administrador (la sesión se conserva en sessionStorage).
  function esNavegacionSitio(a) {
    if (!a || a.closest('.an-admin-ui')) return false;
    if (a.closest('header, .navbar, .an-navbar, .breadcrumb, footer, .an-footer')) return true;
    var href = (a.getAttribute('href') || '').trim();
    if (!href || href === '#' || /^(mailto:|tel:|javascript:)/i.test(href)) return false;
    try {
      var u = new URL(href, location.href);
      if (u.origin !== location.origin) return false;
      return /(index|formaciones|servicios|terapias|experiencias|eventos|nosotros|contacto|reservar|404)\.html/i.test(u.pathname) ||
        /\/estudio\/?$/i.test(u.pathname);
    } catch (_) {
      return /\.html(?:[?#]|$)/i.test(href);
    }
  }

  function confirmarSalidaSiHayCambios() {
    if (!hayCambios) return true;
    return confirm('Tenés cambios sin guardar en esta página. Si navegás ahora se pierden. ¿Continuar?');
  }

  function bloquearEnlaces(e) {
    if (!adminOn) return;
    var a = e.target.closest('a');
    if (!a || a.closest('.an-admin-ui')) return;
    if (esNavegacionSitio(a)) {
      if (!confirmarSalidaSiHayCambios()) {
        e.preventDefault();
        e.stopPropagation();
      }
      // Si confirma (o no hay cambios), dejamos que el navegador siga el enlace.
      // sessionStorage an_admin mantiene el editor activo en la nueva página.
      return;
    }
    // Evitar que otros enlaces del contenido (WhatsApp, tarjetas, etc.) saquen
    // del flujo de edición por accidente.
    e.preventDefault();
  }

  function activarUnEditable(el) {
    if (!el || el._edC) return;
    el._edC = true;
    var tipo = el.getAttribute('data-ed-tipo');
    if (!tipo) {
      if (el.tagName === 'IMG') tipo = 'img';
      else if (el.tagName === 'I') tipo = 'icon';
      else if (el.matches('[style*="background-image"]')) tipo = 'bg';
      else if (esSlotImagen(el)) tipo = 'ph';
      else tipo = 't';
    }
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
    } else if (tipo === 'ph') {
      el.classList.add('an-ed', 'an-ed-ph');
      el.dataset.edt = 'ph';
      el.setAttribute('title', 'Clic para agregar una imagen');
      el.addEventListener('click', onClicImagen);
      agregarBotonImagen(el, 'Agregar imagen');
    } else {
      el.classList.add('an-ed', tipo === 'img' ? 'an-ed-img' : 'an-ed-bg');
      el.dataset.edt = tipo;
      if (tipo === 'img') el.setAttribute('title', 'Clic para cambiar la imagen');
      el.addEventListener('click', onClicImagen);
      if (tipo === 'bg') agregarBotonImagen(el);
    }
  }

  function activarContenido(scope) {
    var raiz = scope || document;
    if (raiz.matches && raiz.matches('[data-ed-id]')) activarUnEditable(raiz);
    raiz.querySelectorAll('[data-ed-id]').forEach(activarUnEditable);
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

    var slot = bloque.querySelector('[data-ed-tipo="ph"], .an-placeholder');
    var tools = document.createElement('div');
    tools.className = 'an-admin-ui an-bloque-tools';
    tools.innerHTML =
      (slot ? '<button class="an-bloque-btn an-bloque-btn--img" type="button" data-acc="img" title="Agregar imagen"><i class="bi bi-image"></i></button>' : '') +
      '<button class="an-bloque-btn" type="button" data-acc="up" title="Subir"><i class="bi bi-arrow-up"></i></button>' +
      '<button class="an-bloque-btn" type="button" data-acc="down" title="Bajar"><i class="bi bi-arrow-down"></i></button>' +
      '<button class="an-bloque-btn" type="button" data-acc="dup" title="Duplicar"><i class="bi bi-files"></i></button>' +
      '<button class="an-bloque-btn an-bloque-btn--del" type="button" data-acc="del" title="Eliminar"><i class="bi bi-trash"></i></button>';
    bloque.appendChild(tools);

    var btnImg = tools.querySelector('[data-acc="img"]');
    if (btnImg && slot) {
      btnImg.addEventListener('click', function (e) {
        e.preventDefault(); e.stopPropagation(); elegirImagen(slot);
      });
    }
    tools.querySelector('[data-acc="up"]').addEventListener('click', function (e) {
      e.preventDefault(); e.stopPropagation(); moverBloque(bloque, -1);
    });
    tools.querySelector('[data-acc="down"]').addEventListener('click', function (e) {
      e.preventDefault(); e.stopPropagation(); moverBloque(bloque, 1);
    });
    tools.querySelector('[data-acc="dup"]').addEventListener('click', function (e) {
      e.preventDefault(); e.stopPropagation(); duplicarBloque(bloque);
    });
    tools.querySelector('[data-acc="del"]').addEventListener('click', function (e) {
      e.preventDefault(); e.stopPropagation(); eliminarBloque(bloque);
    });
  }

  // Hermanos que son bloques movibles dentro del mismo contenedor.
  function hermanosBloque(cont, excluir) {
    return Array.prototype.filter.call(cont.children, function (ch) {
      return ch !== excluir && ch.getAttribute && ch.getAttribute('data-ed-bid');
    });
  }

  // Reordenar con los botones ▲/▼.
  function moverBloque(bloque, dir) {
    var cont = bloque.parentElement;
    if (!cont) return;
    var hs = hermanosBloque(cont, null);
    var i = hs.indexOf(bloque);
    if (dir < 0 && i > 0) cont.insertBefore(bloque, hs[i - 1]);
    else if (dir > 0 && i < hs.length - 1) cont.insertBefore(bloque, hs[i + 1].nextSibling);
    else return;
    guardarOrden(cont);
    marcarCambios(true);
    bloque.scrollIntoView({ behavior: 'smooth', block: 'center' });
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
    window.addEventListener('beforeunload', avisoSalida);
    mostrarBarra();
  }

  // Salir del modo administrador SIN recargar: quita la interfaz y las
  // afordancias de edición, dejando la página en su estado normal con los
  // cambios ya aplicados a la vista. Se usa tras guardar.
  function desactivarAdmin() {
    if (!adminOn) return;
    adminOn = false;
    sessionStorage.removeItem('an_admin');
    window.removeEventListener('beforeunload', avisoSalida);
    document.removeEventListener('click', bloquearEnlaces, true);

    document.querySelectorAll('.an-admin-ui').forEach(function (n) { n.remove(); });

    document.querySelectorAll('[data-ed-id]').forEach(function (el) {
      el.removeEventListener('input', onTextoInput);
      el.removeEventListener('click', onClicImagen);
      el.removeEventListener('click', onClicIcono);
      el.removeAttribute('contenteditable');
      el.removeAttribute('spellcheck');
      el.removeAttribute('title');
      ['an-ed', 'an-ed-t', 'an-ed-img', 'an-ed-bg', 'an-ed-ph', 'an-ed-icono'].forEach(function (c) { el.classList.remove(c); });
      el._edC = false;
    });
    document.querySelectorAll('[data-ed-bid]').forEach(function (b) {
      b.classList.remove('an-ed-bloque');
      b._edB = false;
    });
    document.querySelectorAll('.an-carril-dup').forEach(function (c) { c.classList.remove('an-carril-dup'); });

    document.body.classList.remove('an-admin');
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
      if (!/^image\//.test(f.type || '')) {
        aviso('Elegí un archivo de imagen (JPG, PNG, WebP…).', false);
        return;
      }
      var ruta = CARPETA_IMAGENES + '/' + nombreSeguro(f.name);
      var url = URL.createObjectURL(f);
      var tipo = el.getAttribute('data-ed-tipo') || el.dataset.edt || '';
      var esBg = tipo === 'bg';
      var esPh = tipo === 'ph' || el.classList.contains('an-placeholder') ||
        (el.classList.contains('an-imagen-marco') && !el.querySelector('img'));

      var destino = el;
      if (esBg) {
        el.style.backgroundImage = "url('" + url + "')";
        fijarOverride(el, { bg: ruta }, false);
      } else if (esPh) {
        destino = reemplazarSlotPorImg(el, url);
        fijarOverride(destino, { img: ruta }, false);
        if (adminOn) activarUnEditable(destino);
      } else {
        el.src = url;
        el.removeAttribute('srcset');
        fijarOverride(el, { img: ruta }, false);
      }

      // Gemelo de la marquesina: misma vista previa local.
      var tw = destino.getAttribute('data-ed-twin');
      if (tw) {
        var g = document.querySelector('[data-ed-id="' + tw + '"]');
        if (g) {
          if (esBg) g.style.backgroundImage = "url('" + url + "')";
          else if (g.tagName === 'IMG') { g.src = url; g.removeAttribute('srcset'); }
          else if (esSlotImagen(g)) {
            var gImg = reemplazarSlotPorImg(g, url);
            if (adminOn) activarUnEditable(gImg);
          }
        }
      }
      imagenesPend[ruta] = f;
      aviso(esPh ? 'Imagen agregada. Guardá para publicarla.' : 'Imagen actualizada. Guardá para publicarla.', true);
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

  function sleep(ms) {
    return new Promise(function (res) { setTimeout(res, ms); });
  }

  function ghHeaders(cfg) {
    return {
      'Authorization': 'Bearer ' + cfg.token,
      'Accept': 'application/vnd.github+json',
      'Content-Type': 'application/json',
      'X-GitHub-Api-Version': '2022-11-28'
    };
  }

  async function ghApi(cfg, url, opt) {
    var o = opt || {};
    var headers = Object.assign({}, ghHeaders(cfg), o.headers || {});
    var r = await fetch(url, Object.assign({}, o, { headers: headers }));
    if (!r.ok) {
      var t = await r.text();
      var msg = String(r.status);
      try { msg = (JSON.parse(t).message) || msg; } catch (_) {}
      var err = new Error(msg + (r.status === 401 || r.status === 403 ? ' (revisá el token y sus permisos)' : ''));
      err.status = r.status;
      throw err;
    }
    if (r.status === 204) return null;
    return r.json();
  }

  function fusionarContenido(remoto, local) {
    var out = {};
    var keys = {};
    Object.keys(remoto || {}).forEach(function (k) { keys[k] = true; });
    Object.keys(local || {}).forEach(function (k) { keys[k] = true; });
    Object.keys(keys).forEach(function (pag) {
      if (pag === '__meta') return;
      var r = (remoto && remoto[pag]) || {};
      var l = (local && local[pag]) || {};
      out[pag] = {
        content: Object.assign({}, r.content || {}, l.content || {}),
        order: Object.assign({}, r.order || {}, l.order || {}),
        added: (l.added && l.added.length) ? l.added.slice() : (r.added || []).slice(),
        removed: (function () {
          var set = {};
          (r.removed || []).concat(l.removed || []).forEach(function (id) { set[id] = true; });
          return Object.keys(set);
        })()
      };
    });
    return out;
  }

  async function leerContenidoRemoto(cfg) {
    var base = 'https://api.github.com/repos/' + cfg.owner + '/' + cfg.repo;
    try {
      var info = await ghApi(cfg, base + '/contents/' + RUTA_CONTENIDO + '?ref=' + encodeURIComponent(cfg.branch));
      if (!info || !info.content) return {};
      var bin = atob(String(info.content).replace(/\n/g, ''));
      var bytes = new Uint8Array(bin.length);
      for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      var raw = (typeof TextDecoder !== 'undefined')
        ? new TextDecoder('utf-8').decode(bytes)
        : decodeURIComponent(escape(bin));
      return JSON.parse(raw);
    } catch (e) {
      if (e && (e.status === 404 || /Not Found/i.test(String(e.message)))) return {};
      throw e;
    }
  }

  async function ghCommit(cfg, archivos, intento) {
    intento = intento || 0;
    var base = 'https://api.github.com/repos/' + cfg.owner + '/' + cfg.repo;
    try {
      var ref = await ghApi(cfg, base + '/git/ref/heads/' + cfg.branch);
      var baseSha = ref.object.sha;
      var baseCommit = await ghApi(cfg, base + '/git/commits/' + baseSha);
      var treeSha = baseCommit.tree.sha;

      var entries = [];
      for (var i = 0; i < archivos.length; i++) {
        var a = archivos[i];
        var content = a.file ? await b64file(a.file) : b64utf8(a.contenido);
        var blob = await ghApi(cfg, base + '/git/blobs', {
          method: 'POST',
          body: JSON.stringify({ content: content, encoding: 'base64' })
        });
        entries.push({ path: a.path, mode: '100644', type: 'blob', sha: blob.sha });
      }

      var tree = await ghApi(cfg, base + '/git/trees', {
        method: 'POST',
        body: JSON.stringify({ base_tree: treeSha, tree: entries })
      });
      var commit = await ghApi(cfg, base + '/git/commits', {
        method: 'POST',
        body: JSON.stringify({
          message: 'Editor web: actualizar contenido del sitio',
          tree: tree.sha,
          parents: [baseSha]
        })
      });
      await ghApi(cfg, base + '/git/refs/heads/' + cfg.branch, {
        method: 'PATCH',
        body: JSON.stringify({ sha: commit.sha, force: false })
      });
      return commit;
    } catch (e) {
      var msg = String((e && e.message) || e);
      var choque = e.status === 409 || /fast.?forward|Conflict|does not match|Reference update/i.test(msg);
      if (choque && intento < 4) {
        await sleep(700 + intento * 400);
        return ghCommit(cfg, archivos, intento + 1);
      }
      throw e;
    }
  }

  function leerPubEstado() {
    try { return JSON.parse(sessionStorage.getItem(PUB_KEY) || 'null'); } catch (_) { return null; }
  }
  function guardarPubEstado(st) {
    if (!st) sessionStorage.removeItem(PUB_KEY);
    else sessionStorage.setItem(PUB_KEY, JSON.stringify(st));
  }

  function fmtCountdown(ms) {
    var s = Math.max(0, Math.ceil(ms / 1000));
    var m = Math.floor(s / 60);
    var r = s % 60;
    return m + ':' + (r < 10 ? '0' : '') + r;
  }

  function actualizarBotonGuardar() {
    var boton = document.getElementById('an-btn-guardar');
    var estado = document.getElementById('an-admin-estado');
    if (!boton) return;
    var pub = leerPubEstado();
    if (publicando || (pub && pub.status === 'pending')) {
      boton.disabled = true;
      var falta = pub ? Math.max(0, (pub.startedAt + PUB_MAX_MS) - Date.now()) : PUB_MAX_MS;
      boton.textContent = 'Publicando… ' + fmtCountdown(falta);
      if (estado) estado.textContent = 'Esperando a que GitHub Pages publique (sin otro Guardar todavía)';
      return;
    }
    boton.disabled = false;
    boton.textContent = hayCambios ? 'Guardar' : 'Guardado ✓';
    if (estado && !hayCambios) estado.textContent = 'Todo guardado · web al día';
  }

  async function pagesTieneCommit(cfg, sha) {
    try {
      var builds = await ghApi(cfg, 'https://api.github.com/repos/' + cfg.owner + '/' + cfg.repo + '/pages/builds');
      if (!Array.isArray(builds) || !builds.length) return null;
      var b = builds[0];
      if (!b) return null;
      if (b.commit && sha && String(b.commit).indexOf(String(sha).slice(0, 7)) === 0) {
        if (b.status === 'built') return true;
        if (b.status === 'errored') return false;
        return null; // building
      }
      // Otro commit más nuevo ya built ⇒ el nuestro quedó atrás pero publicado el árbol.
      if (b.status === 'built' && b.commit && sha && Date.parse(b.created_at || 0) >= (leerPubEstado() || {}).startedAt) {
        // Si Pages built algo posterior al inicio, damos por buena la publicación.
        return true;
      }
      return null;
    } catch (_) {
      return null;
    }
  }

  async function verificarContenidoEnPages(firma) {
    try {
      var r = await fetch(RUTA_CONTENIDO + '?pub=' + Date.now(), { cache: 'no-store' });
      if (!r.ok) return false;
      var txt = await r.text();
      return !!(firma && txt.indexOf(firma) !== -1);
    } catch (_) {
      return false;
    }
  }

  function detenerPubTimer() {
    if (pubTimer) { clearInterval(pubTimer); pubTimer = null; }
  }

  async function monitorearPublicacion(cfg, commitSha, firma, startedAt) {
    var my = ++pubGen;
    publicando = true;
    var st = {
      status: 'pending',
      sha: commitSha,
      startedAt: startedAt || Date.now(),
      firma: firma || ''
    };
    guardarPubEstado(st);
    actualizarBotonGuardar();
    detenerPubTimer();

    pubTimer = setInterval(function () {
      if (my !== pubGen) return;
      var cur = leerPubEstado();
      if (!cur || cur.status !== 'pending') { detenerPubTimer(); actualizarBotonGuardar(); return; }
      if (Date.now() - cur.startedAt >= PUB_MAX_MS) {
        cur.status = 'timeout';
        guardarPubEstado(cur);
        publicando = false;
        detenerPubTimer();
        actualizarBotonGuardar();
        aviso('GitHub ya tiene los cambios. Pages puede tardar un poco más; si no los ves, recargá con Ctrl+F5.', true);
        return;
      }
      actualizarBotonGuardar();
    }, 1000);

    while (my === pubGen) {
      var cur = leerPubEstado();
      if (!cur || cur.status !== 'pending') break;
      if (Date.now() - cur.startedAt >= PUB_MAX_MS) break;

      var pagesOk = await pagesTieneCommit(cfg, commitSha);
      if (my !== pubGen) return;
      if (pagesOk === true) break;
      if (pagesOk === false) {
        cur.status = 'error';
        guardarPubEstado(cur);
        break;
      }
      if (firma && (await verificarContenidoEnPages(firma))) break;
      await sleep(8000);
    }

    if (my !== pubGen) return;
    detenerPubTimer();
    var fin = leerPubEstado() || st;
    if (fin.status === 'error') {
      publicando = false;
      guardarPubEstado(fin);
      actualizarBotonGuardar();
      aviso('GitHub guardó, pero Pages reportó error al publicar. Revisá Actions en el repo.', false);
      return;
    }
    if (fin.status === 'pending' || fin.status === 'timeout') {
      if (fin.status === 'pending') fin.status = 'ready';
      fin.readyAt = Date.now();
      guardarPubEstado(fin);
      publicando = false;
      actualizarBotonGuardar();
      if (fin.status === 'ready') {
        aviso('Cambios en GitHub y ya visibles (o listos) en la web. Podés seguir editando.', true);
      }
      return;
    }
    fin.status = 'ready';
    fin.readyAt = Date.now();
    guardarPubEstado(fin);
    publicando = false;
    actualizarBotonGuardar();
    aviso('Cambios en GitHub y ya visibles (o listos) en la web. Podés seguir editando.', true);
  }

  function reanudarMonitoreoSiCorresponde() {
    var st = leerPubEstado();
    if (!st || st.status !== 'pending') { actualizarBotonGuardar(); return; }
    if (publicando) { actualizarBotonGuardar(); return; }
    var cfg = ghConfig();
    if (!cfg.token) {
      st.status = 'ready';
      guardarPubEstado(st);
      actualizarBotonGuardar();
      return;
    }
    if (Date.now() - st.startedAt >= PUB_MAX_MS) {
      st.status = 'timeout';
      guardarPubEstado(st);
      publicando = false;
      actualizarBotonGuardar();
      return;
    }
    monitorearPublicacion(cfg, st.sha, st.firma, st.startedAt);
  }

  // Guardado unificado: local + GitHub (sin solapar commits) + espera a Pages.
  async function guardarTodo() {
    if (publicando || (leerPubEstado() || {}).status === 'pending') {
      aviso('Todavía se está publicando el guardado anterior. Esperá el conteo antes de volver a Guardar.', false);
      actualizarBotonGuardar();
      return;
    }

    var boton = document.getElementById('an-btn-guardar');
    var imgs = [];
    for (var r in imagenesPend) if (imagenesPend.hasOwnProperty(r)) imgs.push({ path: r, file: imagenesPend[r] });
    var imgsSnapshot = imgs.slice();
    var overSnapshot = JSON.parse(JSON.stringify(OVER));

    var msgs = [], algo = false, commitSha = null, firma = null;
    publicando = true;
    if (boton) { boton.disabled = true; boton.textContent = 'Guardando…'; }

    var cfg = ghConfig();

    // 1) Fusionar con lo que ya está en GitHub para no pisar otras páginas.
    var jsonStr;
    try {
      if (cfg.token) {
        var remoto = await leerContenidoRemoto(cfg);
        OVER = fusionarContenido(remoto, overSnapshot);
        // La página actual manda: reaplicar snapshot local encima del merge.
        if (overSnapshot[PAGINA]) OVER[PAGINA] = overSnapshot[PAGINA];
      }
      jsonStr = JSON.stringify(OVER, null, 2);
      firma = '"savedAt":"' + new Date().toISOString() + '"';
      // Marca verificable en el JSON para detectar cuándo Pages ya sirve este guardado.
      OVER.__meta = Object.assign({}, OVER.__meta || {}, {
        savedAt: new Date().toISOString(),
        page: PAGINA
      });
      jsonStr = JSON.stringify(OVER, null, 2);
      firma = OVER.__meta.savedAt;
    } catch (e) {
      publicando = false;
      actualizarBotonGuardar();
      aviso('No se pudo leer el contenido remoto: ' + ((e && e.message) || e), false);
      return;
    }

    // 2) Carpeta local del equipo (opcional).
    try {
      var raiz = await handleParaGuardar();
      await escribir(raiz, RUTA_CONTENIDO, jsonStr);
      for (var i = 0; i < imgsSnapshot.length; i++) await escribir(raiz, imgsSnapshot[i].path, imgsSnapshot[i].file);
      msgs.push('Local ✓'); algo = true;
    } catch (e) {
      msgs.push('Local ✗ (' + ((e && e.name === 'AbortError') ? 'sin carpeta' : (e && e.message) || e) + ')');
    }

    // 3) GitHub (commit atómico con reintento si hay carrera).
    if (cfg.token) {
      try {
        var archivos = [{ path: RUTA_CONTENIDO, contenido: jsonStr }];
        for (var j = 0; j < imgsSnapshot.length; j++) archivos.push({ path: imgsSnapshot[j].path, file: imgsSnapshot[j].file });
        var commit = await ghCommit(cfg, archivos);
        commitSha = commit && commit.sha;
        msgs.push('GitHub ✓');
        algo = true;
      } catch (e) {
        msgs.push('GitHub ✗ (' + ((e && e.message) || e) + ')');
      }
    } else {
      msgs.push('GitHub ✗ (falta el token en ⚙)');
    }

    if (algo && commitSha) {
      // Solo limpia las imágenes de ESTE guardado; si el usuario subió más mientras,
      // no estaban en imgsSnapshot.
      imgsSnapshot.forEach(function (it) { delete imagenesPend[it.path]; });
      marcarCambios(false);
      aviso('Guardado en GitHub — ' + msgs.join('  ·  ') + '. Esperando publicación en la web…', true);
      await monitorearPublicacion(cfg, commitSha, firma);
    } else {
      publicando = false;
      actualizarBotonGuardar();
      aviso('No se pudo guardar — ' + msgs.join('  ·  '), false);
      if (!cfg.token) setTimeout(abrirAjustes, 400);
    }
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
    var pub = leerPubEstado();
    if (e && !(pub && pub.status === 'pending')) {
      e.textContent = v ? 'Cambios sin guardar' : 'Todo guardado';
    }
    var barra = document.getElementById('an-admin-barra');
    if (barra) barra.classList.toggle('an-admin-barra--sucio', v);
    actualizarBotonGuardar();
  }

  function nombrePaginaActual() {
    var mapa = {
      'index.html': 'Inicio',
      'formaciones.html': 'Formaciones',
      'servicios.html': 'Servicios',
      'terapias.html': 'Terapias',
      'experiencias.html': 'Hospedaje',
      'eventos.html': 'Eventos',
      'nosotros.html': 'Nosotros',
      'contacto.html': 'Contacto'
    };
    return mapa[PAGINA] || PAGINA;
  }

  function mostrarBarra() {
    if (document.getElementById('an-admin-barra')) return;
    var barra = document.createElement('div');
    barra.id = 'an-admin-barra';
    barra.className = 'an-admin-ui an-admin-barra';
    barra.innerHTML =
      '<span class="an-admin-barra__marca"><i class="bi bi-pencil-square"></i> Admin · ' + nombrePaginaActual() + '</span>' +
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
      if ((leerPubEstado() || {}).status === 'pending') {
        if (!confirm('Hay una publicación en curso. ¿Salir de todos modos?')) return;
      } else if (hayCambios && !confirm('Tenés cambios sin publicar. ¿Salir de todos modos?')) {
        return;
      }
      sessionStorage.removeItem('an_admin');
      location.reload();
    });
    actualizarBotonGuardar();
    reanudarMonitoreoSiCorresponde();
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
        aviso('Modo administrador activo en todo el sitio. Usá el menú para editar otras páginas; Guardá antes de cambiar si hay cambios.', true);
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
        if (clics < 4) {
          var d = marca.getAttribute('href');
          if (d) {
            if (adminOn && !confirmarSalidaSiHayCambios()) { clics = 0; return; }
            location.href = d;
          }
        }
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
    else reanudarMonitoreoSiCorresponde();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { setTimeout(arranque, 0); });
  } else {
    setTimeout(arranque, 0);
  }
})();
