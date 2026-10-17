import { useEffect, useState } from 'react';
import api from '../api';

// Sucursal del trabajo. El catálogo vive en Mantenimiento: se lista lo que ese cliente ya tiene allá (por el RUT de la
// empresa) y se puede crear una nueva. Si no hay empresa con RUT, o Mantenimiento no responde, se escribe el nombre a
// mano: el negocio lo guarda como texto y Mantenimiento crea la sucursal al sincronizar la OT.
// value: { nombre, id } — onChange recibe lo mismo.
const NUEVA = '__nueva__';
const clase = 'w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ht-accent disabled:bg-gray-50';

export default function SelectorSucursal({ empresaId, value, onChange, disabled = false }) {
  const [lista, setLista] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [creando, setCreando] = useState(false);
  const [nombreNueva, setNombreNueva] = useState('');
  const [direccionNueva, setDireccionNueva] = useState('');
  const [error, setError] = useState('');
  const [aviso, setAviso] = useState('');

  useEffect(() => {
    setLista([]); setCreando(false); setError(''); setAviso('');
    if (!empresaId) return;
    let cancelado = false;
    setCargando(true);
    api.get('/negocios/sucursales-sugeridas', { params: { empresa_id: empresaId } })
      .then(r => !cancelado && setLista(Array.isArray(r.data) ? r.data : []))
      .catch(() => {})
      .finally(() => !cancelado && setCargando(false));
    return () => { cancelado = true; };
  }, [empresaId]);

  const nombre = value?.nombre || '';
  const enLista = lista.some(s => s.nombre === nombre);

  const crear = async () => {
    setError(''); setAviso('');
    if (!nombreNueva.trim()) { setError('Escribe el nombre de la sucursal.'); return; }
    try {
      const { data } = await api.post('/negocios/sucursales', { empresa_id: empresaId, nombre: nombreNueva, direccion: direccionNueva || null });
      if (data.id) setLista(l => (l.some(s => s.id === data.id) ? l : [...l, { id: data.id, nombre: data.nombre, direccion: data.direccion }]));
      else setAviso('Mantenimiento no respondió: la sucursal quedará como texto y se creará allá al sincronizar la OT.');
      onChange({ nombre: data.nombre, id: data.id || null });
      setCreando(false); setNombreNueva(''); setDireccionNueva('');
    } catch (err) { setError(err.response?.data?.error || 'No se pudo crear la sucursal.'); }
  };

  // Sin lista (sin empresa/RUT o Mantenimiento no responde): texto libre.
  if (!cargando && lista.length === 0 && !creando) {
    return (
      <div>
        <input value={nombre} disabled={disabled} onChange={e => onChange({ nombre: e.target.value, id: null })}
          placeholder={empresaId ? 'Nombre de la sucursal (opcional)' : 'Sucursal (opcional)'} className={clase} />
        {empresaId && !disabled && (
          <button type="button" onClick={() => setCreando(true)} className="text-xs text-ht-accent hover:underline mt-1">+ Nueva sucursal con dirección</button>
        )}
        {aviso && <p className="text-xs text-gray-500 mt-1">{aviso}</p>}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {!creando && (
        <select value={enLista ? nombre : (nombre ? '__texto__' : '')} disabled={disabled || cargando}
          onChange={e => {
            const v = e.target.value;
            if (v === NUEVA) { setCreando(true); return; }
            const s = lista.find(x => x.nombre === v);
            onChange({ nombre: v, id: s ? s.id : null });
          }} className={clase}>
          <option value="">{cargando ? 'Cargando sucursales…' : '— Sin sucursal —'}</option>
          {lista.map(s => <option key={s.id} value={s.nombre}>{s.nombre}{s.direccion ? ` · ${s.direccion}` : ''}</option>)}
          {nombre && !enLista && <option value="__texto__">{nombre} (aún no creada)</option>}
          {!disabled && <option value={NUEVA}>+ Nueva sucursal…</option>}
        </select>
      )}
      {creando && (
        <div className="border border-gray-200 rounded p-3 space-y-2 bg-gray-50">
          <input value={nombreNueva} onChange={e => setNombreNueva(e.target.value)} placeholder="Nombre de la sucursal" className={clase} />
          <input value={direccionNueva} onChange={e => setDireccionNueva(e.target.value)} placeholder="Dirección (opcional)" className={clase} />
          <div className="flex gap-2">
            <button type="button" onClick={crear} className="bg-ht-accent text-ht-navy px-3 py-1.5 rounded text-sm hover:bg-ht-accent/90">Crear sucursal</button>
            <button type="button" onClick={() => { setCreando(false); setError(''); }} className="px-3 py-1.5 rounded text-sm border border-gray-300">Cancelar</button>
          </div>
        </div>
      )}
      {error && <p className="text-xs text-red-600">{error}</p>}
      {aviso && <p className="text-xs text-gray-500">{aviso}</p>}
    </div>
  );
}
