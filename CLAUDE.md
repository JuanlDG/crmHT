# CRM Comercial HidroTecnica (HT-AP-03) — instrucciones del proyecto

Este archivo contiene solo las reglas vigentes. El historial de despliegues,
incidentes y decisiones está en `docs/HT-AP-03-historial-despliegues.md`; lo
que sigue abierto, en `docs/HT-AP-03-pendientes.md`. Las notas de cambio están
en `docs/HT-AP-03-nota-cambio-v*.md` y el procedimiento completo de
promoción en `docs/HT-AP-03-documento-consolidado.md` (§17).

## Despliegue a producción (vigente desde 12-10-2026)

Decisión de Luis Devoto.

- **A `main` (producción) se pasa solo con la orden explícita de Luis
  Devoto.** La decisión es suya, no de Claude. Aplica a cualquier cambio
  (mejora, feature, corrección de error, solo documentación) y a cualquier
  paso a producción (push, merge, cherry-pick).
- **Su orden basta.** No se pide confirmación adicional ni hay restricción de
  horario laboral ni de feriados.
- **Sin excepciones, ni por error crítico.** Si es urgente, Claude le avisa y
  espera su orden; no promueve por su cuenta.
- **`staging` es libre:** se puede subir ahí en cualquier momento, sin pedir
  autorización.
- **Cómo dar la orden:** el clasificador del modo auto de Claude Code ya
  bloqueó un push a `main` aun con el OK de Luis en el chat (10-10-2026). La
  orden debe nombrar qué se promueve (commits o rama) y el destino (`main`).
  Si se bloquea igual, Claude no lo esquiva por otra vía (por ejemplo, un merge
  desde GitHub): informa a Luis.

## Checklist antes de un push a `main`

Lecciones de las promociones del 23-09 (producción caída ~15 min) y 01-10
(build fallido):
1. `staging` tiene su propio historial: no fusionar la rama. Armar una rama
   desde `main` y traer solo lo que se promueve (cherry-pick o por archivo).
2. No dar por "limpio" un archivo solo porque su diff no toca Cobranza o
   Mantenimiento: revisar si depende en tiempo de ejecución de algo que se agrega
   en otro archivo (ej. una columna creada en `db.js`).
3. Revisar la lista de archivos del commit: `git diff --stat origin/main HEAD`
   y `git ls-files -s | grep ^120000` (no deben existir enlaces simbólicos). No
   usar `git add -A` en carpetas de prueba con enlaces.
4. Reproducir el build desde un clon limpio con el comando de `railway.json`.
5. Probar con el schema de `main` creado primero y el código a promover encima:
   servidor real + Postgres + token real, barrido de endpoints autenticados con
   los roles (sin ningún 500). Que corra la migración no basta.
6. Dar por buena la promoción solo con el estado **Success** del despliegue en
   Railway. Claude no lo ve desde aquí: pedirle a Luis que lo confirme. Una
   consulta al conector puede leer la versión anterior si el build falló.

## Estado de los módulos

- **Cobranza:** sigue en `staging`, excluida de toda promoción.
- **Integración con Mantenimiento (v1.41):** en `staging`, sin promover.
- No se promueven `middleware/auth.js`, `routes/auth.js`, `services/email.js` ni
  `Usuarios.jsx` mientras solo contengan cambios de Cobranza.

## Datos técnicos que conviene saber

- `initDb()` pasa a mayúsculas los nombres de contactos en cada arranque: un
  contacto anonimizado queda como `(ELIMINADO)`. Cualquier filtro debe comparar
  sin distinguir mayúsculas.
- El número comercial real de WhatsApp es +56 9 8106 2974 (producción). El
  +56 9 8109 8161 es el de pruebas y se reenvía a `staging`. En
  `config/whatsappCuentas.js` el objeto `VENTAS` conserva su nombre por herencia
  y corresponde a 8106-2974; es solo una etiqueta de log.
- Un número de WhatsApp por módulo (Operaciones, Cobranza): otra entrada en
  `whatsappCuentas.js` con su propio `ambito`.
- El conector MCP vive en otro repo (`ldevoto-sys/crm-mcp-hidrotecnica`). Las
  herramientas que escriben no llevan `readOnlyHint` a propósito; no aflojar su
  aprobación.
