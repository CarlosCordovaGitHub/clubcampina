import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, Lock, LogIn, Mail } from 'lucide-react';
import { api, sesion } from '../api/client';

export function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('admin@clubcampina.com');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setCargando(true);
    try {
      sesion.guardar(await api.login(email, password));
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al iniciar sesión');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="login-fondo">
      <form className="login-caja" onSubmit={enviar}>
        <div className="login-marca">
          <img src="/logo.png" alt="La Campiña Country Club" />
          <h1>Parqueadero · La Campiña</h1>
          <p className="subtitulo">Ingresa con tu cuenta de operador o administrador</p>
        </div>
        <label>
          Correo
          <span className="campo-icono">
            <Mail size={16} />
            <input
              type="email"
              placeholder="tu@clubcampina.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </span>
        </label>
        <label>
          Contraseña
          <span className="campo-icono">
            <Lock size={16} />
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </span>
        </label>
        {error && (
          <span className="error">
            <AlertCircle size={16} />
            {error}
          </span>
        )}
        <button className="primario" disabled={cargando}>
          {cargando ? 'Ingresando…' : (<><LogIn size={16} /> Ingresar</>)}
        </button>
        <p className="pie-login">Club Campiña · Control de acceso vehicular</p>
      </form>
    </div>
  );
}
