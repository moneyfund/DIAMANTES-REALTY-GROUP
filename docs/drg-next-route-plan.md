# DRG 2.0 — plan de rutas públicas

La nueva aplicación reserva desde temprano las rutas públicas para evitar cambiar enlaces repetidamente durante la migración.

| Legacy | Next |
| --- | --- |
| `index.html` | `/` |
| `propiedades.html` | `/propiedades` |
| `propiedad.html?id=ID` | `/propiedad/ID` |
| `mapa.html` | `/mapa` |
| `agentes.html` | `/agentes` |
| `nosotros.html` | `/nosotros` |
| `educacion.html` | `/educacion` |
| `quieres-vender.html` | `/quieres-vender` |
| `contacto.html` | `/contacto` |

`/propiedad?id=ID` se conserva como ruta de compatibilidad y redirige a `/propiedad/ID`.

Estas rutas todavía no sustituyen las páginas legacy en producción.
