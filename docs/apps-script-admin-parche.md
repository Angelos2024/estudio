# Parche único: Guardar el sitio sin tokens (cualquier país / PC)

Tu colega no pudo guardar porque el botón pedía un **token de GitHub por navegador**.
Eso se reemplaza por el **mismo Google Apps Script** de las reservas: solo hace falta
la clave del admin (`1411`).

## Paso obligatorio (una vez, en tu cuenta de Google)

1. Abrí la Google Sheet de reservas → **Extensiones → Apps Script**.
2. Copiá **todo** el archivo  
   [`docs/apps-script/Codigo.gs`](apps-script/Codigo.gs)  
   (ya incluye `admin_guardar` y `accion=contenido`) y pegalo encima del script.
3. Guardá.
4. **Implementar → Administrar implementaciones → ✎ Editar → Nueva versión → Implementar**.
5. Si Google pide permiso de **Drive**, aceptá.
6. Probá en el navegador (debe decir `"ok":true`):

```
https://script.google.com/macros/s/TU_ID/exec?accion=contenido
```

Si ves `"Token inválido"`, la implementación **vieja** sigue activa: repetí el paso 4.

La URL de `reservas.endpoint` en `assets/js/config.js` **no cambia** si actualizás
la misma implementación.

## Uso para cualquiera (Costa Rica, Colombia, etc.)

1. https://angelos2024.github.io/estudio/
2. 4 clics en el logo → clave `1411`
3. Editar → **Guardar**

No hace falta engranaje ni token.
