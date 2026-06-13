# Auditoría de despliegue público — 2026-06-13

## URL auditada

- `https://moneyfund.github.io/DIAMANTES-REALTY-GROUP/`

## Hallazgos

1. La URL pública usa el path `/DIAMANTES-REALTY-GROUP/`, no `/INMO-NICARAGUA/`.
2. El HTML público consultado en `https://moneyfund.github.io/DIAMANTES-REALTY-GROUP/` coincide con el archivo raíz `index.html` del repositorio `moneyfund/DIAMANTES-REALTY-GROUP` en la rama `main`, según comparación con `https://raw.githubusercontent.com/moneyfund/DIAMANTES-REALTY-GROUP/main/index.html`.
3. En esta copia local no existe carpeta `docs/`; los archivos públicos están en la raíz del repositorio.
4. No se encontraron duplicados locales de los archivos críticos auditados: `index.html`, `propiedades.html`, `propiedad.html`, `css/styles.css`, `js/properties.js` ni `js/main.js`.
5. La terminal del entorno devolvió `CONNECT tunnel failed, response 403` al intentar consultar headers y la API pública de GitHub Pages con `curl`; por eso la verificación directa de headers/API desde terminal queda limitada por red del entorno.

## Archivos públicos críticos

La web pública debe cargar estos archivos desde `/DIAMANTES-REALTY-GROUP/`:

- `index.html`
- `css/styles.css`
- `js/properties.js`
- `js/main.js`
- `js/firebase-client.js`
- `js/public-property-filter.js`

## Prueba visible de deploy agregada

Se agregó un marcador oculto en `index.html`:

```html
<div id="deploy-test-public" style="display:none;">
  DEPLOY PUBLIC TEST 2026-06-13
</div>
```

Se agregó una variable de control en `css/styles.css`:

```css
:root {
  --deploy-test-public: "2026-06-13";
}
```

## Cache busting aplicado

Se versionaron los CSS y JS locales de las páginas públicas con `?v=20260613-public-fix` para forzar recarga en GitHub Pages y navegadores.

## Interpretación posterior al merge

- Si el marcador `deploy-test-public` aparece en el código fuente publicado, GitHub Pages está sirviendo este `index.html` y el problema restante era caché o assets sin versión.
- Si el marcador no aparece, GitHub Pages está apuntando a otra rama, carpeta o repositorio, y debe corregirse el source de GitHub Pages.
