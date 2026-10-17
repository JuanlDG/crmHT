// Fechas del calendario de Operaciones. Todo en hora local: un día es el que ve el usuario.
// (Mismas reglas que el calendario de la app de Mantenimiento: jornada 09:00–17:30, lunes a viernes.)

export const DIAS_CORTOS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
export const DIAS_LARGOS = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];
export const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

export const HORA_INICIO_JORNADA = 9;
export const ULTIMA_HORA_DE_INICIO = 17;
export const HORAS = Array.from({ length: ULTIMA_HORA_DE_INICIO - HORA_INICIO_JORNADA + 1 }, (_, i) => HORA_INICIO_JORNADA + i);

const dos = n => String(n).padStart(2, '0');

export const etiquetaHora = h => `${dos(h)}:00`;
export const claveFecha = f => `${f.getFullYear()}-${dos(f.getMonth() + 1)}-${dos(f.getDate())}`;
export const fechaDesdeClave = c => { const [a, m, d] = c.split('-').map(Number); return new Date(a, m - 1, d); };
export const sumarDias = (f, n) => new Date(f.getFullYear(), f.getMonth(), f.getDate() + n);
// Se fija el día 1 para que 31 de enero + 1 mes no salte a marzo.
export const sumarMeses = (f, n) => new Date(f.getFullYear(), f.getMonth() + n, 1);
export const inicioSemana = f => sumarDias(f, -((f.getDay() + 6) % 7));
export const esDiaHabil = f => f.getDay() !== 0 && f.getDay() !== 6;

// Hora de inicio como número (9 para "09:00"), o null si la OT no tiene hora.
export const horaDe = ot => (ot.hora_inicio ? Number(ot.hora_inicio.slice(0, 2)) : null);

// Las OT sin hora, o con una hora fuera de la jornada, se muestran aparte en "Sin hora" para que no desaparezcan.
export const tieneHoraEnJornada = ot => { const h = horaDe(ot); return h !== null && HORAS.includes(h); };

export function textoHorario(ot) {
  const h = horaDe(ot);
  if (h === null) return null;
  return ot.duracion_horas ? `${etiquetaHora(h)} – ${etiquetaHora(h + ot.duracion_horas)} (${ot.duracion_horas} h)` : etiquetaHora(h);
}

export const nombresTecnicos = ot => (ot.tecnicos?.length ? ot.tecnicos.map(t => t.nombre).join(', ') : 'Sin técnico');

// Técnicos sin ningún trabajo ese día. Solo cuentan los días hábiles de hoy en adelante: un día pasado ya no se puede
// programar, y sábado y domingo no se consideran de trabajo.
export function tecnicosLibres(tecnicos, otsDelDia, fecha, hoy) {
  if (!esDiaHabil(fecha) || claveFecha(fecha) < claveFecha(hoy)) return [];
  const ocupados = new Set(otsDelDia.flatMap(ot => (ot.tecnicos || []).map(t => t.id)).filter(id => id != null));
  return tecnicos.filter(t => !ocupados.has(t.id));
}

export function rangoDeVista(vista, fecha) {
  if (vista === 'dia') return [claveFecha(fecha), claveFecha(fecha)];
  if (vista === 'semana') { const l = inicioSemana(fecha); return [claveFecha(l), claveFecha(sumarDias(l, 6))]; }
  return [claveFecha(new Date(fecha.getFullYear(), fecha.getMonth(), 1)), claveFecha(new Date(fecha.getFullYear(), fecha.getMonth() + 1, 0))];
}

export function tituloDeVista(vista, fecha) {
  if (vista === 'dia') {
    const d = DIAS_LARGOS[(fecha.getDay() + 6) % 7];
    return `${d[0].toUpperCase()}${d.slice(1)} ${fecha.getDate()} de ${MESES[fecha.getMonth()].toLowerCase()} de ${fecha.getFullYear()}`;
  }
  if (vista === 'semana') {
    const l = inicioSemana(fecha); const dom = sumarDias(l, 6);
    const mes = d => MESES[d.getMonth()].slice(0, 3).toLowerCase();
    return `${l.getDate()} ${mes(l)} – ${dom.getDate()} ${mes(dom)} ${dom.getFullYear()}`;
  }
  return `${MESES[fecha.getMonth()]} ${fecha.getFullYear()}`;
}
