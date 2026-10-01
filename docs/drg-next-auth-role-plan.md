# DRG 2.0 — Auth y roles

## Compatibilidad transitoria

La versión legacy autoriza administradores y agentes con allowlists de correo en el frontend. DRG 2.0 conserva esas listas temporalmente para evitar bloquear cuentas existentes, pero ya las encapsula detrás de un resolvedor de acceso.

Prioridad del rol:
1. admin legacy;
2. documento de agente por UID/email;
3. agente legacy;
4. cliente autenticado.

Esto NO sustituye reglas de Firestore/Storage. El gate React controla experiencia de interfaz, no constituye una frontera de seguridad.

## Estado actual

- Firebase Auth modular;
- Google provider;
- persistencia local;
- panel admin read-only;
- panel agente read-only;
- resolución compatible de perfiles en agents;
- escrituras continúan deshabilitadas.

## Próximo checkpoint antes de escrituras

1. configurar dominio de Preview como Authorized Domain en Firebase Auth;
2. iniciar sesión con una cuenta admin y una cuenta agente;
3. validar roles e inventario;
4. preparar/deployar reglas Firestore y Storage;
5. realizar backup previo;
6. activar mutaciones en staging de manera controlada.
