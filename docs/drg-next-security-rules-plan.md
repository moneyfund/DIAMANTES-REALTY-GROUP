# Seguridad DRG 2.0 — estado de preparación

La auditoría read-only confirma que las 28 propiedades actuales tienen ownership fuerte:
- 28 con identificador de agente/propietario;
- 28 con email asociado;
- 0 dependientes solo del nombre;
- 0 sin correspondencia;
- 0 documentos con modelo legacy de publicación.

Esto permite diseñar reglas de propiedad sin depender de nombres editables.

Los archivos de `security/` siguen siendo propuestas. No existe workflow de deploy de reglas y no deben publicarse hasta:
1. validar Google Auth en Preview;
2. crear backup;
3. probar reglas en staging/emulador;
4. obtener aprobación explícita para modificar reglas reales.

`sharedPropertyLists` queda intencionalmente restringido a agentes/admin en esta propuesta. Antes de migrar enlaces públicos compartibles hay que diseñar una ruta segura basada en token que no permita enumerar listas activas.
