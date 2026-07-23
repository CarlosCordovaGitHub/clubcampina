// PARQUEADERO — croquis interactivo fiel a la vista aérea del club.
// El estado vive en src/data/live.ts (compartido con el Inicio); hoy lo mueve
// una simulación y mañana el WebSocket /monitoreo del sistema de garita.
import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BrandHeader } from '../../src/components/Header';
import { Badge, Button, Card } from '../../src/components/UI';
import { COLOR_ESTADO, CroquisClub, VistaCroquis, VistaReq } from '../../src/components/CroquisClub';
import { colors, font, fontFamily, radius, shadow, spacing } from '../../src/theme';
import { ETIQUETA_BANDA, EstadoPlaza, PLAZAS, resumen } from '../../src/data/croquis';
import { useParqueaderoVivo } from '../../src/data/live';

const TONO_ESTADO: Record<EstadoPlaza, 'green' | 'red' | 'amber' | 'gris'> = {
  LIBRE: 'green',
  OCUPADA: 'red',
  RESERVADA: 'amber',
  FUERA_DE_SERVICIO: 'gris',
};

const NOMBRE_ESTADO: Record<EstadoPlaza, string> = {
  LIBRE: 'LIBRE',
  OCUPADA: 'OCUPADA',
  RESERVADA: 'RESERVADA',
  FUERA_DE_SERVICIO: 'FUERA DE SERVICIO',
};

export default function Parqueadero() {
  const { estados, pulso, ultimoCambio } = useParqueaderoVivo();
  const [seleccion, setSeleccion] = useState<string | null>(null);
  const [vista, setVista] = useState<VistaReq>({ tipo: 'TODO', n: 0 });
  const [soloLibres, setSoloLibres] = useState(false);
  const [notaReserva, setNotaReserva] = useState(false);

  // la nota "reserva en evaluación" pertenece a la plaza en la que se pulsó
  useEffect(() => setNotaReserva(false), [seleccion]);

  const onSelect = useCallback((codigo: string | null) => setSeleccion(codigo), []);
  const pedirVista = (tipo: VistaCroquis) => setVista((v) => ({ tipo, n: v.n + 1 }));

  const r = resumen(estados);
  const plazaSel = seleccion ? PLAZAS.find((p) => p.codigo === seleccion) ?? null : null;
  const estadoSel = plazaSel ? estados[plazaSel.codigo] : null;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <BrandHeader
        saludo="Estado en tiempo real"
        titulo="Parqueadero"
        right={<TickerEnVivo desde={ultimoCambio} />}
      />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* KPIs en vivo */}
        <View style={styles.kpis}>
          <Kpi valor={r.libres} label="Libres" color={colors.green} icon="checkmark-circle" />
          <Kpi valor={r.ocupadas} label="Ocupadas" color={colors.red} icon="close-circle" />
          <Kpi valor={r.reservadas} label="Reservadas" color={colors.amber} icon="bookmark" />
        </View>

        {/* Controles de vista */}
        <View style={styles.chipsRow}>
          <Chip texto="Ver todo" activo={vista.tipo === 'TODO'} onPress={() => pedirVista('TODO')} />
          <Chip texto="Trasero" activo={vista.tipo === 'TRASERO'} onPress={() => pedirVista('TRASERO')} />
          <Chip texto="Frontal" activo={vista.tipo === 'FRONTAL'} onPress={() => pedirVista('FRONTAL')} />
          <Chip
            texto="Solo libres"
            icono={soloLibres ? 'eye' : 'eye-outline'}
            activo={soloLibres}
            onPress={() => setSoloLibres((v) => !v)}
          />
        </View>

        {/* Croquis */}
        <Card level={2} style={{ padding: spacing(2.5) }}>
          <CroquisClub
            estados={estados}
            seleccion={seleccion}
            onSelect={onSelect}
            soloLibres={soloLibres}
            pulseCodigo={pulso}
            vista={vista}
          />
          <View style={styles.leyenda}>
            <Leyenda color={COLOR_ESTADO.LIBRE} texto="Libre" />
            <Leyenda color={COLOR_ESTADO.OCUPADA} texto="Ocupada" />
            <Leyenda color={COLOR_ESTADO.RESERVADA} texto="Reservada" />
            <Leyenda color={COLOR_ESTADO.FUERA_DE_SERVICIO} texto="F. de servicio" />
          </View>
          <Text style={styles.ayuda}>
            Pellizca para acercar · doble toque para zoom · toca una plaza para ver su detalle
          </Text>
        </Card>

        {/* Detalle de la plaza seleccionada */}
        {plazaSel && estadoSel ? (
          <Card style={{ marginTop: spacing(3) }} level={2}>
            <View style={styles.selRow}>
              <View style={[styles.selIcon, { backgroundColor: colors.skySoft }]}>
                <Ionicons
                  name={plazaSel.tipo === 'MOTOS' ? 'bicycle' : plazaSel.tipo === 'DISCAPACITADOS' ? 'accessibility' : 'car'}
                  size={22}
                  color={colors.navy}
                />
              </View>
              <View style={{ flex: 1, marginLeft: spacing(3) }}>
                <Text style={styles.selTitulo}>Plaza {plazaSel.codigo}</Text>
                <Text style={styles.selSub}>
                  {ETIQUETA_BANDA[plazaSel.banda]}
                  {plazaSel.tipo === 'DISCAPACITADOS' ? ' · preferencial' : ''}
                  {plazaSel.tipo === 'MOTOS' ? ' · motos' : ''}
                </Text>
              </View>
              <Badge tono={TONO_ESTADO[estadoSel]}>{NOMBRE_ESTADO[estadoSel]}</Badge>
            </View>
            {estadoSel === 'LIBRE' && (
              <>
                <Button
                  title={`Reservar la plaza ${plazaSel.codigo}`}
                  icon="bookmark"
                  variant="gold"
                  onPress={() => setNotaReserva(true)}
                  style={{ marginTop: spacing(3) }}
                />
                {notaReserva && (
                  <View style={styles.nota}>
                    <Ionicons name="hourglass-outline" size={16} color={colors.goldDeep} />
                    <Text style={styles.notaText}>
                      La reserva de plazas está en evaluación — se activará tras la propuesta formal al club.
                    </Text>
                  </View>
                )}
              </>
            )}
          </Card>
        ) : (
          <View style={styles.hint}>
            <Ionicons name="hand-left-outline" size={16} color={colors.textSoft} />
            <Text style={styles.hintText}>Toca una plaza del croquis para ver su detalle</Text>
          </View>
        )}

        {/* Nota de integración y fidelidad */}
        <View style={styles.infoBox}>
          <Ionicons name="map-outline" size={18} color={colors.sky} />
          <Text style={styles.infoText}>
            Esquema referencial basado en la vista aérea del club ({r.total} plazas de ejemplo,
            cantidades por confirmar). Los movimientos que ves son simulados: al entrar en operación la
            garita inteligente, el croquis se conectará en vivo al sistema de placas.
          </Text>
        </View>

        <View style={{ height: spacing(8) }} />
      </ScrollView>
    </View>
  );
}

/** Contador "hace Xs" con su propio intervalo: no re-renderiza la pantalla. */
function TickerEnVivo({ desde }: { desde: number }) {
  const [, setTick] = useState(0);
  useEffect(() => {
    const iv = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(iv);
  }, []);
  const seg = Math.max(0, Math.floor((Date.now() - desde) / 1000));
  return (
    <View style={styles.live}>
      <View style={styles.livePulse} />
      <Text style={styles.liveText}>{seg < 2 ? 'ahora' : `hace ${seg}s`}</Text>
    </View>
  );
}

function Kpi({ valor, label, color, icon }: { valor: number; label: string; color: string; icon: any }) {
  return (
    <View style={[styles.kpi, shadow(1)]}>
      <Ionicons name={icon} size={20} color={color} />
      <Text style={[styles.kpiValor, { color }]}>{valor}</Text>
      <Text style={styles.kpiLabel}>{label}</Text>
    </View>
  );
}

function Chip({
  texto,
  activo,
  onPress,
  icono,
}: {
  texto: string;
  activo: boolean;
  onPress: () => void;
  icono?: any;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, activo && styles.chipActivo]}>
      {icono && <Ionicons name={icono} size={14} color={activo ? '#fff' : colors.navy} />}
      <Text style={[styles.chipText, activo && { color: '#fff' }]}>{texto}</Text>
    </Pressable>
  );
}

function Leyenda({ color, texto }: { color: string; texto: string }) {
  return (
    <View style={styles.leyendaItem}>
      <View style={{ width: 11, height: 11, borderRadius: 3, backgroundColor: color }} />
      <Text style={styles.leyendaText}>{texto}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: spacing(5), paddingTop: spacing(4) },
  live: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.greenSoft,
    paddingHorizontal: spacing(2.5),
    paddingVertical: spacing(1.5),
    borderRadius: 999,
  },
  livePulse: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.green },
  liveText: { color: colors.green, fontSize: font.tiny, fontFamily: fontFamily.semibold },
  kpis: { flexDirection: 'row', gap: spacing(3) },
  kpi: { flex: 1, backgroundColor: '#fff', borderRadius: 16, padding: spacing(3.5), alignItems: 'center' },
  kpiValor: { fontSize: 24, fontFamily: fontFamily.semibold, marginTop: spacing(1) },
  kpiLabel: { fontSize: font.small, color: colors.textSoft, fontFamily: fontFamily.medium },
  chipsRow: { flexDirection: 'row', gap: spacing(2), marginVertical: spacing(4), flexWrap: 'wrap' },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: spacing(3.5),
    paddingVertical: spacing(2),
    borderRadius: 999,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colors.line,
  },
  chipActivo: { backgroundColor: colors.navy, borderColor: colors.navy },
  chipText: { fontSize: font.small, fontFamily: fontFamily.medium, color: colors.navy },
  leyenda: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing(4), marginTop: spacing(3), paddingHorizontal: spacing(1) },
  leyendaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  leyendaText: { fontSize: font.tiny, color: colors.textSoft, fontFamily: fontFamily.medium },
  ayuda: { fontSize: font.tiny, color: colors.textFaint, marginTop: spacing(2), paddingHorizontal: spacing(1) },
  selRow: { flexDirection: 'row', alignItems: 'center' },
  selIcon: { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  selTitulo: { fontSize: font.h3, fontFamily: fontFamily.semibold, color: colors.text },
  selSub: { fontSize: font.small, color: colors.textSoft, marginTop: 1 },
  nota: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing(2),
    backgroundColor: colors.amberSoft,
    borderRadius: radius.md,
    padding: spacing(3),
    marginTop: spacing(3),
  },
  notaText: { flex: 1, fontSize: font.small, color: '#7A5A1E', fontFamily: fontFamily.regular, lineHeight: 18 },
  hint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing(2),
    marginTop: spacing(3),
    paddingVertical: spacing(2),
  },
  hintText: { fontSize: font.small, color: colors.textSoft, fontFamily: fontFamily.regular },
  infoBox: {
    flexDirection: 'row',
    gap: spacing(3),
    backgroundColor: colors.skySoft,
    borderRadius: radius.md,
    padding: spacing(4),
    marginTop: spacing(4),
    alignItems: 'flex-start',
  },
  infoText: { flex: 1, fontSize: font.small, color: colors.navy, lineHeight: 19, fontFamily: fontFamily.regular },
});
