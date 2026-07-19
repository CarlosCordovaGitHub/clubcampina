import {
  EstadoZona,
  ResultadoEvento,
} from '@club-campina/shared-types';

const COLOR_RESULTADO: Record<string, string> = {
  [ResultadoEvento.AUTORIZADO]: 'verde',
  [ResultadoEvento.RECHAZADO]: 'rojo',
  [ResultadoEvento.ALERTA]: 'ambar',
};

const COLOR_ESTADO_ZONA: Record<string, string> = {
  [EstadoZona.LIBRE]: 'verde',
  [EstadoZona.OCUPADA]: 'rojo',
  [EstadoZona.FUERA_DE_SERVICIO]: 'gris',
};

export function BadgeResultado({ resultado }: { resultado: string }) {
  return (
    <span className={`badge ${COLOR_RESULTADO[resultado] ?? 'gris'}`}>
      {resultado}
    </span>
  );
}

export function BadgeEstadoZona({ estado }: { estado: string }) {
  return (
    <span className={`badge ${COLOR_ESTADO_ZONA[estado] ?? 'gris'}`}>
      {estado.replaceAll('_', ' ')}
    </span>
  );
}

export function BadgeSimple({
  texto,
  color = 'gris',
}: {
  texto: string;
  color?: 'verde' | 'ambar' | 'rojo' | 'gris';
}) {
  return <span className={`badge ${color}`}>{texto}</span>;
}
