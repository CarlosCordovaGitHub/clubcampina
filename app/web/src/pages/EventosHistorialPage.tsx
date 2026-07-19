import { useState } from 'react';
import { useEventos } from '../features/eventos';
import { BadgeResultado } from '../components/Badge';
import { Paginacion } from '../components/Paginacion';

export function EventosHistorialPage() {
  const [page, setPage] = useState(1);
  const [placa, setPlaca] = useState('');
  const [resultado, setResultado] = useState('');
  const [tipo, setTipo] = useState('');
  const { data, isLoading } = useEventos({ page, placa, resultado, tipo });

  return (
    <>
      <h1>Historial de accesos</h1>
      <div className="tarjeta">
        <div className="fila" style={{ marginBottom: '1rem' }}>
          <input
            placeholder="Buscar por placa…"
            value={placa}
            onChange={(e) => {
              setPlaca(e.target.value);
              setPage(1);
            }}
          />
          <select
            value={tipo}
            onChange={(e) => {
              setTipo(e.target.value);
              setPage(1);
            }}
          >
            <option value="">Todos los tipos</option>
            <option value="INGRESO">Ingreso</option>
            <option value="SALIDA">Salida</option>
          </select>
          <select
            value={resultado}
            onChange={(e) => {
              setResultado(e.target.value);
              setPage(1);
            }}
          >
            <option value="">Todos los resultados</option>
            <option value="AUTORIZADO">Autorizado</option>
            <option value="RECHAZADO">Rechazado</option>
            <option value="ALERTA">Alerta</option>
          </select>
        </div>

        {isLoading && <div className="vacio">Cargando…</div>}
        {data && data.data.length === 0 && (
          <div className="vacio">Sin eventos para los filtros elegidos</div>
        )}
        {data && data.data.length > 0 && (
          <>
            <table>
              <thead>
                <tr>
                  <th>Foto</th>
                  <th>Fecha y hora</th>
                  <th>Tipo</th>
                  <th>Placa</th>
                  <th>Confianza</th>
                  <th>Socio</th>
                  <th>Zona</th>
                  <th>Resultado</th>
                  <th>Motivo</th>
                </tr>
              </thead>
              <tbody>
                {data.data.map((e) => (
                  <tr key={e.id}>
                    <td>
                      {e.fotoUrl ? (
                        <a href={e.fotoUrl} target="_blank" rel="noreferrer">
                          <img className="miniatura" src={e.fotoUrl} alt="" />
                        </a>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td>{new Date(e.timestamp).toLocaleString()}</td>
                    <td>{e.tipo}</td>
                    <td><strong>{e.placaDetectada}</strong></td>
                    <td>
                      {e.confianzaOcr != null
                        ? `${(e.confianzaOcr * 100).toFixed(0)}%`
                        : '—'}
                    </td>
                    <td>
                      {e.vehiculo?.miembro?.nombre ??
                        (e.vehiculo?.visitante
                          ? `Visitante: ${e.vehiculo.visitante.nombre}`
                          : '—')}
                    </td>
                    <td>{e.zona?.codigo ?? '—'}</td>
                    <td><BadgeResultado resultado={e.resultado} /></td>
                    <td style={{ maxWidth: 240 }}>{e.motivo ?? ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Paginacion
              page={data.page}
              pageSize={data.pageSize}
              total={data.total}
              onPage={setPage}
            />
          </>
        )}
      </div>
    </>
  );
}
