import { useState } from 'react';
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
  { a: '/visitantes', texto: 'Visitantes' },
  { a: '/reportes', texto: 'Reportes' },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const { conectado, alertas, descartarAlertas } = useRealtimeMonitoreo();
  const usuario = sesion.usuario();
  const [notif, setNotif] = useState(
    'Notification' in window ? Notification.permission : 'denied',
  );

  const pedirNotificaciones = async () => {
    if (!('Notification' in window)) return;
    setNotif(await Notification.requestPermission());
  };

  return (
    <div className="layout">
      <nav className="sidebar">
        <div className="marca">
          <img src="/logo.png" alt="La Campiña Country Club" />
          <span>La Campiña</span>
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
          {notif === 'default' && (
            <button onClick={pedirNotificaciones}>
              Activar notificaciones
            </button>
          )}
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
