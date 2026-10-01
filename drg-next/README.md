# DRG 2.0

Nueva arquitectura de Diamantes Realty Group.

## Objetivo de Etapa 1

Crear la base Next.js/React/TypeScript sin sustituir ni modificar la web legacy que sigue en producción.

### Stack

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS 4
- Motion
- Firebase modular SDK

### Seguridad

El modo de datos inicia en `disabled`. No existen operaciones de escritura en esta etapa.
La app vive dentro de `/drg-next` para que el proyecto Vercel actual y `diamantesrealtygroup.com`
continúen usando la aplicación HTML/CSS/JS existente.

## Desarrollo

```bash
cd drg-next
npm install
cp .env.example .env.local
npm run dev
```

No configurar Firebase de producción para pruebas de escritura. La siguiente decisión de infraestructura
es crear un proyecto Vercel de staging con Root Directory = `drg-next` y un Firebase de staging/read-only.
