# Pendientes por confirmar con el cliente

Lista viva. Marcar cada punto conforme se resuelva.

## Datos de contacto (`assets/js/config.js`)

- [ ] **Número de WhatsApp Business.** Actualmente `+506 8303 0868`, obtenido de directorios
      públicos en línea. **Debe validarse.**
- [ ] **Correo oficial.** El valor actual (`info@animalesequinoterapia.com`) es un marcador de
      posición inventado.
- [ ] **Dirección exacta.** Se registró "La Guácima, Alajuela" según fuentes públicas; falta la
      dirección de la finca y las coordenadas para el mapa embebido.
- [ ] **Horario real de atención.**
- [ ] **Enlaces de redes sociales.** Se dejaron cargados el Facebook indicado
      (`facebook.com/Equinoterapia.cr`) y un Instagram encontrado en búsqueda; falta confirmar
      el Instagram y si existe canal de YouTube.
- [ ] **Nombre y cargo de la directora / facilitadores** para la sección Nosotros.

## Contenido

- [ ] **Fotografías reales.** Todas las imágenes son marcadores de posición. Ver
      `assets/img/README.md` para los nombres de archivo esperados.
- [ ] **Logo oficial** en versión clara y oscura, más el favicon.
- [ ] **Testimonios reales** con nombre y servicio (los actuales son de muestra).
- [ ] **Historia institucional ampliada.** El PDF menciona 2010; LinkedIn del centro indica 2008.
      Confirmar el año de fundación correcto.
- [ ] **Precios y duraciones** de cada servicio, si se van a mostrar en el sitio.
- [ ] **Calendario de matrícula** de los diplomados.
- [ ] **Respuestas definitivas** de las preguntas frecuentes en `formaciones.html` y `contacto.html`.

## Funcionalidad

- [ ] **Flujo de reservas definitivo.** Hoy el formulario arma un mensaje y lo abre en WhatsApp.
      Decidir si se pasa a envío por correo (Formspree/Web3Forms) o a una agenda en línea.
- [ ] **Qué datos se piden para reservar.** El formulario actual solicita nombre, correo, teléfono,
      servicio, fecha, cantidad de personas y mensaje.
- [ ] **Aviso de privacidad / términos**, necesarios si se recopilan datos personales.
- [ ] **Idioma inglés**, considerando que el PDF menciona clientes internacionales.

## Técnico

- [ ] Definir el escenario de dominio (ver `docs/DESPLIEGUE.md`): dominio completo o subdominio.
- [ ] Crear el repositorio en GitHub y activar Pages.
- [ ] Agregar Google Analytics o similar, si el cliente lo desea.
- [ ] Generar `sitemap.xml` y `robots.txt` cuando el dominio esté definido.
