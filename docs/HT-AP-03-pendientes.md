# HT-AP-03 — Pendientes abiertos

Consolidado el 12-10-2026 a partir de las secciones "Pendientes" que estaban en
`CLAUDE.md` (el texto original está en `docs/HT-AP-03-historial-despliegues.md`).
Cada ítem indica su fecha de origen. **Los ítems no se verificaron de nuevo el
12-10-2026**: pueden estar resueltos o desactualizados.

## Operaciones y Ventas
- **Railway (12-10):** confirmar que el despliegue de `16775b5`/`19b1525` quede
  en Success.
- **v1.46 y v1.47 (09 y 10-10):** probar con WhatsApp real (fuera de ventana de
  24 h y botones; marcar como atendida) y documentar como instructivo en
  SharePoint.
- **Meta (09-10):** pasar las plantillas "Seguimiento" y "Vencimiento" a Utilidad.
- **Facturado desde Softland (08-10):** mover a Facturado con la llave negocio →
  NV (número y N° de OC) → factura. Falta verificar si la factura en Softland
  trae la referencia a la NV y cuántos negocios tienen NV u OC cargados.
- **OT (08-10, plan en curso):** leer Excel/informes de Fracttal para mover a
  Ejecutado.
- **OT al desplegar (01-10):** los 31 negocios en Programado y 24 en Ejecutado
  que ya existían no tienen OT (al moverlos se piden los datos); hacen falta
  usuarios con rol `tecnico` para asignar técnicos.
- **Arranque de Trabajos, Fase 2 (09-09, sin iniciar):** motor de checklist
  obligatorio configurable por etapa; N° de Contrato para servicios recurrentes;
  WhatsApp de Operaciones (número separado, sin dar de alta en Meta). Fuera de
  alcance por decisión del 09-09: integración con Compras y Despacho; firma
  digital de cliente (no evaluada).

## Cobranza y Mantenimiento
- **Cobranza:** sigue en `staging`, sin promover (módulo con desarrollo
  pendiente). Incluye correcciones de la auditoría 23-09 (conciliación
  transaccional, tope de redondeo). `staging` conserva su propio historial: al
  promover hay que repetir el procedimiento por archivo, no fusionar la rama.
- **Integración con Mantenimiento (v1.41):** en `staging`, sin promover.

## Conector MCP (30-09)
Repo `ldevoto-sys/crm-mcp-hidrotecnica`, Railway proyecto CRM-MCP.
- Fusionar la rama de despliegue a `main` del repo y apuntar ambos ambientes
  (Production y Staging) a `main`; hoy despliegan desde una rama provisional.
- Probar `crm_softland_documentos` con un rango que tenga datos (cotizaciones de
  julio; notas de venta y facturas de agosto-septiembre).
- Mensajes de WhatsApp: la primera página de agosto-septiembre partía el 31-08
  y no aparecían los ids 1 a 7; causa sin determinar, hay una consulta de
  diagnóstico de solo lectura sin ejecutar.
- Softland: la historia anterior a 2023-01-01 no está replicada; decidir si hace
  falta.
- Fase 2, sin iniciar: causa de pérdida "Otro" con comentario obligatorio,
  análisis de pérdidas sin respuesta y endpoint para enviar informes por correo
  (solo `@hidrotecnica.cl`, con tope y registro de envíos).
- Decisión pendiente: `GET /api/v1/whatsapp/conversaciones/:id/mensajes` devuelve
  el hilo de un contacto anonimizado si se conoce su id.
- Costos: el ambiente Staging del MCP tiene un Postgres con volumen que el
  conector no usa.

## Seguridad y configuración
- Rotar `BI_READONLY_PASSWORD` y la clave del rol `reportes_solo_lectura` (esta
  última quedó escrita en una conversación con Claude el 30-09). La API key de
  Cowork sigue siendo una sola para lectura y escritura.
- Configurar `TEAMS_WEBHOOK_URL` en Railway producción si se quiere el canal
  Teams en las alertas de WhatsApp (16-09; sin ella funciona solo por correo).
