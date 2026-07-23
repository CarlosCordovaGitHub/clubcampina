import { useState } from 'react';
import { Search, UserPlus } from 'lucide-react';
import { TipoVehiculo } from '@club-campina/shared-types';
import { useVisitantes, useVisitantesMutations } from '../features/visitantes';
import { BadgeSimple } from '../components/Badge';
import { Paginacion } from '../components/Paginacion';
import { PageHeader } from '../components/PageHeader';

export function VisitantesPage() {
  const [page, setPage] = useState(1);
  const [buscar, setBuscar] = useState('');
  const { data, isLoading } = useVisitantes({ page, buscar });
  const { crear, desactivar } = useVisitantesMutations();

  const [nombre, setNombre] = useState('');
  const [documento, setDocumento] = useState('');
  const [placa, setPlaca] = useState('');
  const [telefono, setTelefono] = useState('');
  const [tipo, setTipo] = useState<TipoVehiculo>(TipoVehiculo.AUTOMOVIL);
  const [horas, setHoras] = useState(4);
  const [error, setError] = useState('');

  const crearVisitante = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await crear.mutateAsync({
        nombre,
        documento,
        placa,
        telefono: telefono || undefined,
        tipoVehiculo: tipo,
        tiempoMaxHoras: horas,
      });
      setNombre('');
      setDocumento('');
      setPlaca('');
      setTelefono('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    }
  };

  return (
    <>
      <PageHeader icono={UserPlus} titulo="Visitantes" descripcion="Autorizaciones temporales de acceso" />

      <div className="tarjeta">
        <h2><UserPlus size={16} /> Autorizar visitante temporal</h2>
        <form className="formulario" onSubmit={crearVisitante}>
          <label>
            Nombre
            <input value={nombre} onChange={(e) => setNombre(e.target.value)} required minLength={2} />
          </label>
          <label>
            Documento
            <input value={documento} onChange={(e) => setDocumento(e.target.value)} required minLength={4} />
          </label>
          <label>
            Placa
            <input
              value={placa}
              onChange={(e) => setPlaca(e.target.value.toUpperCase())}
              placeholder="ABC123"
              required
            />
          </label>
          <label>
            Teléfono (opcional)
            <input value={telefono} onChange={(e) => setTelefono(e.target.value)} />
          </label>
          <label>
            Tipo de vehículo
            <select value={tipo} onChange={(e) => setTipo(e.target.value as TipoVehiculo)}>
              {Object.values(TipoVehiculo).map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </label>
          <label>
            Tiempo máximo (horas)
            <input
              type="number"
              min={1}
              max={24}
              value={horas}
              onChange={(e) => setHoras(Number(e.target.value))}
            />
          </label>
          <button className="primario" disabled={crear.isPending}>
            {crear.isPending ? 'Guardando…' : 'Autorizar'}
          </button>
        </form>
        {error && <p style={{ color: 'var(--rojo)' }}>{error}</p>}
      </div>

      <div className="tarjeta">
        <div className="fila separada">
          <h2>Listado</h2>
          <span className="input-icono">
            <Search size={15} />
            <input
              placeholder="Buscar por nombre, documento o placa…"
              value={buscar}
              onChange={(e) => {
                setBuscar(e.target.value);
                setPage(1);
              }}
            />
          </span>
        </div>
        {isLoading && <div className="vacio">Cargando…</div>}
        {data && data.data.length === 0 && (
          <div className="vacio">Sin visitantes registrados</div>
        )}
        {data && data.data.length > 0 && (
          <>
            <div className="tabla-wrap">
            <table>
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Documento</th>
                  <th>Placa</th>
                  <th>Límite</th>
                  <th>Situación</th>
                  <th>Autorización</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {data.data.map((v) => (
                  <tr key={v.id}>
                    <td>{v.nombre}</td>
                    <td>{v.documento}</td>
                    <td><strong>{v.placa ?? '—'}</strong></td>
                    <td>{v.tiempoMaxHoras} h</td>
                    <td>
                      {v.excedido ? (
                        <BadgeSimple texto={`EXCEDIDO · zona ${v.zonaCodigo}`} color="rojo" />
                      ) : v.dentro ? (
                        <BadgeSimple
                          texto={`Dentro · zona ${v.zonaCodigo} · desde ${
                            v.horaIngreso
                              ? new Date(v.horaIngreso).toLocaleTimeString()
                              : '?'
                          }`}
                          color="ambar"
                        />
                      ) : (
                        <BadgeSimple texto="Fuera" color="gris" />
                      )}
                    </td>
                    <td>
                      <BadgeSimple
                        texto={v.activo ? 'VIGENTE' : 'DESACTIVADA'}
                        color={v.activo ? 'verde' : 'gris'}
                      />
                    </td>
                    <td>
                      {v.activo && (
                        <button
                          className="peligro"
                          onClick={() => {
                            if (confirm(`¿Desactivar la autorización de ${v.nombre}?`)) {
                              desactivar.mutate(v.id);
                            }
                          }}
                        >
                          Desactivar
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
            <Paginacion page={data.page} pageSize={data.pageSize} total={data.total} onPage={setPage} />
          </>
        )}
      </div>
    </>
  );
}
