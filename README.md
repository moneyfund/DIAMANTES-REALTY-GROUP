# Diamantes Realty Group

Sitio web inmobiliario profesional desarrollado con HTML, CSS y JavaScript vanilla.

## Estructura

- `index.html`
- `propiedades.html`
- `propiedad.html`
- `agentes.html`
- `agent.html`
- `agent-dashboard.html`
- `css/styles.css`
- `js/main.js`
- `js/properties.js`
- `js/agentes.js`
- `js/agent-public.js`
- `js/agent-dashboard.js`
- `js/firebase-client.js`
- `firestore.rules`

## Uso local

Abre `index.html` con un servidor estático para que la carga de Firebase funcione correctamente.

Ejemplo:

```bash
python3 -m http.server 8000
```

Luego visita `http://localhost:8000`.

## Multi-agente con Firebase

Se implementó un sistema multi-agente con Firestore:

- Colección `agents` (1 documento por agente con id = `uid`).
- Colección `properties` (cada propiedad incluye `agentId`, `agentName`, `status`, `images`, `video`, etc.).
- Dashboard de agente en `agent-dashboard.html` para:
  - editar su perfil,
  - agregar propiedades,
  - editar propiedades propias,
  - marcar propiedades como vendidas.
- Perfil público del agente en `agent.html?id=AGENT_UID`.
- Sitio público (`index.html`, `propiedades.html`, `propiedad.html`, `mapa.html`, `agentes.html`) leyendo datos desde Firestore.

## Reglas recomendadas de Firestore

Usa el archivo `firestore.rules` para asegurar que cada agente solo pueda escribir su perfil y sus propiedades.

Publicación sugerida:

```bash
firebase deploy --only firestore:rules
```

## Formato recomendado para imágenes

- Usa enlaces directos que terminen en `.jpg`, `.jpeg`, `.png` o `.webp`.
- Evita URLs de Facebook (`facebook.com`, `fbcdn.net`), porque suelen bloquear la carga directa de imágenes.

## Vista previa al compartir propiedades

Vercel sirve `/share/property/:propertyId` mediante `api/property-share.js`. La función consulta
el documento público directamente en la API REST de Firestore y devuelve Open Graph/Twitter Card
en el HTML inicial antes de dirigir al visitante a `propiedad.html?id=:propertyId`.

No necesita una credencial privada. Opcionalmente se pueden configurar estas variables en Vercel:

- `FIREBASE_PROJECT_ID`: reemplaza `inmo-nicaragua` si se despliega contra otro proyecto.
- `PUBLIC_SITE_ORIGIN`: fija el origen público canónico (por ejemplo,
  `https://www.diamantesrealtygroup.com`) en vez de inferirlo de la solicitud.

Firestore debe conservar lectura pública para las propiedades publicadas. La función vuelve a
validar `publicationStatus` y `publicVisible`, prioriza `coverImage`, `mainImage`, `featuredImage`,
`imageUrl` y luego las colecciones de imágenes; el logo del sitio se usa solo como respaldo.
- El frontend mantiene fallback automático para imágenes inválidas usando `assets/placeholder.svg`.


## Despliegue en Vercel

El proyecto incluye `vercel.json` para despliegue estático con URLs limpias y reescrituras de rutas públicas (`/propiedades`, `/propiedad`, `/agentes`, `/agente`, `/mapa`, `/admin`, etc.) hacia sus archivos HTML correspondientes.

Puntos importantes:

- `cleanUrls: true` permite usar rutas sin `.html`.
- `rewrites` evita errores 404 en páginas internas al refrescar.
- No se altera la integración con Firebase/Firestore: las variables y configuración se mantienen en `js/firebase-client.js` y `assets/js/firebase-config.js`.
