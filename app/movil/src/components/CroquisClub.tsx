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
  TRASERO: { cx: 400, cy: 400, scale: 1.7 },
  FRONTAL: { cx: 790, cy: 1200, scale: 1.9 },
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
  // viewBox 1000×1460 · vista "desde la garita": norte = arriba, Av. al sur.
  return (
    <G pointerEvents="none">
      {/* ── Av. Galo Plaza Lasso (única salida, al sur) ── */}
      <Rect x={0} y={1372} width={1000} height={88} fill="#8D99AB" />
      <Line x1={0} y1={1416} x2={1000} y2={1416} stroke="#FFFFFF" strokeWidth={3} strokeDasharray="26 20" opacity={0.8} />
      <SvgText x={430} y={1404} fontSize={21} fontWeight="bold" fill="#FFFFFF" textAnchor="middle" opacity={0.9}>
        Av. Galo Plaza Lasso
      </SvgText>

      {/* ── Vías internas ──
           · acceso norte al lote principal
           · CALLE que baja por el costado OESTE de la Casa Club y conecta el
             parqueadero trasero con la explanada de la entrada
           · frente de la garita sobre la Av. */}
      <Path
        d="M 616 118 V 240 M 560 800 L 560 1082 Q 560 1120 602 1124 L 792 1124"
        stroke="#D7DEE8" strokeWidth={42} strokeLinecap="round" strokeLinejoin="round" fill="none"
      />
      <Path
        d="M 560 806 L 560 1082 Q 560 1118 602 1122 L 700 1122"
        stroke="#FFFFFF" strokeWidth={3} strokeDasharray="16 14" fill="none" opacity={0.7}
      />

      {/* ── Base de PAVIMENTO del parqueadero principal (todo el lote es asfalto) ── */}
      {/* una sola figura en "L": cuerpo A–D arriba + playón G abajo-derecha */}
      <Path
        d="M 240 150 L 620 150 L 620 542 L 800 542 L 800 802 L 452 802 L 452 640 L 240 640 Z"
        fill="#C6CDD5" stroke="#C6CDD5" strokeWidth={22} strokeLinejoin="round"
      />

      {/* pasillos de circulación dentro del lote (líneas de aparcamiento) */}
      {[
        [244, 200, 332], [244, 324, 332], [244, 448, 332], [270, 572, 284], [480, 728, 296],
      ].map(([x, y, w], i) => (
        <Rect key={i} x={Number(x)} y={Number(y) - 7} width={Number(w)} height={14} rx={7} fill="#EAEEF2" opacity={0.85} />
      ))}

      {/* ── Gran complejo de canchas de tenis (costado noroeste) ── */}
      <G>
        {/* franja de canchas pequeñas arriba */}
        {[0, 1, 2].map((c) => (
          <G key={`s${c}`}>
            <Rect x={30 + c * 66} y={40} width={60} height={92} rx={4} fill="#D9A47C" />
            <Rect x={30 + c * 66} y={40} width={60} height={92} rx={4} fill="none" stroke="#F1DCC8" strokeWidth={2} />
            <Line x1={30 + c * 66} y1={86} x2={90 + c * 66} y2={86} stroke="#F1DCC8" strokeWidth={2} opacity={0.7} />
          </G>
        ))}
        {/* bloque principal de canchas: 2 columnas × 3 filas */}
        {Array.from({ length: 6 }).map((_, i) => {
          const col = i % 2;
          const row = Math.floor(i / 2);
          const x = 18 + col * 110;
          const y = 156 + row * 178;
          return (
            <G key={i}>
              <Rect x={x} y={y} width={104} height={166} rx={5} fill="#D9A47C" />
              <Rect x={x} y={y} width={104} height={166} rx={5} fill="none" stroke="#F1DCC8" strokeWidth={2.5} />
              <Line x1={x} y1={y + 83} x2={x + 104} y2={y + 83} stroke="#F1DCC8" strokeWidth={2} opacity={0.8} />
            </G>
          );
        })}
        <SvgText x={128} y={712} fontSize={16} fontWeight="bold" fill="#8A6A4D" textAnchor="middle">Canchas de tenis</SvgText>
      </G>

      {/* ── Canchas de fútbol / campos abiertos (costado este) ── */}
      <G>
        <Rect x={648} y={56} width={330} height={470} rx={10} fill="#CBE3C6" />
        <Rect x={682} y={92} width={262} height={210} fill="none" stroke="#FFFFFF" strokeWidth={3} opacity={0.85} />
        <Line x1={682} y1={197} x2={944} y2={197} stroke="#FFFFFF" strokeWidth={3} opacity={0.85} />
        <Circle cx={813} cy={197} r={30} fill="none" stroke="#FFFFFF" strokeWidth={3} opacity={0.85} />
        <Rect x={682} y={330} width={262} height={166} fill="none" stroke="#FFFFFF" strokeWidth={3} opacity={0.7} />
        <SvgText x={813} y={508} fontSize={16} fontWeight="bold" fill="#FFFFFF" textAnchor="middle" opacity={0.9}>Canchas de fútbol</SvgText>
      </G>

      {/* ── Dos canchas de tenis sueltas en el borde este ── */}
      {[560, 660].map((y, i) => (
        <G key={i}>
          <Rect x={906} y={y} width={80} height={88} rx={5} fill="#D9A47C" />
          <Rect x={906} y={y} width={80} height={88} rx={5} fill="none" stroke="#F1DCC8" strokeWidth={2} />
          <Line x1={946} y1={y} x2={946} y2={y + 88} stroke="#F1DCC8" strokeWidth={2} opacity={0.7} />
        </G>
      ))}

      {/* ── Coliseo · Piscina ───────────────────────────────────────────────
           Nave grande de cubierta clara abovedada (piscina cubierta) + edificio
           anexo de servicios con lucernarios + piscina exterior + dos bohíos de
           techo cónico + quiosco de teja. */}
      <G>
        {/* sombra base del conjunto */}
        <Rect x={52} y={956} width={356} height={214} rx={18} fill="#00000010" />

        {/* edificio anexo (servicios / gimnasio) */}
        <Rect x={44} y={934} width={116} height={170} rx={8} fill="#B4BCC6" stroke="#8F98A5" strokeWidth={2.5} />
        {[[60, 952], [96, 952], [60, 996], [96, 996], [60, 1040], [96, 1040]].map(([x, y], i) => (
          <Rect key={i} x={Number(x)} y={Number(y)} width={26} height={26} rx={3} fill="#7E8794" />
        ))}

        {/* nave principal — cubierta abovedada clara */}
        <Rect x={166} y={944} width={230} height={152} rx={18} fill="#EEF1F5" stroke="#BFC7D2" strokeWidth={3} />
        <Rect x={166} y={1010} width={230} height={16} rx={6} fill="#FFFFFF" opacity={0.9} />
        {[966, 986, 1006, 1034, 1054, 1074].map((y) => (
          <Line key={y} x1={180} y1={y} x2={382} y2={y} stroke="#D3DAE3" strokeWidth={3} />
        ))}
        <Rect x={166} y={944} width={12} height={152} rx={4} fill="#DBE1EA" />
        <Rect x={384} y={944} width={12} height={152} rx={4} fill="#DBE1EA" />

        {/* piscina exterior */}
        <Rect x={330} y={1108} width={78} height={52} rx={6} fill="#7FB4D8" stroke="#5E93BA" strokeWidth={2.5} />
        {[1120, 1134, 1148].map((y) => (
          <Line key={y} x1={336} y1={y} x2={402} y2={y} stroke="#DCEAF4" strokeWidth={2} opacity={0.8} />
        ))}

        {/* dos bohíos (techo cónico con varillas) */}
        {[[150, 1152], [252, 1164]].map(([cx, cy], i) => (
          <G key={i}>
            <Circle cx={Number(cx)} cy={Number(cy) + 4} r={42} fill="#00000010" />
            <Circle cx={Number(cx)} cy={Number(cy)} r={42} fill="#CDB68E" stroke="#A98D62" strokeWidth={3} />
            {Array.from({ length: 12 }).map((_, k) => {
              const a = (k * Math.PI) / 6;
              return (
                <Line
                  key={k}
                  x1={Number(cx)}
                  y1={Number(cy)}
                  x2={Number(cx) + Math.cos(a) * 42}
                  y2={Number(cy) + Math.sin(a) * 42}
                  stroke="#A98D62"
                  strokeWidth={1.6}
                  opacity={0.75}
                />
              );
            })}
            <Circle cx={Number(cx)} cy={Number(cy)} r={5} fill="#8A7050" />
          </G>
        ))}

        {/* quiosco de teja (techo naranja a dos aguas) */}
        <Rect x={318} y={1176} width={62} height={46} rx={6} fill="#C15C3C" stroke="#9E4730" strokeWidth={2.5} />
        <Line x1={349} y1={1176} x2={349} y2={1222} stroke="#9E4730" strokeWidth={3} />

        <SvgText x={214} y={1252} fontSize={15} fontWeight="bold" fill={colors.textSoft} textAnchor="middle">
          Coliseo · Piscina
        </SvgText>
      </G>

      {/* ── Casa Club: pabellones de techo de teja (cubiertas a cuatro aguas) +
           ala de servicios gris + porche naranja ── */}
      <G>
        {/* ala de servicios (gris, techo plano) al costado oeste */}
        <Rect x={596} y={912} width={96} height={168} rx={8} fill="#8C949F" stroke="#727A86" strokeWidth={2.5} />
        {[948, 990, 1032].map((y) => (
          <Line key={y} x1={606} y1={y} x2={682} y2={y} stroke="#6E7681" strokeWidth={3} opacity={0.7} />
        ))}

        {/* porche / anexo de teja naranja */}
        <Rect x={614} y={1060} width={74} height={46} rx={6} fill="#D08A3C" stroke="#A96C24" strokeWidth={2.5} />
        <Line x1={651} y1={1060} x2={651} y2={1106} stroke="#A96C24" strokeWidth={3} />

        {/* pabellones a cuatro aguas (pirámide con 4 faldones sombreados) */}
        {[
          [688, 866, 152, 152],
          [832, 832, 112, 112],
          [806, 958, 146, 138],
          [640, 984, 88, 88],
        ].map(([x, y, w, h], i) => {
          const cx = x + w / 2;
          const cy = y + h / 2;
          return (
            <G key={i}>
              <Rect x={x + 4} y={y + 6} width={w} height={h} rx={6} fill="#00000012" />
              <Path d={`M ${x} ${y} L ${x + w} ${y} L ${cx} ${cy} Z`} fill="#CB6C4C" />
              <Path d={`M ${x + w} ${y} L ${x + w} ${y + h} L ${cx} ${cy} Z`} fill="#B85B41" />
              <Path d={`M ${x + w} ${y + h} L ${x} ${y + h} L ${cx} ${cy} Z`} fill="#9E4A38" />
              <Path d={`M ${x} ${y + h} L ${x} ${y} L ${cx} ${cy} Z`} fill="#AF553E" />
              <Path
                d={`M ${x} ${y} L ${cx} ${cy} L ${x + w} ${y} M ${x + w} ${y + h} L ${cx} ${cy} L ${x} ${y + h}`}
                stroke="#84392B" strokeWidth={2.5} fill="none" strokeLinejoin="round"
              />
              <Rect x={x} y={y} width={w} height={h} rx={6} fill="none" stroke="#84392B" strokeWidth={2} />
            </G>
          );
        })}

        <SvgText x={782} y={946} fontSize={20} fontWeight="bold" fill="#FFF3EC" textAnchor="middle"
          stroke="#7A3325" strokeWidth={0.6}>
          Casa Club
        </SvgText>
      </G>

      {/* ── ENTRADA: explanada de 8 plazas → garita → acceso abocinado a la Av. ──
           Se apila de arriba a abajo con separación clara:
           explanada (2 filas de 4) · garita · calzada con flechas de sentido. */}
      <G>
        {/* explanada de las 8 plazas */}
        <Path
          d="M 616 1100 L 912 1100 L 912 1256 L 616 1256 Z"
          fill="#C6CDD5" stroke="#C6CDD5" strokeWidth={16} strokeLinejoin="round"
        />
        {/* calzada de acceso, abocinada al llegar a la Av. */}
        <Path
          d="M 720 1250 L 824 1250 L 842 1322 C 850 1350 862 1368 876 1384 L 668 1384 C 682 1368 694 1350 702 1322 Z"
          fill="#C6CDD5" stroke="#C6CDD5" strokeWidth={8} strokeLinejoin="round"
        />

        {/* garita: caseta sobre la calzada + pluma */}
        <Rect x={750} y={1268} width={44} height={32} rx={5} fill="#FFFFFF" stroke={colors.navy} strokeWidth={3} />
        <Line x1={746} y1={1312} x2={800} y2={1320} stroke={colors.gold} strokeWidth={5} strokeLinecap="round" />
        <SvgText x={772} y={1262} fontSize={13} fontWeight="bold" fill={colors.navy} textAnchor="middle">Garita</SvgText>

        {/* eje de sentidos + flechas (con espacio, debajo de la garita) */}
        <Line x1={772} y1={1300} x2={772} y2={1380} stroke="#FFFFFF" strokeWidth={3} strokeDasharray="14 12" opacity={0.75} />
        <Path d="M 744 1372 L 744 1330 M 736 1344 L 744 1330 L 752 1344" stroke="#FFFFFF" strokeWidth={3.5} fill="none" strokeLinecap="round" strokeLinejoin="round" opacity={0.9} />
        <Path d="M 800 1330 L 800 1372 M 792 1358 L 800 1372 L 808 1358" stroke="#FFFFFF" strokeWidth={3.5} fill="none" strokeLinecap="round" strokeLinejoin="round" opacity={0.9} />
      </G>

      {/* ── Árboles ── */}
      {[
        [252, 150], [430, 640], [300, 720], [430, 720], [560, 736],
        [640, 640], [960, 540], [430, 1010], [470, 1150], [980, 780],
      ].map(([cx, cy], i) => (
        <Circle key={i} cx={cx} cy={cy} r={15} fill="#A7C8A1" opacity={0.85} />
      ))}

      {/* ── Rótulos de bloques y bandas ── */}
      <SvgText x={430} y={126} fontSize={19} fontWeight="bold" fill={colors.navy} opacity={0.55} textAnchor="middle">
        PARQUEADERO PRINCIPAL
      </SvgText>
      <SvgText x={862} y={1180} fontSize={13} fontWeight="bold" fill={colors.navy} opacity={0.5} textAnchor="middle">
        ENTRADA
      </SvgText>
      {[
        ['A', 232, 206], ['B', 232, 330], ['C', 232, 454], ['D', 258, 578],
        ['V', 636, 186], ['G', 470, 776],
      ].map(([id, x, y]) => (
        <SvgText key={String(id)} x={Number(x)} y={Number(y)} fontSize={22} fontWeight="bold" fill={colors.navy} opacity={0.32} textAnchor="middle">
          {id}
        </SvgText>
      ))}

      {/* ── Norte aproximado (la vista aérea está rotada) ── */}
      <G transform="rotate(-30 946 92)">
        <Line x1={946} y1={112} x2={946} y2={66} stroke={colors.navy} strokeWidth={4} strokeLinecap="round" opacity={0.6} />
        <Path d="M 946 56 L 937 74 L 955 74 Z" fill={colors.navy} opacity={0.6} />
        <SvgText x={946} y={134} fontSize={15} fontWeight="bold" fill={colors.navy} opacity={0.6} textAnchor="middle">N</SvgText>
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
