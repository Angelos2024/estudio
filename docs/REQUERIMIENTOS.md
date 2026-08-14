# Requerimientos del cliente

Fuente: `sitio_web_animales.pdf` — *AnÍmales, Arquitectura de Contenidos, Filosofía y Catálogo de
Productos/Servicios · Documento de Gestión Web 2026*.

## Concepto

"Vitrina digital intuitiva" que facilite la consulta, reserva y contacto rápido de clientes locales
(Costa Rica) e internacionales.

## Arquitectura de navegación (7 secciones)

| # | Sección | Archivo | Contenido |
| --- | --- | --- | --- |
| 1 | Inicio | `index.html` | Presentación conceptual, propuesta de valor, acceso a categorías, testimonios |
| 2 | Formaciones Académicas | `formaciones.html` | Diplomados y comunidad de graduados |
| 3 | Servicios y Sesiones | `servicios.html` | Convivencias, mentorías de pareja, trabajo sistémico |
| 4 | Terapias y Visitas | `terapias.html` | Equinoterapia, monta terapéutica, estimulación temprana, visitas |
| 5 | Hospedaje y Experiencias | `experiencias.html` | Alojamiento de retiro y certificados de regalo |
| 6 | Nosotros / Filosofía | `nosotros.html` | Historia desde 2010, enfoque CEEC, bienestar animal |
| 7 | Contacto / Reservas | `contacto.html` | Formulario interactivo, WhatsApp Business, mapa |

## Paleta institucional

Rosa (Formación) · Morado (Sesiones) · Verde (Terapias) · Amarillo (Experiencias) · Ocre (Identidad).

## Filosofía

**Bienestar integral y respeto absoluto.** Los caballos viven en libertad, sin herraduras
(*barefoot*), alimentados con forraje verde, seco y camote. Bajo el modelo **CEEC** (Constelaciones
Familiares y Equilibrio Emocional con Caballos), la manada actúa como espejo neutral de resonancia
sistémica y regulación emocional.

## Catálogo (16 servicios en 4 categorías)

Cargado íntegramente en `assets/js/data.js`.

**Categoría 1 · Formaciones Académicas (rosa)**
1. Diplomado en Equinoterapia
2. Diplomado CEEC
3. Comunidad de Graduados

**Categoría 2 · Sesiones de Configuración y Crecimiento Personal (morado)**
4. Convivencias Grupales de Configuraciones Sistémicas
5. Convivencias Grupales Privadas
6. Convivencias Familias
7. Sesiones de Mentoría de Pareja
8. Sesiones Individuales: Constelaciones y Configuraciones
9. Sesiones Individuales: Equilibrio Emocional
10. Coaching Sistémico con Caballos

**Categoría 3 · Terapias Especializadas y Visitas (verde)**
11. Equinoterapia Clínica
12. Monta Terapéutica
13. Estimulación Temprana Asistida
14. Visitas Pedagógicas Institucionales

**Categoría 4 · Experiencias Complementarias (amarillo)**
15. Certificados de Regalo (Gift Cards)
16. Hospedaje de Retiro

## Definiciones acordadas con el desarrollador

- Sitio estático: HTML, CSS, JavaScript y Bootstrap. Sin proceso de compilación.
- Alojamiento en GitHub Pages desde el repositorio; el dominio se conecta desde Wix.
- **Sin inicio de sesión ni registro de usuarios.** Solo se evaluará qué datos se solicitan si se
  implementa un flujo de reserva formal.
