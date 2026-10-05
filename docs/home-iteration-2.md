# Home inmersiva — segunda iteración

## Punto de partida y reversión

Estado aprobado anterior: commit `fe726f01bbc124674fb61662b3c7074553dc7630`,
rama `codex/drg-premium-experience`, PR #341. La primera preview es
`diamantesrealtygroup-b8o2ga4fv-moneyfunds-projects.vercel.app`.

Las tarjetas, los filtros, el catálogo, la paginación y el inventario real están
aprobados. Esta iteración sustituye solamente la experiencia de Inicio y restaura
el color original del logo. No requiere migraciones de datos. Se puede volver al
commit anterior o revertir el commit de esta iteración.

## Dirección visual

Un ambiente luminoso con líneas arquitectónicas, una sola fotografía existente
de Granada y el símbolo rojo como pieza espacial. Una escena persistente recorre
hero, salida, destacadas, momento de marca y retirada. Texto, enlaces y búsqueda
permanecen en HTML. El catálogo y los contratos de Firebase se conservan.

El archivo `assets/logo.png` es RGBA, transparente, con color dominante
RGB(230, 16, 9), `#E61009`. Los tres contornos principales del símbolo se extraen
de ese archivo para construir geometría extruida. El PNG original no se modifica.

Se retiran el slideshow automático, las nueve máscaras del logo y sus reglas.
La nueva capa visual carga únicamente en Home y conserva scroll nativo.

## Arquitectura

- `css/home-journey.css`: composición, ambiente, responsive y fallback. No añade
  `!important`. La hoja compartida conserva exactamente las 86 reglas examinadas
  de tarjetas, catálogo, filtros, skeletons y estados vacíos de la versión aprobada.
- `js/home/home-experience.js`: detección de capacidad, carga diferida,
  tipografía, observadores, puntero y ciclo de vida.
- `js/home/logo-geometry.js`: tres contornos del símbolo original, extrusión
  de 0.24 unidades y bisel de 0.009; cara `#e61009`, canto rojo oscuro.
- `js/home/scene.js`: cámara, iluminación, renderer transparente y dibujo bajo
  demanda. No emplea mapas de sombras, partículas, postprocesado ni texturas grandes.
- `js/home/journey.js`: una timeline y un ScrollTrigger, con scrub de 0.55 s.
  Los hitos se recalculan cuando cambia el tamaño del contenido real.
- `js/home/vendor/`: Three.js 0.180.0 y GSAP 3.13.0, fijados y servidos localmente.
  633,499 bytes sin comprimir; aproximadamente 176 KB gzip en conjunto.
  Avisos y licencias se conservan junto a los bundles.
- `tools/home-visual/`: tooling opcional y aislado para reconstruir bundles con
  `npm ci && npm run build`. No es un paso del build de Vercel ni introduce un
  package.json en la raíz. No cambia rutas ni configuración de despliegue.

El símbolo fallback es un SVG transparente. El nombre visual de marca reutiliza
el PNG oficial mediante un recorte SVG, sin volver a dibujar su tipografía.
Los textos, buscador, enlaces, encabezados y contenido SEO siguen en HTML.

Las capas son: ambiente 0, fotografía 10, escena 20, contenido 30, navegación
900 y diálogos 2000. Canvas y ambiente tienen `pointer-events: none`.

## Movimiento y rendimiento

La escena pasa por hero, aproximación, presencia lateral detrás de destacadas,
momento central y retirada. Cambian cámara, escala, orientación y opacidad;
la fotografía se desplaza ligeramente y el nombre de marca aparece después del
símbolo. No se capturan eventos wheel/touch ni se sustituye el scroll del navegador.
La sección central utiliza sticky CSS durante 45svh adicionales en escritorio.

Sólo se importa la capa WebGL con ancho superior a 900 px, puntero preciso,
más de dos núcleos lógicos y más de 2 GB cuando esos datos están disponibles.
Se respeta ahorro de datos. Mobile/tablet utilizan SVG/CSS; movimiento reducido
usa composición estática y elimina la fase sticky. WebGL fallido, importación
fallida o pérdida de contexto restablecen el fallback.

Presupuesto observado: 132 triángulos, 6 draw calls, DPR máximo 1.5. El renderer
se activa por cambios de scroll/puntero/viewport y detiene el dibujo en reposo,
con la página oculta o después de la retirada. La influencia del puntero es
inferior a 3 grados y utiliza interpolación. Al desmontar se liberan geometrías,
materiales, renderer, contexto, observadores y eventos propios.
Las variables de movimiento se actualizan en cada capa decorativa, sin invalidar
estilos heredados de todo el documento ni de las tarjetas.

Diagnóstico de lectura para QA en Home:
`window.drgHomeExperience.getDiagnostics()`.

## Verificación de esta iteración

- Chromium: 1440×900, 1920×1080, 1366×768, 834×1112, 390×844 y 360×740.
  Revisadas capturas del hero, marca, destacadas, categorías y buscador móvil.
  Sin desbordamiento horizontal; búsqueda dentro del hero en los seis tamaños.
- Datos reales: 32 tarjetas en las selecciones de Home; catálogo y mapa con
  28 propiedades públicas. Formularios de compra/alquiler, parámetros URL,
  presupuesto, carrusel, ordenar, paginación, compartir, menú y cierre/foco
  de paneles conservan su comportamiento. Galería y reseñas cargan en la ficha.
- El módulo Auth inicializa; no se ejecutan escrituras ni acciones autenticadas
  con cuentas de clientes, agentes o administradores.
- Mobile, movimiento reducido y equipo limitado no solicitan bundles pesados.
  Se prueban dependencia bloqueada, pérdida de contexto WebGL, DPR 3 limitado
  a 1.5, redimensionado, eliminación/recreación de la escena y ausencia en catálogo.
  El fallback estático conserva el titular y el enlace al catálogo sin JavaScript.
- 31/31 pruebas focalizadas correctas. Suite completa: 66/79, con los mismos
  13 fallos previos de expectativas antiguas; no hay fallos adicionales.
- Sin errores JavaScript no capturados en los recorridos comprobados. El fallo
  de Firebase muestra el estado de reintento existente.

La comprobación utiliza Chromium con renderizado software SwiftShader en un
contenedor compartido. Una pasada de scroll de 3.5 s registró 25 FPS de media,
17 ms de mediana entre cuadros y 133 ms de p95 después de limitar la invalidación
de estilos a las capas decorativas. Esa medición muestra pausas en este entorno;
no acredita 60 FPS ni sustituye pruebas con GPU física, Safari/iOS o Android
reales. La preview requiere esa revisión antes de una promoción a producción.
No se afirma un resultado Lighthouse.

## Entrega

Rama `codex/drg-premium-experience`, PR #341. Sólo Preview Deployment para revisión.
No fusionar con `main` ni promover a producción sin la aprobación posterior del usuario.
