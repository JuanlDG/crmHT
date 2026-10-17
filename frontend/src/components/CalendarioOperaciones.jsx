import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import {
  DIAS_CORTOS, HORAS, claveFecha, etiquetaHora, horaDe, inicioSemana, nombresTecnicos,
  rangoDeVista, sumarDias, sumarMeses, tecnicosLibres, textoHorario, tieneHoraEnJornada, tituloDeVista,
} from '../utils/calendario';

const VISTAS = [['dia', 'Día'], ['semana', 'Semana'], ['mes', 'Mes']];
const textoLibres = n => `${n} ${n === 1 ? 'técnico libre' : 'técnicos libres'}`;
const claseChip = ot => (ot.etapa?.toLowerCase() === 'aceptado' ? 'bg-gray-100 text-gray-600' : 'bg-ht-accent/15 text-ht-navy');

function ChipOT({ ot, onAbrir, detalle = false }) {
  return (
    <button type="button" onClick={e => { e.stopPropagation(); onAbrir(ot); }}
      className={`block w-full text-left rounded px-1.5 py-0.5 text-[11px] ${claseChip(ot)} hover:ring-1 hover:ring-ht-accent`}
      title={`${ot.ot} · ${ot.cliente || ''} · ${nombresTecnicos(ot)}`}>
      <span className="font-medium">{ot.ot}</span> {ot.cliente || ot.titulo}
      {detalle && <span className="block text-gray-600">{[textoHorario(ot), nombresTecnicos(ot)].filter(Boolean).join(' · ')}</span>}
    </button>
  );
}

function Libres({ tecnicos }) {
  if (!tecnicos.length) return null;
  return (
    <span className="inline-block rounded bg-red-100 text-red-700 px-1.5 py-0.5 text-[11px] font-medium"
      title={tecnicos.map(t => t.nombre).join(', ')}>{textoLibres(tecnicos.length)}</span>
  );
}

export default function CalendarioOperaciones() {
  const navigate = useNavigate();
  const hoy = useMemo(() => new Date(), []);
  const hoyKey = claveFecha(hoy);
  const [vista, setVista] = useState('mes');
  const [fechaVista, setFechaVista] = useState(hoy);
  const [datos, setDatos] = useState({ ots: [], tecnicos: [] });
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(true);
  const [desde, hasta] = rangoDeVista(vista, fechaVista);

  useEffect(() => {
    let cancelado = false;
    setCargando(true); setError('');
    api.get('/ordenes-trabajo/calendario', { params: { desde, hasta } })
      .then(r => !cancelado && setDatos(r.data))
      .catch(err => !cancelado && setError(err.response?.data?.error || 'No se pudo cargar el calendario.'))
      .finally(() => !cancelado && setCargando(false));
    return () => { cancelado = true; };
  }, [desde, hasta]);

  const otsPorDia = useMemo(() => {
    const m = {};
    datos.ots.forEach(ot => { (m[ot.fecha] ||= []).push(ot); });
    return m;
  }, [datos.ots]);
  const otsDe = f => otsPorDia[claveFecha(f)] || [];
  const libresDe = f => tecnicosLibres(datos.tecnicos, otsDe(f), f, hoy);
  const abrir = ot => navigate(`/negocios/${ot.negocio_id}/ot`);
  const irADia = f => { setFechaVista(f); setVista('dia'); };
  const mover = n => setFechaVista(f => (vista === 'mes' ? sumarMeses(f, n) : sumarDias(f, n * (vista === 'semana' ? 7 : 1))));

  return (
    <div>
      <div className="flex items-center justify-between mb-3 flex-wrap gap-3">
        <div className="flex rounded border border-gray-300 overflow-hidden text-sm" role="group" aria-label="Vista">
          {VISTAS.map(([k, label]) => (
            <button key={k} type="button" onClick={() => setVista(k)} aria-pressed={vista === k}
              className={`px-3 py-1.5 ${vista === k ? 'bg-ht-navy text-white' : 'bg-white text-ht-navy'}`}>{label}</button>
          ))}
        </div>
        <div className="flex items-center gap-2 text-sm">
          <button type="button" onClick={() => mover(-1)} aria-label="Anterior" className="px-3 py-1.5 rounded border border-gray-300">‹</button>
          <span className="font-medium text-ht-navy min-w-40 text-center">{tituloDeVista(vista, fechaVista)}</span>
          <button type="button" onClick={() => mover(1)} aria-label="Siguiente" className="px-3 py-1.5 rounded border border-gray-300">›</button>
          <button type="button" onClick={() => setFechaVista(hoy)} className="px-3 py-1.5 rounded border border-gray-300">Hoy</button>
        </div>
      </div>
      <p className="text-xs text-gray-500 mb-3">
        En rojo, los técnicos activos sin trabajo ese día (lunes a viernes, de hoy en adelante). Click en una OT para abrirla; en un día, para verlo por horas.
      </p>
      {error && <div className="mb-3 p-3 bg-red-50 border border-red-200 text-red-700 rounded text-sm">{error}</div>}
      {cargando && <p className="text-sm text-gray-400 mb-2">Cargando…</p>}

      {vista === 'mes' && <VistaMes fechaVista={fechaVista} hoyKey={hoyKey} otsDe={otsDe} libresDe={libresDe} abrir={abrir} irADia={irADia} />}
      {vista === 'semana' && <VistaSemana fechaVista={fechaVista} hoyKey={hoyKey} otsDe={otsDe} libresDe={libresDe} abrir={abrir} irADia={irADia} />}
      {vista === 'dia' && <VistaDia fecha={fechaVista} ots={otsDe(fechaVista)} libres={libresDe(fechaVista)} abrir={abrir} />}
    </div>
  );
}

function VistaMes({ fechaVista, hoyKey, otsDe, libresDe, abrir, irADia }) {
  const primero = new Date(fechaVista.getFullYear(), fechaVista.getMonth(), 1);
  const inicio = inicioSemana(primero);
  const ultimo = new Date(fechaVista.getFullYear(), fechaVista.getMonth() + 1, 0);
  const semanas = Math.ceil(((ultimo - inicio) / 86400000 + 1) / 7);
  const dias = Array.from({ length: semanas * 7 }, (_, i) => sumarDias(inicio, i));
  return (
    <div className="grid grid-cols-7 border-l border-t border-gray-200 bg-white text-sm">
      {DIAS_CORTOS.map(d => <div key={d} className="border-r border-b border-gray-200 px-2 py-1 text-xs font-medium text-gray-600 bg-gray-50">{d}</div>)}
      {dias.map(f => {
        const k = claveFecha(f); const ots = otsDe(f); const enMes = f.getMonth() === fechaVista.getMonth();
        return (
          <div key={k} onClick={() => irADia(f)} role="button" tabIndex={0} onKeyDown={e => e.key === 'Enter' && irADia(f)}
            className={`border-r border-b border-gray-200 min-h-24 p-1 cursor-pointer hover:bg-ht-accent/5 ${enMes ? '' : 'bg-gray-50 text-gray-400'}`}>
            <div className={`text-xs mb-1 ${k === hoyKey ? 'inline-block rounded-full bg-ht-navy text-white px-1.5' : ''}`}>{f.getDate()}</div>
            <div className="space-y-0.5">
              {ots.slice(0, 3).map(ot => <ChipOT key={ot.ot} ot={ot} onAbrir={abrir} />)}
              {ots.length > 3 && <div className="text-[11px] text-gray-500">+{ots.length - 3} más</div>}
              {enMes && <Libres tecnicos={libresDe(f)} />}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function VistaSemana({ fechaVista, hoyKey, otsDe, libresDe, abrir, irADia }) {
  const lunes = inicioSemana(fechaVista);
  return (
    <div className="grid grid-cols-1 md:grid-cols-7 gap-2">
      {Array.from({ length: 7 }, (_, i) => sumarDias(lunes, i)).map(f => {
        const k = claveFecha(f); const ots = otsDe(f);
        return (
          <div key={k} className={`rounded border bg-white p-2 ${k === hoyKey ? 'border-ht-navy' : 'border-gray-200'}`}>
            <button type="button" onClick={() => irADia(f)} className="text-xs font-medium text-ht-navy mb-1 hover:underline">
              {DIAS_CORTOS[i0(f)]} {f.getDate()}
            </button>
            <div className="space-y-1">
              {ots.map(ot => <ChipOT key={ot.ot} ot={ot} onAbrir={abrir} detalle />)}
              {!ots.length && <div className="text-[11px] text-gray-400">Sin OT</div>}
              <Libres tecnicos={libresDe(f)} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
const i0 = f => (f.getDay() + 6) % 7;

function VistaDia({ fecha, ots, libres, abrir }) {
  const sinHora = ots.filter(ot => !tieneHoraEnJornada(ot));
  return (
    <div className="bg-white border border-gray-200 rounded">
      {libres.length > 0 && (
        <div className="px-3 py-2 bg-red-50 border-b border-red-200 text-sm text-red-700">
          <span className="font-medium">{textoLibres(libres.length)}:</span> {libres.map(t => t.nombre).join(', ')}
        </div>
      )}
      <ul>
        {HORAS.map(h => {
          const delBloque = ots.filter(ot => horaDe(ot) === h);
          return (
            <li key={h} className="flex border-b border-gray-100 last:border-0">
              <div className="w-16 shrink-0 px-2 py-2 text-xs text-gray-500">{etiquetaHora(h)}</div>
              <div className="flex-1 py-1 pr-2 space-y-1">
                {delBloque.map(ot => <ChipOT key={ot.ot} ot={ot} onAbrir={abrir} detalle />)}
              </div>
            </li>
          );
        })}
        <li className="flex">
          <div className="w-16 shrink-0 px-2 py-2 text-xs text-gray-500">Sin hora</div>
          <div className="flex-1 py-1 pr-2 space-y-1">
            {sinHora.map(ot => <ChipOT key={ot.ot} ot={ot} onAbrir={abrir} detalle />)}
            {!sinHora.length && <span className="text-[11px] text-gray-400">—</span>}
          </div>
        </li>
      </ul>
      {!ots.length && <p className="px-3 py-2 text-sm text-gray-400">No hay OT este día ({claveFecha(fecha)}).</p>}
    </div>
  );
}
