import { useState } from 'react';
import { LayoutGrid, Plus } from 'lucide-react';
import { EstadoZona, RolUsuario, TipoZona } from '@club-campina/shared-types';
import { sesion } from '../api/client';
import { resumenZonas, useZonas, useZonasMutations } from '../features/zonas';
import { BadgeSimple, BadgeEstadoZona } from '../components/Badge';
import { PageHeader } from '../components/PageHeader';
import { CroquisZonas } from '../components/CroquisZonas';

export function ZonasMapaPage() {
  const { data: zonas, isLoading } = useZonas();
  const { cambiarEstado, crear, eliminar } = useZonasMutations();
  const resumen = resumenZonas(zonas);
  const rol = sesion.usuario()?.rol;
  const puedeOperar = rol === RolUsuario.ADMIN || rol === RolUsuario.OPERADOR;
  const esAdmin = rol === RolUsuario.ADMIN;

  const [codigo, setCodigo] = useState('');
  const [tipo, setTipo] = useState<TipoZona>(TipoZona.GENERAL);
  const [error, setError] = useState('');
  const [seleccion, setSeleccion] = useState<string | null>(null);

  const zonaSel = zonas?.find((z) => z.codigo === seleccion) ?? null;

  const crearZona = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await crear.mutateAsync({ codigo, tipo });
      setCodigo('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    }
  };

  return (
    <>
      <PageHeader
        icono={LayoutGrid}
        titulo="Mapa de zonas"
        descripcion="Disponibilidad de espacios por zona"
        acciones={
          <div className="fila">
            <BadgeSimple texto={`${resumen.libres} libres`} color="verde" />
            <BadgeSimple texto={`${resumen.ocupadas} ocupadas`} color="rojo" />
            <BadgeSimple texto={`${resumen.fueraServicio} fuera de servicio`} color="gris" />
          </div>
        }
      />
      {esAdmin && (
        <div className="tarjeta">
          <h2><Plus size={16} /> Crear zona</h2>
          <form className="formulario" onSubmit={crearZona}>
            <label>
              Código
              <input
                value={codigo}
                onChange={(e) => setCodigo(e.target.value.toUpperCase())}
                placeholder="A-07"
                required
              />
            </label>
            <label>
              Tipo
              <select value={tipo} onChange={(e) => setTipo(e.target.value as TipoZona)}>
                {Object.values(TipoZona).map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </label>
            <button className="primario" disabled={crear.isPending}>
              {crear.isPending ? 'Creando…' : 'Crear zona'}
            </button>
          </form>
          {error && <p style={{ color: 'var(--rojo)' }}>{error}</p>}
        </div>
      )}

      <div className="tarjeta">
        {isLoading && <div className="vacio">Cargando zonas…</div>}
        <CroquisZonas zonas={zonas} seleccion={seleccion} onSelect={setSeleccion} />
        <div className="croquis-leyenda">
          <span><i className="punto-leyenda" style={{ background: '#2FBF71' }} /> Libre</span>
          <span><i className="punto-leyenda" style={{ background: '#DF5B52' }} /> Ocupada</span>
          <span><i className="punto-leyenda" style={{ background: '#AEB9C6' }} /> Fuera de servicio</span>
        </div>
        <p className="croquis-ayuda">Toca una plaza del croquis para ver su detalle</p>
      </div>

      {zonaSel && (
        <div className="tarjeta">
          <div className="fila separada">
            <h2>Zona {zonaSel.codigo}</h2>
            <BadgeEstadoZona estado={zonaSel.estado} />
          </div>
          <p className="descripcion" style={{ margin: '0 0 0.75rem' }}>{zonaSel.tipo}</p>
          {zonaSel.estado === EstadoZona.OCUPADA && zonaSel.vehiculoActual && (
            <p style={{ margin: '0 0 0.75rem' }}>
              <strong>{zonaSel.vehiculoActual.placa}</strong>
              {' · '}
              {zonaSel.vehiculoActual.miembro?.nombre ??
                (zonaSel.vehiculoActual.visitante
                  ? `Visitante: ${zonaSel.vehiculoActual.visitante.nombre}`
                  : '')}
            </p>
          )}
          {puedeOperar && zonaSel.estado !== EstadoZona.OCUPADA && (
            <div className="fila">
              <button
                className="secundario"
                onClick={() =>
                  cambiarEstado.mutate({
                    id: zonaSel.id,
                    estado:
                      zonaSel.estado === EstadoZona.LIBRE
                        ? EstadoZona.FUERA_DE_SERVICIO
                        : EstadoZona.LIBRE,
                  })
                }
              >
                {zonaSel.estado === EstadoZona.LIBRE ? 'Deshabilitar' : 'Habilitar'}
              </button>
              {esAdmin && (
                <button
                  className="peligro"
                  onClick={() => {
                    if (confirm(`¿Eliminar la zona ${zonaSel.codigo}?`)) {
                      eliminar.mutate(zonaSel.id);
                      setSeleccion(null);
                    }
                  }}
                >
                  Eliminar
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </>
  );
}
