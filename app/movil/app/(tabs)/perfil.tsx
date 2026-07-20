// PERFIL — datos del socio, enrolamiento facial (objetivo estratégico),
// vehículos, billetera y accesos rápidos a ajustes.
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Badge, Button, Card, IconCircle, SectionTitle } from '../../src/components/UI';
import { colors, font, gradients, radius, shadow, spacing } from '../../src/theme';
import { socio } from '../../src/data/mock';
import { sesionSocioStore } from '../../src/data/live';

export default function Perfil() {
  const insets = useSafeAreaInsets();
  // compartido con el banner del Inicio (registrar aquí lo apaga allá)
  const { fotoFacial: facial } = sesionSocioStore.useStore();
  const setFacial = (v: boolean) => sesionSocioStore.set({ fotoFacial: v });

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <LinearGradient colors={gradients.brand} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.top, { paddingTop: insets.top + spacing(5) }]}>
        <View style={styles.goldLine} />
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{socio.avatarIniciales}</Text>
        </View>
        <Text style={styles.nombre}>{socio.nombre}</Text>
        <View style={styles.chips}>
          <View style={styles.chip}>
            <Ionicons name="ribbon" size={13} color={colors.gold} />
            <Text style={styles.chipText}>{socio.tipo}</Text>
          </View>
          <View style={styles.chip}>
            <Ionicons name="card" size={13} color={colors.gold} />
            <Text style={styles.chipText}>{socio.numeroDerecho}</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Enrolamiento facial */}
        <Card level={2} style={{ marginTop: -spacing(5) }}>
          <View style={styles.rowBetween}>
            <View style={styles.rowCenter}>
              <IconCircle name="scan" bg={facial ? colors.greenSoft : colors.amberSoft} color={facial ? colors.green : colors.amber} />
              <View style={{ marginLeft: spacing(3), flex: 1 }}>
                <Text style={styles.cardTitle}>Acceso facial</Text>
                <Text style={styles.cardSub}>{facial ? 'Rostro registrado y activo' : 'Aún no has registrado tu rostro'}</Text>
              </View>
            </View>
            <Badge tono={facial ? 'green' : 'amber'}>{facial ? 'ACTIVO' : 'PENDIENTE'}</Badge>
          </View>
          {!facial && (
            <>
              <Text style={styles.facialInfo}>
                Registra tu rostro para entrar al club, gym, piscina y sala de juegos sin credenciales ni filas. Tu foto se usa solo
                para el acceso y se guarda cifrada.
              </Text>
              <Button title="Registrar mi rostro" icon="camera" variant="gold" onPress={() => setFacial(true)} style={{ marginTop: spacing(3) }} />
            </>
          )}
        </Card>

        {/* Mi acceso QR */}
        <SectionTitle title="Mi acceso" />
        <Card>
          <View style={styles.rowCenter}>
            <View style={styles.qrBox}>
              <Ionicons name="qr-code" size={54} color={colors.navy} />
            </View>
            <View style={{ flex: 1, marginLeft: spacing(4) }}>
              <Text style={styles.cardTitle}>Código de socio</Text>
              <Text style={styles.cardSub}>Muéstralo en garita como respaldo de tu acceso facial o vehicular.</Text>
            </View>
          </View>
        </Card>

        {/* Vehículos */}
        <SectionTitle title="Mis vehículos" action="Agregar" />
        <Card>
          <View style={styles.vehRow}>
            <IconCircle name="car-sport" bg={colors.skySoft} color={colors.navy} size={40} />
            <View style={{ flex: 1, marginLeft: spacing(3) }}>
              <Text style={styles.cardTitle}>PCP-6521</Text>
              <Text style={styles.cardSub}>Chevrolet · Camioneta</Text>
            </View>
            <Badge tono="green">ACTIVO</Badge>
          </View>
        </Card>

        {/* Billetera */}
        <SectionTitle title="Billetera del club" />
        <Card>
          <View style={styles.rowBetween}>
            <View style={styles.rowCenter}>
              <IconCircle name="wallet" bg="#F7EFD9" color={colors.goldDeep} />
              <View style={{ marginLeft: spacing(3) }}>
                <Text style={styles.cardTitle}>Saldo disponible</Text>
                <Text style={styles.cardSub}>Consumos y reservas</Text>
              </View>
            </View>
            <Text style={styles.saldo}>${socio.saldoBilletera.toFixed(2)}</Text>
          </View>
        </Card>

        {/* Ajustes */}
        <SectionTitle title="Ajustes" />
        <Card style={{ paddingVertical: spacing(1) }}>
          <Opcion icon="notifications-outline" texto="Notificaciones" />
          <Opcion icon="lock-closed-outline" texto="Seguridad y contraseña" />
          <Opcion icon="help-circle-outline" texto="Ayuda / Chatbot" />
          <Opcion icon="log-out-outline" texto="Cerrar sesión" tint={colors.red} onPress={() => router.replace('/')} last />
        </Card>

        <View style={{ height: spacing(8) }} />
      </ScrollView>
    </View>
  );
}

function Opcion({ icon, texto, tint = colors.navy, onPress, last }: { icon: any; texto: string; tint?: string; onPress?: () => void; last?: boolean }) {
  return (
    <Pressable onPress={onPress} style={[styles.opcion, !last && { borderBottomWidth: 1, borderBottomColor: colors.line }]}>
      <Ionicons name={icon} size={20} color={tint} />
      <Text style={[styles.opcionText, { color: tint === colors.red ? colors.red : colors.text }]}>{texto}</Text>
      <Ionicons name="chevron-forward" size={18} color={colors.textFaint} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  top: { alignItems: 'center', paddingBottom: spacing(8), borderBottomLeftRadius: 26, borderBottomRightRadius: 26 },
  goldLine: { position: 'absolute', top: 0, left: 0, right: 0, height: 4, backgroundColor: colors.gold },
  avatar: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  avatarText: { color: colors.navyDeep, fontWeight: '900', fontSize: 28 },
  nombre: { color: '#fff', fontSize: font.h2, fontWeight: '800', marginTop: spacing(3) },
  chips: { flexDirection: 'row', gap: spacing(2), marginTop: spacing(3) },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(255,255,255,0.12)', paddingHorizontal: spacing(3), paddingVertical: spacing(1.5), borderRadius: 999 },
  chipText: { color: '#fff', fontSize: font.tiny, fontWeight: '700' },
  scroll: { paddingHorizontal: spacing(5) },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rowCenter: { flexDirection: 'row', alignItems: 'center' },
  cardTitle: { fontSize: font.body, fontWeight: '800', color: colors.text },
  cardSub: { fontSize: font.small, color: colors.textSoft, marginTop: 1 },
  facialInfo: { fontSize: font.small, color: colors.textSoft, lineHeight: 20, marginTop: spacing(3) },
  qrBox: { width: 84, height: 84, borderRadius: radius.md, backgroundColor: colors.surfaceAlt, borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center' },
  vehRow: { flexDirection: 'row', alignItems: 'center' },
  saldo: { fontSize: font.h2, fontWeight: '900', color: colors.goldDeep },
  opcion: { flexDirection: 'row', alignItems: 'center', gap: spacing(3), paddingVertical: spacing(3.5), paddingHorizontal: spacing(1) },
  opcionText: { flex: 1, fontSize: font.body, fontWeight: '600' },
});
