# Despliegue: GitHub Pages + dominio administrado en Wix

## 1. Subir el proyecto a GitHub

```powershell
cd "C:\Users\Angelos\Desktop\hector gifarro"
git init
git add .
git commit -m "Maqueta inicial del sitio AnÍmales"
git branch -M main
git remote add origin https://github.com/USUARIO/animales-sitio.git
git push -u origin main
```

## 2. Activar GitHub Pages

1. En el repositorio: **Settings → Pages**.
2. En *Source* elegí **Deploy from a branch**.
3. Branch: `main`, carpeta: `/ (root)`. Guardar.
4. A los pocos minutos el sitio queda en `https://USUARIO.github.io/animales-sitio/`.

El archivo `.nojekyll` ya está incluido para que GitHub Pages publique los archivos tal cual, sin
procesarlos con Jekyll.

## 3. Conectar el dominio del cliente

El cliente administra su dominio en Wix. Hay dos escenarios:

### Escenario A — El dominio apunta completo a GitHub Pages (recomendado)

El sitio de Wix se reemplaza por este. Se configuran los registros DNS **en el panel de Wix**
(*Dominios → Administrar DNS*):

**Registros A** para el dominio raíz (`animales.com`), los cuatro:

```
185.199.108.153
185.199.109.153
185.199.110.153
185.199.111.153
```

**Registro CNAME** para `www`:

```
www  →  USUARIO.github.io
```

Después, en **Settings → Pages → Custom domain** del repositorio, escribí el dominio y guardá.
GitHub crea automáticamente un archivo `CNAME` en el repositorio. Al confirmarse la propagación
(puede tardar hasta 48 horas), activá **Enforce HTTPS**.

> Importante: al mover los registros A y CNAME, el sitio publicado en Wix deja de responder en ese
> dominio. Confirmá con el cliente antes de hacer el cambio.

### Escenario B — Solo un subdominio apunta a GitHub Pages

El sitio de Wix se mantiene en el dominio principal y este proyecto vive, por ejemplo, en
`reservas.animales.com`. En el panel DNS de Wix se agrega un único registro:

```
CNAME   reservas   →   USUARIO.github.io
```

Y en **Settings → Pages → Custom domain** se coloca `reservas.animales.com`.

## 4. Verificación posterior

- [ ] El sitio carga por HTTPS sin advertencias.
- [ ] `www` y el dominio raíz llevan al mismo lugar.
- [ ] Los enlaces de WhatsApp abren con el número correcto.
- [ ] El mapa muestra la ubicación real.
- [ ] La página `404.html` aparece al entrar a una ruta inexistente.

## 5. Actualizaciones posteriores

Cada `git push` a `main` republica el sitio automáticamente en un par de minutos.

```powershell
git add .
git commit -m "Descripción del cambio"
git push
```
