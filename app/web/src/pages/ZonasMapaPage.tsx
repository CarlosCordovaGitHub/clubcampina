import { useState } from 'react';
import { EstadoZona, RolUsuario, TipoZona } from '@club-campina/shared-types';
import { sesion } from '../api/client';
import { resumenZonas, useZonas, useZonasMutations } from '../features/zonas';
import { BadgeSimple } from '../components/Badge';

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
      <h1>Mapa de zonas</h1>
      <div className="fila" style={{ marginBottom: '1rem' }}>
        <BadgeSimple texto={`${resumen.libres} libres`} color="verde" />
        <BadgeSimple texto={`${resumen.ocupadas} ocupadas`} color="rojo" />
        <BadgeSimple texto={`${resumen.fueraServicio} fuera de servicio`} color="gris" />
      </div>
      {esAdmin && (
        <div className="tarjeta">
          <h2>Crear zona</h2>
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
        <div className="mapa-zonas">
          {zonas?.map((zona) => (
            <div key={zona.id} className={`zona ${zona.estado}`}>
              <span className="codigo">{zona.codigo}</span>
              <span className="detalle">{zona.tipo}</span>
              {zona.estado === EstadoZona.OCUPADA && zona.vehiculoActual && (
                <span className="detalle">
                  <strong>{zona.vehiculoActual.placa}</strong>
                  <br />
                  {zona.vehiculoActual.miembro?.nombre ??
                    (zona.vehiculoActual.visitante
                      ? `Visitante: ${zona.vehiculoActual.visitante.nombre}`
                      : '')}
                </span>
              )}
              {puedeOperar && zona.estado !== EstadoZona.OCUPADA && (
                <div className="fila" style={{ marginTop: 'auto', gap: '0.35rem' }}>
                  <button
                    className="secundario"
                    style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                    onClick={() =>
                      cambiarEstado.mutate({
                        id: zona.id,
                        estado:
                          zona.estado === EstadoZona.LIBRE
                            ? EstadoZona.FUERA_DE_SERVICIO
                            : EstadoZona.LIBRE,
                      })
                    }
                  >
                    {zona.estado === EstadoZona.LIBRE ? 'Deshabilitar' : 'Habilitar'}
                  </button>
                  {esAdmin && (
                    <button
                      className="peligro"
                      style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                      onClick={() => {
                        if (confirm(`¿Eliminar la zona ${zona.codigo}?`)) {
                          eliminar.mutate(zona.id);
                        }
                      }}
                    >
                      Eliminar
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
