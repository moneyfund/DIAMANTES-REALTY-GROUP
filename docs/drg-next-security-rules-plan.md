# Propuesta de reglas DRG 2.0

Estos archivos son BORRADORES y NO se despliegan automáticamente.

- security/firestore.rules.proposed
- security/storage.rules.proposed

Objetivos:
- mantener lectura pública de propiedades aprobadas;
- permitir a agentes trabajar únicamente con propiedades que les pertenecen;
- reservar aprobación/rechazo y administración global para administradores;
- proteger documentos legales;
- permitir comentarios/reseñas autenticados por usuario;
- separar formularios públicos de su bandeja administrativa.

Antes de desplegar:
1. ejecutar auditoría de ownership;
2. corregir propiedades sin UID/email fuerte;
3. realizar backup Firestore + Storage;
4. validar login admin/agente desde staging;
5. probar reglas con emulador o proyecto de staging;
6. desplegar a producción únicamente tras aprobación explícita.
