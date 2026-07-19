// Contratos compartidos entre la API NestJS y los frontends (web hoy, móvil mañana).

// ── Enums de dominio ────────────────────────────────────────────────

export enum EstadoMiembro {
  ACTIVO = 'ACTIVO',
  SUSPENDIDO = 'SUSPENDIDO',
  INACTIVO = 'INACTIVO',
}

export enum TipoMembresia {
  PLENA = 'PLENA',
  FAMILIAR = 'FAMILIAR',
  JUVENIL = 'JUVENIL',
  CORPORATIVA = 'CORPORATIVA',
}

export enum TipoVehiculo {
  AUTOMOVIL = 'AUTOMOVIL',
  CAMIONETA = 'CAMIONETA',
  MOTOCICLETA = 'MOTOCICLETA',
  OTRO = 'OTRO',
}

export enum EstadoVehiculo {
  ACTIVO = 'ACTIVO',
  INACTIVO = 'INACTIVO',
}

export enum TipoZona {
  GENERAL = 'GENERAL',
  VIP = 'VIP',
  DISCAPACITADOS = 'DISCAPACITADOS',
  MOTOS = 'MOTOS',
}

export enum EstadoZona {
  LIBRE = 'LIBRE',
  OCUPADA = 'OCUPADA',
  FUERA_DE_SERVICIO = 'FUERA_DE_SERVICIO',
}

export enum TipoEventoAcceso {
  INGRESO = 'INGRESO',
  SALIDA = 'SALIDA',
}

export enum ResultadoEvento {
  AUTORIZADO = 'AUTORIZADO',
  RECHAZADO = 'RECHAZADO',
  ALERTA = 'ALERTA',
}

export enum RolUsuario {
  ADMIN = 'ADMIN',
  OPERADOR = 'OPERADOR',
  CONSULTA = 'CONSULTA',
}

// ── Modelos expuestos por la API ────────────────────────────────────

export interface Miembro {
  id: string;
  nombre: string;
  documentoIdentidad: string;
  tipoMembresia: TipoMembresia;
  estado: EstadoMiembro;
  createdAt: string;
  updatedAt: string;
  vehiculos?: Vehiculo[];
}

export interface Vehiculo {
  id: string;
  placa: string;
  marca: string | null;
  modelo: string | null;
  tipo: TipoVehiculo;
  estado: EstadoVehiculo;
  miembroId: string | null;
  miembro?: Miembro | null;
  visitanteId?: string | null;
  visitante?: Visitante | null;
  createdAt: string;
  updatedAt: string;
}

export interface Visitante {
  id: string;
  nombre: string;
  documento: string;
  telefono: string | null;
  tiempoMaxHoras: number;
  activo: boolean;
  vehiculos?: Vehiculo[];
  createdAt: string;
}

/** Visitante enriquecido con su situación actual dentro del parqueadero. */
export interface VisitanteConEstado extends Visitante {
  placa: string | null;
  dentro: boolean;
  zonaCodigo: string | null;
  horaIngreso: string | null;
  /** true si sigue dentro y superó su tiempo máximo */
  excedido: boolean;
}

export interface ZonaParqueadero {
  id: string;
  codigo: string;
  tipo: TipoZona;
  estado: EstadoZona;
  vehiculoActualId: string | null;
  vehiculoActual?: Vehiculo | null;
  updatedAt: string;
}

export interface EventoAcceso {
  id: string;
  tipo: TipoEventoAcceso;
  placaDetectada: string;
  confianzaOcr: number | null;
  resultado: ResultadoEvento;
  motivo: string | null;
  fotoUrl: string | null;
  vehiculoId: string | null;
  vehiculo?: Vehiculo | null;
  zonaId: string | null;
  zona?: ZonaParqueadero | null;
  operadorId: string | null;
  timestamp: string;
  /** Solo en la respuesta inmediata de ingreso/salida (no persistidos) */
  ocrBackend?: string | null;
  ocrBbox?: number[] | null;
}

export interface UsuarioPublico {
  id: string;
  nombre: string;
  email: string;
  rol: RolUsuario;
}

// ── DTOs de entrada ─────────────────────────────────────────────────

export interface CrearMiembroDto {
  nombre: string;
  documentoIdentidad: string;
  tipoMembresia: TipoMembresia;
  estado?: EstadoMiembro;
}

export type ActualizarMiembroDto = Partial<CrearMiembroDto>;

export interface CrearVehiculoDto {
  placa: string;
  marca?: string;
  modelo?: string;
  tipo: TipoVehiculo;
  estado?: EstadoVehiculo;
  miembroId: string;
}

export type ActualizarVehiculoDto = Partial<CrearVehiculoDto>;

export interface CrearZonaDto {
  codigo: string;
  tipo: TipoZona;
}

export interface ActualizarZonaDto {
  codigo?: string;
  tipo?: TipoZona;
  estado?: EstadoZona;
}

export interface CrearVisitanteDto {
  nombre: string;
  documento: string;
  telefono?: string;
  placa: string;
  tipoVehiculo?: TipoVehiculo;
  tiempoMaxHoras?: number;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface LoginRespuesta {
  accessToken: string;
  usuario: UsuarioPublico;
}

// ── Respuestas paginadas ────────────────────────────────────────────

export interface Paginado<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

// ── Resultado del motor de visión (contrato HTTP interno) ───────────

export interface ReconocimientoPlaca {
  plate_text: string | null;
  confidence: number;
  bbox: [number, number, number, number] | null;
  processing_ms: number;
  /** Backend que produjo la lectura: fast_alpr | easyocr | easyocr-fallback */
  backend?: string;
}

// ── Reportes ────────────────────────────────────────────────────────

export interface OcupacionPorHora {
  hora: number; // 0-23
  ingresos: number;
}

export interface FrecuenciaSocio {
  miembroId: string;
  nombre: string;
  ingresos: number;
}

export interface ResumenReportes {
  desdeDias: number;
  totalIngresos: number;
  totalRechazados: number;
  totalAlertas: number;
  ocupacionPorHora: OcupacionPorHora[];
  frecuenciaSocios: FrecuenciaSocio[];
}

// ── Eventos WebSocket (namespace /monitoreo) ────────────────────────

export const WS_NAMESPACE_MONITOREO = '/monitoreo';

export enum EventoWS {
  ZONA_ACTUALIZADA = 'zona.actualizada',
  EVENTO_NUEVO = 'evento.nuevo',
  ALERTA = 'alerta',
}

export interface PayloadZonaActualizada {
  zona: ZonaParqueadero;
}

export interface PayloadEventoNuevo {
  evento: EventoAcceso;
}

export interface PayloadAlerta {
  mensaje: string;
  evento?: EventoAcceso;
}
