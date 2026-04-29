# Dashboard personal

App local de agenda + ideas + reservas + métricas. Doble click en `index.html` y anda.
Sin instalación, sin Node, sin build. HTML/CSS/JS vanilla puro. **PWA instalable en celular.**

## Cómo abrir en PC

1. Abrí `index.html` con doble click (se abre en tu navegador por defecto).
2. Recomendado: anclar la pestaña en Chrome/Edge para tenerlo siempre a mano.

> Los datos se guardan en `localStorage` del navegador. **Si abrís el archivo en otro navegador, no vas a ver tus datos** — usá siempre el mismo. Para portar entre navegadores o equipos, exportá JSON desde `⚙ Datos`.

## Cómo instalar en celular

La PWA necesita servirse por HTTPS para ser instalable. Dos caminos:

### Probar local (misma red wifi)

1. Abrí PowerShell en `C:/Users/franf/dashboard/` y corré:
   ```bash
   python -m http.server 8000
   ```
2. En la PC, mirá tu IP local: `ipconfig` → "IPv4 Address" (ej: `192.168.0.42`).
3. En el celular (misma wifi) abrí `http://192.168.0.42:8000`.
4. Vas a ver el dashboard responsive con bottom nav. La instalación PWA solo anda con HTTPS, así que para tener el ícono en home necesitás el paso siguiente.

### Hostear (instalable como app)

**Opción A — GitHub Pages (recomendado, gratis):**
1. Crear repo en GitHub, pushear la carpeta `dashboard/`
2. Settings → Pages → Source: branch main, folder /
3. URL: `https://TU_USUARIO.github.io/dashboard/`

**Opción B — Vercel / Netlify:** drag & drop de la carpeta en su web.

Una vez con HTTPS:

- **iPhone (Safari):** abrir la URL → botón compartir → "Añadir a pantalla de inicio".
- **Android (Chrome):** abrir la URL → menú ⋮ → "Instalar app" o "Añadir a pantalla de inicio".

Después abrís desde el ícono y queda fullscreen, sin barra del browser, con ícono propio. Funciona offline (los datos están en local).

> **Importante:** en Fase 1 los datos del celular y la PC están separados (cada dispositivo tiene su localStorage). Para sincronizar, ver Fase 2 en `~/.claude/plans/`.

## Atajos

| Tecla | Acción |
|---|---|
| `1` | Calendario |
| `2` | Ideas |
| `3` | Reservas |
| `N` | Crear nuevo (según vista activa) |
| `T` | Ir a hoy (calendario) |
| `←` `→` | Navegar mes/semana/día |
| `/` | Buscar (en Ideas) |
| `Esc` | Cerrar modal |

## Cómo editar

Cada cosa vive en un archivo. Para cambiar algo, tocás solo ese archivo:

| Querés cambiar… | Archivo |
|---|---|
| Colores, tipografía, espaciados, animaciones | `css/style.css` (variables `:root` arriba) |
| Estructura de la página, modales | `index.html` |
| Lógica del calendario (vistas, drag-drop, modal evento) | `js/calendar.js` |
| Lógica de ideas (captura, búsqueda, edición) | `js/ideas.js` |
| Lógica de reservas (CRUD, filtros, total mes) | `js/reservas.js` |
| Atajos, router de vistas, settings | `js/app.js` |
| Cómo se guardan los datos | `js/storage.js` |

### Cambiar la paleta
Editá las variables al principio de `css/style.css`:
```css
:root {
  --bg: #0d0d0d;
  --accent: #2d6a4f;       /* verde principal */
  --accent-light: #74c69d; /* verde claro / hoy */
  --reserva: #4a90e2;      /* color reservas */
  ...
}
```

### Agregar un módulo nuevo
1. Agregá un `<section class="view" id="view-NOMBRE">` en `index.html`
2. Agregá un `<div class="nav-item" data-view="NOMBRE">` en el sidebar
3. Creá `js/NOMBRE.js` con `init()` y `render()`
4. Cargálo en `index.html` antes de `app.js`
5. En `app.js → switchView`, agregá el `if (name === 'NOMBRE')`

## Backup

`⚙ Datos` (sidebar inferior izquierda) → Exportar JSON / Importar JSON.
Hacelo cada tanto. localStorage se puede limpiar si vaciás caché del navegador.

## Roadmap a producto

Cuando el uso propio valide el MVP, los pasos para empaquetarlo y venderlo:

1. **Tauri** — wrapping en ejecutable nativo (~3-5MB) para Win/Mac/Linux
   - `npm create tauri-app` apuntando al `index.html` actual
   - `tauri build` produce instaladores `.msi` / `.dmg` / `.AppImage`
2. **Storage nativo** — reemplazar `js/storage.js` por versión Tauri (filesystem o `tauri-plugin-sql`)
3. **Notificaciones nativas** — `tauri-plugin-notification` para recordatorios
4. **Auto-update** — `tauri-plugin-updater`
5. **Distribución** — landing en `Fraga Studio/web/` + checkout MercadoPago/Stripe

Toda la migración cambia solo `storage.js` + agrega un wrapper Tauri. El resto del código se reusa intacto.
