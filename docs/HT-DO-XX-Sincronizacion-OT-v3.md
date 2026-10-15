# Sincronización de Órdenes de Trabajo: Mantenimiento ↔ CRM (contrato v3)

Decisiones de Luis Devoto: la OT debe ser **idéntica** en las dos aplicaciones, **en tiempo real**, y ante un cambio
en ambos lados **el último cambio gana en todo**.

Este documento es el contrato entre las dos aplicaciones. Vive igual en los dos repositorios
(`hidrotecnica-app/docs/integracion-crm-sincronizacion.md` y `crmHT/docs/HT-DO-XX-Sincronizacion-OT-v3.md`).
Reemplaza la integración v2 (avisos de "programada" y "ejecutada"), que sigue funcionando por compatibilidad.

## 1. Principios

1. **Una OT = un negocio del CRM.** La clave común es `negocio_id` (el número de la OT es `OT-{negocio_id}`).
2. **Foto completa (snapshot).** Cada vez que una OT cambia en un lado, ese lado envía al otro una foto con los datos
   que modela. No se envían "diffs": el receptor adopta lo que viene (solo las claves presentes).
3. **El último cambio gana.** Cada foto trae `actualizado_en` (UTC, microsegundos). El receptor la aplica solo si es
   **más nueva** que la que él tiene; si es igual o más vieja la ignora y responde `aplicado: false` con **su** foto,
   para que el emisor la adopte. Al aplicar, guarda ese mismo `actualizado_en` como propio.
   Es "el último gana" sobre la OT completa: si dos personas editan campos distintos casi a la vez, queda la foto del
   último (decisión de Luis).
4. **Sin eco.** Lo que se aplica desde una foto recibida **no** se vuelve a enviar.
5. **Entrega confiable.** Cada lado tiene una cola de salida (outbox) en su base de datos, con reintentos con espera
   creciente. Se intenta enviar de inmediato (tiempo real); si el otro lado está caído, queda en cola y sale solo.
6. **Reconciliación.** Mantenimiento consulta al CRM cada 5 minutos las OT actualizadas desde su última consulta y
   aplica las más nuevas (red de seguridad ante avisos perdidos).
7. **Desde la pantalla de la OT del CRM, el cambio es síncrono**: el CRM primero envía la foto a Mantenimiento; si
   Mantenimiento la rechaza (422, por ejemplo una hora fuera de su jornada) el CRM **no guarda** el cambio y muestra
   el motivo. Si Mantenimiento no responde, el CRM guarda y deja el envío en cola.
   Los demás cambios del CRM (mover la tarjeta en el pipeline, editar fechas/ítems) se envían de forma asíncrona.
   Los cambios hechos en Mantenimiento ya están validados y también se envían de forma asíncrona.
8. **Primer envío.** Una OT que nace en Mantenimiento se registra con `POST /negocios` (devuelve el `negocio_id`) y
   enseguida se envía su foto; el CRM la acepta siempre (su hora de cambio queda vacía hasta entonces).
   Las OT que ya existían y nunca se sincronizaron (o las importadas por planilla) se envían solas en cola.

## 2. Autenticación

Sin cambios respecto de la integración existente (v2). Tres secretos, uno por sentido:

| Sentido | Mecanismo | Variable (CRM) | Variable (Mantenimiento) |
|---|---|---|---|
| Mantenimiento → CRM (`/api/v1/mantenimiento/*`) | `Authorization: Bearer` | `MANTENIMIENTO_API_KEY_ENTRANTE` | `CRM_API_KEY_SALIENTE` |
| CRM → Mantenimiento (webhook) | `X-Hidrotecnica-Signature: sha256=HMAC(cuerpo)` | `MANTENIMIENTO_WEBHOOK_SECRET` (y `MANTENIMIENTO_WEBHOOK_URL`) | `CRM_WEBHOOK_SECRET` |
| CRM → Mantenimiento (consultas) | `Authorization: Bearer` | `MANTENIMIENTO_API_KEY_SALIENTE` | `CRM_API_KEY_ENTRANTE` |

## 3. La foto (`ot`)

```jsonc
{
  "negocio_id": "123",                    // clave común (texto)
  "actualizado_en": "2026-10-15T14:03:22.123456Z",
  "origen_cambio": "mantenimiento",        // "crm" | "mantenimiento" (informativo)

  // ---- Lo que modela el CRM. La foto del CRM trae todo; la de Mantenimiento solo lo marcado ★ ----
  "numero": "OT-123",
  "negocio_titulo": "...",
  "tipo_trabajo": "mantenimiento_preventivo",
  "monto_estimado": 1500000,
  "etapa": "Programado",                  // ★ Mantenimiento la manda derivada de su estado
  "cliente": { "empresa": "...", "rut": "76.123.456-7", "email": "...", "direccion": "...", "comuna": "...", "contacto": "...", "telefono": "..." },
  "sucursal_nombre": "...",               // ★
  "observaciones": "...",                 // ★
  "fecha_programada": "2026-10-20",       // ★
  "fecha_ejecucion": null,                // ★
  "horas_programadas": 2,                 // ★ espejo de duracion_horas
  "horas_ejecutadas": null,
  "items": [ { "tipo": "material", "descripcion": "...", "cantidad": 2, "codigo": "..." } ],

  // ---- Lo que modela Mantenimiento: viaja en las dos direcciones ----
  "mantenimiento": {
    "referencia_externa": "57",            // id de la OT en Mantenimiento
    "estado": "programado",                // aceptado | programado | ejecutado
    "tipo_tarea": "...",
    "descripcion": "...",
    "prioridad": "alta",                   // alta | media | baja | null
    "clasificacion_1": null, "clasificacion_2": null,
    "sala": null, "equipo": null, "componente": null,
    "hora_inicio": "09:00",                // HH:MM | null (jornada 09:00–17:30, bloques de 1 h)
    "duracion_horas": 2,                   // solo viaja junto con hora_inicio
    "avance": 0,                           // 0–100
    "tecnico": { "email": "tec@hidrotecnica.cl", "nombre": "Pedro" }   // null = sin técnico
  }
}
```

El CRM **no interpreta** el bloque `mantenimiento` (lo guarda en `ordenes_trabajo.mant_datos`, JSON) salvo `estado`,
`hora_inicio` y `duracion_horas`. Una foto del CRM solo trae en `mantenimiento` las claves que ya recibió de
Mantenimiento más `estado`: así una OT que nació en el CRM no le borra a Mantenimiento datos que el CRM nunca tuvo.

Correspondencias entre campos:

| Mantenimiento | CRM |
|---|---|
| `estado` aceptado / programado / ejecutado | etapa del pipeline Operaciones "Aceptado" / "Programado" / "Ejecutado" |
| `duracion_horas` | `ordenes_trabajo.horas_programadas` |
| `fecha_programada`, `fecha_ejecucion`, `observaciones`, `sucursal_nombre` | mismas columnas |
| resto de `mantenimiento` | `ordenes_trabajo.mant_datos` (JSON) |

### Qué puede editar cada lado

| Dato | Se edita en | En el otro lado |
|---|---|---|
| Fecha programada y de ejecución, observaciones, hora de inicio, duración, prioridad, descripción, avance, estado | los dos | se refleja |
| Técnico, sala, equipo, componente, tipo de tarea, sucursal, clasificaciones | Mantenimiento | solo lectura en el CRM |
| Cliente, monto, materiales y herramientas | CRM | solo lectura en Mantenimiento |

### Reglas al aplicar una foto

* Una etapa del CRM **posterior** a "Ejecutado" (por ejemplo "Facturado") cuenta como ejecutada: una foto de
  Mantenimiento con `estado: ejecutado` **no** la hace retroceder.
* `estado: aceptado` (el administrador la devolvió a "Aceptado"): se limpian fecha, hora y duración (el técnico se conserva).
* `estado: programado` sin fecha se acepta tal cual (en el CRM se puede mover la tarjeta antes de tener la fecha; si no,
  rebotaría); la OT queda visible como programada sin fecha.
* `estado: ejecutado` sin `fecha_ejecucion` usa la fecha de hoy (hora de Chile) y deja el avance en 100.
* Una OT que el técnico cerró con su ficha **no** puede devolverse desde el CRM: Mantenimiento la mantiene ejecutada y
  responde `normalizado: true`; la foto corregida sale hacia el CRM con una hora más nueva.
* El técnico se identifica por **correo**. Un correo que Mantenimiento no conoce deja el técnico como estaba;
  `tecnico: null` lo quita.
* Hora de inicio entre 09:00 y 17:00 en punto, duración ≥ 1 h, término ≤ 18:00; duración sin hora, error. Si no cumple
  → **422** con `detail` y no se aplica nada.

## 4. Endpoints

### 4.1 Mantenimiento → CRM (Bearer `MANTENIMIENTO_API_KEY_ENTRANTE`)

| Método y ruta | Uso |
|---|---|
| `POST /api/v1/mantenimiento/negocios` | **Existente.** Registra una OT que nace en Mantenimiento; devuelve `negocio_id` (idempotente por `referencia_externa`). |
| `PUT /api/v1/mantenimiento/ordenes-trabajo/:negocioId` | **Nuevo.** Cuerpo `{ "ot": <foto> }`. Responde `200 { "aplicado": true, "actualizado_en": "..." }`, o `200 { "aplicado": false, "ot": <foto del CRM> }` si la del CRM es más nueva. 400 foto inválida, 404 no existe, 409 si falta la etapa en el pipeline. |
| `GET /api/v1/mantenimiento/ordenes-trabajo?actualizadas_desde=<ISO>` | **Nuevo.** Hasta 200 fotos de las OT que ya gestiona Mantenimiento, de la más antigua a la más nueva: `{ "ordenes": [...], "siguiente": "<ISO>", "hay_mas": bool }`. |
| `GET /api/v1/mantenimiento/ordenes-trabajo/:negocioId` | **Existente**; ahora devuelve la foto completa (con `actualizado_en` y `mantenimiento`). |
| `PATCH …/programacion` y `…/ejecucion` | **Existentes**, sin cambios; Mantenimiento ya no los usa (la foto los reemplaza). |

Límite del CRM: 60 solicitudes por minuto en total. Mantenimiento espacia sus envíos (≈ 40 por minuto) y, ante un 429,
espera 70 s.

### 4.2 CRM → Mantenimiento (firma HMAC)

| Método y ruta | Uso |
|---|---|
| `POST /integraciones/crm/ot` | **Existente.** Eventos `ot_creada` y **`ot_actualizada`** (nuevo), cuerpo `{ "evento": "...", "ot": <foto> }`. Responde `200 { "aplicado": bool, "normalizado": bool, "actualizado_en": "...", "ot": <foto de Mantenimiento si aplicado=false> }`; `422` con `detail` si la foto no cumple las reglas de Mantenimiento. |

Un aviso antiguo (sin `actualizado_en` ni `mantenimiento`) sigue admitiéndose: solo refresca los datos del CRM
(etapa, monto, materiales, observaciones).

## 5. Cola de salida (ambos lados)

Una fila por OT pendiente (si la OT vuelve a cambiar se reutiliza la misma fila: solo importa la última foto, que se
arma **al enviar**): `intentos`, `proximo_intento`, `ultimo_error`.

* Sin respuesta o 5xx: reintento con espera creciente de 15 s, 30 s, 1 min, 2 min, 5 min, 10 min y luego cada 15 min.
* 429: 70 s. Otro 4xx (dato inválido): se deja registrado en `ultimo_error` y se reintenta cada hora.
* Si la OT cambia mientras se está enviando, la fila se conserva y se vuelve a enviar con la foto nueva.
* En el CRM, la pantalla de la OT muestra "Sincronizada" o "Pendiente de enviar" (con el último error al pasar el cursor).
