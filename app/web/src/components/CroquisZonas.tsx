// Croquis visual del parqueadero (SVG) — mismo espíritu que el croquis de la
// app móvil (src/components/CroquisClub.tsx): un plano ilustrado del club con
// las plazas en su posición real, en vez de una grilla plana de tarjetas.
//
// Las posiciones son fijas por código para el set de zonas de la demo
// (A-01…A-07, D-01, M-01…M-03, V-01…V-02). Cualquier zona nueva que no esté
// en el mapa de posiciones se ubica automáticamente en una fila de reserva
// abajo, para que crear zonas desde el formulario nunca rompa el dibujo.
import { EstadoZona, type ZonaParqueadero } from '@club-campina/shared-types';

const COLOR_ESTADO: Record<string, string> = {
  [EstadoZona.LIBRE]: '#2FA968',
  [EstadoZona.OCUPADA]: '#D5544B',
  [EstadoZona.FUERA_DE_SERVICIO]: '#9AA6B4',
};

type Posicion = { x: number; y: number; w: number; h: number; ang: number };

const STALL = { w: 24, h: 46 };
const STALL_VIP = { w: 26, h: 46 };
const STALL_MOTO = { w: 16, h: 28 };

const POSICIONES: Record<string, Posicion> = {
  'A-01': { x: 78, y: 196, ...STALL, ang: -22 },
  'A-02': { x: 110, y: 208, ...STALL, ang: -22 },
  'A-03': { x: 142, y: 220, ...STALL, ang: -22 },
  'A-04': { x: 174, y: 232, ...STALL, ang: -22 },
  'A-05': { x: 206, y: 244, ...STALL, ang: -22 },
  'A-06': { x: 238, y: 256, ...STALL, ang: -22 },
  'A-07': { x: 270, y: 268, ...STALL, ang: -22 },
  'D-01': { x: 630, y: 300, ...STALL, ang: 0 },
  'V-01': { x: 848, y: 296, ...STALL_VIP, ang: 0 },
  'V-02': { x: 848, y: 352, ...STALL_VIP, ang: 0 },
  'M-01': { x: 552, y: 452, ...STALL_MOTO, ang: 0 },
  'M-02': { x: 576, y: 452, ...STALL_MOTO, ang: 0 },
  'M-03': { x: 600, y: 452, ...STALL_MOTO, ang: 0 },
};

const RESERVA_Y = 520;

export function CroquisZonas({
  zonas,
  seleccion,
  onSelect,
}: {
  zonas: ZonaParqueadero[] | undefined;
  seleccion: string | null;
  onSelect: (codigo: string) => void;
}) {
  let extraIndex = 0;
  const items = (zonas ?? []).map((zona) => {
    const fija = POSICIONES[zona.codigo];
    if (fija) return { zona, pos: fija };
    const pos: Posicion = { x: 60 + extraIndex * 30, y: RESERVA_Y, ...STALL, ang: 0 };
    extraIndex += 1;
    return { zona, pos };
  });
  const hayReserva = items.some((it) => it.pos.y === RESERVA_Y);

  return (
    <div className="croquis-wrap">
      <svg viewBox="0 0 940 560" width="100%" role="img" aria-label="Croquis del parqueadero">
        <defs>
          <linearGradient id="grass" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#EAF2E7" />
            <stop offset="1" stopColor="#DCEAD7" />
          </linearGradient>
          <linearGradient id="asfalto" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#93A0B0" />
            <stop offset="1" stopColor="#7C8A9B" />
          </linearGradient>
          <linearGradient id="casaClub" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#C15F45" />
            <stop offset="1" stopColor="#A34E39" />
          </linearGradient>
          <linearGradient id="tenis" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#E0AC80" />
            <stop offset="1" stopColor="#CD9367" />
          </linearGradient>
          <radialGradient id="arbol" cx="0.35" cy="0.3" r="0.75">
            <stop offset="0" stopColor="#B9D6AE" />
            <stop offset="1" stopColor="#8FB584" />
          </radialGradient>
        </defs>

        <rect x={0} y={0} width={940} height={560} rx={16} fill="url(#grass)" />

        {/* Vía interna */}
        <path
          d="M 460 0 V 320 Q 460 384 522 410 H 940"
          stroke="url(#asfalto)"
          strokeWidth={44}
          fill="none"
          strokeLinecap="round"
        />
        <path
          d="M 460 0 V 320 Q 460 384 522 410 H 940"
          stroke="#FFFFFF"
          strokeWidth={2}
          strokeDasharray="12 12"
          fill="none"
          opacity={0.55}
        />

        {/* Av. principal */}
        <rect x={0} y={498} width={940} height={62} fill="#6E7A89" />
        <rect x={0} y={498} width={940} height={6} fill="#84909F" />
        <line x1={0} y1={529} x2={940} y2={529} stroke="#FFFFFF" strokeWidth={2.5} strokeDasharray="24 18" opacity={0.75} />
        <text x={470} y={548} fontSize={13} fontWeight={700} fill="#FFFFFF" textAnchor="middle" opacity={0.85} letterSpacing={0.5}>
          AV. GALO PLAZA LASSO
        </text>

        {/* Cancha de tenis */}
        <g className="sombra-suave">
          <rect x={40} y={36} width={168} height={96} rx={8} fill="url(#tenis)" />
          <rect x={40} y={36} width={168} height={96} rx={8} fill="none" stroke="#F4E3D2" strokeWidth={2} opacity={0.6} />
          <line x1={124} y1={36} x2={124} y2={132} stroke="#F4E3D2" strokeWidth={2.5} opacity={0.8} />
          <text x={124} y={90} fontSize={14} fontWeight={700} fill="#6B4A30" textAnchor="middle" letterSpacing={0.3}>
            TENIS
          </text>
        </g>

        {/* Asfalto bajo la banda A */}
        <g transform="rotate(-22 174 232)">
          <rect x={50} y={205} width={248} height={58} rx={12} fill="url(#asfalto)" opacity={0.9} />
        </g>
        <text x={174} y={186} fontSize={13} fontWeight={700} fill="#004878" opacity={0.55} textAnchor="middle" letterSpacing={0.4}>
          BANDA A
        </text>

        {/* Asfalto bajo D-01 / V-01 / V-02 */}
        <rect x={604} y={272} width={54} height={58} rx={10} fill="url(#asfalto)" opacity={0.9} />
        <rect x={824} y={268} width={54} height={116} rx={10} fill="url(#asfalto)" opacity={0.9} />

        {/* Asfalto bajo motos */}
        <rect x={538} y={434} width={78} height={38} rx={9} fill="url(#asfalto)" opacity={0.9} />

        {/* Casa Club */}
        <g className="sombra-media">
          <rect x={600} y={100} width={280} height={168} rx={14} fill="url(#casaClub)" />
          <rect x={600} y={100} width={280} height={40} rx={14} fill="#00000018" />
          <rect x={670} y={244} width={200} height={16} rx={2} fill="#F1E9E0" />
          {[652, 702, 752, 802, 828].map((x) => (
            <rect key={x} x={x} y={160} width={20} height={26} rx={3} fill="#F1E9E0" opacity={0.85} />
          ))}
          <text x={740} y={140} fontSize={19} fontWeight={700} fill="#FFF4EE" textAnchor="middle" letterSpacing={0.4}>
            CASA CLUB
          </text>
        </g>

        {/* Garita */}
        <g className="sombra-suave">
          <rect x={498} y={468} width={44} height={32} rx={6} fill="#FFFFFF" stroke="#004878" strokeWidth={3} />
          <rect x={498} y={468} width={44} height={8} rx={4} fill="#D8A848" />
          <text x={520} y={514} fontSize={12} fontWeight={700} fill="#004878" textAnchor="middle" letterSpacing={0.3}>
            GARITA
          </text>
        </g>

        {/* Árboles */}
        {[[318, 66], [352, 372], [604, 356], [928, 330], [40, 480], [906, 460]].map(([cx, cy], i) => (
          <g key={i}>
            <ellipse cx={cx} cy={cy + 12} rx={13} ry={4} fill="#00000014" />
            <circle cx={cx} cy={cy} r={15} fill="url(#arbol)" />
          </g>
        ))}

        {hayReserva && (
          <text x={60} y={RESERVA_Y - 16} fontSize={12} fontWeight={700} fill="#004878" opacity={0.55} letterSpacing={0.3}>
            OTRAS ZONAS
          </text>
        )}

        {/* Plazas */}
        {items.map(({ zona, pos }) => {
          const color = COLOR_ESTADO[zona.estado] ?? '#9AA6B4';
          const activa = seleccion === zona.codigo;
          const transformRect = pos.ang !== 0 ? `rotate(${pos.ang} ${pos.x} ${pos.y})` : undefined;
          return (
            <g
              key={zona.id}
              className="plaza-croquis"
              onClick={() => onSelect(zona.codigo)}
              tabIndex={0}
              role="button"
              aria-label={`Zona ${zona.codigo}, ${zona.estado}`}
            >
              <rect
                x={pos.x - pos.w / 2}
                y={pos.y - pos.h / 2}
                width={pos.w}
                height={pos.h}
                rx={4}
                transform={transformRect}
                fill={color}
                opacity={zona.estado === EstadoZona.FUERA_DE_SERVICIO ? 0.7 : 1}
                stroke={activa ? '#003057' : 'rgba(255,255,255,0.85)'}
                strokeWidth={activa ? 3.5 : 1.4}
              />
              <text
                x={pos.x}
                y={pos.y + 3.5}
                fontSize={8.5}
                fontWeight={700}
                fill="#FFFFFF"
                textAnchor="middle"
                pointerEvents="none"
              >
                {zona.codigo}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
