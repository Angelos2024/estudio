# Reservas y solicitudes — Conexión con Google

Este sitio es **estático** (GitHub Pages), así que no tiene servidor propio. El
formulario de contacto envía los datos a un **Google Apps Script** que:

1. Registra cada solicitud en una **Google Sheet** (tu base de datos en tiempo real).
2. Te envía un **correo** de aviso.
3. Crea un **evento TENTATIVO** en **Google Calendar** (si la persona indicó fecha).

Después confirmás por teléfono y marcás la fila como **Confirmada** en la hoja.

> Enfoque elegido: **híbrido A+B**. La parte A (formulario → hoja + correo +
> calendario) se conecta con los pasos de abajo. La parte B (agenda con horarios
> disponibles) es opcional y se explica al final.

---

## Parte A — Formulario → Google Sheet + correo + calendario

### 1. Crear la Google Sheet
1. Entrá a [sheets.new](https://sheets.new) con la cuenta de Google que recibirá
   las reservas (por ahora la tuya de pruebas; luego se migra a la del cliente).
2. Ponele un nombre, por ejemplo **AnÍmales — Reservas**.
3. Dejala abierta.

### 2. Pegar el script
1. En la hoja: menú **Extensiones → Apps Script**.
2. Borrá el contenido de ejemplo y pegá **todo** el archivo
   [`integraciones/apps-script/Codigo.gs`](../integraciones/apps-script/Codigo.gs).
3. Arriba, en el bloque `CONFIG`, ajustá:
   - `CORREO_AVISOS`: el correo donde querés recibir los avisos.
   - `CALENDAR_ID`: dejá `'primary'` para tu calendario principal, o pegá el ID
     de un calendario dedicado.
   - (Opcional) `DURACION_MIN` y `HORA_INICIO_DEFECTO`.
   - `SHEET_ID`: **dejalo vacío** si creaste el script desde la hoja (recomendado).
4. Guardá (ícono de disquete).

### 3. Desplegar como aplicación web
1. Botón **Implementar → Nueva implementación**.
2. En "Tipo", elegí **Aplicación web**.
3. Configurá:
   - **Ejecutar como:** Yo (tu cuenta).
   - **Quién tiene acceso:** **Cualquier usuario**.
4. **Implementar**. Google pedirá **autorizar permisos** (hoja, correo,
   calendario): aceptá. Si aparece "Google no verificó la app", entrá en
   *Configuración avanzada → Ir a (nombre) (no seguro)* — es tu propio script.
5. Copiá la **URL de la aplicación web** (termina en `/exec`).

### 4. Pegar la URL en el sitio
Abrí [`assets/js/config.js`](../assets/js/config.js) y pegá la URL en
`reservas.endpoint`:

```js
reservas: {
  endpoint: 'https://script.google.com/macros/s/XXXXXXXX/exec',
  ...
}
```

Listo. Desde ese momento, cada envío del formulario aparece en la hoja, te llega
el correo y se crea el evento tentativo.

### 5. Probar
1. Abrí `contacto.html` en el sitio.
2. Completá y enviá el formulario.
3. Verificá que aparezca una fila nueva en la hoja, el correo en tu bandeja y el
   evento (amarillo, "TENTATIVO — …") en el calendario.

> **Nota técnica:** Apps Script no expone cabeceras CORS para POST, por eso el
> sitio envía la solicitud en modo `no-cors` y asume éxito si la red responde. Si
> el envío fallara por red, el formulario abre WhatsApp con los datos como
> respaldo para no perder la solicitud.

---

## Sincronización a la PC local (tiempo real)

- La **Google Sheet es la base en tiempo real**: se actualiza sola en cuanto
  entra una solicitud. Abrila en la PC (navegador o app de Sheets) y la ves al
  instante.
- Para tener además una **copia local** del archivo, instalá
  **Google Drive para Escritorio** e iniciá sesión con la misma cuenta: el
  archivo queda espejado en el disco de la PC.
- El **Google Calendar** también se sincroniza con la app de Calendario del
  sistema si vinculás la cuenta.

---

## Flujo de aprobación (autorizar / reagendar / rechazar)

En la columna **Estado** de la hoja hay un menú desplegable con 4 opciones. Al
elegir una, el evento del calendario se actualiza **automáticamente**:

| Estado en la hoja | Qué pasa en el calendario |
|---|---|
| **Pendiente** | Evento amarillo con prefijo `TENTATIVO` (estado inicial). |
| **Confirmada** | Evento verde con prefijo `CONFIRMADA`. |
| **Reagendar** | Evento naranja con prefijo `REAGENDAR`. |
| **Rechazada** | El evento se **elimina** del calendario (libera el espacio). |

La fila también se pinta del color correspondiente para ubicarla de un vistazo.

> Idea de uso: entra la solicitud como **Pendiente**, hablás por teléfono para
> acordar y recién ahí marcás **Confirmada**, **Reagendar** o **Rechazada**.

### Activar este automatismo (una sola vez)
El cambio de estado requiere un **activador instalable** (el `onEdit` simple no
puede tocar Calendar/correo). Configuralo así:

1. En el editor de Apps Script, guardá el código actualizado (**Ctrl+S**).
2. En la barra izquierda, entrá al ícono de **reloj ⏰ (Activadores)**.
3. Botón **+ Agregar activador** (abajo a la derecha) y configurá:
   - **Función:** `alEditarEstado`
   - **Implementación:** Head
   - **Origen del evento:** Desde una hoja de cálculo
   - **Tipo de evento:** Al editar
4. **Guardar** y autorizá los permisos.

Listo: desde ese momento, cambiar el **Estado** en la hoja actualiza el evento.

### (Opcional) Avisar por correo al solicitante
Por defecto, al confirmar o rechazar **no** se le escribe al cliente (vos lo
manejás por teléfono). Si querés que se le envíe un correo automático, poné en
el script `AVISAR_AL_CLIENTE: true`.

> Nota: si ya habías creado la hoja antes de esta versión, al recibir una nueva
> solicitud (o al ejecutar `prepararHoja` una vez) se agrega solo el menú
> desplegable de estados a la columna **Estado**.

---

## Panel de administración local (app de escritorio)

Además de la hoja, hay una **app local** (`panel-local/`) para gestionar todo
desde tu PC con un ícono en el escritorio: listar, **confirmar / reagendar /
rechazar**. Trabaja sobre el mismo Apps Script, así que queda todo sincronizado
con la hoja y el calendario (**doble vía**: lo que hagas en el panel aparece en
la hoja y viceversa).

### 1. Verificar el token
En el script, en `CONFIG.TOKEN`, hay un token secreto. El panel usa el mismo en
`panel-local/config.json`. Ya vienen con el mismo valor; si cambiás uno, cambiá
el otro.

### 2. Redeploy del script (imprescindible)
El panel usa la API nueva (`listar`, `estado`, `reagendar`). Para activarla:
pegá el `Codigo.gs` actualizado, guardá y hacé **Implementar → Gestionar
implementaciones → lápiz ✏️ → Versión: Nueva versión → Implementar**.

### 3. Instalar dependencias del panel
```bash
cd panel-local
pip install -r requirements.txt
```

### 4. Abrir el panel
- Doble clic en **`Iniciar panel.bat`**, o `python app.py`.
- Para el ícono de escritorio: clic derecho en **`crear-acceso-directo.ps1`** →
  *Ejecutar con PowerShell*.

Detalles de uso y empaquetado a `.exe` en `panel-local/README.md`.

> Cómo conviven las dos vías:
> - Cambios desde el **panel** o desde el **menú de la hoja** → actualizan la
>   hoja y el calendario.
> - Si movés/borrás un evento **directamente en Google Calendar**, eso no vuelve
>   solo a la hoja (para ese caso usá el panel o la hoja como control).

---

## Parte B (opcional) — Agenda con horarios disponibles

Para que la persona elija directamente un espacio libre:

### Opción B1 — Google Appointment Schedule (gratis con Gmail/Workspace)
1. En Google Calendar: **Crear → Programación de citas**.
2. Definí duración, **días y horarios disponibles**, y anticipación mínima.
3. **Guardá** y abrí **Compartir → Insertar** para copiar la URL/iframe.
4. Pegá esa URL en `assets/js/config.js` → `reservas.agendaEmbed`.

### Opción B2 — Calendly
1. Creá un tipo de evento en [calendly.com](https://calendly.com) con tu
   disponibilidad.
2. Copiá el enlace del evento.
3. Pegalo en `reservas.agendaEmbed`.

En cuanto `agendaEmbed` tenga una URL, aparece automáticamente la sección
**"Elegí un horario disponible"** en `contacto.html`. Si lo dejás vacío, esa
sección queda oculta.

---

## Parte C — Administración (Clientes frecuentes y Días inhábiles)

El panel local (`panel-local`) tiene **tres secciones** en la barra superior:

1. **Solicitudes** — las reservas que llegan del sitio (confirmar/reagendar/rechazar).
2. **Clientes** — registro de clientes frecuentes (CRM).
3. **Días inhábiles** — calendario para marcar días cerrados.

Todo se guarda en la **misma Google Sheet**, en pestañas nuevas que el script crea
solo (`Clientes` y `DiasInhabiles`). No hay que configurar nada extra: al
redeployar y abrir el panel, las pestañas aparecen la primera vez que se usan.

### Clientes frecuentes
- Botón **“+ Nuevo cliente”**: nombre (obligatorio), teléfono, correo, etiqueta
  (Frecuente/VIP/…), **días de visita** (Lun–Dom), frecuencia y notas.
- **Editar** o **Eliminar** desde la tarjeta de cada cliente.
- Buscador por nombre, teléfono o correo.
- El teléfono/correo entran como **texto** (sin el error de fórmula del `+`).

### Días inhábiles
- Calendario mensual: **tocá un día** para marcarlo/quitarlo como inhábil
  (con motivo opcional: feriado, mantenimiento, vacaciones…).
- Los días con solicitudes muestran un **punto verde** con la cantidad.
- Si entra una solicitud (o se reagenda) en un **día inhábil**, el correo y el
  evento del calendario se marcan con **⚠️ [DÍA INHÁBIL]** para que lo notes.
- La lista lateral muestra los próximos días cerrados; se quitan con un clic.

> El panel usa una sola llamada (`accion=datos`) que trae solicitudes + clientes
> + días inhábiles juntos, así carga rápido.

---

## Migrar al cliente (más adelante)

Cuando el cliente tenga su cuenta lista:
1. Repetí los pasos 1–4 con **su** cuenta de Google (el script crea las pestañas
   `Solicitudes`, `Clientes` y `DiasInhabiles` solo; o corré `prepararHoja` una vez).
2. Actualizá `reservas.endpoint` (y `agendaEmbed` si aplica) con las nuevas URLs.
3. Actualizá `CORREO_AVISOS` dentro del script y el **TOKEN** (línea de `CONFIG`).
4. En la otra laptop: instalá Python + `pip install -r panel-local/requirements.txt`
   y poné el nuevo endpoint + token en **Ajustes** del panel (o en `config.json`).
