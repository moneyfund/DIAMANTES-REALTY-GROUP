# DRG 2.0 preview deployment

La rama migration/drg-next reemplaza vercel.json únicamente dentro de la rama para que los Preview Deployments del proyecto actual construyan drg-next/package.json con @vercel/next.

main conserva su vercel.json original, aliases de producción y aplicación legacy.

La nueva app opera en modo readonly por defecto y no implementa escrituras.
