import { useState } from 'react';
import { Car, Plus, Search } from 'lucide-react';
import {
  EstadoVehiculo,
  TipoVehiculo,
} from '@club-campina/shared-types';
import { useMiembros } from '../features/miembros';
import { useVehiculos, useVehiculosMutations } from '../features/vehiculos';
import { BadgeSimple } from '../components/Badge';
import { Paginacion } from '../components/Paginacion';
import { PageHeader } from '../components/PageHeader';

export function VehiculosPage() {
  const [page, setPage] = useState(1);
  const [buscar, setBuscar] = useState('');
  const { data, isLoading } = useVehiculos({ page, buscar });
  const { data: miembros } = useMiembros({ page: 1 });
  const { crear, actualizar, eliminar } = useVehiculosMutations();

  const [placa, setPlaca] = useState('');
  const [marca, setMarca] = useState('');
  const [modelo, setModelo] = useState('');
  const [tipo, setTipo] = useState<TipoVehiculo>(TipoVehiculo.AUTOMOVIL);
  const [miembroId, setMiembroId] = useState('');
  const [error, setError] = useState('');

  const crearVehiculo = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await crear.mutateAsync({ placa, marca, modelo, tipo, miembroId });
      setPlaca('');
      setMarca('');
      setModelo('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    }
  };

  return (
    <>
      <PageHeader icono={Car} titulo="Vehículos" descripcion="Vehículos registrados y su titular" />

      <div className="tarjeta">
        <h2><Plus size={16} /> Registrar vehículo</h2>
        <form className="formulario" onSubmit={crearVehiculo}>
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
            Marca
            <input value={marca} onChange={(e) => setMarca(e.target.value)} />
          </label>
          <label>
            Modelo
            <input value={modelo} onChange={(e) => setModelo(e.target.value)} />
          </label>
          <label>
            Tipo
            <select value={tipo} onChange={(e) => setTipo(e.target.value as TipoVehiculo)}>
              {Object.values(TipoVehiculo).map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </label>
          <label>
            Socio propietario
            <select value={miembroId} onChange={(e) => setMiembroId(e.target.value)} required>
              <option value="">Seleccionar…</option>
              {miembros?.data.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nombre} ({m.documentoIdentidad})
                </option>
              ))}
            </select>
          </label>
          <button className="primario" disabled={crear.isPending}>
            {crear.isPending ? 'Guardando…' : 'Registrar'}
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
              placeholder="Buscar por placa o socio…"
              value={buscar}
              onChange={(e) => {
                setBuscar(e.target.value);
                setPage(1);
              }}
            />
          </span>
        </div>
        {isLoading && <div className="vacio">Cargando…</div>}
        {data && (
          <>
            <div className="tabla-wrap">
            <table>
              <thead>
                <tr>
                  <th>Placa</th>
                  <th>Marca / Modelo</th>
                  <th>Tipo</th>
                  <th>Socio</th>
                  <th>Estado</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {data.data.map((v) => (
                  <tr key={v.id}>
                    <td><strong>{v.placa}</strong></td>
                    <td>{[v.marca, v.modelo].filter(Boolean).join(' ') || '—'}</td>
                    <td>{v.tipo}</td>
                    <td>{v.miembro?.nombre ?? '—'}</td>
                    <td>
                      <BadgeSimple
                        texto={v.estado}
                        color={v.estado === EstadoVehiculo.ACTIVO ? 'verde' : 'ambar'}
                      />
                    </td>
                    <td>
                      <div className="fila">
                        <button
                          className="secundario"
                          onClick={() =>
                            actualizar.mutate({
                              id: v.id,
                              dto: {
                                estado:
                                  v.estado === EstadoVehiculo.ACTIVO
                                    ? EstadoVehiculo.INACTIVO
                                    : EstadoVehiculo.ACTIVO,
                              },
                            })
                          }
                        >
                          {v.estado === EstadoVehiculo.ACTIVO ? 'Desactivar' : 'Activar'}
                        </button>
                        <button
                          className="peligro"
                          onClick={() => {
                            if (confirm(`¿Eliminar el vehículo ${v.placa}?`)) {
                              eliminar.mutate(v.id);
                            }
                          }}
                        >
                          Eliminar
                        </button>
                      </div>
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
