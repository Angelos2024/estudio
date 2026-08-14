# AnÍmales — Sitio Web

Sitio web estático del **Centro de Terapia Asistida con Animales AnÍmales** (Costa Rica, modelo CEEC).
Construido con HTML, CSS y JavaScript sobre **Bootstrap 5.3**, sin proceso de compilación, para
publicarse en **GitHub Pages** y conectarse al dominio que el cliente administra en Wix.

> Estado actual: **maqueta de trabajo**. Los textos provienen del documento de gestión web del
> cliente; las fotografías y los datos de contacto están pendientes de confirmación.

---

## 1. Estructura del proyecto

```
hector gifarro/
├── index.html              Inicio: propuesta de valor, categorías, destacados, testimonios
├── formaciones.html        Categoría 1 · Formaciones Académicas
├── servicios.html          Categoría 2 · Servicios y Sesiones
├── terapias.html           Categoría 3 · Terapias y Visitas
├── experiencias.html       Categoría 4 · Hospedaje y Experiencias
├── nosotros.html           Historia, modelo CEEC y bienestar animal
├── contacto.html           Formulario de reservas, datos de contacto y mapa
├── 404.html                Página de error para GitHub Pages
├── assets/
│   ├── css/styles.css      Sistema de diseño completo (paleta, componentes, utilidades)
│   ├── js/config.js        Datos de contacto y enlaces externos (editar aquí)
│   ├── js/data.js          Catálogo de las 4 categorías y los 16 servicios
│   ├── js/main.js          Render de tarjetas, navegación, formulario y animaciones
│   └── img/                Fotografías del sitio (ver assets/img/README.md)
├── docs/
│   ├── REQUERIMIENTOS.md   Resumen del PDF del cliente
│   ├── PENDIENTES.md       Lista de información que falta por parte del cliente
│   └── DESPLIEGUE.md       Publicación en GitHub Pages y conexión del dominio Wix
├── .nojekyll               Evita que GitHub Pages procese el sitio con Jekyll
└── .gitignore
```

## 2. Trabajar de forma local

No hay dependencias ni instalación. Bootstrap y los íconos se cargan desde CDN.

**Opción A — Live Server (recomendada).** En VS Code / Cursor, instalá la extensión *Live Server*,
hacé clic derecho sobre `index.html` y elegí **Open with Live Server**.

**Opción B — Servidor de Python.**

```powershell
cd "C:\Users\Angelos\Desktop\hector gifarro"
python -m http.server 5500
```

Luego abrí <http://localhost:5500>.

**Opción C — Abrir el archivo directamente.** Funciona: todo el JavaScript es local y no usa `fetch`.
Aun así, se recomienda un servidor local para que las rutas y el comportamiento sean idénticos a
los de producción.

## 3. Cómo editar el contenido

| Qué querés cambiar | Dónde |
| --- | --- |
| Teléfono, WhatsApp, correo, dirección, redes, mapa | `assets/js/config.js` |
| Servicios: nombre, modalidad, descripción, destacados | `assets/js/data.js` |
| Colores, tipografías, espaciados, componentes | `assets/css/styles.css` (bloque `:root`) |
| Textos de secciones, títulos, preguntas frecuentes | Directamente en cada archivo `.html` |
| Fotografías | `assets/img/` (ver nombres esperados en `assets/img/README.md`) |

Las tarjetas de servicio se generan solas desde `data.js`. Para agregar un servicio nuevo basta con
añadir un objeto a `SERVICIOS` con su `categoria`; aparecerá en la página correspondiente y en el
selector del formulario de reservas.

## 4. Paleta institucional

Definida en `:root` dentro de `assets/css/styles.css`, según el documento del cliente:

| Uso | Variable | Color |
| --- | --- | --- |
| Formaciones | `--an-rosa` | `#d4759b` |
| Sesiones | `--an-morado` | `#7a5c9e` |
| Terapias | `--an-verde` | `#5b8f6a` |
| Experiencias | `--an-amarillo` | `#e2a93b` |
| Identidad | `--an-ocre` | `#a97442` |

## 5. Reservas

Por ahora **no hay inicio de sesión ni registro**, tal como se definió. El formulario de
`contacto.html` valida los campos y arma un mensaje que se abre en WhatsApp Business con los datos
de la solicitud. Cuando se defina el flujo real de reservas, las alternativas son:

1. **Formspree / Web3Forms** — envío por correo sin backend (más simple, gratuito hasta cierto volumen).
2. **Google Calendar / Calendly embebido** — si el cliente quiere disponibilidad y agenda en línea.
3. **Backend propio** — solo si se requiere pago en línea o gestión de cupos.

## 6. Publicación

Ver `docs/DESPLIEGUE.md` para el paso a paso de GitHub Pages y de la conexión del dominio desde Wix.
