# HT-AP-03 — Nota de cambio v1.43 (07/10/2026)

> **Estado: en producción desde el 08-10-2026** (rama `main`, commit `11dcc9a`), con la orden
> explícita de Luis Devoto.
> Documentación: hoja de actualización de HT-AP-03 (`docs/sharepoint/HTAP03_v1.43_hoja_de_actualizacion.docx`)
> y del manual HT-IN-05 v10 (`docs/sharepoint/HTIN05_v10_hoja_de_actualizacion.docx`), pendientes de publicar en SharePoint.

## Importador de oportunidades: técnicos por nombre, sin tildes y parcial

### Problema
La columna `tecnicos` exigía el correo o el nombre completo exacto, con
tildes (ej. "Matías Andres Rojas Villalobos"). Los nombres largos se
escribían mal y la fila se rechazaba.

### Regla nueva (`backend/utils/tecnicos.js`, usada por `routes/negocios.js`)
Se compara contra usuarios **activos con perfil técnico**, sin distinguir
mayúsculas, tildes ni espacios repetidos:

1. Correo o nombre completo → coincidencia exacta.
2. Si no hay exacta, nombre parcial de **2 o más palabras**: todas las palabras
   escritas deben ser palabras del nombre del usuario, en cualquier orden
   (`Raul Ibarra`, `Matias Rojas`, `Palma Elvis`).
   - Un solo usuario coincide → se asigna.
   - Más de uno → la fila se rechaza como **"técnico ambiguo"** (usar nombre
     completo o correo). No se asigna ninguno.
3. Una sola palabra (`Ibarra`, `Palma`) nunca se acepta por parcial.

Un parcial puede calzar con una palabra que no es el nombre de pila: `Luis
Lopez` calza con "Vicente **Luis** Lopez Barrera" si es el único. Ante duda,
usar nombre completo o correo.

Si el CSV usa `;` como separador, la lista de varios técnicos va entre
comillas: `"Matias Rojas;Raul Ibarra"`.

### Cómo se probó
Servidor real + Postgres, preview y confirmar con 7 filas: nombres sin tildes,
parcial único, parcial con orden distinto, dos técnicos en una celda, parcial
de una palabra (rechaza), nombre inexistente (rechaza), apellidos de dos
técnicos distintos (rechaza). Los asignados en `ot_tecnicos` coinciden con lo
esperado. El caso "ambiguo" se probó solo a nivel de la función
(`Luis Perez` entre `Luis Andres Perez` y `Luis Pablo Perez`), no por el endpoint.
No toca `db.js`: sin migración.
