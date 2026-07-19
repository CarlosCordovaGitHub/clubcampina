import { Navigate, Route, Routes } from 'react-router-dom';
import { sesion } from './api/client';
import { Layout } from './components/Layout';
import { DashboardPage } from './pages/DashboardPage';
import { ZonasMapaPage } from './pages/ZonasMapaPage';
import { IngresoSimuladoPage } from './pages/IngresoSimuladoPage';
import { EventosHistorialPage } from './pages/EventosHistorialPage';
import { MiembrosPage } from './pages/MiembrosPage';
import { VehiculosPage } from './pages/VehiculosPage';
import { LoginPage } from './pages/LoginPage';

function Protegido({ children }: { children: React.ReactNode }) {
  if (!sesion.token()) return <Navigate to="/login" replace />;
  return <Layout>{children}</Layout>;
}

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<Protegido><DashboardPage /></Protegido>} />
      <Route path="/zonas" element={<Protegido><ZonasMapaPage /></Protegido>} />
      <Route path="/acceso" element={<Protegido><IngresoSimuladoPage /></Protegido>} />
      <Route path="/eventos" element={<Protegido><EventosHistorialPage /></Protegido>} />
      <Route path="/miembros" element={<Protegido><MiembrosPage /></Protegido>} />
      <Route path="/vehiculos" element={<Protegido><VehiculosPage /></Protegido>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
