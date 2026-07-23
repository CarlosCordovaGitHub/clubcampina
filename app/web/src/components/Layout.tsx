import { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  Bell,
  BellRing,
  ClipboardList,
  Gauge,
  LayoutGrid,
  LogOut,
  ScanLine,
  UserPlus,
  Users,
  Car,
  FileBarChart2,
} from 'lucide-react';
import { sesion } from '../api/client';
import { useRealtimeMonitoreo } from '../realtime/useRealtime';

const enlaces = [
  { a: '/', texto: 'Dashboard', icono: Gauge },
  { a: '/zonas', texto: 'Mapa de zonas', icono: LayoutGrid },
  { a: '/acceso', texto: 'Registro de acceso', icono: ScanLine },
  { a: '/eventos', texto: 'Historial', icono: ClipboardList },
  { a: '/miembros', texto: 'Miembros', icono: Users },
  { a: '/vehiculos', texto: 'Vehículos', icono: Car },
  { a: '/visitantes', texto: 'Visitantes', icono: UserPlus },
  { a: '/reportes', texto: 'Reportes', icono: FileBarChart2 },
];

function iniciales(nombre?: string) {
  if (!nombre) return '?';
  const partes = nombre.trim().split(/\s+/);
  return (partes[0]?.[0] ?? '') + (partes[1]?.[0] ?? '');
}

export function Layout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { conectado, alertas, descartarAlertas } = useRealtimeMonitoreo();
  const usuario = sesion.usuario();
  const [notif, setNotif] = useState(
    'Notification' in window ? Notification.permission : 'denied',
  );

  const pedirNotificaciones = async () => {
    if (!('Notification' in window)) return;
    setNotif(await Notification.requestPermission());
  };

  const actual = enlaces.find((e) => (e.a === '/' ? location.pathname === '/' : location.pathname.startsWith(e.a)));

  return (
    <div className="app-shell">
      <nav className="sidebar">
        <div className="marca">
          <img src="/logo.png" alt="La Campiña Country Club" />
          <span>La Campiña</span>
        </div>
        <div className="grupo-enlaces">
          {enlaces.map((e) => (
            <NavLink
              key={e.a}
              to={e.a}
              end={e.a === '/'}
              className={({ isActive }) => (isActive ? 'activo' : '')}
            >
              <e.icono size={17} strokeWidth={2} />
              {e.texto}
            </NavLink>
          ))}
        </div>
        <div className="pie">
          <div className="estado-conexion">
            <span className={`punto ${conectado ? 'on' : 'off'}`} />
            {conectado ? 'Monitoreo en vivo' : 'Sin conexión en vivo'}
          </div>
          {notif === 'default' && (
            <button className="enlace-notif" onClick={pedirNotificaciones}>
              <Bell size={14} /> Activar notificaciones
            </button>
          )}
        </div>
      </nav>
      <div className="contenido-scroll">
        <header className="navbar">
          <div className="navbar-titulo">
            <span className="eyebrow">Parqueadero</span>
            <h1>{actual?.texto ?? 'Club Campiña'}</h1>
          </div>
          <div className="navbar-derecha">
            <button className="icon-btn" title="Notificaciones" onClick={pedirNotificaciones}>
              {notif === 'granted' ? <BellRing size={18} /> : <Bell size={18} />}
            </button>
            <div className="navbar-usuario">
              <span className="avatar">{iniciales(usuario?.nombre).toUpperCase()}</span>
              <span className="nombre">{usuario?.nombre}</span>
            </div>
            <button
              className="icon-btn"
              title="Cerrar sesión"
              onClick={() => {
                sesion.cerrar();
                navigate('/login');
              }}
            >
              <LogOut size={18} />
            </button>
          </div>
        </header>
        <main className="contenido">
          {alertas.length > 0 && (
            <div className="alerta-banner">
              <span className="alerta-texto">
                <AlertTriangle size={17} />
                {alertas[0].mensaje}
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
    </div>
  );
}
