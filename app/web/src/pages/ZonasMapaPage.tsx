import { EstadoZona, RolUsuario } from '@club-campina/shared-types';
import { sesion } from '../api/client';
import { resumenZonas, useZonas, useZonasMutations } from '../features/zonas';
import { BadgeSimple } from '../components/Badge';

export function ZonasMapaPage() {
  const { data: zonas, isLoading } = useZonas();
  const { cambiarEstado } = useZonasMutations();
  const resumen = resumenZonas(zonas);
  const rol = sesion.usuario()?.rol;
  const puedeOperar = rol === RolUsuario.ADMIN || rol === RolUsuario.OPERADOR;

  return (
    <>
      <h1>Mapa de zonas</h1>
      <div className="fila" style={{ marginBottom: '1rem' }}>
        <BadgeSimple texto={`${resumen.libres} libres`} color="verde" />
        <BadgeSimple texto={`${resumen.ocupadas} ocupadas`} color="rojo" />
        <BadgeSimple texto={`${resumen.fueraServicio} fuera de servicio`} color="gris" />
      </div>
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
                  {zona.vehiculoActual.miembro?.nombre}
                </span>
              )}
              {puedeOperar && zona.estado !== EstadoZona.OCUPADA && (
                <button
                  className="secundario"
                  style={{ marginTop: 'auto', fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
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
              )}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
