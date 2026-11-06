# Guardar cambios del editor (sin token en el navegador)

El sitio es estático (GitHub Pages). Para que **cualquier persona** con la
contraseña del admin pueda pulsar **Guardar** y que el cambio se vea en la web
**sin configurar un token de GitHub en el navegador**, el contenido se publica
a través del **mismo Google Apps Script** de las reservas.

## Qué tenés que hacer una sola vez (dueño del sitio)

1. Abrí el proyecto de Apps Script de las reservas
   (`Extensiones → Apps Script` en la Google Sheet, o el script ya conectado).
2. Reemplazá / actualizá el código con la versión de
   `integraciones/apps-script/Codigo.gs` (incluye las funciones del editor).
3. **Implementar → Administrar implementaciones → Editar → Nueva versión → Implementar**.
   Así se mantiene la misma URL `/exec`.
4. La primera vez que se guarde contenido, Google pedirá permiso de **Drive**
   (además de hoja/correo/calendario): aceptá.
5. En `assets/js/config.js`, `reservas.endpoint` ya debe apuntar a esa URL.
   El admin la reutiliza sola.

Listo. Desde cualquier PC:

1. Abrí https://angelos2024.github.io/estudio/
2. 4 clics en el logo → clave `1411`
3. Editá y pulsá **Guardar**

No hace falta engranaje ⚙ ni token.

## Cómo funciona

- **Guardar** envía el JSON + fotos (si hay) al Apps Script.
- El script guarda `animales-contenido.json` y las imágenes en una carpeta de
  Drive (`Anímales — Contenido web`), con enlace público.
- Al cargar, el sitio pide `?accion=contenido` a ese endpoint y aplica los
  cambios a todos los visitantes (al instante, sin esperar a GitHub Pages).

## Seguridad

- Quien sepa la clave `1411` puede publicar contenido.
- Cambiá `ADMIN_CLAVE` en el Apps Script si querés otra clave (y la constante
  `CLAVE` en `assets/js/admin.js` para que coincida el login).
