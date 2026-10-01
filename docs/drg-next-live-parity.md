# DRG 2.0 — comprobación live de solo lectura

El script scripts/check-production-readonly.ts lee la configuración web pública desde el cliente legacy ya versionado y consulta exclusivamente la colección pública properties.

No autentica usuarios y no exporta ninguna mutación.

Mide conteos y cobertura de campos esenciales para comprobar paridad de lectura antes de migrar la interfaz.

Esta prueba NO crea, edita ni elimina datos.
