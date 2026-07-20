// Sistema de diseño de la app — identidad visual de La Campiña Country Club.
// Colores extraídos del logo oficial (ave dorada/azul sobre "La Campiña · COUNTRY CLUB").
import { Platform } from 'react-native';

export const colors = {
  navy: '#004878', // azul marino primario (texto del logo)
  navyDeep: '#003057',
  navy2: '#013D6B',
  gold: '#D8A848', // dorado del ala del logo
  goldDeep: '#C79A3C',
  sky: '#0078C0', // celeste de la franja media
  skySoft: '#E6F0F7',

  bg: '#F3F6FA',
  surface: '#FFFFFF',
  surfaceAlt: '#FAFBFD',
  text: '#0F1B2D',
  textSoft: '#5B6B7F',
  textFaint: '#93A1B3',
  line: '#E4E9F0',

  green: '#1E9E5A',
  greenSoft: '#E4F5EC',
  red: '#D8443C',
  redSoft: '#FBE9E8',
  amber: '#E0A32E',
  amberSoft: '#FBF1DC',

  white: '#FFFFFF',
  overlay: 'rgba(0,32,56,0.55)',
};

export const gradients = {
  brand: ['#013D6B', '#004878', '#0078C0'] as const,
  navy: ['#003057', '#014A7F'] as const,
  gold: ['#D8A848', '#C79A3C'] as const,
  sky: ['#0078C0', '#26A0DE'] as const,
};

export const spacing = (n: number) => n * 4;

export const radius = {
  sm: 8,
  md: 14,
  lg: 20,
  xl: 28,
  pill: 999,
};

export const font = {
  h1: 26,
  h2: 21,
  h3: 17,
  body: 15,
  small: 13,
  tiny: 11,
};

export const shadow = (level: 1 | 2 | 3 = 1) => {
  if (Platform.OS === 'android') return { elevation: level * 3 };
  const map = {
    1: { shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 3 } },
    2: { shadowOpacity: 0.12, shadowRadius: 16, shadowOffset: { width: 0, height: 8 } },
    3: { shadowOpacity: 0.18, shadowRadius: 26, shadowOffset: { width: 0, height: 14 } },
  } as const;
  return { shadowColor: '#012845', ...map[level] };
};
