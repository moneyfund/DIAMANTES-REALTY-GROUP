# DRG 2.0 — límite de seguridad de datos

La nueva arquitectura separa tres conceptos:

- `disabled`: no inicializa Firebase;
- `readonly`: permite lectura pública mediante el repositorio, sin API de escritura;
- `staging` / `production`: reservados para fases posteriores donde sí existan mutaciones explícitas.

En esta etapa no existe ningún método de crear, editar o eliminar propiedades en DRG 2.0.

## Server-side

Las futuras páginas SEO de propiedades necesitarán lectura del lado servidor. Esa capa no debe usar claves privadas en variables `NEXT_PUBLIC_*`.
Se añadirá como un adaptador separado cuando migremos fichas individuales.
