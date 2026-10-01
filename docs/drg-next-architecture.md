# DRG 2.0 — arquitectura de transición

## Regla principal

El frontend nuevo no conoce directamente detalles de Firestore. Los componentes consumen repositorios y la implementación concreta puede cambiar sin reescribir la UI.

```text
React components
      ↓
PropertyRepository
      ↓
FirestorePropertyRepository | DisabledPropertyRepository
      ↓
Firebase modular SDK
```

Esto permite mantener producción intacta, usar staging posteriormente y probar la compatibilidad de datos sin acoplar el diseño a Firebase.

## Estado actual

- lectura pública: interfaz preparada;
- lectura por ID: interfaz preparada;
- escritura: no implementada;
- Auth/admin: todavía no migrados;
- tests: cubren reglas legacy críticas de publicación, aliases, precios e imágenes.
