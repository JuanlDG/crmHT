# HT-AP-03 — Nota de cambio v1.50 (17/10/2026)

> **Estado: en `staging`, sin promover a `main`.** Depende de la sincronización de OT con Mantenimiento (v1.41, v1.48).
> Documentación pendiente: hoja de actualización de HT-AP-03 y del manual HT-IN-05 en SharePoint, antes de promover.

## Sucursal del trabajo

Pedido de Luis Devoto (17-10-2026): clientes como Cencosud, Sodimac o Banco Santander tienen muchas sucursales; hay que
saber qué se cotiza y dónde, aunque no siempre se llene al cotizar.

### Decisión de diseño
La sucursal es un dato del **negocio/OT** (no de la empresa). **El catálogo de sucursales vive en Mantenimiento**
(nombre, dirección, ubicación en el mapa, salas y equipos); el CRM lo consulta por el RUT de la empresa y puede pedir
sucursales nuevas. No se duplica el catálogo en el CRM.

### Qué se hizo
- **Selector "Sucursal"** (opcional) al crear el negocio, en la ficha del negocio y en la pantalla de la OT. Lista las
  sucursales que el cliente ya tiene en Mantenimiento y permite **"+ Nueva sucursal"** (nombre y dirección opcional), que
  se crea allá. Si el cliente no tiene RUT o Mantenimiento no responde, se escribe el nombre a mano: queda como texto y
  Mantenimiento la crea al sincronizar la OT.
- **Se ve** en la tarjeta del pipeline, en la cotización (PDF, bajo la dirección del cliente, si está llena), en el
  detalle de la OT y en el calendario de Operaciones.
- **Alerta "Sin sucursal"** (no bloquea) en la tarjeta de los negocios de Operaciones en Aceptado o Programado.
- **Cambiar la sucursal** de un negocio que ya tiene OT la envía a Mantenimiento; allá la OT pasa a esa sucursal y se
  quitan la sala, el equipo y el componente (eran de la anterior). El cambio hecho en Mantenimiento ya llegaba al CRM.
- **Importación:** columna opcional `sucursal` en el importador de oportunidades.
- API: `GET /api/negocios/sucursales-sugeridas` acepta `empresa_id`; `POST /api/negocios/sucursales`
  `{ empresa_id, nombre, direccion? }`; `POST` y `PUT /api/negocios` aceptan `sucursal_nombre` y
  `mantenimiento_sucursal_id`.

### Pendiente
- Limpieza de empresas que llevan la sucursal en el nombre (ej. "Banco Santander (Suc. …)"): solo listado, sin modificar.
- La propuesta en Word (`wordPropuesta.js`) no incluye la sucursal todavía.

### Pruebas
CRM y Mantenimiento corriendo a la vez (Postgres y SQLite reales): crear sucursal nueva, listarla, negocio con sucursal →
OT en esa sucursal, cambio de sucursal que se refleja en Mantenimiento, importación con la columna, alerta, y el caso con
Mantenimiento caído (queda como texto). Pantallas revisadas en navegador.
