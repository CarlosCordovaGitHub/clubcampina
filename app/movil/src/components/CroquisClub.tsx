// ─────────────────────────────────────────────────────────────────────────────
// CROQUIS INTERACTIVO DEL CLUB — mapa SVG fiel a la vista aérea (parqueaderos.jpg)
// con paisaje (canchas, Casa Club, coliseo, vías, Av. Galo Plaza Lasso) y las
// plazas definidas en src/data/croquis.ts.
//
// Interacción (sin dependencias extra: PanResponder + Animated de RN core):
//   · pellizcar = zoom (1×–3×) · arrastrar = mover · doble toque = acercar/reset
//   · tocar una plaza = seleccionar · tocar el fondo = deseleccionar
//   · prop `vista` anima a presets (TODO / TRASERO / FRONTAL)
//   · con zoom ≥ 1.55 aparecen los códigos de plaza (A-07…)
// ─────────────────────────────────────────────────────────────────────────────
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, GestureResponderEvent, PanResponder, Pressable, StyleSheet, View } from 'react-native';
import Svg, { Circle, G, Line, Path, Rect, Text as SvgText } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { colors, shadow } from '../theme';
import { EstadoPlaza, PLAZAS, Plaza, VIEWBOX } from '../data/croquis';

export type VistaCroquis = 'TODO' | 'TRASERO' | 'FRONTAL';

/** Petición de vista con nonce: tocar el mismo chip vuelve a encuadrar. */
export type VistaReq = { tipo: VistaCroquis; n: number };

export const COLOR_ESTADO: Record<EstadoPlaza, string> = {
  LIBRE: '#2FBF71',
  OCUPADA: '#DF5B52',
  RESERVADA: '#E0A32E',
  FUERA_DE_SERVICIO: '#AEB9C6',
};

// foco (cx, cy en coords de viewBox) y escala de cada preset
const PRESETS: Record<VistaCroquis, { cx: number; cy: number; scale: number }> = {
  TODO: { cx: 500, cy: 700, scale: 1 },
  TRASERO: { cx: 300, cy: 430, scale: 1.85 },
  FRONTAL: { cx: 660, cy: 1080, scale: 1.85 },
};

const MIN_SCALE = 1;
const MAX_SCALE = 3;

export const CroquisClub = React.memo(function CroquisClub({
  estados,
  seleccion,
  onSelect,
  soloLibres,
  pulseCodigo,
  vista,
}: {
  estados: Record<string, EstadoPlaza>;
  seleccion: string | null;
  onSelect: (codigo: string | null) => void;
  soloLibres: boolean;
  pulseCodigo: string | null;
  vista: VistaReq;
}) {
  const [ancho, setAncho] = useState(340);
  const svgH = ancho * (VIEWBOX.h / VIEWBOX.w);
  const alto = svgH; // el mapa completo siempre visible (garita y Av. incluidas)

  const scaleAV = useRef(new Animated.Value(1)).current;
  const txAV = useRef(new Animated.Value(0)).current;
  const tyAV = useRef(new Animated.Value(0)).current;
  const cur = useRef({ scale: 1, tx: 0, ty: 0 });
  const inicioGesto = useRef({ scale: 1, tx: 0, ty: 0, dist: 0 });
  // El PanResponder se crea una sola vez: las dimensiones deben leerse por ref
  // (si no, sus callbacks quedan atados al ancho del primer render).
  const dims = useRef({ ancho, svgH });
  dims.current = { ancho, svgH };
  const [conCodigos, setConCodigos] = useState(false);
  const conCodigosRef = useRef(false);
  const tapRef = useRef<View>(null);

  useEffect(() => {
    const l1 = scaleAV.addListener(({ value }) => {
      cur.current.scale = value;
      const mostrar = value >= 1.55;
      if (mostrar !== conCodigosRef.current) {
        conCodigosRef.current = mostrar;
        setConCodigos(mostrar);
      }
    });
    const l2 = txAV.addListener(({ value }) => (cur.current.tx = value));
    const l3 = tyAV.addListener(({ value }) => (cur.current.ty = value));
    return () => {
      scaleAV.removeListener(l1);
      txAV.removeListener(l2);
      tyAV.removeListener(l3);
    };
  }, [scaleAV, txAV, tyAV]);

  const clampT = (v: number, dim: number, s: number) => {
    const max = (dim * (s - 1)) / 2 + dim * 0.06; // pequeño margen elástico
    return Math.max(-max, Math.min(max, v));
  };

  const animarA = (s: number, tx: number, ty: number) => {
    Animated.parallel([
      Animated.spring(scaleAV, { toValue: s, useNativeDriver: false, friction: 8 }),
      Animated.spring(txAV, { toValue: tx, useNativeDriver: false, friction: 8 }),
      Animated.spring(tyAV, { toValue: ty, useNativeDriver: false, friction: 8 }),
    ]).start();
  };

  const irAPreset = (v: VistaCroquis) => {
    const p = PRESETS[v];
    const tx = clampT((0.5 - p.cx / VIEWBOX.w) * ancho * p.scale, ancho, p.scale);
    const ty = clampT((0.5 - p.cy / VIEWBOX.h) * svgH * p.scale, svgH, p.scale);
    animarA(p.scale, p.scale === 1 ? 0 : tx, p.scale === 1 ? 0 : ty);
  };

  // el preset pedido desde la pantalla (chips "Ver todo / Trasero / Frontal");
  // `vista.n` permite re-encuadrar aunque el tipo no cambie
  useEffect(() => {
    irAPreset(vista.tipo);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vista, ancho]);

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_e, g) =>
        g.numberActiveTouches === 2 || Math.abs(g.dx) + Math.abs(g.dy) > 10,
      onPanResponderGrant: () => {
        inicioGesto.current = { ...cur.current, dist: 0 };
      },
      onPanResponderMove: (e, g) => {
        const touches = e.nativeEvent.touches;
        if (touches.length >= 2) {
          const dx = touches[0].pageX - touches[1].pageX;
          const dy = touches[0].pageY - touches[1].pageY;
          const dist = Math.hypot(dx, dy);
          if (inicioGesto.current.dist === 0) {
            inicioGesto.current.dist = dist;
            inicioGesto.current.scale = cur.current.scale;
          } else {
            const nuevo = Math.max(
              MIN_SCALE,
              Math.min(MAX_SCALE, (inicioGesto.current.scale * dist) / inicioGesto.current.dist),
            );
            scaleAV.setValue(nuevo);
          }
          // re-basar la traslación: al soltar un dedo, el arrastre continúa
          // desde aquí en vez de saltar por el dx/dy acumulado del pinch
          inicioGesto.current.tx = cur.current.tx - g.dx;
          inicioGesto.current.ty = cur.current.ty - g.dy;
        } else {
          inicioGesto.current.dist = 0;
          txAV.setValue(inicioGesto.current.tx + g.dx);
          tyAV.setValue(inicioGesto.current.ty + g.dy);
        }
      },
      onPanResponderRelease: () => {
        const { ancho: w, svgH: h } = dims.current;
        const s = cur.current.scale;
        if (s <= 1.04) {
          animarA(1, 0, 0);
        } else {
          animarA(s, clampT(cur.current.tx, w, s), clampT(cur.current.ty, h, s));
        }
      },
      onPanResponderTerminationRequest: () => true,
    }),
  ).current;

  // ── Toques sobre el mapa: hit-testing propio (fiable en web y nativo) ─────
  // locationX/Y llegan en el espacio local del contenido (pre-transformación),
  // así que basta escalar a coordenadas del viewBox y buscar la plaza más
  // cercana — esto además da un radio táctil generoso a plazas pequeñas.
  const tapPendiente = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (tapPendiente.current) clearTimeout(tapPendiente.current);
  }, []);

  const plazaEn = (vx: number, vy: number): Plaza | null => {
    let mejor: Plaza | null = null;
    let mejorD = Infinity;
    for (const p of PLAZAS) {
      const d = (p.x - vx) ** 2 + (p.y - vy) ** 2;
      if (d < mejorD) {
        mejorD = d;
        mejor = p;
      }
    }
    // radio táctil ~26 unidades de viewBox (una plaza mide 18×44)
    return mejor && mejorD <= 26 * 26 ? mejor : null;
  };

  const zoomHacia = (lx: number | null, ly: number | null) => {
    if (cur.current.scale > 1.3) {
      animarA(1, 0, 0);
      return;
    }
    const s = 2;
    const tx = lx != null ? clampT((0.5 - lx / ancho) * ancho * s, ancho, s) : 0;
    const ty = ly != null ? clampT((0.5 - ly / svgH) * svgH * s, svgH, s) : 0;
    animarA(s, tx, ty);
  };

  // Resuelve el punto del toque en coordenadas locales del contenido.
  // Cobertura por plataforma:
  //  · nativo → locationX (ya viene en espacio local, pre-transformación)
  //  · web con mouse → offsetX (el navegador aplica la transformación inversa)
  //  · web táctil → los Touch del DOM no traen offsetX: se usa pageX contra el
  //    rect transformado del propio nodo (measureInWindow ≙ getBoundingClientRect)
  //    y se mapea por fracción — válido con cualquier escala/traslación.
  const resolverPunto = (
    e: GestureResponderEvent,
    cb: (p: { x: number; y: number } | null) => void,
  ) => {
    const ne: any = e?.nativeEvent ?? {};
    if (typeof ne.locationX === 'number') return cb({ x: ne.locationX, y: ne.locationY });
    if (typeof ne.offsetX === 'number') return cb({ x: ne.offsetX, y: ne.offsetY });
    const t = ne.changedTouches?.[0];
    const px = ne.pageX ?? t?.pageX;
    const py = ne.pageY ?? t?.pageY;
    const nodo: any = tapRef.current;
    if (typeof px !== 'number' || !nodo?.measureInWindow) return cb(null);
    nodo.measureInWindow((x: number, y: number, w: number, h: number) => {
      if (!(w > 0) || !(h > 0)) return cb(null);
      cb({ x: ((px - x) / w) * ancho, y: ((py - y) / h) * svgH });
    });
  };

  const onTapMapa = (e: GestureResponderEvent) => {
    resolverPunto(e, (punto) => {
      if (tapPendiente.current) {
        // doble toque: acercar hacia el punto tocado / volver a vista completa
        clearTimeout(tapPendiente.current);
        tapPendiente.current = null;
        zoomHacia(punto?.x ?? null, punto?.y ?? null);
        return;
      }
      tapPendiente.current = setTimeout(() => {
        tapPendiente.current = null;
        if (!punto) return;
        const plaza = plazaEn((punto.x / ancho) * VIEWBOX.w, (punto.y / svgH) * VIEWBOX.h);
        onSelect(plaza ? plaza.codigo : null);
      }, 240);
    });
  };

  const zoomBoton = (factor: number) => {
    const s = Math.max(MIN_SCALE, Math.min(MAX_SCALE, cur.current.scale * factor));
    animarA(s, clampT(cur.current.tx, ancho, s), clampT(cur.current.ty, svgH, s));
  };

  const paisaje = useMemo(() => <Paisaje />, []);

  return (
    <View
      style={[styles.marco, { height: alto }]}
      onLayout={(e) => setAncho(e.nativeEvent.layout.width)}
      {...pan.panHandlers}
    >
      <Animated.View
        style={{
          width: ancho,
          height: svgH,
          transform: [{ translateX: txAV }, { translateY: tyAV }, { scale: scaleAV }],
        }}
      >
        <Pressable ref={tapRef} style={{ width: ancho, height: svgH }} onPress={onTapMapa}>
          <Svg width="100%" height="100%" viewBox={`0 0 ${VIEWBOX.w} ${VIEWBOX.h}`} pointerEvents="none">
            <Rect x={0} y={0} width={VIEWBOX.w} height={VIEWBOX.h} fill="#E2EDDF" />
            {paisaje}
            {PLAZAS.map((p) => {
              const estado = estados[p.codigo] ?? 'LIBRE';
              return (
                <PlazaRect
                  key={p.codigo}
                  plaza={p}
                  estado={estado}
                  seleccionada={seleccion === p.codigo}
                  atenuada={soloLibres && estado !== 'LIBRE'}
                  pulso={pulseCodigo === p.codigo}
                  conCodigo={conCodigos}
                />
              );
            })}
          </Svg>
        </Pressable>
      </Animated.View>

      {/* controles de zoom */}
      <View style={styles.zoomCol}>
        <Pressable style={[styles.zoomBtn, shadow(1)]} onPress={() => zoomBoton(1.45)}>
          <Ionicons name="add" size={20} color={colors.navy} />
        </Pressable>
        <Pressable style={[styles.zoomBtn, shadow(1)]} onPress={() => zoomBoton(1 / 1.45)}>
          <Ionicons name="remove" size={20} color={colors.navy} />
        </Pressable>
        <Pressable style={[styles.zoomBtn, shadow(1)]} onPress={() => irAPreset('TODO')}>
          <Ionicons name="scan-outline" size={17} color={colors.navy} />
        </Pressable>
      </View>
    </View>
  );
});

// ── Una plaza ────────────────────────────────────────────────────────────────

const PlazaRect = React.memo(function PlazaRect({
  plaza,
  estado,
  seleccionada,
  atenuada,
  pulso,
  conCodigo,
}: {
  plaza: Plaza;
  estado: EstadoPlaza;
  seleccionada: boolean;
  atenuada: boolean;
  pulso: boolean;
  conCodigo: boolean;
}) {
  const { x, y, w, h, ang } = plaza;
  const transform = ang !== 0 ? `rotate(${ang} ${x} ${y})` : undefined;
  return (
    <G opacity={atenuada ? 0.18 : 1}>
      <Rect
        x={x - w / 2}
        y={y - h / 2}
        width={w}
        height={h}
        rx={3}
        transform={transform}
        fill={COLOR_ESTADO[estado]}
        opacity={estado === 'FUERA_DE_SERVICIO' ? 0.7 : 0.95}
        stroke={seleccionada ? colors.navyDeep : pulso ? colors.gold : '#FFFFFF'}
        strokeWidth={seleccionada ? 4 : pulso ? 4 : 1}
      />
      {plaza.tipo === 'DISCAPACITADOS' && (
        <Circle cx={x} cy={y - h / 2 - 7} r={5} fill={colors.sky} transform={transform} />
      )}
      {conCodigo && (
        <SvgText
          x={x}
          y={y + 2.5}
          fontSize={7.5}
          fontWeight="bold"
          fill="#FFFFFF"
          textAnchor="middle"
          transform={transform}
        >
          {plaza.codigo}
        </SvgText>
      )}
    </G>
  );
});

// ── Paisaje del club (estático) ──────────────────────────────────────────────

function Paisaje() {
  return (
    <G pointerEvents="none">
      {/* Av. Galo Plaza Lasso */}
      <Rect x={0} y={1300} width={1000} height={100} fill="#8D99AB" />
      <Line x1={0} y1={1350} x2={1000} y2={1350} stroke="#FFFFFF" strokeWidth={3} strokeDasharray="26 20" opacity={0.8} />
      <SvgText x={500} y={1338} fontSize={22} fontWeight="bold" fill="#FFFFFF" textAnchor="middle" opacity={0.9}>
        Av. Galo Plaza Lasso
      </SvgText>

      {/* Vías internas */}
      <Path
        d="M 470 110 V 690 Q 470 780 512 860 Q 545 930 545 1005 V 1150"
        stroke="#D7DEE8" strokeWidth={58} strokeLinecap="round" fill="none"
      />
      <Path d="M 545 1150 H 895" stroke="#D7DEE8" strokeWidth={54} strokeLinecap="round" fill="none" />
      <Path d="M 872 1150 V 1300" stroke="#D7DEE8" strokeWidth={54} fill="none" />
      <Path
        d="M 470 130 V 690 Q 470 780 512 860 Q 545 930 545 1005 V 1140"
        stroke="#FFFFFF" strokeWidth={3} strokeDasharray="16 14" fill="none" opacity={0.75}
      />
      {/* pasillos de las bandas traseras */}
      {[247, 381, 515].map((y) => (
        <Rect key={y} x={62} y={y - 8} width={390} height={16} fill="#D7DEE8" opacity={0.55} rx={8} />
      ))}

      {/* Canchas de tenis (arcilla) */}
      <G>
        <Rect x={40} y={25} width={170} height={88} rx={6} fill="#D9A47C" />
        <Line x1={125} y1={25} x2={125} y2={113} stroke="#F1DCC8" strokeWidth={3} />
        <Rect x={40} y={540} width={130} height={110} rx={6} fill="#D9A47C" />
        <Rect x={40} y={664} width={130} height={110} rx={6} fill="#D9A47C" />
        <Line x1={40} y1={595} x2={170} y2={595} stroke="#F1DCC8" strokeWidth={3} />
        <Line x1={40} y1={719} x2={170} y2={719} stroke="#F1DCC8" strokeWidth={3} />
        <SvgText x={105} y={800} fontSize={17} fontWeight="bold" fill="#8A6A4D" textAnchor="middle">Tenis</SvgText>
        <SvgText x={125} y={135} fontSize={17} fontWeight="bold" fill="#8A6A4D" textAnchor="middle">Tenis</SvgText>
      </G>

      {/* Canchas de fútbol */}
      <G>
        <Rect x={560} y={55} width={390} height={365} rx={10} fill="#CBE3C6" />
        <Rect x={600} y={90} width={310} height={295} fill="none" stroke="#FFFFFF" strokeWidth={3} opacity={0.85} />
        <Line x1={600} y1={237} x2={910} y2={237} stroke="#FFFFFF" strokeWidth={3} opacity={0.85} />
        <Circle cx={755} cy={237} r={38} fill="none" stroke="#FFFFFF" strokeWidth={3} opacity={0.85} />
        <SvgText x={755} y={452} fontSize={18} fontWeight="bold" fill="#5E8A57" textAnchor="middle">Canchas de fútbol</SvgText>
      </G>

      {/* Vóley arena */}
      <Rect x={848} y={478} width={100} height={90} rx={8} fill="#EAD9B0" />
      <SvgText x={898} y={590} fontSize={15} fontWeight="bold" fill="#A08A56" textAnchor="middle">Arena</SvgText>

      {/* Coliseo / piscina */}
      <G>
        <Rect x={60} y={840} width={290} height={200} rx={10} fill="#F0F3F7" stroke="#C9D4E4" strokeWidth={3} />
        {[895, 940, 985].map((y) => (
          <Line key={y} x1={75} y1={y} x2={335} y2={y} stroke="#C9D4E4" strokeWidth={4} />
        ))}
        <SvgText x={205} y={1070} fontSize={17} fontWeight="bold" fill={colors.textSoft} textAnchor="middle">Coliseo · Piscina</SvgText>
      </G>

      {/* Bohíos */}
      <Circle cx={165} cy={1150} r={40} fill="#E8E2D8" stroke="#CDBFA8" strokeWidth={3} />
      <Circle cx={290} cy={1180} r={30} fill="#E8E2D8" stroke="#CDBFA8" strokeWidth={3} />

      {/* Casa Club */}
      <G>
        <Rect x={575} y={870} width={355} height={215} rx={12} fill="#B5543C" />
        <Path d="M 575 977 H 930" stroke="#8E3E2C" strokeWidth={5} />
        <Path d="M 700 870 V 1085 M 815 870 V 1085" stroke="#8E3E2C" strokeWidth={4} opacity={0.7} />
        <Rect x={640} y={1085} width={220} height={16} fill="#F1E9E0" />
        <SvgText x={752} y={962} fontSize={22} fontWeight="bold" fill="#FFF3EC" textAnchor="middle">Casa Club</SvgText>
      </G>

      {/* Cafetería */}
      <Rect x={585} y={720} width={72} height={64} rx={8} fill="#F7F3EA" stroke="#D8CBB2" strokeWidth={3} />

      {/* Garita (única entrada / salida) */}
      <G>
        <Rect x={905} y={1180} width={46} height={36} rx={6} fill="#FFFFFF" stroke={colors.navy} strokeWidth={3} />
        <Line x1={845} y1={1188} x2={899} y2={1214} stroke={colors.gold} strokeWidth={6} strokeLinecap="round" />
        <SvgText x={928} y={1245} fontSize={15} fontWeight="bold" fill={colors.navy} textAnchor="middle">Garita</SvgText>
      </G>

      {/* Árboles */}
      {[
        [100, 220], [95, 330], [105, 435], [360, 790], [420, 1250], [340, 1265],
        [940, 700], [930, 790], [500, 1245],
      ].map(([cx, cy], i) => (
        <Circle key={i} cx={cx} cy={cy} r={16} fill="#A7C8A1" opacity={0.85} />
      ))}

      {/* Rótulos de bloques y bandas */}
      <SvgText x={255} y={112} fontSize={19} fontWeight="bold" fill={colors.navy} opacity={0.55} textAnchor="middle">
        PARQUEADERO TRASERO
      </SvgText>
      <SvgText x={430} y={1198} fontSize={17} fontWeight="bold" fill={colors.navy} opacity={0.55} textAnchor="middle">
        P. FRONTAL
      </SvgText>
      {[
        ['A', 44, 188], ['B', 44, 322], ['C', 44, 456], ['D', 176, 590], ['E', 176, 724], ['G', 848, 622],
      ].map(([id, x, y]) => (
        <SvgText key={String(id)} x={Number(x)} y={Number(y)} fontSize={26} fontWeight="bold" fill={colors.navy} opacity={0.35} textAnchor="middle">
          {id}
        </SvgText>
      ))}

      {/* Norte aproximado (la foto aérea está rotada) */}
      <G transform="rotate(-32 935 85)">
        <Line x1={935} y1={105} x2={935} y2={62} stroke={colors.navy} strokeWidth={4} strokeLinecap="round" opacity={0.6} />
        <Path d="M 935 52 L 926 70 L 944 70 Z" fill={colors.navy} opacity={0.6} />
        <SvgText x={935} y={128} fontSize={16} fontWeight="bold" fill={colors.navy} opacity={0.6} textAnchor="middle">N</SvgText>
      </G>
    </G>
  );
}

const styles = StyleSheet.create({
  marco: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#E2EDDF',
  },
  zoomCol: {
    position: 'absolute',
    right: 10,
    bottom: 10,
    gap: 8,
  },
  zoomBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
