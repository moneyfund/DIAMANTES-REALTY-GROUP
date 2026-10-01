# DRG 2.0 — compatibilidad de datos públicos

La capa Next ya replica las reglas críticas del frontend legacy antes de conectar un entorno real:

- colección pública: `properties`;
- visibilidad: `visibility`, `publicationStatus`, `publicVisible`;
- alias de tipos de propiedad;
- alias de venta/alquiler;
- variantes históricas de precio, título, ubicación, dormitorios y baños;
- selección de portada e imágenes;
- normalización de estado.

La vista temporal `/propiedades` sólo sirve para validar paridad de lectura. No es un rediseño.

## Regla de seguridad

No existen exports de escritura en `src/lib/firebase/properties.ts`.
Mientras `NEXT_PUBLIC_DRG_DATA_MODE=disabled`, la aplicación tampoco inicializa Firebase.

Próximo paso: conectar un entorno de staging o, de forma temporal, producción en modo de lectura de aplicación
para comparar conteos y documentos sin realizar escrituras.
