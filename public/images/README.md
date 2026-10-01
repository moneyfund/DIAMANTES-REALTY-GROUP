# Imágenes originales pendientes

Este directorio queda preparado para que se suban posteriormente las fotografías y recursos originales, sin incluir binarios en este PR.

Nombres sugeridos:

- `amy-hero.png`
- `amy-about.png`
- `service-real-estate.png`
- `service-investments.png`
- `service-insurance.png`
- `property-01.jpg`
- `property-02.jpg`
- `property-03.jpg`
- `footer-amy.png`
- `logo-amy.png`

Cuando los archivos estén disponibles, reemplaza las URLs temporales HTTPS en `src/config/siteImages.js` por rutas locales, por ejemplo:

```js
heroPortrait: '/images/amy-hero.png'
```

No es necesario modificar los componentes si siguen consumiendo las claves centralizadas de `siteImages`.
