# HT-AP-03 — Nota de cambio v1.48 (15/10/2026)

> **Estado: solo en `staging`, sin promover.** Pull request desde el fork `JuanlDG/crmHT` (rama
> `feat/sincronizacion-ot-mantenimiento`). Va junto con la v0.38 de la app de Mantenimiento
> (`hidrotecnica-app`): una sola funciona a medias, las dos deben desplegarse.
> Contrato entre las dos aplicaciones: `docs/HT-DO-XX-Sincronizacion-OT-v3.md`.

## Orden de Trabajo idéntica y en tiempo real con Mantenimiento

### Pedido (Luis Devoto)
La información de la OT debe guardarse en el CRM y ser **idéntica** a la de Mantenimiento, **en tiempo real**. Si se
cambia en los dos lados, **el último cambio gana en todo**.

### Antes
El CRM solo avisaba a Mantenimiento cuando **creaba** la OT, y solo recibía de allá "programada" y "ejecutada"
(fecha). El resto de lo que pasa con la OT en Mantenimiento (técnico, hora, prioridad, avance, sala, equipo...) no
llegaba al CRM, ni lo que se editaba en el CRM llegaba a Mantenimiento.

### Qué cambia
1. **Cada cambio de la OT en el CRM se envía a Mantenimiento** (webhook firmado `ot_actualizada`, con la foto
   completa de la OT): mover la tarjeta de etapa, editar fechas/horas, materiales, observaciones y los datos
   compartidos. Si Mantenimiento está caído, queda en una cola (`mantenimiento_outbox`) y sale solo, con reintentos.
2. **Cada cambio en Mantenimiento llega al CRM** por `PUT /api/v1/mantenimiento/ordenes-trabajo/:negocioId` y mueve la
   etapa del negocio (Aceptado / Programado / Ejecutado) igual que el kanban. Una etapa posterior a Ejecutado
   (p. ej. Facturado) no retrocede.
3. **El último cambio gana**: cada OT guarda la hora de su último cambio (`sync_actualizado_en`); una foto más vieja
   se ignora (y se le devuelve la del CRM para que la adopte). Lo que llega de Mantenimiento no se le devuelve.
4. **Datos de Mantenimiento en la OT** (`ordenes_trabajo.mant_datos`, JSON): técnico, sala, equipo, componente,
   prioridad, hora de inicio, duración, avance, descripción. Se ven en la pantalla de la OT, sección **"Datos
   compartidos con Mantenimiento"**, con la insignia *Sincronizada* / *Pendiente de enviar*.
   - Se editan en el CRM: hora de inicio (jornada 09:00–17:30), duración, prioridad, avance, descripción y las
     fechas. El botón **Guardar y enviar a Mantenimiento** envía primero; si Mantenimiento lo rechaza (p. ej. una
     hora fuera de su jornada) **no se guarda** y se muestra el motivo. Las horas programadas de las OT de
     Mantenimiento son su duración, así que ese campo se edita ahí.
   - Solo lectura en el CRM: técnico, sala, equipo y componente (se asignan en Mantenimiento).
5. **Reconciliación**: `GET /api/v1/mantenimiento/ordenes-trabajo?actualizadas_desde=<ISO>` entrega las OT cambiadas;
   Mantenimiento la consulta cada 5 minutos como red de seguridad.
6. `GET /api/v1/mantenimiento/ordenes-trabajo/:negocioId` ahora devuelve la foto completa (con `actualizado_en` y el
   bloque `mantenimiento`), compatible con lo anterior.

### Base de datos (se crea sola al iniciar, `IF NOT EXISTS`)
`ordenes_trabajo.mant_datos` (JSONB), `.sync_actualizado_en` y `.mantenimiento_sincronizado_en` (TIMESTAMPTZ) y la
tabla `mantenimiento_outbox`. Las OT existentes quedan con la hora de cambio vacía (cualquier foto de Mantenimiento
las actualiza). No toca Cobranza ni nada de otros módulos.

### Variables de entorno (las mismas de la integración v1.41; ninguna nueva)
`MANTENIMIENTO_API_KEY_ENTRANTE`, `MANTENIMIENTO_WEBHOOK_URL`, `MANTENIMIENTO_WEBHOOK_SECRET`,
`MANTENIMIENTO_API_KEY_SALIENTE`, `MANTENIMIENTO_API_URL`. `MANTENIMIENTO_WEBHOOK_URL` debe apuntar al
ambiente correspondiente (staging con staging, producción con producción). Sin ella, la sincronización de salida
queda desactivada.

### Archivos
`backend/services/mantenimientoSync.js` (nuevo), `backend/routes/api_mantenimiento.js`,
`backend/routes/ordenes_trabajo.js` (`PUT /:id/mantenimiento`, estado de la cola), `backend/routes/negocios.js`
(`cambiarEtapaNegocio` avisa el cambio; opción `sinSync` para lo que viene de Mantenimiento),
`backend/services/ot.js`, `backend/services/mantenimientoOT.js`, `backend/db.js`, `backend/server.js` (hilo de la cola),
`frontend/src/pages/ventas/DetalleOT.jsx`.

### Cómo se probó
Los dos sistemas corriendo a la vez (CRM con Postgres real y Mantenimiento): OT creada en Mantenimiento → aparece en
el CRM en Programado con todos sus datos; edición en cada lado reflejada en el otro; hora fuera de jornada desde el
CRM → 422 y nada cambia; Ejecutado y Facturado desde el kanban; devolver a Aceptado desde Mantenimiento; foto vieja
ignorada; y la caída de cada sistema por separado (lo editado mientras el otro estaba caído llegó solo al volver).
El frontend compila y la pantalla de la OT se revisó en el navegador. Esta rama **no** se ha probado contra
datos reales.

### Pendiente
- Asignar técnico desde el CRM (hoy solo se asigna en Mantenimiento; haría falta consultar su lista).
- Promoción a `main`: solo con la orden explícita de Luis Devoto, después de probar en `staging` con Mantenimiento
  en staging; seguir el checklist de `CLAUDE.md`.
