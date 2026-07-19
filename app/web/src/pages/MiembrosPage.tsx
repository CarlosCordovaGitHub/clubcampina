import { useState } from 'react';
import {
  EstadoMiembro,
  TipoMembresia,
} from '@club-campina/shared-types';
import { useMiembros, useMiembrosMutations } from '../features/miembros';
import { BadgeSimple } from '../components/Badge';
import { Paginacion } from '../components/Paginacion';

export function MiembrosPage() {
  const [page, setPage] = useState(1);
  const [buscar, setBuscar] = useState('');
  const { data, isLoading } = useMiembros({ page, buscar });
  const { crear, actualizar, eliminar } = useMiembrosMutations();

  const [nombre, setNombre] = useState('');
  const [documento, setDocumento] = useState('');
  const [tipo, setTipo] = useState<TipoMembresia>(TipoMembresia.PLENA);
  const [error, setError] = useState('');

  const crearMiembro = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await crear.mutateAsync({
        nombre,
        documentoIdentidad: documento,
        tipoMembresia: tipo,
      });
      setNombre('');
      setDocumento('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    }
  };

  return (
    <>
      <h1>Miembros</h1>

      <div className="tarjeta">
        <h2>Registrar miembro</h2>
        <form className="formulario" onSubmit={crearMiembro}>
          <label>
            Nombre
            <input value={nombre} onChange={(e) => setNombre(e.target.value)} required minLength={2} />
          </label>
          <label>
            Documento de identidad
            <input value={documento} onChange={(e) => setDocumento(e.target.value)} required minLength={4} />
          </label>
          <label>
            Tipo de membresía
            <select value={tipo} onChange={(e) => setTipo(e.target.value as TipoMembresia)}>
              {Object.values(TipoMembresia).map((t) => (
                <option key={t} value={t}>{t}</option>
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
          <input
            placeholder="Buscar por nombre o documento…"
            value={buscar}
            onChange={(e) => {
              setBuscar(e.target.value);
              setPage(1);
            }}
          />
        </div>
        {isLoading && <div className="vacio">Cargando…</div>}
        {data && (
          <>
            <table>
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Documento</th>
                  <th>Membresía</th>
                  <th>Estado</th>
                  <th>Vehículos</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {data.data.map((m) => (
                  <tr key={m.id}>
                    <td>{m.nombre}</td>
                    <td>{m.documentoIdentidad}</td>
                    <td>{m.tipoMembresia}</td>
                    <td>
                      <BadgeSimple
                        texto={m.estado}
                        color={m.estado === EstadoMiembro.ACTIVO ? 'verde' : 'ambar'}
                      />
                    </td>
                    <td>{m.vehiculos?.map((v) => v.placa).join(', ') || '—'}</td>
                    <td>
                      <div className="fila">
                        <button
                          className="secundario"
                          onClick={() =>
                            actualizar.mutate({
                              id: m.id,
                              dto: {
                                estado:
                                  m.estado === EstadoMiembro.ACTIVO
                                    ? EstadoMiembro.SUSPENDIDO
                                    : EstadoMiembro.ACTIVO,
                              },
                            })
                          }
                        >
                          {m.estado === EstadoMiembro.ACTIVO ? 'Suspender' : 'Activar'}
                        </button>
                        <button
                          className="peligro"
                          onClick={() => {
                            if (confirm(`¿Eliminar a ${m.nombre} y sus vehículos?`)) {
                              eliminar.mutate(m.id);
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
            <Paginacion page={data.page} pageSize={data.pageSize} total={data.total} onPage={setPage} />
          </>
        )}
      </div>
    </>
  );
}
