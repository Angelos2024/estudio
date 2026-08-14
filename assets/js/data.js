/*
 * Catálogo de contenidos de AnÍmales.
 * Fuente única de datos: se consume desde las páginas de categoría y desde el inicio.
 * Editar aquí para actualizar textos, precios o agregar servicios nuevos.
 */

const CATEGORIAS = {
  formaciones: {
    id: 'formaciones',
    nombre: 'Formaciones Académicas',
    color: 'rosa',
    pagina: 'formaciones.html',
    icono: 'bi-mortarboard',
    descripcion:
      'Diplomados especializados con práctica directa en campo y una comunidad profesional que acompaña a los egresados.',
  },
  sesiones: {
    id: 'sesiones',
    nombre: 'Servicios y Sesiones',
    color: 'morado',
    pagina: 'servicios.html',
    icono: 'bi-people',
    descripcion:
      'Convivencias grupales y familiares, mentorías de pareja y trabajo sistémico guiado por la manada en libertad.',
  },
  terapias: {
    id: 'terapias',
    nombre: 'Terapias y Visitas',
    color: 'verde',
    pagina: 'terapias.html',
    icono: 'bi-heart-pulse',
    descripcion:
      'Abordaje clínico en equinoterapia, monta terapéutica, estimulación temprana y visitas institucionales.',
  },
  experiencias: {
    id: 'experiencias',
    nombre: 'Hospedaje y Experiencias',
    color: 'amarillo',
    pagina: 'experiencias.html',
    icono: 'bi-house-heart',
    descripcion:
      'Alojamiento de retiro en plena naturaleza y certificados de regalo canjeables por cualquier servicio.',
  },
};

const SERVICIOS = [
  // Categoría 1: Formaciones Académicas
  {
    slug: 'diplomado-equinoterapia',
    categoria: 'formaciones',
    nombre: 'Diplomado en Equinoterapia',
    modalidad: 'Teórico-Práctica',
    dirigido: 'Terapeutas, educadores y apasionados del área equina',
    resumen:
      'Capacitación técnica e integral en intervención terapéutica asistida.',
    descripcion:
      'Capacitación técnica e integral en intervención terapéutica asistida. Cubre aspectos motores, cognitivos, psicológicos y neurológicos con práctica directa en campo.',
    destacado: true,
  },
  {
    slug: 'diplomado-ceec',
    categoria: 'formaciones',
    nombre: 'Diplomado CEEC (Constelaciones Familiares y Equilibrio Emocional)',
    modalidad: 'Especialización Avanzada',
    dirigido: 'Enfoque: lenguaje no verbal y campo sistémico',
    resumen:
      'Especialización en la facilitación de configuraciones sistémicas asistidas con caballos.',
    descripcion:
      'Especialización en la facilitación de configuraciones sistémicas asistidas con caballos. Desarrolla la lectura del comportamiento no verbal y la presencia consciente del facilitador.',
    destacado: true,
  },
  {
    slug: 'comunidad-graduados',
    categoria: 'formaciones',
    nombre: 'Comunidad de Graduados',
    modalidad: 'Continua',
    dirigido: 'Exclusivo para egresados de AnÍmales',
    resumen:
      'Red profesional de supervisión clínica y actualización de conocimientos.',
    descripcion:
      'Red profesional de supervisión clínica, actualización de conocimientos, talleres de profundización y encuentros de convivencia entre graduados.',
  },

  // Categoría 2: Sesiones de Configuración y Crecimiento Personal
  {
    slug: 'convivencias-grupales',
    categoria: 'sesiones',
    nombre: 'Convivencias Grupales de Configuraciones Sistémicas',
    modalidad: 'Inmersión Grupal (Adultos)',
    dirigido: 'Enfoque: trabajo sistémico',
    resumen:
      'Jornadas grupales para identificar y desatar nudos relacionales.',
    descripcion:
      'Jornadas grupales para identificar y desatar nudos relacionales o dinámicas inconscientes con la guía neutral de la manada en libertad.',
    destacado: true,
  },
  {
    slug: 'convivencias-privadas',
    categoria: 'sesiones',
    nombre: 'Convivencias Grupales Privadas',
    modalidad: 'Grupos Cerrados / Empresas',
    dirigido: 'Enfoque: cohesión y dinámica de equipo',
    resumen:
      'Espacios a la medida para equipos de trabajo u organizaciones.',
    descripcion:
      'Espacios diseñados a la medida para equipos de trabajo u organizaciones que buscan fortalecer el liderazgo, la comunicación asertiva y el orden sistémico.',
  },
  {
    slug: 'convivencias-familias',
    categoria: 'sesiones',
    nombre: 'Convivencias Familias',
    modalidad: 'Grupo Familiar',
    dirigido: 'Enfoque: reordenamiento y vínculo',
    resumen:
      'Encuentros para reestablecer el equilibrio en el núcleo familiar.',
    descripcion:
      'Encuentros orientados a reestablecer el equilibrio en la dinámica del núcleo familiar, mejorando la comunicación y la empatía guiados por los caballos.',
  },
  {
    slug: 'mentoria-pareja',
    categoria: 'sesiones',
    nombre: 'Sesiones de Mentoría de Pareja',
    modalidad: 'Parejas',
    dirigido: 'Enfoque: comunicación y resolución vincular',
    resumen:
      'Abordaje vivencial para clarificar patrones relacionales y fortalecer el vínculo.',
    descripcion:
      'Abordaje vivencial para parejas que buscan clarificar patrones relacionales, resolver conflictos y fortalecer su vínculo a través del reflejo del caballo.',
  },
  {
    slug: 'individual-constelaciones',
    categoria: 'sesiones',
    nombre: 'Sesiones Individuales: Constelaciones y Configuraciones',
    modalidad: 'Individual',
    dirigido: 'Enfoque: proceso personal profundo',
    resumen:
      'Atención personalizada de 2 horas dentro del campo sistémico equino.',
    descripcion:
      'Atención personalizada de 2 horas para abordar temas de vida, bloqueos personales o metas específicas dentro del campo sistémico equino.',
  },
  {
    slug: 'individual-equilibrio-emocional',
    categoria: 'sesiones',
    nombre: 'Sesiones Individuales: Equilibrio Emocional',
    modalidad: 'Individual',
    dirigido: 'Enfoque: regulación del sistema nervioso',
    resumen:
      'Gestión del estrés y autorregulación mediante la co-regulación con la manada.',
    descripcion:
      'Proceso enfocado en la gestión del estrés, autorregulación y recuperación de la paz interior mediante la co-regulación con la manada.',
  },
  {
    slug: 'coaching-sistemico',
    categoria: 'sesiones',
    nombre: 'Coaching Sistémico con Caballos',
    modalidad: 'Flexible (grupal e individual)',
    dirigido: 'Enfoque: metas, liderazgo y límites',
    resumen:
      'Proceso dinámico para potenciar liderazgo y establecer límites claros.',
    descripcion:
      'Proceso dinámico orientado a potenciar habilidades de liderazgo, establecimiento de límites claros y coherencia entre pensamiento y acción.',
  },

  // Categoría 3: Terapias Especializadas y Visitas
  {
    slug: 'equinoterapia-clinica',
    categoria: 'terapias',
    nombre: 'Equinoterapia Clínica',
    modalidad: 'Individual / Evaluación previa',
    dirigido: 'Enfoque: salud integral',
    resumen:
      'Intervención multidisciplinaria en un ambiente profesional, controlado y seguro.',
    descripcion:
      'Intervención multidisciplinaria para favorecer aspectos motores, cognitivos y emocionales en un ambiente profesional, controlado y seguro.',
    destacado: true,
  },
  {
    slug: 'monta-terapeutica',
    categoria: 'terapias',
    nombre: 'Monta Terapéutica',
    modalidad: 'Individual',
    dirigido: 'Enfoque: postura, equilibrio y autoconfianza',
    resumen:
      'Aprovecha el patrón de marcha tridimensional del caballo.',
    descripcion:
      'Práctica adaptada que aprovecha el patrón de marcha tridimensional del caballo para estimular el fortalecimiento físico y la seguridad personal.',
  },
  {
    slug: 'estimulacion-temprana',
    categoria: 'terapias',
    nombre: 'Estimulación Temprana Asistida',
    modalidad: 'Primera Infancia',
    dirigido: 'Enfoque: desarrollo neuromotor',
    resumen:
      'Integración sensorial, motricidad y vínculo afectivo en la naturaleza.',
    descripcion:
      'Programa especializado para bebés y niños pequeños orientado a potenciar la integración sensorial, la motricidad y el vínculo afectivo en la naturaleza.',
  },
  {
    slug: 'visitas-pedagogicas',
    categoria: 'terapias',
    nombre: 'Visitas Pedagógicas Institucionales',
    modalidad: 'Delegaciones',
    dirigido: 'Universidades, Adulto Mayor y Grupos',
    resumen:
      'Jornadas educativas y vivenciales adaptadas para instituciones.',
    descripcion:
      'Jornadas educativas y vivenciales adaptadas para instituciones interesadas en conocer el manejo ético equino, las terapias asistidas y el bienestar animal.',
  },

  // Categoría 4: Experiencias Complementarias
  {
    slug: 'certificados-regalo',
    categoria: 'experiencias',
    nombre: 'Certificados de Regalo (Gift Cards)',
    modalidad: 'Digital o Impreso',
    dirigido: 'Canjeable por cualquier servicio',
    resumen:
      'Un obsequio con propósito: regalar una experiencia de sanación o descanso.',
    descripcion:
      'Un obsequio con propósito. Permite regalar a un ser querido una experiencia de sanación, crecimiento o descanso en AnÍmales.',
  },
  {
    slug: 'hospedaje-retiro',
    categoria: 'experiencias',
    nombre: 'Hospedaje de Retiro',
    modalidad: 'Alojamiento privado',
    dirigido: 'Enfoque: descanso y reconexión',
    resumen:
      'Estancia en un entorno natural de paz para complementar formaciones o desconectar.',
    descripcion:
      'Estancia dentro de nuestras instalaciones para disfrutar de un entorno natural de paz, complementar formaciones o vivir un retiro de desconexión.',
    destacado: true,
  },
];
