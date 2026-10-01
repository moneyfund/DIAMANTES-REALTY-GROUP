# Experiencia pública de Diamantes — octubre de 2026

El inicio y el catálogo comparten ahora una base visual independiente en
`css/drg-premium.css`. Las páginas restantes conservan sus estilos actuales;
el detalle y el mapa cargan además las reglas del componente de tarjeta.

## Arquitectura y mantenimiento

- Continúa la aplicación HTML/CSS/JavaScript existente. No hay migración a
  Next.js, paquetes de producción nuevos ni modificaciones de Firebase,
  colecciones, reglas, autenticación, rutas o configuración de despliegue.
- `propertyCardTemplate` en `js/properties.js` conserva los enlaces y contratos
  del inventario. Presenta fotografía 4:3, precio USD/NIO, estado, características
  y el enlace de compartir Open Graph existente. Los títulos se limpian sólo
  en la presentación; no se modifica ningún documento de Firestore.
- `js/drg-experience.js` controla la presentación: carga/error, desplazamiento
  horizontal nativo, revelados, filtros móviles y el logo original en capas CSS.
  No lee ni escribe en la base de datos.
- Las animaciones reaccionan al desplazamiento nativo mediante un único frame
  pendiente, se suspenden fuera de pantalla y respetan movimiento reducido.
- `js/main.js` sigue siendo responsable de navegación, sesión, footer y búsqueda.
  La búsqueda del inicio transmite ahora presupuesto mínimo y máximo; los rangos
  de alquiler se expresan por mes. Los filtros y el orden se conservan en la URL.
- Las páginas nuevas no cargan las antiguas capas `premium-home`,
  `home-vip-refresh` y `home-public-v3`. No volver a incluir el controlador de
  cortina: intercepta el scroll y entra en conflicto con la experiencia nativa.
- Los tokens `--drg-*` centralizan tipografía, paleta, radios, sombras y movimiento.
  Los estilos de página se limitan a `.drg-premium`; las tarjetas compartidas a
  `.drg-property-card`.

## Verificación

Se revisaron en Chromium las vistas de 1440, 834 y 390 píxeles con el inventario
real: 28 propiedades públicas al momento de la revisión. Se comprobaron búsqueda,
venta/alquiler, presupuesto, orden, paginación, estado vacío, carruseles, búsqueda
móvil, navegación, foco de filtros y movimiento reducido. La ficha individual
sigue resolviendo su URL original, con galería y reseñas; el mapa conserva sus
28 resultados. También se verificaron el enlace Open Graph copiado y el estado
de error con reintento al bloquear una petición de Firebase. No hubo excepciones
JavaScript no capturadas en estas comprobaciones. No se realizaron escrituras de prueba en
Firestore ni inicios de sesión con cuentas de clientes o agentes.

Comprobación funcional focalizada (31 pruebas, todas correctas):

```sh
node --test tests/premium-catalog.test.js tests/property-share.test.js tests/property-visibility.test.js tests/public-properties-loading.test.js tests/home-mobile-search.test.js tests/home-property-carousel.test.js tests/public-property-card.test.js
```

También se comprobaron sintaxis JavaScript, referencias locales y `git diff --check`.
La aplicación estática no tiene compilador TypeScript ni un comando npm de build.
Vercel publica los archivos existentes y la función de compartir sin cambiar
la configuración del proyecto.

La suite completa tiene 79 pruebas: 66 correctas y 13 fallos presentes también
en la base `fc653b1`. Corresponden a expectativas antiguas de autenticación,
dashboard, cortina del inicio, navbar, mapa y equipo. La suite retirada de
`home-vip-refresh` verificaba un controlador ya sustituido; se reemplazó por
pruebas funcionales de filtros, precios, datos compatibles y tarjetas.

El CSS local enlazado directamente por el inicio bajó de aproximadamente
439 KB a 51 KB (sin comprimir); el catálogo, de 445 KB a 54 KB. Esto mide recursos
CSS, no constituye una medición de Core Web Vitals.

La reversión consiste en revertir el commit del rediseño; no requiere migrar datos.
