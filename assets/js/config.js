/*
 * Configuración global del sitio.
 * Todos los datos de contacto y enlaces externos se editan únicamente aquí.
 * Los valores marcados como PENDIENTE deben confirmarse con el cliente.
 */

const SITIO = {
  nombre: 'AnÍmales',
  descripcion: 'Centro de Terapia Asistida con Animales • Costa Rica • Modelo CEEC',

  // POR CONFIRMAR: número obtenido de directorios públicos, falta validarlo con el cliente.
  whatsapp: '50683030868',
  whatsappSaludo: 'Hola AnÍmales, me gustaría recibir más información.',

  // PENDIENTE: correo oficial de atención.
  email: 'info@animalesequinoterapia.com',
  telefono: '+506 8303 0868',

  // POR CONFIRMAR: dirección exacta (finca) y coordenadas para el mapa.
  direccion: 'La Guácima, Alajuela, Costa Rica',
  mapaEmbed: 'https://www.google.com/maps?q=La+Gu%C3%A1cima,+Alajuela,+Costa+Rica&output=embed',

  redes: {
    // POR CONFIRMAR: perfiles localizados en búsqueda, falta validarlos con el cliente.
    instagram: 'https://www.instagram.com/animales.equinoterapia/',
    facebook: 'https://www.facebook.com/Equinoterapia.cr',
    youtube: '',
  },

  horario: 'Lunes a sábado, 8:00 a.m. – 5:00 p.m. (hora de Costa Rica)',

  /*
   * Reservas / solicitudes de información.
   * Flujo: el formulario envía los datos a un Google Apps Script (Web App) que
   * los registra en una Google Sheet, avisa por correo y crea un evento
   * TENTATIVO en Google Calendar. Luego se confirma por teléfono.
   * Guía de conexión: docs/RESERVAS.md
   */
  reservas: {
    // Pega aquí la URL del Web App de Apps Script (debe terminar en /exec).
    // Mientras esté vacío, el formulario usa WhatsApp como respaldo.
    endpoint: 'https://script.google.com/macros/s/AKfycbzSVpwPdhwN0R5wZQJxmixbmeFLsFA_cWYlDbCmJYWIkFb4XNneNXlw59ufg2olgewx/exec',

    // Solo informativo para la web; el correo real se define dentro del script.
    correoAvisos: 'skyblackroan@gmail.com',

    // Opcional (Opción B): URL para incrustar una agenda de disponibilidad,
    // por ejemplo Google Appointment Schedule o Calendly. Vacío = oculta la sección.
    agendaEmbed: '',
  },
};
