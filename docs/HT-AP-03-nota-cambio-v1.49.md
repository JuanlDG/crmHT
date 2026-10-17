# HT-AP-03 — Nota de cambio v1.49 (17/10/2026)

> **Estado: en `staging`, sin promover a `main`.** Depende de la sincronización de OT con Mantenimiento
> (v1.41 y v1.48), que tampoco está en `main`.
> Documentación pendiente: hoja de actualización de HT-AP-03 y del manual HT-IN-05 en SharePoint, antes de promover.

## Sección Operaciones, calendario de OT y perfil Operaciones

Pedido de Luis Devoto (17-10-2026).

### Sección "Operaciones" (menú, debajo de Reportes)
- **Pestaña Pipeline:** el pipeline Operaciones, con el **mes actual por defecto**. Se ven las OT cuya fecha
  (programada, o de ejecución si ya se ejecutó) cae en el mes, **más las que todavía no tienen fecha** (por programar).
  "Ver todo" quita el filtro. El mes queda en la URL.
- **Pestaña Calendario:** vistas **día, semana y mes**, como en la app de Mantenimiento. Destaca en rojo los
  **técnicos activos sin trabajo** cada día (lunes a viernes, de hoy en adelante). Click en una OT la abre; en un día, lo
  muestra por horas (jornada 09:00–17:30). Es de solo lectura: se programa en la OT o en Mantenimiento.
- El técnico de cada OT sale de los técnicos asignados en el CRM o, si la gestiona Mantenimiento, del técnico que informa
  (se cruza por **correo** con los usuarios del CRM).
- Lo ven administrador, jefe comercial, gerencia y quien tenga el perfil Operaciones.
- `GET /api/ordenes-trabajo/calendario?desde=&hasta=` (sin montos). `GET /api/negocios` acepta `ot_desde` / `ot_hasta`.

### Perfil Operaciones
Casilla en Usuarios (`users.es_encargado_operaciones`), independiente del rol (igual que postventa y despacho): ve y
edita todas las OT y los negocios del pipeline Operaciones, con montos, y accede a la sección Operaciones. Un técnico con
el perfil ve las OT de todos los técnicos.

### Corrección de seguridad
Un usuario con rol **técnico** podía listar todos los negocios (con sus montos) por `GET /api/negocios` y su
exportación. Ahora recibe 403 (salvo que tenga el perfil Operaciones, y entonces solo ve el pipeline Operaciones).
Pendiente de decidir: el técnico sin perfil sigue pudiendo listar `empresas`, `contactos` y `productos`
(Servicio Técnico usa contactos y productos).

### Otros
- El botón **"Ver OT"** del pipeline muestra el número: "Ver OT 212".

### Archivos
`backend/db.js`, `middleware/auth.js`, `routes/auth.js`, `routes/users.js`, `routes/negocios.js`,
`routes/ordenes_trabajo.js`; frontend: `Operaciones.jsx`, `CalendarioOperaciones.jsx`, `utils/calendario.js`,
`Pipeline.jsx`, `Layout.jsx`, `App.jsx`, `Usuarios.jsx`, `MisTareas.jsx`, `MisOTs.jsx`, `DetalleOT.jsx`.

### Pruebas
Servidor real + Postgres, con usuarios de cada tipo: permisos del perfil (vendedor y técnico con y sin perfil),
filtro por mes (incluye las OT sin fecha y excluye las de otro mes), calendario con técnico cruzado por correo y
técnicos libres, 403 al técnico en negocios. Vistas día, semana y mes revisadas en navegador.
