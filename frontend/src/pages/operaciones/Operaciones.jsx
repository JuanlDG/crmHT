import { useSearchParams } from 'react-router-dom';
import Pipeline from '../ventas/Pipeline';
import CalendarioOperaciones from '../../components/CalendarioOperaciones';

const TABS = [['pipeline', 'Pipeline'], ['calendario', 'Calendario']];

// Sección Operaciones: el pipeline Operaciones (por defecto, el mes actual) y, en la otra pestaña, el calendario de OT.
export default function Operaciones() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get('tab') === 'calendario' ? 'calendario' : 'pipeline';
  return (
    <div className="h-full flex flex-col">
      <h1 className="text-2xl font-bold text-ht-navy mb-3 flex-shrink-0">Operaciones</h1>
      <div className="flex gap-6 border-b border-gray-200 mb-4 flex-shrink-0" role="tablist">
        {TABS.map(([k, label]) => (
          <button key={k} type="button" role="tab" aria-selected={tab === k}
            onClick={() => setSearchParams(k === 'pipeline' ? {} : { tab: k })}
            className={`pb-2 -mb-px border-b-2 text-sm ${tab === k ? 'border-ht-accent text-ht-navy font-medium' : 'border-transparent text-gray-500 hover:text-ht-navy'}`}>
            {label}
          </button>
        ))}
      </div>
      {tab === 'pipeline' ? <Pipeline pipelineNombre="Operaciones" /> : <CalendarioOperaciones />}
    </div>
  );
}
