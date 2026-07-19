// Cliente REST tipado contra @club-campina/shared-types.
// Una futura app móvil reutiliza este mismo módulo cambiando solo BASE_URL.
import type {
  ActualizarMiembroDto,
  ActualizarVehiculoDto,
  ActualizarZonaDto,
  CrearMiembroDto,
  CrearVehiculoDto,
  CrearZonaDto,
  EventoAcceso,
  LoginRespuesta,
  Miembro,
  Paginado,
  Vehiculo,
  ZonaParqueadero,
} from '@club-campina/shared-types';

const BASE_URL = '/api/v1';
const TOKEN_KEY = 'campina.token';
const USUARIO_KEY = 'campina.usuario';

export const sesion = {
  guardar(r: LoginRespuesta) {
    localStorage.setItem(TOKEN_KEY, r.accessToken);
    localStorage.setItem(USUARIO_KEY, JSON.stringify(r.usuario));
  },
  token: () => localStorage.getItem(TOKEN_KEY),
  usuario(): LoginRespuesta['usuario'] | null {
    const raw = localStorage.getItem(USUARIO_KEY);
    return raw ? JSON.parse(raw) : null;
  },
  cerrar() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USUARIO_KEY);
  },
};

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export async function request<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const headers = new Headers(init.headers);
  const token = sesion.token();
  if (token) headers.set('Authorization', `Bearer ${token}`);
  if (init.body && !(init.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  const res = await fetch(`${BASE_URL}${path}`, { ...init, headers });
  if (res.status === 401 && !path.startsWith('/auth')) {
    sesion.cerrar();
    window.location.assign('/login');
  }
  if (!res.ok) {
    const cuerpo = await res.json().catch(() => null);
    const msg = Array.isArray(cuerpo?.message)
      ? cuerpo.message.join('; ')
      : (cuerpo?.message ?? `Error ${res.status}`);
    throw new ApiError(res.status, msg);
  }
  return res.json() as Promise<T>;
}

const qs = (params: Record<string, string | number | undefined>) => {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== '') sp.set(k, String(v));
  }
  const s = sp.toString();
  return s ? `?${s}` : '';
};

export const api = {
  login: (email: string, password: string) =>
    request<LoginRespuesta>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  miembros: {
    listar: (params: { page?: number; pageSize?: number; buscar?: string } = {}) =>
      request<Paginado<Miembro>>(`/miembros${qs(params)}`),
    crear: (dto: CrearMiembroDto) =>
      request<Miembro>('/miembros', { method: 'POST', body: JSON.stringify(dto) }),
    actualizar: (id: string, dto: ActualizarMiembroDto) =>
      request<Miembro>(`/miembros/${id}`, { method: 'PATCH', body: JSON.stringify(dto) }),
    eliminar: (id: string) => request<{ ok: true }>(`/miembros/${id}`, { method: 'DELETE' }),
  },

  vehiculos: {
    listar: (params: { page?: number; pageSize?: number; buscar?: string } = {}) =>
      request<Paginado<Vehiculo>>(`/vehiculos${qs(params)}`),
    crear: (dto: CrearVehiculoDto) =>
      request<Vehiculo>('/vehiculos', { method: 'POST', body: JSON.stringify(dto) }),
    actualizar: (id: string, dto: ActualizarVehiculoDto) =>
      request<Vehiculo>(`/vehiculos/${id}`, { method: 'PATCH', body: JSON.stringify(dto) }),
    eliminar: (id: string) => request<{ ok: true }>(`/vehiculos/${id}`, { method: 'DELETE' }),
  },

  zonas: {
    listar: () => request<ZonaParqueadero[]>('/zonas'),
    crear: (dto: CrearZonaDto) =>
      request<ZonaParqueadero>('/zonas', { method: 'POST', body: JSON.stringify(dto) }),
    actualizar: (id: string, dto: ActualizarZonaDto) =>
      request<ZonaParqueadero>(`/zonas/${id}`, { method: 'PATCH', body: JSON.stringify(dto) }),
    eliminar: (id: string) => request<{ ok: true }>(`/zonas/${id}`, { method: 'DELETE' }),
  },

  eventos: {
    historial: (
      params: {
        page?: number;
        pageSize?: number;
        placa?: string;
        resultado?: string;
        tipo?: string;
      } = {},
    ) => request<Paginado<EventoAcceso>>(`/eventos-acceso${qs(params)}`),
    ingreso: (imagen: File) => {
      const form = new FormData();
      form.append('imagen', imagen);
      return request<EventoAcceso>('/eventos-acceso/ingreso', {
        method: 'POST',
        body: form,
      });
    },
    salida: (imagen: File) => {
      const form = new FormData();
      form.append('imagen', imagen);
      return request<EventoAcceso>('/eventos-acceso/salida', {
        method: 'POST',
        body: form,
      });
    },
  },
};
