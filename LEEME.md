# Army Forge — subir el proyecto desde cero

## Qué hay en esta carpeta

Ya no es un único archivo enorme — está dividido en piezas más manejables:

| Archivo | Qué es | Tamaño |
|---|---|---|
| `index.html` | La página en sí — carga todo lo demás en orden | ~2 KB |
| `app.js` | Toda la lógica de la app (componentes React) | ~75 KB |
| `data-aos.js` | Datos de Age of Sigmar | ~1.4 MB |
| `data-w40k.js` | Datos de Warhammer 40.000 | ~1.4 MB |
| `data-extras.js` | Formaciones, rasgos y artefactos de AoS | ~150 KB |
| `manifest.json` + `icon-192.png` + `icon-512.png` | Metadatos para poder instalarla como app | — |
| `.nojekyll` | Archivo vacío — evita el problema que tuviste antes | 0 bytes |

**`app.js` ahora se puede editar cómodamente** en el propio GitHub (antes era una sola línea kilométrica; ahora tiene formato normal, con saltos de línea).

## Paso 1 — Crear el repositorio

1. Ve a **github.com** → inicia sesión → **"+"** → **"New repository"**
2. Nombre (el que quieras, por ejemplo `army-forge`), marca **Public**, pulsa **"Create repository"**

## Paso 2 — Subir los archivos

1. En el repo vacío, pulsa **"uploading an existing file"**
2. Selecciona **los 8 archivos** de esta carpeta (¡ojo, incluido `.nojekyll`, que al ser un archivo "oculto" a veces no se ve fácilmente en el selector — si tu explorador de archivos no lo muestra, actívalo o créalo luego a mano desde GitHub con "Add file → Create new file" escribiendo `.nojekyll` como nombre, vacío)
3. **"Commit changes"**

## Paso 3 — Activar GitHub Pages

1. **Settings → Pages**
2. Branch: **main**, carpeta: **/ (root)** → **Save**
3. Espera 1-2 minutos

## Paso 4 — Verificar

Abre `https://tu-usuario.github.io/tu-repo/` — debería cargar directamente la app (fondo negro, "Elige tu juego"), sin pasos intermedios.

Si por lo que sea ves texto en vez de la app, comprueba que el archivo `.nojekyll` se subió de verdad (en la lista de archivos del repo debería aparecer, aunque esté vacío).

## Paso 5 — El APK

Igual que antes: la URL de GitHub Pages → **pwabuilder.com** → pestaña Android → **"Generate Package"**.

## Por qué está dividido ahora

Antes todo iba en un único `index.html` de 3 MB. Ahora:
- Los **datos** (que son la mayor parte del peso) van en sus propios archivos, cargados con `<script src="...">` normal — el navegador los descarga en paralelo, más rápido
- **`app.js`** contiene solo la lógica, así que si algún día quieres tocar algo del comportamiento de la app, es el único archivo que necesitas abrir y es perfectamente legible
- **`index.html`** es diminuto — solo se encarga de cargar todo en el orden correcto
