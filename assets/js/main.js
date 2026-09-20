/*
 * Anímales — Lógica compartida del sitio.
 * Depende de config.js y data.js, que deben cargarse antes que este archivo.
 */

(function () {
  'use strict';

  /* ---------------------------------------------------------------------
     Utilidades
     --------------------------------------------------------------------- */

  /** Escapa texto antes de insertarlo en HTML. */
  function esc(texto) {
    return String(texto ?? '').replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  /** Construye un enlace de WhatsApp con mensaje precargado. */
  function enlaceWhatsApp(mensaje) {
    const texto = mensaje || SITIO.whatsappSaludo;
    return 'https://wa.me/' + SITIO.whatsapp + '?text=' + encodeURIComponent(texto);
  }

  /* ---------------------------------------------------------------------
     Datos de contacto: se inyectan en cualquier página desde config.js
     --------------------------------------------------------------------- */
  function aplicarDatosDelSitio() {
    document.querySelectorAll('[data-wa]').forEach(function (el) {
      el.href = enlaceWhatsApp(el.dataset.wa || '');
    });

    document.querySelectorAll('[data-sitio]').forEach(function (el) {
      const campo = el.dataset.sitio;
      if (campo === 'email') {
        el.textContent = SITIO.email;
        if (el.tagName === 'A') el.href = 'mailto:' + SITIO.email;
      } else if (campo === 'telefono') {
        el.textContent = SITIO.telefono;
        if (el.tagName === 'A') el.href = 'tel:' + SITIO.telefono.replace(/\s/g, '');
      } else if (campo === 'direccion') {
        el.textContent = SITIO.direccion;
      } else if (campo === 'horario') {
        el.textContent = SITIO.horario;
      } else if (campo === 'anio') {
        el.textContent = new Date().getFullYear();
      }
    });

    const mapa = document.querySelector('[data-mapa]');
    if (mapa) mapa.src = SITIO.mapaEmbed;

    document.querySelectorAll('[data-red]').forEach(function (el) {
      const url = SITIO.redes[el.dataset.red];
      if (url) {
        el.href = url;
      } else {
        el.remove(); // Red social aún no definida por el cliente
      }
    });
  }

  /* ---------------------------------------------------------------------
     Navegación: marca el enlace de la página actual
     --------------------------------------------------------------------- */
  function marcarEnlaceActivo() {
    const actual = location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.an-navbar .nav-link').forEach(function (enlace) {
      const destino = enlace.getAttribute('href');
      if (destino === actual) {
        enlace.classList.add('active');
        enlace.setAttribute('aria-current', 'page');
      }
    });
  }

  function sombraAlDesplazar() {
    const nav = document.querySelector('.an-navbar');
    if (!nav) return;
    const alternar = function () {
      nav.classList.toggle('an-navbar--scroll', window.scrollY > 12);
    };
    alternar();
    window.addEventListener('scroll', alternar, { passive: true });
  }

  /* ---------------------------------------------------------------------
     Tarjetas de servicio
     Uso: <div data-servicios="formaciones"></div>
          <div data-servicios="destacados"></div>
     --------------------------------------------------------------------- */
  function tarjetaServicio(servicio) {
    const cat = CATEGORIAS[servicio.categoria];
    const mensaje =
      'Hola Anímales, quisiera información sobre: ' + servicio.nombre + '.';

    const tieneGaleria = servicio.galeria && servicio.galeria.length;
    const btnFotos = tieneGaleria
      ? '<button type="button" class="an-tarjeta__fotos" data-abrir-galeria="' +
        esc(servicio.slug) + '" aria-label="Ver fotos de ' + esc(servicio.nombre) + '">' +
        '<i class="bi bi-images"></i><span>Fotos</span></button>'
      : '';

    // Cabecera de la tarjeta. Con 'img' muestra la foto; sin ella, un
    // placeholder limpio con el color y el ícono de la categoría.
    const media = servicio.img
      ? '<div class="an-tarjeta__media" style="background-image:url(\'' +
          esc(servicio.img) + '\')">' + btnFotos + '</div>'
      : '<div class="an-tarjeta__media an-tarjeta__media--vacia">' +
          '<span class="an-tarjeta__icono"><i class="bi ' + cat.icono +
          '"></i></span>' + btnFotos + '</div>';

    return [
      '<div class="col-md-6 col-lg-4 an-revelar">',
      '  <article class="an-tarjeta an-cat-' + cat.color +
        (tieneGaleria ? ' an-tarjeta--galeria" data-galeria="' + esc(servicio.slug) + '"' : '"') + '>',
      '    ' + media,
      '    <div class="an-meta">',
      '      <span class="an-etiqueta">' + esc(cat.nombre) + '</span>',
      '      <span class="an-etiqueta an-etiqueta--linea">' + esc(servicio.modalidad) + '</span>',
      '    </div>',
      '    <h3>' + esc(servicio.nombre) + '</h3>',
      '    <p class="mb-2"><strong>Dirigido a:</strong> ' + esc(servicio.dirigido) + '</p>',
      '    <p>' + esc(servicio.descripcion) + '</p>',
      '    <div class="an-acciones d-flex flex-wrap gap-2">',
      '      <a class="btn an-btn-principal btn-sm" href="contacto.html?servicio=' +
        encodeURIComponent(servicio.slug) + '">Reservar</a>',
      '      <a class="btn an-btn-contorno btn-sm" href="' + enlaceWhatsApp(mensaje) +
        '" target="_blank" rel="noopener">Consultar</a>',
      '    </div>',
      '  </article>',
      '</div>',
    ].join('');
  }

  function renderizarServicios() {
    document.querySelectorAll('[data-servicios]').forEach(function (contenedor) {
      const filtro = contenedor.dataset.servicios;
      const lista =
        filtro === 'destacados'
          ? SERVICIOS.filter(function (s) { return s.destacado; })
          : SERVICIOS.filter(function (s) {
              return s.categoria === filtro ||
                (s.extraCategorias && s.extraCategorias.indexOf(filtro) !== -1);
            });

      contenedor.classList.add('row', 'g-4');
      contenedor.innerHTML = lista.map(tarjetaServicio).join('');
    });
  }

  /* ---------------------------------------------------------------------
     Accesos a categorías
     Uso: <div data-categorias></div>
     --------------------------------------------------------------------- */
  function renderizarCategorias() {
    const contenedor = document.querySelector('[data-categorias]');
    if (!contenedor) return;

    contenedor.classList.add('row', 'g-4');
    contenedor.innerHTML = Object.values(CATEGORIAS)
      .map(function (cat) {
        return [
          '<div class="col-sm-6 col-lg-3 an-revelar">',
          '  <a class="an-tarjeta-cat an-cat-' + cat.color + '" href="' + cat.pagina + '">',
          '    <span class="an-icono"><i class="bi ' + cat.icono + '"></i></span>',
          '    <h3>' + esc(cat.nombre) + '</h3>',
          '    <p>' + esc(cat.descripcion) + '</p>',
          '    <span class="an-enlace">Ver más <i class="bi bi-arrow-right"></i></span>',
          '  </a>',
          '</div>',
        ].join('');
      })
      .join('');
  }

  /* ---------------------------------------------------------------------
     Carril de tarjetas flotantes (marquesina)
     Uso: <div class="an-carril" data-carril-cards></div>
     Se desliza en bucle continuo y se detiene al pasar el mouse.
     --------------------------------------------------------------------- */
  // 8 tarjetas independientes de la marquesina.
  // Cada una usa su propia imagen en /imagenes (tarjeta-1..8.jpg).
  // Mientras la imagen no exista, se muestra el color de la categoría como fondo.
  const CARRIL_TARJETAS = [
    {
      slug: 'diplomado-equinoterapia', img: 'imagenes/tarjeta-1.jpg', color: 'rosa',
      pagina: 'formaciones.html',
      titulo: 'Diplomado en Equinoterapia',
      texto: 'Formación técnica e integral en intervención terapéutica asistida con caballos.',
    },
    {
      slug: 'diplomado-ceec', img: 'imagenes/tarjeta-2.jpg', color: 'rosa',
      pagina: 'formaciones.html',
      titulo: 'Diplomado CEEC',
      texto: 'Constelaciones familiares y equilibrio emocional a través del campo sistémico equino.',
    },
    {
      slug: 'convivencias-grupales', img: 'imagenes/tarjeta-3.jpg', color: 'morado',
      pagina: 'servicios.html',
      titulo: 'Convivencias Grupales',
      texto: 'Jornadas para desatar nudos relacionales con la guía neutral de la manada.',
    },
    {
      slug: 'mentoria-pareja', img: 'imagenes/tarjeta-4.jpg', color: 'morado',
      pagina: 'servicios.html',
      titulo: 'Mentoría de Pareja',
      texto: 'Abordaje vivencial para clarificar patrones y fortalecer el vínculo.',
    },
    {
      slug: 'equinoterapia-clinica', img: 'imagenes/tarjeta-5.jpg', color: 'verde',
      pagina: 'terapias.html',
      titulo: 'Equinoterapia',
      texto: 'Intervención multidisciplinaria en un ambiente natural al aire libre, controlado y seguro.',
    },
    {
      slug: 'estimulacion-temprana', img: 'imagenes/tarjeta-6.jpg', color: 'verde',
      pagina: 'terapias.html',
      titulo: 'Estimulación Temprana',
      texto: 'Integración sensorial, motricidad y vínculo afectivo en plena naturaleza.',
    },
    {
      slug: 'hospedaje-retiro', img: 'imagenes/tarjeta-7.jpg', color: 'amarillo',
      pagina: 'experiencias.html',
      titulo: 'Hospedaje de Retiro',
      texto: 'Estancia en un entorno natural de paz para descansar y reconectar.',
    },
    {
      slug: 'certificados-regalo', img: 'imagenes/tarjeta-8.jpg', color: 'amarillo',
      pagina: 'experiencias.html',
      titulo: 'Certificados de Regalo',
      texto: 'Un obsequio con propósito, canjeable por cualquier servicio de Anímales.',
    },
  ];

  function renderizarCarril() {
    const contenedor = document.querySelector('[data-carril-cards]');
    if (!contenedor) return;

    const cards = CARRIL_TARJETAS
      .map(function (t) {
        var srv = t.slug ? servicioPorSlug(t.slug) : null;
        var img = (srv && srv.img) || t.img;
        return [
          '<article class="an-flotante-card an-cat-' + t.color + '">',
          '  <div class="an-flotante-card__media" style="background-image:url(\'' +
            esc(img) + '\')">',
          '    <span class="an-flotante-card__icono" aria-hidden="true"><img src="assets/img/huella-mano.png" alt=""></span>',
          '  </div>',
          '  <div class="an-flotante-card__cuerpo">',
          '    <h3>' + esc(t.titulo) + '</h3>',
          '    <p>' + esc(t.texto) + '</p>',
          '  </div>',
          '</article>',
        ].join('');
      })
      .join('');

    const pista = document.createElement('div');
    pista.className = 'an-carril__pista';
    // Se duplica el contenido para lograr un bucle continuo sin saltos.
    pista.innerHTML = cards + cards;

    contenedor.innerHTML = '';
    contenedor.appendChild(pista);
  }

  /* ---------------------------------------------------------------------
     Formulario de contacto y reservas
     Sin backend: arma un mensaje y lo abre en WhatsApp Business.
     --------------------------------------------------------------------- */
  function prepararFormulario() {
    const form = document.querySelector('#form-contacto');
    if (!form) return;

    // Rellena un <select> con los servicios agrupados por categoría.
    function poblarServicios(destino, excluirSlug) {
      if (!destino) return;
      Object.values(CATEGORIAS).forEach(function (cat) {
        const items = SERVICIOS.filter(function (s) {
          return s.categoria === cat.id && s.slug !== excluirSlug;
        });
        if (!items.length) return;
        const grupo = document.createElement('optgroup');
        grupo.label = cat.nombre;
        items.forEach(function (s) {
          const opcion = document.createElement('option');
          opcion.value = s.slug;
          opcion.textContent = s.nombre;
          grupo.appendChild(opcion);
        });
        destino.appendChild(grupo);
      });
    }

    const SLUG_REGALO = 'certificados-regalo';
    const select = form.querySelector('#servicio');
    const selectRegalo = form.querySelector('#servicioRegalo');
    const bloqueRegalo = form.querySelector('#bloque-regalo');

    poblarServicios(select);
    // El servicio a canjear con el certificado (sin incluir la propia gift card).
    poblarServicios(selectRegalo, SLUG_REGALO);

    // Muestra los campos de emisor/receptor solo cuando se elige el certificado.
    function alternarRegalo() {
      if (!bloqueRegalo || !select) return;
      bloqueRegalo.classList.toggle('d-none', select.value !== SLUG_REGALO);
    }
    if (select) select.addEventListener('change', alternarRegalo);

    // Preselección al llegar desde una tarjeta: contacto.html?servicio=slug
    const solicitado = new URLSearchParams(location.search).get('servicio');
    if (solicitado && select &&
        select.querySelector('option[value="' + CSS.escape(solicitado) + '"]')) {
      select.value = solicitado;
    }
    alternarRegalo();

    form.addEventListener('submit', function (evento) {
      evento.preventDefault();
      evento.stopPropagation();

      form.classList.add('was-validated');
      if (!form.checkValidity()) return;

      const datos = new FormData(form);
      const servicio = SERVICIOS.find(function (s) { return s.slug === datos.get('servicio'); });
      const esRegalo = datos.get('servicio') === 'certificados-regalo';
      const servicioRegalo = SERVICIOS.find(function (s) { return s.slug === datos.get('servicioRegalo'); });

      let mensajeUsuario = datos.get('mensaje') || '';
      if (esRegalo) {
        // Sin tocar el backend: incrustamos los datos del regalo en el mensaje
        // para que queden registrados en la hoja y en el correo.
        const detalleRegalo = [
          'Certificado de regalo:',
          '· Emisor (quién regala): ' + (datos.get('emisor') || 'No indicado'),
          '· Receptor (quién recibe): ' + (datos.get('receptor') || 'No indicado'),
          '· Servicio a agendar: ' + (servicioRegalo ? servicioRegalo.nombre : 'A elección del receptor'),
        ].join('\n');
        mensajeUsuario = mensajeUsuario ? detalleRegalo + '\n\n' + mensajeUsuario : detalleRegalo;
      }

      const solicitud = {
        nombre: datos.get('nombre') || '',
        email: datos.get('email') || '',
        telefono: datos.get('telefono') || '',
        servicio: servicio ? servicio.nombre : 'Consulta general',
        servicioSlug: datos.get('servicio') || '',
        fecha: datos.get('fecha') || '',
        personas: datos.get('personas') || '',
        mensaje: mensajeUsuario,
        esRegalo: esRegalo,
        emisor: datos.get('emisor') || '',
        receptor: datos.get('receptor') || '',
        servicioRegalo: servicioRegalo ? servicioRegalo.nombre : '',
        origen: location.href,
        enviado: new Date().toISOString(),
      };

      const mensajeWA = [
        'Hola Anímales, quisiera solicitar información o reservar.',
        '',
        'Nombre: ' + solicitud.nombre,
        'Correo: ' + solicitud.email,
        'Teléfono: ' + (solicitud.telefono || 'No indicado'),
        'Servicio de interés: ' + solicitud.servicio,
        'Fecha tentativa: ' + (solicitud.fecha || 'Por definir'),
        'Personas: ' + (solicitud.personas || 'Por definir'),
        '',
        'Mensaje: ' + (solicitud.mensaje || '—'),
      ].join('\n');

      const endpoint = (SITIO.reservas && SITIO.reservas.endpoint) || '';
      const boton = form.querySelector('button[type="submit"]');

      function finalizar(texto) {
        const aviso = document.querySelector('#aviso-envio');
        if (aviso) {
          const cuerpo = aviso.querySelector('[data-aviso-texto]');
          if (cuerpo && texto) cuerpo.textContent = texto;
          aviso.classList.remove('d-none');
          aviso.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        form.classList.remove('was-validated');
        form.reset();
      }

      // Sin endpoint configurado: respaldo por WhatsApp (comportamiento base).
      if (!endpoint) {
        window.open(enlaceWhatsApp(mensajeWA), '_blank', 'noopener');
        finalizar('Abrimos WhatsApp con tu solicitud lista para enviar. Si no se abrió, revisá que el navegador no haya bloqueado la ventana emergente.');
        return;
      }

      // Con endpoint: se registra en Google (Sheet + correo + calendario tentativo).
      // Apps Script no expone cabeceras CORS para POST, por eso usamos no-cors:
      // la respuesta es opaca y asumimos éxito si la petición no falla en red.
      if (boton) {
        boton.disabled = true;
        boton.dataset.textoOriginal = boton.innerHTML;
        boton.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Enviando…';
      }

      fetch(endpoint, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(solicitud),
      })
        .then(function () {
          finalizar('¡Recibimos tu solicitud! Te contactaremos por teléfono o correo para confirmar la fecha y los detalles. Gracias.');
        })
        .catch(function () {
          // Si falla la red, no perdemos la solicitud: abrimos WhatsApp.
          window.open(enlaceWhatsApp(mensajeWA), '_blank', 'noopener');
          finalizar('No pudimos registrar la solicitud automáticamente, así que abrimos WhatsApp con tus datos para que la envíes directamente.');
        })
        .finally(function () {
          if (boton) {
            boton.disabled = false;
            if (boton.dataset.textoOriginal) boton.innerHTML = boton.dataset.textoOriginal;
          }
        });
    });
  }

  /* ---------------------------------------------------------------------
     Agenda de disponibilidad opcional (Opción B)
     Incrusta Google Appointment Schedule o Calendly si hay URL en config.
     --------------------------------------------------------------------- */
  function renderizarAgenda() {
    const contenedor = document.querySelector('[data-agenda-embed]');
    if (!contenedor) return;

    const url = (SITIO.reservas && SITIO.reservas.agendaEmbed) || '';
    const seccion = contenedor.closest('[data-agenda-seccion]') || contenedor;

    if (!url) {
      seccion.classList.add('d-none'); // Sin agenda configurada: se oculta.
      return;
    }

    seccion.classList.remove('d-none');
    contenedor.innerHTML =
      '<iframe src="' + esc(url) + '" title="Agenda de disponibilidad" ' +
      'width="100%" height="640" style="border:0; display:block;" loading="lazy"></iframe>';
  }

  /* ---------------------------------------------------------------------
     Aparición progresiva de elementos al desplazar
     --------------------------------------------------------------------- */
  function activarRevelado() {
    const elementos = document.querySelectorAll('.an-revelar');
    if (!('IntersectionObserver' in window)) {
      elementos.forEach(function (el) { el.classList.add('an-visible'); });
      return;
    }

    const observador = new IntersectionObserver(
      function (entradas) {
        entradas.forEach(function (entrada) {
          if (entrada.isIntersecting) {
            entrada.target.classList.add('an-visible');
            observador.unobserve(entrada.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );

    elementos.forEach(function (el) { observador.observe(el); });
  }

  /* ---------------------------------------------------------------------
     Pack de fotos de un servicio (lightbox)
     Se abre al clic en la tarjeta o en el ícono de fotos.
     Reservar / Consultar siguen funcionando aparte.
     --------------------------------------------------------------------- */
  var galeriaEstado = { slug: '', indice: 0, fotos: [], titulo: '' };

  function servicioPorSlug(slug) {
    return SERVICIOS.find(function (s) { return s.slug === slug; }) || null;
  }

  function asegurarVisorGaleria() {
    if (document.getElementById('an-galeria')) return;
    var visor = document.createElement('div');
    visor.id = 'an-galeria';
    visor.className = 'an-galeria';
    visor.setAttribute('hidden', '');
    visor.innerHTML =
      '<div class="an-galeria__fondo" data-galeria-cerrar></div>' +
      '<div class="an-galeria__caja" role="dialog" aria-modal="true" aria-labelledby="an-galeria-titulo">' +
      '  <button type="button" class="an-galeria__cerrar" data-galeria-cerrar aria-label="Cerrar galería"><i class="bi bi-x-lg"></i></button>' +
      '  <button type="button" class="an-galeria__nav an-galeria__nav--prev" data-galeria-dir="-1" aria-label="Foto anterior"><i class="bi bi-chevron-left"></i></button>' +
      '  <figure class="an-galeria__marco">' +
      '    <img id="an-galeria-foto" class="an-galeria__foto" alt="">' +
      '    <figcaption id="an-galeria-titulo" class="an-galeria__titulo"></figcaption>' +
      '  </figure>' +
      '  <button type="button" class="an-galeria__nav an-galeria__nav--next" data-galeria-dir="1" aria-label="Foto siguiente"><i class="bi bi-chevron-right"></i></button>' +
      '  <div id="an-galeria-thumbs" class="an-galeria__thumbs"></div>' +
      '</div>';
    document.body.appendChild(visor);

    visor.addEventListener('click', function (e) {
      if (e.target.closest('[data-galeria-cerrar]')) { cerrarGaleria(); return; }
      var dir = e.target.closest('[data-galeria-dir]');
      if (dir) { moverGaleria(Number(dir.getAttribute('data-galeria-dir'))); return; }
      var thumb = e.target.closest('[data-galeria-i]');
      if (thumb) mostrarFotoGaleria(Number(thumb.getAttribute('data-galeria-i')));
    });
  }

  function mostrarFotoGaleria(i) {
    var n = galeriaEstado.fotos.length;
    if (!n) return;
    galeriaEstado.indice = ((i % n) + n) % n;
    var foto = document.getElementById('an-galeria-foto');
    var titulo = document.getElementById('an-galeria-titulo');
    foto.src = galeriaEstado.fotos[galeriaEstado.indice];
    foto.alt = galeriaEstado.titulo + ' · foto ' + (galeriaEstado.indice + 1);
    titulo.textContent = galeriaEstado.titulo + ' · ' + (galeriaEstado.indice + 1) + ' / ' + n;
    document.querySelectorAll('#an-galeria-thumbs [data-galeria-i]').forEach(function (el) {
      el.classList.toggle('is-activa', Number(el.getAttribute('data-galeria-i')) === galeriaEstado.indice);
    });
  }

  function moverGaleria(dir) {
    mostrarFotoGaleria(galeriaEstado.indice + dir);
  }

  function abrirGaleria(slug, indice) {
    var servicio = servicioPorSlug(slug);
    if (!servicio || !servicio.galeria || !servicio.galeria.length) return;
    asegurarVisorGaleria();
    galeriaEstado.slug = slug;
    galeriaEstado.fotos = servicio.galeria;
    galeriaEstado.titulo = servicio.nombre;
    var thumbs = document.getElementById('an-galeria-thumbs');
    thumbs.innerHTML = servicio.galeria.map(function (src, i) {
      return '<button type="button" class="an-galeria__thumb" data-galeria-i="' + i +
        '" aria-label="Ver foto ' + (i + 1) + '"><img src="' + esc(src) + '" alt=""></button>';
    }).join('');
    var visor = document.getElementById('an-galeria');
    visor.removeAttribute('hidden');
    document.body.classList.add('an-galeria-abierta');
    mostrarFotoGaleria(indice || 0);
  }

  function cerrarGaleria() {
    var visor = document.getElementById('an-galeria');
    if (!visor) return;
    visor.setAttribute('hidden', '');
    document.body.classList.remove('an-galeria-abierta');
  }

  function prepararGalerias() {
    document.addEventListener('click', function (e) {
      if (document.body.classList.contains('an-admin')) return;
      if (e.target.closest('a')) return;
      var tarjeta = e.target.closest('[data-galeria]');
      if (!tarjeta) return;
      e.preventDefault();
      abrirGaleria(tarjeta.getAttribute('data-galeria'), 0);
    });

    document.addEventListener('keydown', function (e) {
      if (!document.body.classList.contains('an-galeria-abierta')) return;
      if (e.key === 'Escape') cerrarGaleria();
      else if (e.key === 'ArrowLeft') moverGaleria(-1);
      else if (e.key === 'ArrowRight') moverGaleria(1);
    });
  }

  /* ---------------------------------------------------------------------
     Arranque
     --------------------------------------------------------------------- */
  document.addEventListener('DOMContentLoaded', function () {
    renderizarCategorias();
    renderizarServicios();
    renderizarCarril();
    aplicarDatosDelSitio();
    marcarEnlaceActivo();
    sombraAlDesplazar();
    prepararFormulario();
    renderizarAgenda();
    prepararGalerias();
    activarRevelado();
  });
})();
