// INICIO — panel del socio: estado del parqueadero, accesos rápidos, próxima
// reserva, invitados de hoy y noticias destacadas.
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { BrandHeader } from '../../src/components/Header';
import { Badge, Button, Card, IconCircle, SectionTitle } from '../../src/components/UI';
import { colors, font, fontFamily, gradients, radius, shadow, spacing } from '../../src/theme';
import { invitados, misReservas, noticias, socio } from '../../src/data/mock';
import { resumen } from '../../src/data/croquis';
import { sesionSocioStore, useParqueaderoVivo } from '../../src/data/live';

export default function Inicio() {
  // mismo estado en vivo que el tab Parqueadero (simulación hoy, WebSocket mañana)
  const { estados } = useParqueaderoVivo();
  const { fotoFacial } = sesionSocioStore.useStore();
  const r = resumen(estados);
  const pct = Math.round((r.libres / r.total) * 100);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <BrandHeader
        saludo="Buenas tardes,"
        titulo={socio.tratamiento}
        avatar={socio.avatarIniciales}
        right={
          <Pressable style={styles.bell} hitSlop={8}>
            <Ionicons name="notifications-outline" size={22} color={colors.navy} />
            <View style={styles.dot} />
          </Pressable>
        }
      />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Estado del parqueadero en vivo */}
        <Card onPress={() => router.push('/(tabs)/parqueadero')} level={2}>
          <View style={styles.rowBetween}>
            <View style={styles.rowCenter}>
              <IconCircle name="car-sport" bg={colors.skySoft} color={colors.sky} />
              <View style={{ marginLeft: spacing(3) }}>
                <Text style={styles.cardTitle}>Parqueadero en vivo</Text>
                <Text style={styles.cardSub}>Actualizado hace instantes</Text>
              </View>
            </View>
            <View style={styles.live}>
              <View style={styles.livePulse} />
              <Text style={styles.liveText}>EN VIVO</Text>
            </View>
          </View>

          <View style={styles.barTrack}>
            <View style={[styles.barFill, { width: `${100 - pct}%` }]} />
          </View>
          <View style={styles.rowBetween}>
            <Text style={styles.libres}>
              <Text style={{ color: colors.green, fontFamily: fontFamily.semibold }}>{r.libres}</Text> plazas libres de {r.total}
            </Text>
            <Text style={styles.verMas}>Ver croquis ›</Text>
          </View>
        </Card>

        {/* Accesos rápidos */}
        <View style={styles.quickRow}>
          <Quick icono="calendar" label="Reservar" tint={colors.sky} onPress={() => router.push('/(tabs)/reservas')} />
          <Quick icono="person-add" label="Invitar" tint={colors.green} onPress={() => router.push('/invitado-nuevo')} />
          <Quick icono="qr-code" label="Mi acceso" tint={colors.goldDeep} onPress={() => router.push('/(tabs)/perfil')} />
          <Quick icono="newspaper" label="Noticias" tint={colors.navy} onPress={() => router.push('/noticias')} />
        </View>

        {/* Enrolamiento facial */}
        {!fotoFacial && (
          <Pressable onPress={() => router.push('/(tabs)/perfil')}>
            <LinearGradient colors={gradients.gold} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.facial}>
              <Ionicons name="happy-outline" size={30} color={colors.navyDeep} />
              <View style={{ flex: 1, marginHorizontal: spacing(3) }}>
                <Text style={styles.facialTitle}>Activa tu acceso facial</Text>
                <Text style={styles.facialSub}>Entra al club y a las áreas sin hacer fila. Registra tu rostro en 1 minuto.</Text>
              </View>
              <Ionicons name="chevron-forward" size={22} color={colors.navyDeep} />
            </LinearGradient>
          </Pressable>
        )}

        {/* Próxima reserva */}
        <SectionTitle title="Tu próxima reserva" action="Ver todas" onAction={() => router.push('/(tabs)/reservas')} />
        {misReservas.slice(0, 1).map((rv) => (
          <Card key={rv.id}>
            <View style={styles.rowBetween}>
              <View style={styles.rowCenter}>
                <IconCircle name={rv.icono as any} bg={colors.greenSoft} color={colors.green} />
                <View style={{ marginLeft: spacing(3) }}>
                  <Text style={styles.cardTitle}>{rv.cancha}</Text>
                  <Text style={styles.cardSub}>
                    {rv.fecha} · {rv.hora}
                  </Text>
                </View>
              </View>
              <Badge tono="green">{rv.estado}</Badge>
            </View>
          </Card>
        ))}

        {/* Invitados de hoy */}
        <SectionTitle title="Invitados de hoy" action="Gestionar" onAction={() => router.push('/(tabs)/invitados')} />
        <Card>
          <View style={styles.rowBetween}>
            <Text style={styles.cardSub}>
              Usados <Text style={{ color: colors.navy, fontFamily: fontFamily.semibold }}>{socio.invitadosUsados}</Text> de {socio.invitadosPermitidos} cupos
            </Text>
            <Button title="Nuevo" icon="add" variant="outline" onPress={() => router.push('/invitado-nuevo')} style={styles.btnMini} />
          </View>
          <View style={{ height: 1, backgroundColor: colors.line, marginVertical: spacing(3) }} />
          {invitados.map((inv) => (
            <View key={inv.id} style={styles.invRow}>
              <IconCircle name="person" bg={colors.skySoft} color={colors.navy} size={38} />
              <View style={{ flex: 1, marginLeft: spacing(3) }}>
                <Text style={styles.invName}>{inv.nombre}</Text>
                <Text style={styles.cardSub}>
                  {inv.placa ? `Placa ${inv.placa} · ` : ''}
                  {inv.fecha}
                </Text>
              </View>
              <Badge tono={inv.estado === 'DENTRO' ? 'green' : inv.estado === 'PENDIENTE' ? 'amber' : 'gris'}>{inv.estado}</Badge>
            </View>
          ))}
        </Card>

        {/* Noticias destacadas */}
        <SectionTitle title="Noticias del club" action="Ver todas" onAction={() => router.push('/noticias')} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing(3), paddingRight: spacing(5) }}>
          {noticias.slice(0, 3).map((n) => (
            <Pressable key={n.id} onPress={() => router.push('/noticias')} style={[styles.noticiaCard, shadow(1)]}>
              <LinearGradient colors={[n.color, '#00294A']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.noticiaImg}>
                <Ionicons name={n.icono as any} size={30} color="rgba(255,255,255,0.9)" />
                <View style={styles.noticiaTag}>
                  <Text style={styles.noticiaTagText}>{n.seccion}</Text>
                </View>
              </LinearGradient>
              <View style={{ padding: spacing(3) }}>
                <Text numberOfLines={2} style={styles.noticiaTitle}>
                  {n.titular}
                </Text>
                <Text style={styles.noticiaFecha}>{n.fecha}</Text>
              </View>
            </Pressable>
          ))}
        </ScrollView>

        <View style={{ height: spacing(8) }} />
      </ScrollView>
    </View>
  );
}

function Quick({ icono, label, tint, onPress }: { icono: any; label: string; tint: string; onPress: () => void }) {
  return (
    <Pressable style={styles.quick} onPress={onPress}>
      <View style={[styles.quickIcon, { backgroundColor: tint }]}>
        <Ionicons name={icono} size={24} color="#fff" />
      </View>
      <Text style={styles.quickLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: spacing(5) },
  bell: { padding: 4 },
  dot: { position: 'absolute', top: 4, right: 4, width: 9, height: 9, borderRadius: 5, backgroundColor: colors.gold, borderWidth: 1.5, borderColor: colors.navy },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rowCenter: { flexDirection: 'row', alignItems: 'center' },
  cardTitle: { fontSize: font.body, fontFamily: fontFamily.semibold, color: colors.text },
  cardSub: { fontSize: font.small, color: colors.textSoft, marginTop: 1 },
  live: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: colors.redSoft, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 },
  livePulse: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.red },
  liveText: { color: colors.red, fontSize: 10, fontFamily: fontFamily.semibold, letterSpacing: 0.5 },
  barTrack: { height: 10, borderRadius: 6, backgroundColor: colors.greenSoft, marginTop: spacing(4), marginBottom: spacing(2), overflow: 'hidden' },
  barFill: { height: 10, borderRadius: 6, backgroundColor: colors.red, opacity: 0.85 },
  libres: { fontSize: font.small, color: colors.textSoft },
  verMas: { fontSize: font.small, color: colors.sky, fontFamily: fontFamily.medium },
  quickRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing(5), marginBottom: spacing(2) },
  quick: { alignItems: 'center', gap: spacing(2), width: '23%' },
  quickIcon: { width: 58, height: 58, borderRadius: 18, alignItems: 'center', justifyContent: 'center', ...shadow(1) },
  quickLabel: { fontSize: font.tiny, fontFamily: fontFamily.medium, color: colors.text },
  facial: { flexDirection: 'row', alignItems: 'center', borderRadius: radius.lg, padding: spacing(4), marginTop: spacing(4) },
  facialTitle: { fontSize: font.body, fontFamily: fontFamily.semibold, color: colors.navyDeep },
  facialSub: { fontSize: font.small, color: '#5A4a1e', marginTop: 2 },
  btnMini: { paddingVertical: spacing(2), paddingHorizontal: spacing(3) },
  invRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing(2) },
  invName: { fontSize: font.body, fontFamily: fontFamily.medium, color: colors.text },
  noticiaCard: { width: 220, backgroundColor: '#fff', borderRadius: radius.lg, overflow: 'hidden' },
  noticiaImg: { height: 96, alignItems: 'center', justifyContent: 'center' },
  noticiaTag: { position: 'absolute', top: 8, left: 8, backgroundColor: 'rgba(0,0,0,0.28)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  noticiaTagText: { color: '#fff', fontSize: 9, fontFamily: fontFamily.semibold, letterSpacing: 0.4 },
  noticiaTitle: { fontSize: font.small, fontFamily: fontFamily.semibold, color: colors.text, minHeight: 36 },
  noticiaFecha: { fontSize: font.tiny, color: colors.textFaint, marginTop: spacing(2) },
});
