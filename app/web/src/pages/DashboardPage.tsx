import { Link } from 'react-router-dom';
import { useEventos } from '../features/eventos';
import { resumenZonas, useZonas } from '../features/zonas';
import { BadgeResultado } from '../components/Badge';

export function DashboardPage() {
  const { data: zonas } = useZonas();
  const { data: eventos } = useEventos({ page: 1 });
  const resumen = resumenZonas(zonas);

  return (
    <>
      <h1>Dashboard</h1>
      <div className="kpis">
        <div className="kpi">
          <div className="valor">{resumen.libres}</div>
          <div className="etiqueta">Zonas libres</div>
        </div>
        <div className="kpi">
          <div className="valor">{resumen.ocupadas}</div>
          <div className="etiqueta">Zonas ocupadas</div>
        </div>
        <div className="kpi">
          <div className="valor">{resumen.fueraServicio}</div>
          <div className="etiqueta">Fuera de servicio</div>
        </div>
        <div className="kpi">
          <div className="valor">{eventos?.total ?? '—'}</div>
          <div className="etiqueta">Eventos registrados</div>
        </div>
      </div>

      <div className="tarjeta">
        <div className="fila separada">
          <h2>Últimos eventos</h2>
          <Link to="/eventos">Ver historial completo →</Link>
        </div>
        {eventos && eventos.data.length > 0 ? (
          <table>
            <thead>
              <tr>
                <th>Hora</th>
                <th>Tipo</th>
                <th>Placa</th>
                <th>Socio</th>
                <th>Zona</th>
                <th>Resultado</th>
              </tr>
            </thead>
            <tbody>
              {eventos.data.slice(0, 8).map((e) => (
                <tr key={e.id}>
                  <td>{new Date(e.timestamp).toLocaleTimeString()}</td>
                  <td>{e.tipo}</td>
                  <td><strong>{e.placaDetectada}</strong></td>
                  <td>{e.vehiculo?.miembro?.nombre ?? '—'}</td>
                  <td>{e.zona?.codigo ?? '—'}</td>
                  <td><BadgeResultado resultado={e.resultado} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="vacio">Aún no hay eventos de acceso</div>
        )}
      </div>
    </>
  );
}
