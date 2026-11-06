/**
 * AnÍmales — Recepción de solicitudes de reserva/información.
 *
 * Qué hace al recibir una solicitud desde el formulario del sitio:
 *   1. Registra una fila en la Google Sheet (base de datos en tiempo real).
 *   2. Envía un correo de aviso con todos los datos.
 *   3. Crea un evento TENTATIVO en Google Calendar (si viene fecha).
 *
 * Luego se confirma por teléfono y se marca la fila como "Confirmada".
 *
 * Instrucciones completas de conexión: docs/RESERVAS.md
 */

// ==== CONFIGURACIÓN (editar estos valores) ==================================
var CONFIG = {
  // Deja '' si creas el script DESDE la hoja (Extensiones > Apps Script).
  // Si es un script independiente, pega aquí el ID de la Google Sheet
  // (lo que va entre /d/ y /edit en la URL de la hoja).
  SHEET_ID: '',

  // Nombre de la pestaña donde se guardan las solicitudes.
  SHEET_NOMBRE: 'Solicitudes',

  // Pestaña de clientes frecuentes (CRM).
  SHEET_CLIENTES: 'Clientes',

  // Pestaña de días inhábiles / cerrados (para organizar disponibilidad).
  SHEET_INHABILES: 'DiasInhabiles',

  // Correo(s) que recibirán el aviso. Separar varios con coma.
  CORREO_AVISOS: 'skyblackroan@gmail.com',

  // Calendario donde se crean los eventos tentativos.
  // 'primary' = tu calendario principal. O pega el ID de un calendario propio.
  CALENDAR_ID: 'primary',

  // Duración por defecto del evento tentativo (minutos) cuando hay fecha.
  DURACION_MIN: 90,

  // Hora de inicio por defecto (24h) si la fecha no trae hora.
  HORA_INICIO_DEFECTO: 9,

  // Zona horaria para las fechas del evento.
  ZONA_HORARIA: 'America/Costa_Rica',

  // Si es true, al Confirmar/Rechazar se envía además un correo al SOLICITANTE.
  // Por defecto false: vos hablás por teléfono y solo se actualiza el calendario.
  AVISAR_AL_CLIENTE: false,

  // Token secreto para las acciones del PANEL LOCAL (listar/confirmar/reagendar/
  // rechazar). Debe coincidir con el del panel (panel-local/config.json).
  // Es seguro tenerlo aquí: la carpeta `integraciones/` está en .gitignore,
  // así que este archivo NO se publica en GitHub (queda solo en tu equipo).
  TOKEN: 'an_b5Kal37JaDoPwG6jCRNvxtWQ79NN-I1a',

  // Clave del editor web del sitio (4 clics en el logo). Quien la sepa puede
  // Guardar cambios desde cualquier navegador, sin token de GitHub.
  ADMIN_CLAVE: '1411',

  // Carpeta de Drive donde se guardan fotos subidas desde el admin.
  // '' = se crea sola la primera vez ("Anímales — Contenido web").
  ADMIN_DRIVE_FOLDER_ID: '',
};

// Devuelve el token efectivo (el de CONFIG.TOKEN, definido arriba).
// Si alguna vez guardaste un token en las Propiedades del script, se ignora.
function obtenerToken_() {
  return CONFIG.TOKEN;
}

// Utilidad opcional: limpia el token viejo de las Propiedades del script,
// por si quedó guardado un valor de ejemplo en pruebas anteriores.
function limpiarTokenPropiedad() {
  try { PropertiesService.getScriptProperties().deleteProperty('TOKEN'); } catch (ignore) {}
}

// Estados posibles (menú desplegable en la columna "Estado").
var ESTADOS = ['Pendiente', 'Confirmada', 'Reagendar', 'Rechazada'];

// Encabezados de la hoja (orden de las columnas).
var ENCABEZADOS = [
  'Fecha de registro', 'Estado', 'Nombre', 'Correo', 'Teléfono',
  'Servicio', 'Fecha tentativa', 'Personas', 'Mensaje', 'Origen', 'ID Evento',
];

// Índice (1-based) de columnas usadas por el flujo de aprobación.
var COL = { ESTADO: 2, NOMBRE: 3, CORREO: 4, SERVICIO: 6, FECHA: 7, ID_EVENTO: 11 };

// Encabezados de la hoja de clientes frecuentes.
var ENCABEZADOS_CLIENTES = [
  'ID', 'Nombre', 'Teléfono', 'Correo', 'Etiqueta',
  'Días de visita', 'Frecuencia', 'Notas', 'Creado',
];

// Encabezados de la hoja de días inhábiles.
var ENCABEZADOS_INHABILES = ['Fecha', 'Motivo'];

// ==== PUNTO DE ENTRADA =====================================================
function doPost(e) {
  try {
    var cuerpo = parsearCuerpo_(e);

    // Editor web del sitio público (clave ADMIN_CLAVE, sin token de GitHub).
    if (cuerpo.accion === 'admin_guardar') {
      if (String(cuerpo.clave || '') !== String(CONFIG.ADMIN_CLAVE || '')) {
        return responder_({ ok: false, error: 'Clave de administrador inválida' });
      }
      return responder_(guardarContenidoSitio_(cuerpo));
    }

    // Acciones del panel local (protegidas por token).
    if (cuerpo.accion) {
      if (cuerpo.token !== obtenerToken_()) {
        return responder_({ ok: false, error: 'Token inválido' });
      }
      if (cuerpo.accion === 'estado') return responder_(cambiarEstadoAdmin_(cuerpo));
      if (cuerpo.accion === 'reagendar') return responder_(reagendarAdmin_(cuerpo));
      if (cuerpo.accion === 'cliente_guardar') return responder_(guardarClienteAdmin_(cuerpo));
      if (cuerpo.accion === 'cliente_eliminar') return responder_(eliminarClienteAdmin_(cuerpo));
      if (cuerpo.accion === 'inhabil_guardar') return responder_(guardarInhabilAdmin_(cuerpo));
      if (cuerpo.accion === 'inhabil_eliminar') return responder_(eliminarInhabilAdmin_(cuerpo));
      return responder_({ ok: false, error: 'Acción desconocida' });
    }

    // Nueva solicitud desde el formulario público del sitio.
    var datos = normalizarSolicitud_(cuerpo);
    var hoja = obtenerHoja_();
    var idEvento = crearEventoTentativo_(datos);
    guardarFila_(hoja, datos, idEvento);
    enviarCorreo_(datos);

    return responder_({ ok: true, mensaje: 'Solicitud registrada' });
  } catch (err) {
    return responder_({ ok: false, error: String(err) });
  }
}

// GET: prueba de vida, contenido público del editor, y lecturas del panel local.
function doGet(e) {
  var p = (e && e.parameter) || {};

  // Contenido del sitio (público: lo lee cualquier visitante).
  if (p.accion === 'contenido') {
    return responder_({ ok: true, contenido: leerContenidoSitio_() });
  }

  if (p.accion) {
    if (p.token !== obtenerToken_()) return responder_({ ok: false, error: 'Token inválido' });

    // Carga completa del panel en una sola llamada.
    if (p.accion === 'datos') {
      return responder_({
        ok: true,
        solicitudes: listarSolicitudes_(),
        clientes: listarClientes_(),
        inhabiles: listarInhabiles_(),
      });
    }
    if (p.accion === 'listar') return responder_({ ok: true, solicitudes: listarSolicitudes_() });
    if (p.accion === 'clientes_listar') return responder_({ ok: true, clientes: listarClientes_() });
    if (p.accion === 'inhabiles_listar') return responder_({ ok: true, inhabiles: listarInhabiles_() });
    return responder_({ ok: false, error: 'Acción desconocida' });
  }
  return responder_({ ok: true, mensaje: 'Endpoint de reservas AnÍmales activo' });
}

// Ejecutá esta función UNA VEZ desde el editor (botón Ejecutar) para preparar
// la hoja: crea los encabezados y el menú desplegable de estados.
function prepararHoja() {
  var hoja = obtenerHoja_();
  configurarValidacionEstados_(hoja);
  configurarFormatoTexto_(hoja);
  obtenerHojaClientes_();
  obtenerHojaInhabiles_();
}

// ==== LÓGICA ===============================================================
// Devuelve el cuerpo crudo de la petición (JSON o parámetros).
function parsearCuerpo_(e) {
  var cuerpo = {};
  if (e && e.postData && e.postData.contents) {
    try {
      cuerpo = JSON.parse(e.postData.contents);
    } catch (ignore) {
      cuerpo = (e.parameter) || {};
    }
  } else if (e && e.parameter) {
    cuerpo = e.parameter;
  }
  return cuerpo || {};
}

// Mapea el cuerpo a los campos de una solicitud del formulario.
function normalizarSolicitud_(cuerpo) {
  return {
    nombre: (cuerpo.nombre || '').toString().trim(),
    email: (cuerpo.email || '').toString().trim(),
    telefono: (cuerpo.telefono || '').toString().trim(),
    servicio: (cuerpo.servicio || 'Consulta general').toString().trim(),
    fecha: (cuerpo.fecha || '').toString().trim(),
    personas: (cuerpo.personas || '').toString().trim(),
    mensaje: (cuerpo.mensaje || '').toString().trim(),
    origen: (cuerpo.origen || '').toString().trim(),
  };
}

function obtenerHoja_() {
  var ss = CONFIG.SHEET_ID
    ? SpreadsheetApp.openById(CONFIG.SHEET_ID)
    : SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) {
    throw new Error('No se encontró la hoja. Configura SHEET_ID o crea el script desde la hoja.');
  }
  var hoja = ss.getSheetByName(CONFIG.SHEET_NOMBRE);
  if (!hoja) {
    hoja = ss.insertSheet(CONFIG.SHEET_NOMBRE);
  }
  if (hoja.getLastRow() === 0) {
    hoja.appendRow(ENCABEZADOS);
    hoja.getRange(1, 1, 1, ENCABEZADOS.length).setFontWeight('bold');
    hoja.setFrozenRows(1);
    // Solo al crear la hoja: configuración pesada (validación + formato texto).
    // NO se hace en cada petición para que listar/registrar sean rápidos.
    configurarValidacionEstados_(hoja);
    configurarFormatoTexto_(hoja);
  }
  return hoja;
}

// Fuerza formato TEXTO en columnas que pueden empezar con "+" o "=" (teléfono,
// correo, mensaje, etc.) para evitar el "Error de análisis de fórmula".
function configurarFormatoTexto_(hoja) {
  try {
    [COL.NOMBRE, COL.CORREO, 5, COL.SERVICIO, COL.FECHA, 9, 10, COL.ID_EVENTO]
      .forEach(function (c) {
        hoja.getRange(2, c, 1000, 1).setNumberFormat('@');
      });
  } catch (ignore) {}
}

// Coloca el menú desplegable de estados en la columna "Estado".
function configurarValidacionEstados_(hoja) {
  try {
    var regla = SpreadsheetApp.newDataValidation()
      .requireValueInList(ESTADOS, true)
      .setAllowInvalid(false)
      .build();
    hoja.getRange(2, COL.ESTADO, 1000, 1).setDataValidation(regla);
  } catch (ignore) {}
}

// Devuelve el libro (spreadsheet) activo o por ID.
function obtenerLibro_() {
  var ss = CONFIG.SHEET_ID
    ? SpreadsheetApp.openById(CONFIG.SHEET_ID)
    : SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) {
    throw new Error('No se encontró la hoja. Configura SHEET_ID o crea el script desde la hoja.');
  }
  return ss;
}

// Hoja de clientes frecuentes (la crea con encabezados si no existe).
function obtenerHojaClientes_() {
  var ss = obtenerLibro_();
  var hoja = ss.getSheetByName(CONFIG.SHEET_CLIENTES);
  if (!hoja) {
    hoja = ss.insertSheet(CONFIG.SHEET_CLIENTES);
    hoja.appendRow(ENCABEZADOS_CLIENTES);
    hoja.getRange(1, 1, 1, ENCABEZADOS_CLIENTES.length).setFontWeight('bold');
    hoja.setFrozenRows(1);
    // Forzar texto en teléfono/correo para evitar el "Error de análisis de fórmula".
    hoja.getRange(2, 3, 2000, 2).setNumberFormat('@');
  }
  return hoja;
}

// Hoja de días inhábiles (la crea con encabezados si no existe).
function obtenerHojaInhabiles_() {
  var ss = obtenerLibro_();
  var hoja = ss.getSheetByName(CONFIG.SHEET_INHABILES);
  if (!hoja) {
    hoja = ss.insertSheet(CONFIG.SHEET_INHABILES);
    hoja.appendRow(ENCABEZADOS_INHABILES);
    hoja.getRange(1, 1, 1, ENCABEZADOS_INHABILES.length).setFontWeight('bold');
    hoja.setFrozenRows(1);
    hoja.getRange(2, 1, 2000, 1).setNumberFormat('@'); // Fecha como texto AAAA-MM-DD.
  }
  return hoja;
}

// Devuelve el calendario configurado (principal o por ID).
function obtenerCalendario_() {
  return CONFIG.CALENDAR_ID === 'primary'
    ? CalendarApp.getDefaultCalendar()
    : CalendarApp.getCalendarById(CONFIG.CALENDAR_ID);
}

function guardarFila_(hoja, d, idEvento) {
  hoja.appendRow([
    new Date(), 'Pendiente', d.nombre, d.email, d.telefono,
    d.servicio, d.fecha, d.personas, d.mensaje, d.origen, idEvento || '',
  ]);
}

function crearEventoTentativo_(d) {
  if (!d.fecha) return '';
  try {
    var cal = obtenerCalendario_();
    if (!cal) return '';

    var partes = d.fecha.split('-'); // formato esperado: AAAA-MM-DD
    var inicio = new Date(
      parseInt(partes[0], 10),
      parseInt(partes[1], 10) - 1,
      parseInt(partes[2], 10),
      CONFIG.HORA_INICIO_DEFECTO, 0, 0
    );
    var fin = new Date(inicio.getTime() + CONFIG.DURACION_MIN * 60000);

    var motivoInh = motivoInhabil_(d.fecha);
    var titulo = (motivoInh ? '[DÍA INHÁBIL] ' : '') +
      'TENTATIVO — ' + d.servicio + ' — ' + (d.nombre || 'Sin nombre');
    var descripcion = [
      'Solicitud pendiente de confirmación telefónica.',
      motivoInh ? '⚠️ OJO: la fecha cae en un DÍA INHÁBIL (' + motivoInh + ').' : '',
      '',
      'Nombre: ' + d.nombre,
      'Correo: ' + d.email,
      'Teléfono: ' + d.telefono,
      'Personas: ' + (d.personas || 'Por definir'),
      'Mensaje: ' + (d.mensaje || '—'),
    ].join('\n');

    var evento = cal.createEvent(titulo, inicio, fin, { description: descripcion });
    try { evento.setColor(CalendarApp.EventColor.YELLOW); } catch (ignore) {}
    return evento.getId();
  } catch (err) {
    return ''; // No bloquear el registro si el calendario falla.
  }
}

function enviarCorreo_(d) {
  var motivoInh = motivoInhabil_(d.fecha);
  var asunto = (motivoInh ? '[DÍA INHÁBIL] ' : '') +
    'Nueva solicitud — ' + d.servicio + ' — ' + (d.nombre || 'Sin nombre');
  var lineas = [
    'Se recibió una nueva solicitud desde el sitio web.',
    motivoInh ? '⚠️ La fecha solicitada cae en un DÍA INHÁBIL (' + motivoInh + ').' : '',
    '',
    'Nombre: ' + d.nombre,
    'Correo: ' + d.email,
    'Teléfono: ' + d.telefono,
    'Servicio: ' + d.servicio,
    'Fecha tentativa: ' + (d.fecha || 'Por definir'),
    'Personas: ' + (d.personas || 'Por definir'),
    '',
    'Mensaje:',
    d.mensaje || '—',
    '',
    'Origen: ' + d.origen,
  ];
  var opciones = {};
  if (d.email) opciones.replyTo = d.email; // Responder va directo al solicitante.
  MailApp.sendEmail(CONFIG.CORREO_AVISOS, asunto, lineas.join('\n'), opciones);
}

function responder_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// ==== EDITOR WEB DEL SITIO (sin token de GitHub en el navegador) ============
var ADMIN_CONTENIDO_FILE = 'animales-contenido.json';

function carpetaAdmin_() {
  var id = CONFIG.ADMIN_DRIVE_FOLDER_ID || PropertiesService.getScriptProperties().getProperty('ADMIN_DRIVE_FOLDER_ID');
  if (id) {
    try { return DriveApp.getFolderById(id); } catch (ignore) {}
  }
  var it = DriveApp.getFoldersByName('Anímales — Contenido web');
  var folder = it.hasNext() ? it.next() : DriveApp.createFolder('Anímales — Contenido web');
  PropertiesService.getScriptProperties().setProperty('ADMIN_DRIVE_FOLDER_ID', folder.getId());
  return folder;
}

function archivoContenido_() {
  var folder = carpetaAdmin_();
  var it = folder.getFilesByName(ADMIN_CONTENIDO_FILE);
  if (it.hasNext()) return it.next();
  return folder.createFile(ADMIN_CONTENIDO_FILE, '{}', MimeType.PLAIN_TEXT);
}

function leerContenidoSitio_() {
  try {
    var raw = archivoContenido_().getBlob().getDataAsString('UTF-8') || '{}';
    return JSON.parse(raw);
  } catch (ignore) {
    return {};
  }
}

function urlPublicaDrive_(file) {
  try {
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  } catch (ignore) {}
  return 'https://drive.google.com/uc?export=view&id=' + file.getId();
}

function reemplazarRutas_(obj, mapa) {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) {
    for (var i = 0; i < obj.length; i++) obj[i] = reemplazarRutas_(obj[i], mapa);
    return obj;
  }
  Object.keys(obj).forEach(function (k) {
    var v = obj[k];
    if (typeof v === 'string' && mapa[v]) obj[k] = mapa[v];
    else if (v && typeof v === 'object') obj[k] = reemplazarRutas_(v, mapa);
  });
  return obj;
}

function guardarContenidoSitio_(cuerpo) {
  var contenido = cuerpo.contenido;
  if (!contenido || typeof contenido !== 'object') {
    return { ok: false, error: 'Falta el contenido a guardar' };
  }

  var mapaUrls = {};
  var imgs = cuerpo.imagenes || [];
  var folder = carpetaAdmin_();
  for (var i = 0; i < imgs.length; i++) {
    var im = imgs[i] || {};
    if (!im.path || !im.base64) continue;
    var bytes = Utilities.base64Decode(String(im.base64).replace(/^data:[^;]+;base64,/, ''));
    var mime = im.mime || 'image/jpeg';
    var nombre = (im.name || ('img-' + Date.now() + '-' + i + '.jpg')).toString().replace(/[^\w.\-]+/g, '_');
    var blob = Utilities.newBlob(bytes, mime, nombre);
    var file = folder.createFile(blob);
    mapaUrls[im.path] = urlPublicaDrive_(file);
  }

  contenido = reemplazarRutas_(contenido, mapaUrls);
  contenido.__meta = contenido.__meta || {};
  contenido.__meta.savedAt = new Date().toISOString();
  contenido.__meta.source = 'apps-script-admin';

  var json = JSON.stringify(contenido, null, 2);
  var archivo = archivoContenido_();
  archivo.setContent(json);

  return { ok: true, mensaje: 'Contenido publicado', contenido: contenido, urls: mapaUrls };
}

// ==== APROBAR / REAGENDAR / RECHAZAR =======================================
/**
 * Se ejecuta al cambiar el "Estado" de una fila en la hoja.
 * IMPORTANTE: requiere un ACTIVADOR INSTALABLE (no basta el onEdit simple),
 * porque toca Calendar y correo. Ver docs/RESERVAS.md.
 *
 * Acciones según el estado elegido:
 *   Confirmada → evento a color verde y quita "TENTATIVO" del título.
 *   Reagendar  → evento a color naranja con prefijo "REAGENDAR".
 *   Rechazada  → elimina el evento del calendario.
 *   Pendiente  → vuelve a amarillo con prefijo "TENTATIVO".
 */
function alEditarEstado(e) {
  if (!e || !e.range) return;
  var rango = e.range;
  if (rango.getColumn() !== COL.ESTADO || rango.getRow() < 2) return;
  if (rango.getNumRows() !== 1 || rango.getNumColumns() !== 1) return;

  var hoja = rango.getSheet();
  if (hoja.getName() !== CONFIG.SHEET_NOMBRE) return;

  var estado = String(e.value || '').trim();
  if (ESTADOS.indexOf(estado) === -1) return;

  var fila = rango.getRow();
  var idEvento = String(hoja.getRange(fila, COL.ID_EVENTO).getValue() || '').trim();
  var nombre = String(hoja.getRange(fila, COL.NOMBRE).getValue() || '');
  var correo = String(hoja.getRange(fila, COL.CORREO).getValue() || '');
  var servicio = String(hoja.getRange(fila, COL.SERVICIO).getValue() || 'Consulta');
  var fecha = String(hoja.getRange(fila, COL.FECHA).getValue() || '');

  actualizarEventoSegunEstado_(idEvento, estado, servicio, nombre);
  colorearFilaSegunEstado_(hoja, fila, estado);

  if (CONFIG.AVISAR_AL_CLIENTE && correo) {
    if (estado === 'Confirmada') {
      avisarCliente_(correo, 'Reserva confirmada — AnÍmales',
        'Hola ' + nombre + ',\n\nConfirmamos tu reserva de "' + servicio + '"' +
        (fecha ? ' para el ' + fecha : '') + '. ¡Te esperamos!\n\nAnÍmales');
    } else if (estado === 'Rechazada') {
      avisarCliente_(correo, 'Sobre tu solicitud — AnÍmales',
        'Hola ' + nombre + ',\n\nGracias por tu interés. Por el momento no pudimos ' +
        'agendar tu solicitud de "' + servicio + '". Te contactaremos para ver alternativas.\n\nAnÍmales');
    }
  }
}

function actualizarEventoSegunEstado_(idEvento, estado, servicio, nombre) {
  if (!idEvento) return;
  try {
    var cal = obtenerCalendario_();
    if (!cal) return;
    var evento = cal.getEventById(idEvento);
    if (!evento) return;

    var base = servicio + ' — ' + (nombre || 'Sin nombre');

    if (estado === 'Confirmada') {
      evento.setTitle('CONFIRMADA — ' + base);
      evento.setColor(CalendarApp.EventColor.GREEN);
    } else if (estado === 'Reagendar') {
      evento.setTitle('REAGENDAR — ' + base);
      evento.setColor(CalendarApp.EventColor.ORANGE);
    } else if (estado === 'Rechazada') {
      evento.deleteEvent(); // Se libera el espacio en el calendario.
    } else { // Pendiente
      evento.setTitle('TENTATIVO — ' + base);
      evento.setColor(CalendarApp.EventColor.YELLOW);
    }
  } catch (ignore) {}
}

function colorearFilaSegunEstado_(hoja, fila, estado) {
  var colores = {
    Pendiente: '#fff3cd',
    Confirmada: '#d1e7dd',
    Reagendar: '#ffe5d0',
    Rechazada: '#f8d7da',
  };
  try {
    hoja.getRange(fila, 1, 1, ENCABEZADOS.length)
      .setBackground(colores[estado] || null);
  } catch (ignore) {}
}

function avisarCliente_(correo, asunto, cuerpo) {
  try { MailApp.sendEmail(correo, asunto, cuerpo); } catch (ignore) {}
}

// ==== API PARA EL PANEL LOCAL ==============================================
// Devuelve todas las solicitudes como lista de objetos.
function listarSolicitudes_() {
  var hoja = obtenerHoja_();
  var ultima = hoja.getLastRow();
  if (ultima < 2) return [];
  var valores = hoja.getRange(2, 1, ultima - 1, ENCABEZADOS.length).getValues();
  return valores.map(function (r, i) {
    var registro = r[0];
    if (registro instanceof Date) {
      registro = Utilities.formatDate(registro, CONFIG.ZONA_HORARIA, 'yyyy-MM-dd HH:mm');
    }
    return {
      fila: i + 2,
      registro: String(registro || ''),
      estado: String(r[1] || 'Pendiente'),
      nombre: String(r[2] || ''),
      correo: String(r[3] || ''),
      telefono: String(r[4] || ''),
      servicio: String(r[5] || ''),
      fecha: String(r[6] || ''),
      personas: String(r[7] || ''),
      mensaje: String(r[8] || ''),
      origen: String(r[9] || ''),
      idEvento: String(r[10] || ''),
    };
  });
}

// Cambia el estado de una fila y actualiza el evento del calendario.
function cambiarEstadoAdmin_(c) {
  var fila = parseInt(c.fila, 10);
  var estado = String(c.estado || '').trim();
  if (!fila || ESTADOS.indexOf(estado) === -1) {
    return { ok: false, error: 'Fila o estado inválido' };
  }
  var hoja = obtenerHoja_();
  hoja.getRange(fila, COL.ESTADO).setValue(estado);

  var idEvento = String(hoja.getRange(fila, COL.ID_EVENTO).getValue() || '').trim();
  var nombre = String(hoja.getRange(fila, COL.NOMBRE).getValue() || '');
  var correo = String(hoja.getRange(fila, COL.CORREO).getValue() || '');
  var servicio = String(hoja.getRange(fila, COL.SERVICIO).getValue() || 'Consulta');
  var fecha = String(hoja.getRange(fila, COL.FECHA).getValue() || '');

  actualizarEventoSegunEstado_(idEvento, estado, servicio, nombre);
  colorearFilaSegunEstado_(hoja, fila, estado);

  if (CONFIG.AVISAR_AL_CLIENTE && correo) {
    if (estado === 'Confirmada') {
      avisarCliente_(correo, 'Reserva confirmada — AnÍmales',
        'Hola ' + nombre + ',\n\nConfirmamos tu reserva de "' + servicio + '"' +
        (fecha ? ' para el ' + fecha : '') + '. ¡Te esperamos!\n\nAnÍmales');
    } else if (estado === 'Rechazada') {
      avisarCliente_(correo, 'Sobre tu solicitud — AnÍmales',
        'Hola ' + nombre + ',\n\nGracias por tu interés. Por el momento no pudimos ' +
        'agendar tu solicitud de "' + servicio + '". Te contactaremos para ver alternativas.\n\nAnÍmales');
    }
  }
  return { ok: true, estado: estado };
}

// Reagenda: mueve el evento a nueva fecha/hora y actualiza la hoja.
function reagendarAdmin_(c) {
  var fila = parseInt(c.fila, 10);
  var fecha = String(c.fecha || '').trim(); // AAAA-MM-DD
  if (!fila || !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
    return { ok: false, error: 'Fila o fecha inválida' };
  }
  var hora = String(c.hora || '').trim(); // HH:MM (opcional)
  var h = CONFIG.HORA_INICIO_DEFECTO, m = 0;
  if (/^\d{1,2}:\d{2}$/.test(hora)) {
    h = parseInt(hora.split(':')[0], 10);
    m = parseInt(hora.split(':')[1], 10);
  }
  var p = fecha.split('-');
  var inicio = new Date(parseInt(p[0], 10), parseInt(p[1], 10) - 1, parseInt(p[2], 10), h, m, 0);
  var fin = new Date(inicio.getTime() + CONFIG.DURACION_MIN * 60000);

  var hoja = obtenerHoja_();
  hoja.getRange(fila, COL.FECHA).setValue(fecha + (hora ? ' ' + hora : ''));

  var idEvento = String(hoja.getRange(fila, COL.ID_EVENTO).getValue() || '').trim();
  var nombre = String(hoja.getRange(fila, COL.NOMBRE).getValue() || '');
  var servicio = String(hoja.getRange(fila, COL.SERVICIO).getValue() || 'Consulta');

  try {
    var cal = obtenerCalendario_();
    if (cal) {
      var evento = idEvento ? cal.getEventById(idEvento) : null;
      if (evento) {
        evento.setTime(inicio, fin);
      } else {
        evento = cal.createEvent('REAGENDAR — ' + servicio + ' — ' + (nombre || 'Sin nombre'), inicio, fin);
        try { evento.setColor(CalendarApp.EventColor.ORANGE); } catch (ignore) {}
        hoja.getRange(fila, COL.ID_EVENTO).setValue(evento.getId());
      }
    }
  } catch (ignore) {}

  var motivoInh = motivoInhabil_(fecha);
  return {
    ok: true,
    fecha: fecha,
    hora: hora,
    aviso: motivoInh ? 'Ojo: esa fecha es un día inhábil (' + motivoInh + ').' : '',
  };
}

// ==== CLIENTES FRECUENTES ==================================================
// Devuelve todos los clientes como lista de objetos.
function listarClientes_() {
  var hoja = obtenerHojaClientes_();
  var ultima = hoja.getLastRow();
  if (ultima < 2) return [];
  var valores = hoja.getRange(2, 1, ultima - 1, ENCABEZADOS_CLIENTES.length).getValues();
  return valores.map(function (r, i) {
    var creado = r[8];
    if (creado instanceof Date) {
      creado = Utilities.formatDate(creado, CONFIG.ZONA_HORARIA, 'yyyy-MM-dd');
    }
    return {
      fila: i + 2,
      id: String(r[0] || ''),
      nombre: String(r[1] || ''),
      telefono: String(r[2] || ''),
      correo: String(r[3] || ''),
      etiqueta: String(r[4] || ''),
      dias: String(r[5] || ''),
      frecuencia: String(r[6] || ''),
      notas: String(r[7] || ''),
      creado: String(creado || ''),
    };
  });
}

// Crea o actualiza un cliente. Si trae "id" existente, actualiza esa fila.
function guardarClienteAdmin_(c) {
  var nombre = String(c.nombre || '').trim();
  if (!nombre) return { ok: false, error: 'El nombre es obligatorio' };

  var hoja = obtenerHojaClientes_();
  var id = String(c.id || '').trim();
  var datos = [
    id || generarId_('cli'),
    nombre,
    String(c.telefono || '').trim(),
    String(c.correo || '').trim(),
    String(c.etiqueta || '').trim(),
    String(c.dias || '').trim(),
    String(c.frecuencia || '').trim(),
    String(c.notas || '').trim(),
  ];

  var fila = id ? buscarFilaPorId_(hoja, id) : 0;
  if (fila) {
    // Actualiza sin tocar la fecha de creación (columna 9).
    hoja.getRange(fila, 1, 1, 8).setValues([datos]);
    return { ok: true, id: datos[0], fila: fila, actualizado: true };
  }
  datos.push(Utilities.formatDate(new Date(), CONFIG.ZONA_HORARIA, 'yyyy-MM-dd'));
  hoja.appendRow(datos);
  return { ok: true, id: datos[0], fila: hoja.getLastRow(), actualizado: false };
}

// Elimina un cliente por ID.
function eliminarClienteAdmin_(c) {
  var id = String(c.id || '').trim();
  if (!id) return { ok: false, error: 'Falta el ID' };
  var hoja = obtenerHojaClientes_();
  var fila = buscarFilaPorId_(hoja, id);
  if (!fila) return { ok: false, error: 'Cliente no encontrado' };
  hoja.deleteRow(fila);
  return { ok: true, id: id };
}

// Busca la fila (1-based) cuyo valor en la columna A coincide con el ID.
function buscarFilaPorId_(hoja, id) {
  var ultima = hoja.getLastRow();
  if (ultima < 2) return 0;
  var ids = hoja.getRange(2, 1, ultima - 1, 1).getValues();
  for (var i = 0; i < ids.length; i++) {
    if (String(ids[i][0]) === id) return i + 2;
  }
  return 0;
}

// ==== DÍAS INHÁBILES =======================================================
// Devuelve la lista de días inhábiles [{fecha, motivo}].
function listarInhabiles_() {
  var hoja = obtenerHojaInhabiles_();
  var ultima = hoja.getLastRow();
  if (ultima < 2) return [];
  var valores = hoja.getRange(2, 1, ultima - 1, ENCABEZADOS_INHABILES.length).getValues();
  return valores
    .map(function (r) {
      return { fecha: normalizarFechaISO_(r[0]), motivo: String(r[1] || '') };
    })
    .filter(function (x) { return x.fecha; })
    .sort(function (a, b) { return a.fecha < b.fecha ? -1 : (a.fecha > b.fecha ? 1 : 0); });
}

// Agrega o actualiza el motivo de un día inhábil.
function guardarInhabilAdmin_(c) {
  var fecha = normalizarFechaISO_(c.fecha);
  if (!fecha) return { ok: false, error: 'Fecha inválida (usar AAAA-MM-DD)' };
  var motivo = String(c.motivo || '').trim();

  var hoja = obtenerHojaInhabiles_();
  var fila = buscarFilaPorFecha_(hoja, fecha);
  if (fila) {
    hoja.getRange(fila, 2).setValue(motivo);
    return { ok: true, fecha: fecha, actualizado: true };
  }
  hoja.appendRow([fecha, motivo]);
  return { ok: true, fecha: fecha, actualizado: false };
}

// Elimina un día inhábil por fecha.
function eliminarInhabilAdmin_(c) {
  var fecha = normalizarFechaISO_(c.fecha);
  if (!fecha) return { ok: false, error: 'Fecha inválida' };
  var hoja = obtenerHojaInhabiles_();
  var fila = buscarFilaPorFecha_(hoja, fecha);
  if (!fila) return { ok: false, error: 'Ese día no estaba marcado' };
  hoja.deleteRow(fila);
  return { ok: true, fecha: fecha };
}

// Devuelve el motivo si la fecha es inhábil, o '' si no.
function motivoInhabil_(fechaTexto) {
  var fecha = normalizarFechaISO_(fechaTexto);
  if (!fecha) return '';
  var hoja = obtenerHojaInhabiles_();
  var ultima = hoja.getLastRow();
  if (ultima < 2) return '';
  var valores = hoja.getRange(2, 1, ultima - 1, 2).getValues();
  for (var i = 0; i < valores.length; i++) {
    if (normalizarFechaISO_(valores[i][0]) === fecha) {
      return String(valores[i][1] || 'sin motivo');
    }
  }
  return '';
}

function buscarFilaPorFecha_(hoja, fecha) {
  var ultima = hoja.getLastRow();
  if (ultima < 2) return 0;
  var valores = hoja.getRange(2, 1, ultima - 1, 1).getValues();
  for (var i = 0; i < valores.length; i++) {
    if (normalizarFechaISO_(valores[i][0]) === fecha) return i + 2;
  }
  return 0;
}

// ==== UTILIDADES ===========================================================
// Convierte una fecha (texto o Date) al formato AAAA-MM-DD, o '' si no aplica.
function normalizarFechaISO_(valor) {
  if (valor instanceof Date) {
    return Utilities.formatDate(valor, CONFIG.ZONA_HORARIA, 'yyyy-MM-dd');
  }
  var s = String(valor || '').trim();
  var m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? (m[1] + '-' + m[2] + '-' + m[3]) : '';
}

// Genera un ID corto y único (prefijo + timestamp base36 + azar).
function generarId_(prefijo) {
  return (prefijo || 'id') + '_' +
    Date.now().toString(36) + Math.floor(Math.random() * 1296).toString(36);
}
