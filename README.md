# ExtraTime Pro Mobile (PWA)
Archivos: index.html, styles.css, app.js, database.js (IndexedDB), manifest.json, service-worker.js, icons/.

## Ejecutar en PC
En esta carpeta: `python3 -m http.server 8080` y abrir http://localhost:8080 (localhost sí permite Service Worker; abrir index.html con doble clic NO).

## Probar/instalar en Android
El Service Worker exige HTTPS o localhost. Opciones:
1. Subir la carpeta a un hosting HTTPS gratuito (Netlify, GitHub Pages, Cloudflare Pages), abrir la URL en Chrome del celular, menú ⋮ → "Instalar aplicación". Abrirla una vez con internet; luego funciona sin conexión.
2. Con cable USB: activar depuración USB, ejecutar el servidor en la PC, `adb reverse tcp:8080 tcp:8080` y abrir http://localhost:8080 en Chrome del celular.
(http://IP-de-la-PC:8080 NO sirve para instalar ni para el modo offline.)

## Copias de seguridad
Copias de seguridad → "Descargar copia (JSON)". Para restaurar: "Importar copia"; se valida el archivo, se muestran las cantidades y se pide confirmación antes de reemplazar. Los datos son locales a cada navegador/instalación: sin copia no se transfieren entre dispositivos. Borrar los datos del sitio en Chrome elimina la base.

## Notas
CSV con separador ";" y BOM UTF-8 (abre bien en Excel en español). Horas en decimal (8,50). No hay XLSX (requeriría una biblioteca). No se aplican reglas laborales automáticas: el tipo se elige a mano.
