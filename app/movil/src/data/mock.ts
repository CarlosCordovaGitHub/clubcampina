// Datos de ejemplo para la fase 1 (se reemplazarán por la API real).
// Inspirados en el contenido real del club visto en la plataforma actual.

export const socio = {
  nombre: 'María Fernanda Andrade',
  tratamiento: 'María Fernanda',
  numeroDerecho: 'CLC-1042',
  tipo: 'Socio Pleno',
  invitadosPermitidos: 5,
  invitadosUsados: 2,
  fotoFacial: false, // aún no ha enrolado su rostro (objetivo estratégico)
  saldoBilletera: 84.5,
  avatarIniciales: 'MF',
};

// Nota: el estado del parqueadero NO vive aquí — la geometría está en
// ./croquis.ts y el estado en vivo (compartido entre pantallas) en ./live.ts.

export type Cancha = {
  id: string;
  nombre: string;
  icono: string; // Ionicons
  color: string;
  disponibles: number;
  desde: string;
};

export const canchas: Cancha[] = [
  { id: '57244', nombre: 'Tenis', icono: 'tennisball', color: '#1E9E5A', disponibles: 6, desde: '06:00' },
  { id: '57303', nombre: 'Fútbol', icono: 'football', color: '#0078C0', disponibles: 3, desde: '07:00' },
  { id: '57305', nombre: 'Piscina', icono: 'water', color: '#26A0DE', disponibles: 12, desde: '05:30' },
  { id: '57243', nombre: 'Squash', icono: 'ellipse', color: '#C79A3C', disponibles: 4, desde: '06:00' },
  { id: '57245', nombre: 'Vóley', icono: 'basketball', color: '#D8443C', disponibles: 2, desde: '08:00' },
  { id: '57304', nombre: 'Yoga', icono: 'body', color: '#7A5AC2', disponibles: 8, desde: '07:00' },
  { id: '57240', nombre: 'Básquet', icono: 'basketball', color: '#E0A32E', disponibles: 5, desde: '06:30' },
  { id: '57241', nombre: 'Gimnasio', icono: 'barbell', color: '#004878', disponibles: 20, desde: '05:00' },
];

export type Reserva = {
  id: string;
  cancha: string;
  icono: string;
  fecha: string;
  hora: string;
  estado: 'CONFIRMADA' | 'PENDIENTE';
};

export const misReservas: Reserva[] = [
  { id: 'r1', cancha: 'Tenis · Cancha 3', icono: 'tennisball', fecha: 'Hoy', hora: '18:00 – 19:00', estado: 'CONFIRMADA' },
  { id: 'r2', cancha: 'Piscina · Carril 2', icono: 'water', fecha: 'Mañana', hora: '07:00 – 08:00', estado: 'CONFIRMADA' },
];

export type Noticia = {
  id: string;
  seccion: 'INSTITUCIONAL' | 'Generales' | 'Convenios CLC';
  titular: string;
  resumen: string;
  fecha: string;
  meGusta: number;
  comentarios: number;
  icono: string;
  color: string;
};

export const noticias: Noticia[] = [
  {
    id: 'n1',
    seccion: 'INSTITUCIONAL',
    titular: 'Comunicado: nuevo control de acceso vehicular',
    resumen:
      'Desde el próximo mes la garita reconoce tu placa automáticamente. Registra tus vehículos en tu perfil para agilizar el ingreso.',
    fecha: '17 jul 2026',
    meGusta: 42,
    comentarios: 8,
    icono: 'megaphone',
    color: '#004878',
  },
  {
    id: 'n2',
    seccion: 'Generales',
    titular: 'Temporada de playa: Tonsupa julio 2026',
    resumen: 'Se abre el registro para las estadías de socios en la sede de Tonsupa. Cupos limitados por familia.',
    fecha: '10 jul 2026',
    meGusta: 76,
    comentarios: 21,
    icono: 'sunny',
    color: '#0078C0',
  },
  {
    id: 'n3',
    seccion: 'Convenios CLC',
    titular: 'Nuevo convenio: Escuela de Karate',
    resumen: 'Descuento del 20% para hijos de socios en la escuela de artes marciales del club. Inscripciones abiertas.',
    fecha: '10 jun 2026',
    meGusta: 33,
    comentarios: 5,
    icono: 'ribbon',
    color: '#C79A3C',
  },
  {
    id: 'n4',
    seccion: 'Generales',
    titular: 'Exhibición Vintage Motors en el parqueadero frontal',
    resumen: 'Este sábado, muestra de autos clásicos abierta a socios y sus invitados. Entrada libre.',
    fecha: '25 jun 2026',
    meGusta: 58,
    comentarios: 12,
    icono: 'car-sport',
    color: '#1E9E5A',
  },
];

export type Evento = {
  id: string;
  titulo: string;
  fecha: string;
  lugar: string;
  permitidos: number;
  registrados: number;
  icono: string;
};

export const eventos: Evento[] = [
  { id: 'e1', titulo: 'Noche de gala aniversario', fecha: 'Sáb 2 ago · 20:00', lugar: 'Salón Los Cerezos', permitidos: 300, registrados: 214, icono: 'wine' },
  { id: 'e2', titulo: 'Torneo interno de golf', fecha: 'Dom 10 ago · 07:00', lugar: 'Campo de golf', permitidos: 80, registrados: 61, icono: 'golf' },
];

export type Invitado = {
  id: string;
  nombre: string;
  documento: string;
  placa?: string;
  fecha: string;
  estado: 'PENDIENTE' | 'DENTRO' | 'FINALIZADO';
  qr: string;
};

export const invitados: Invitado[] = [
  { id: 'i1', nombre: 'Carlos Muñoz', documento: '1712345678', placa: 'PCP-6521', fecha: 'Hoy · 14:00', estado: 'DENTRO', qr: 'CLC-INV-i1-1712345678' },
  { id: 'i2', nombre: 'Familia Herrera (3)', documento: '1798765432', placa: 'GSA-1180', fecha: 'Hoy · 16:30', estado: 'PENDIENTE', qr: 'CLC-INV-i2-1798765432' },
];
