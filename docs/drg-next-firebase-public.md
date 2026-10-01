# Firebase público en DRG 2.0

La configuración web pública de Firebase se deriva de la misma configuración que ya usa el frontend legacy.

No contiene credenciales administrativas ni service-account keys.

Reglas:
- el modo de datos continúa en disabled por defecto;
- staging se despliega con NEXT_PUBLIC_DRG_DATA_MODE=readonly;
- la capa nueva no implementa escrituras;
- cualquier futura mutación deberá pasar por una fase separada de staging y autorización.
