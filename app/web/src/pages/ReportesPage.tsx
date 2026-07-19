import { useState } from 'react';
import { descargarCsvEventos, useReportes } from '../features/reportes';

export function ReportesPage() {
  const [dias, setDias] = useState(7);
  const { data, isLoading } = useReportes(dias);
  const [descargando, setDescargando] = useState(false);

  const maxHora = Math.max(1, ...(data?.ocupacionPorHora.map((h) => h.ingresos) ?? []));
  const maxSocio = Math.max(1, ...(data?.frecuenciaSocios.map((s) => s.ingresos) ?? []));
  const horaPico = data?.ocupacionPorHora.reduce(
    (a, b) => (b.ingresos > a.ingresos ? b : a),
    { hora: 0, ingresos: 0 },
  );

  const exportar = async () => {
    setDescargando(true);
    try {
      await descargarCsvEventos({});
    } finally {
      setDescargando(false);
    }
  };

  return (
    <>
      <div className="fila separada">
        <h1>Reportes</h1>
        <div className="fila">
          <select value={dias} onChange={(e) => setDias(Number(e.target.value))}>
            <option value={1}>Último día</option>
            <option value={7}>Últimos 7 días</option>
            <option value={30}>Últimos 30 días</option>
            <option value={90}>Últimos 90 días</option>
          </select>
          <button className="secundario" onClick={exportar} disabled={descargando}>
            {descargando ? 'Exportando…' : 'Exportar historial CSV'}
          </button>
        </div>
      </div>

      {isLoading && !data && <div className="vacio">Cargando…</div>}

      {data && (
        <>
          <div className="kpis">
            <div className="kpi">
              <div className="valor">{data.totalIngresos}</div>
              <div className="etiqueta">Ingresos autorizados</div>
            </div>
            <div className="kpi">
              <div className="valor">{data.totalRechazados}</div>
              <div className="etiqueta">Rechazados</div>
            </div>
            <div className="kpi">
              <div className="valor">{data.totalAlertas}</div>
              <div className="etiqueta">Alertas</div>
            </div>
            <div className="kpi">
              <div className="valor">
                {horaPico && horaPico.ingresos > 0
                  ? `${String(horaPico.hora).padStart(2, '0')}:00`
                  : '—'}
              </div>
              <div className="etiqueta">Hora pico de ingresos</div>
            </div>
          </div>

          <div className="tarjeta">
            <h2>Ingresos autorizados por hora del día</h2>
            <div className="chart-columnas" role="img" aria-label="Ingresos por hora del día">
              {data.ocupacionPorHora.map((h) => (
                <div className="chart-col" key={h.hora}>
                  <div className="chart-col-area">
                    {h.ingresos > 0 && h.ingresos === horaPico?.ingresos && (
                      <span className="chart-valor">{h.ingresos}</span>
                    )}
                    <div
                      className="chart-barra"
                      style={{ height: `${(h.ingresos / maxHora) * 100}%` }}
                      title={`${String(h.hora).padStart(2, '0')}:00 — ${h.ingresos} ingreso${h.ingresos === 1 ? '' : 's'}`}
                    />
                  </div>
                  <span className="chart-etiqueta">
                    {h.hora % 3 === 0 ? String(h.hora).padStart(2, '0') : ''}
                  </span>
                </div>
              ))}
            </div>
            <details>
              <summary className="chart-tabla-toggle">Ver como tabla</summary>
              <table>
                <thead>
                  <tr><th>Hora</th><th>Ingresos</th></tr>
                </thead>
                <tbody>
                  {data.ocupacionPorHora
                    .filter((h) => h.ingresos > 0)
                    .map((h) => (
                      <tr key={h.hora}>
                        <td>{String(h.hora).padStart(2, '0')}:00</td>
                        <td>{h.ingresos}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </details>
          </div>

          <div className="tarjeta">
            <h2>Socios más frecuentes</h2>
            {data.frecuenciaSocios.length === 0 ? (
              <div className="vacio">Sin ingresos de socios en el período</div>
            ) : (
              <div className="chart-filas">
                {data.frecuenciaSocios.map((s) => (
                  <div className="chart-fila" key={s.miembroId}>
                    <span className="chart-fila-nombre">{s.nombre}</span>
                    <div className="chart-fila-area">
                      <div
                        className="chart-barra-h"
                        style={{ width: `${(s.ingresos / maxSocio) * 100}%` }}
                        title={`${s.nombre}: ${s.ingresos} ingreso${s.ingresos === 1 ? '' : 's'}`}
                      />
                      <span className="chart-fila-valor">{s.ingresos}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
}
