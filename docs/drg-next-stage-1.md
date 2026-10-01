# Migración DRG 2.0 — Etapa 1

Rama: `migration/drg-next`

## Alcance

Esta etapa introduce una aplicación Next.js aislada en `drg-next/`. No modifica el HTML, CSS, JavaScript,
Firebase ni la configuración Vercel que hoy sirven `diamantesrealtygroup.com`.

## Decisiones

1. La producción legacy permanece intacta.
2. El rediseño experimental de `codex/drg-premium-experience` no se usa como base.
3. Firebase se migra al SDK modular mediante una única inicialización.
4. No hay funciones de escritura en la nueva capa de datos.
5. La conexión a datos inicia deshabilitada y se activa solo por variables de entorno.
6. Los assets originales se copian por referencia de blob a la carpeta pública de DRG 2.0.
7. La primera preview deberá desplegarse como un proyecto Vercel separado con Root Directory `drg-next`.

## Siguiente checkpoint

- instalar dependencias y ejecutar typecheck/build;
- crear staging Vercel separado;
- decidir Firebase staging;
- validar lectura real de propiedades;
- recién después comenzar la migración visual 1:1 del Hero, navbar, cards y catálogo.
