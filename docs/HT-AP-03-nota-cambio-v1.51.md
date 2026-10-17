# HT-AP-03 — Nota de cambio v1.51 (17/10/2026)

> **Estado: en `staging`, sin promover a `main`.** Depende de v1.34–v1.50 (Operaciones y sincronización con Mantenimiento).
> Documentación pendiente: hoja de actualización de HT-AP-03 y del manual HT-IN-05 en SharePoint, antes de promover.

## Pipeline de Operaciones: ejecución y facturación por separado

Pedido de Luis Devoto (17-10-2026): según el cliente, pasan meses entre ejecutar un trabajo y facturarlo; hay que verlos
por separado y poder filtrar por fecha de ejecución y por fecha de facturación.

### Fecha de facturación (opcional)
- Campo nuevo `negocios.fecha_facturacion` (fecha). Se indica al **mover el negocio a Facturado** (ventana opcional, por
  defecto hoy), en la ficha del negocio (visible desde Ejecutado) y en la actualización masiva (columna
  `fecha_facturacion`; la exportación de negocios también la trae).
- Si falta, los filtros usan la **fecha de cierre** y, en último caso, el día en que el negocio entró a la etapa.
  No hay integración con Softland para esto (la factura de Softland no trae el vínculo con el negocio).

### Filtros (pestaña Pipeline de Operaciones)
| Filtro | Qué hace |
|---|---|
| **Mes** (ejecución) | La fecha del trabajo: programada si aún no se ejecuta, real si ya se ejecutó. Por defecto, el mes actual. Incluye las OT sin fecha. |
| **Facturación** | Solo los negocios ya facturados (Facturado o Ganado) con su fecha en ese mes. Al elegirla se quita el filtro de mes de ejecución. |
| **Por facturar** | Todo lo ejecutado y sin facturar, de cualquier mes. |
| **Facturados del mes** | Atajo: Facturación = mes actual. |

La columna **Ejecutado se muestra siempre completa** con el filtro de mes (es lo que está por facturar).

### Tarjetas
- Aceptado / Programado: "Programado para dd-mm-aa".
- Ejecutado: "Ejecutado dd-mm-aa" y **"hace N días sin facturar"**: gris, ámbar desde 30 días, rojo desde 60.
- Facturado / Ganado: "Ejecutado … · Facturado … (N d)" con los días entre ambas.

### API
`GET /api/negocios` acepta `fact_desde`, `fact_hasta` y `por_facturar=1`, y devuelve `fecha_facturacion`,
`fecha_facturacion_efectiva`, `fecha_programada` y `fecha_ejecucion`. `PUT /api/negocios/:id` y
`PUT /api/negocios/:id/etapa` aceptan `fecha_facturacion` (AAAA-MM-DD; vacío la borra en el PUT; un movimiento de etapa sin
la fecha no borra la que había).

### Pruebas
Servidor y Postgres reales: ejecutado de julio visible con el filtro de octubre, facturado en octubre / septiembre en su
filtro, "Por facturar", fecha indicada al mover, fecha inválida rechazada, borrado, y exportación con la columna.
Pantalla revisada en navegador.
