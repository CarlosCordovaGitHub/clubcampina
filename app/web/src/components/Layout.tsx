import { NavLink, useNavigate } from 'react-router-dom';
import { sesion } from '../api/client';
import { useRealtimeMonitoreo } from '../realtime/useRealtime';

const enlaces = [
  { a: '/', texto: 'Dashboard' },
  { a: '/zonas', texto: 'Mapa de zonas' },
  { a: '/acceso', texto: 'Ingreso / Salida' },
  { a: '/eventos', texto: 'Historial' },
  { a: '/miembros', texto: 'Miembros' },
  { a: '/vehiculos', texto: 'Vehículos' },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const { conectado, alertas, descartarAlertas } = useRealtimeMonitoreo();
  const usuario = sesion.usuario();

  return (
    <div className="layout">
      <nav className="sidebar">
        <div className="marca">
          <img src="/logo.jpg" alt="Club Campiña" />
          <span>Club Campiña</span>
        </div>
        {enlaces.map((e) => (
          <NavLink
            key={e.a}
            to={e.a}
            end={e.a === '/'}
            className={({ isActive }) => (isActive ? 'activo' : '')}
          >
            {e.texto}
          </NavLink>
        ))}
        <div className="pie">
          <div>
            <span className={`punto ${conectado ? 'on' : 'off'}`} />
            {conectado ? 'Monitoreo en vivo' : 'Sin conexión en vivo'}
          </div>
          <div>{usuario?.nombre}</div>
          <button
            onClick={() => {
              sesion.cerrar();
              navigate('/login');
            }}
          >
            Cerrar sesión
          </button>
        </div>
      </nav>
      <main className="contenido">
        {alertas.length > 0 && (
          <div className="alerta-banner">
            <span>
              ⚠ {alertas[0].mensaje}
              {alertas.length > 1 ? ` (+${alertas.length - 1} alertas más)` : ''}
            </span>
            <button className="secundario" onClick={descartarAlertas}>
              Descartar
            </button>
          </div>
        )}
        {children}
      </main>
    </div>
  );
}
