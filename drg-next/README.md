# DRG 2.0 — Migration Preview

Migración pública de Diamantes Realty Group a Next.js + React + TypeScript.

## Estado de esta fase

La rama `migration/drg-next` contiene una experiencia pública completa en modo seguro de solo lectura. La web legacy en `main` y el dominio de producción no se sustituyen ni se modifican desde esta rama.

### Stack

- Next.js 16
- React 19
- TypeScript
- Firebase modular SDK
- Leaflet
- Motion preparado para iteraciones visuales posteriores

### Rutas públicas migradas

- `/`
- `/propiedades`
- `/propiedad/[id]`
- `/mapa`
- `/nosotros`
- `/agentes`
- `/agente/[id]`
- `/educacion`
- `/quieres-vender`
- `/contacto`
- `/politicas-de-privacidad`
- `/condiciones-de-uso`
- `/licencia-de-operacion`

También existen redirecciones de compatibilidad para las rutas públicas legacy `.html`.

## Paridad de datos validada

El workflow de CI ejecuta una comprobación read-only contra Firestore de producción.

Última validación de esta fase:

- 28 propiedades fuente
- 28 propiedades públicas normalizadas
- 28/28 con título
- 28/28 con precio
- 28/28 con portada
- 28/28 con ubicación
- 28/28 con tipo
- 28/28 con operación
- 7 agentes activos
- 7/7 con nombre
- 7/7 con contacto
- 6/7 con foto

## Seguridad de migración

`DRG_DATA_MODE=readonly` permite lectura del catálogo y agentes para verificar paridad visual y funcional sin activar escrituras.

En esta fase:

- no se modifica Firestore desde la nueva aplicación;
- formularios públicos validan la UI pero no envían datos;
- comentarios y reseñas se leen, pero no se publican;
- paneles privados, autenticación administrativa y escrituras continúan en la aplicación legacy de producción;
- no se han movido secretos de servidor ni credenciales privadas al cliente.

## Validación automática

Cada push y actualización del PR ejecuta:

1. tests de normalización y compatibilidad;
2. prueba live read-only contra Firestore;
3. TypeScript;
4. build de producción de Next.js.

## Siguiente fase

La siguiente fase debe tratar autenticación y escrituras como un proyecto separado: migrar Google Auth, reglas/roles, formularios, creación/edición de propiedades, Storage, revisión editorial y dashboards. No debe habilitarse escritura en esta preview hasta completar ese bloque y su matriz de permisos.
