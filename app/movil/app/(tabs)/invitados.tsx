// INVITADOS — control certero de invitados del socio (cupos, placa, pase QR).
// Este es el diferenciador: cada invitado queda ligado al socio y a su vehículo,
// y el sistema de acceso (ALPR/facial) confirma el ingreso real sin filas.
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { BrandHeader } from '../../src/components/Header';
import { Badge, Button, Card, IconCircle, SectionTitle } from '../../src/components/UI';
import { colors, font, fontFamily, gradients, radius, shadow, spacing } from '../../src/theme';
import { invitados, socio } from '../../src/data/mock';

export default function Invitados() {
  const restantes = socio.invitadosPermitidos - socio.invitadosUsados;
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <BrandHeader saludo="Tus acompañantes" titulo="Invitados" />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Tarjeta de cupos */}
        <LinearGradient colors={gradients.brand} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.cupos, shadow(2)]}>
          <View style={styles.rowBetween}>
            <View>
              <Text style={styles.cuposLabel}>Cupos de invitados hoy</Text>
              <Text style={styles.cuposBig}>
                {restantes}
                <Text style={styles.cuposTotal}> / {socio.invitadosPermitidos}</Text>
              </Text>
              <Text style={styles.cuposHint}>disponibles · fútbol no cuenta cupo</Text>
            </View>
            <View style={styles.cuposIcon}>
              <Ionicons name="people" size={30} color={colors.gold} />
            </View>
          </View>
          <View style={styles.pips}>
            {Array.from({ length: socio.invitadosPermitidos }).map((_, i) => (
              <View key={i} style={[styles.pip, { backgroundColor: i < socio.invitadosUsados ? colors.gold : 'rgba(255,255,255,0.25)' }]} />
            ))}
          </View>
        </LinearGradient>

        <Button title="Nueva invitación" icon="person-add" variant="gold" onPress={() => router.push('/invitado-nuevo')} style={{ marginTop: spacing(4) }} />

        <SectionTitle title="Invitaciones de hoy" />
        {invitados.map((inv) => (
          <Card key={inv.id} style={{ marginBottom: spacing(3) }}>
            <View style={styles.rowBetween}>
              <View style={styles.rowCenter}>
                <IconCircle name="person" bg={colors.skySoft} color={colors.navy} />
                <View style={{ marginLeft: spacing(3) }}>
                  <Text style={styles.name}>{inv.nombre}</Text>
                  <Text style={styles.sub}>CI {inv.documento}</Text>
                </View>
              </View>
              <Badge tono={inv.estado === 'DENTRO' ? 'green' : inv.estado === 'PENDIENTE' ? 'amber' : 'gris'}>{inv.estado}</Badge>
            </View>

            <View style={styles.metaRow}>
              {inv.placa && (
                <View style={styles.meta}>
                  <Ionicons name="car-outline" size={15} color={colors.textSoft} />
                  <Text style={styles.metaText}>{inv.placa}</Text>
                </View>
              )}
              <View style={styles.meta}>
                <Ionicons name="time-outline" size={15} color={colors.textSoft} />
                <Text style={styles.metaText}>{inv.fecha}</Text>
              </View>
            </View>

            <Pressable style={styles.qrRow} onPress={() => router.push('/invitado-nuevo')}>
              <Ionicons name="qr-code" size={18} color={colors.navy} />
              <Text style={styles.qrText}>Ver pase QR de acceso</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.textFaint} />
            </Pressable>
          </Card>
        ))}

        <View style={styles.infoBox}>
          <Ionicons name="shield-checkmark" size={20} color={colors.sky} />
          <Text style={styles.infoText}>
            El ingreso de cada invitado se confirma automáticamente en garita por su placa o rostro. No más conteo manual ni filas.
          </Text>
        </View>

        <View style={{ height: spacing(8) }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: spacing(5), paddingTop: spacing(4) },
  cupos: { borderRadius: radius.lg, padding: spacing(5) },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rowCenter: { flexDirection: 'row', alignItems: 'center' },
  cuposLabel: { color: '#BFE0F5', fontSize: font.small, fontFamily: fontFamily.medium },
  cuposBig: { color: '#fff', fontSize: 40, fontFamily: fontFamily.bold, marginTop: 2 },
  cuposTotal: { color: 'rgba(255,255,255,0.6)', fontSize: 22, fontFamily: fontFamily.semibold },
  cuposHint: { color: 'rgba(255,255,255,0.75)', fontSize: font.tiny },
  cuposIcon: { width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },
  pips: { flexDirection: 'row', gap: spacing(2), marginTop: spacing(4) },
  pip: { flex: 1, height: 6, borderRadius: 3 },
  name: { fontSize: font.body, fontFamily: fontFamily.semibold, color: colors.text },
  sub: { fontSize: font.small, color: colors.textSoft, marginTop: 1 },
  metaRow: { flexDirection: 'row', gap: spacing(4), marginTop: spacing(3) },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  metaText: { fontSize: font.small, color: colors.textSoft, fontFamily: fontFamily.medium },
  qrRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(2),
    marginTop: spacing(3),
    paddingTop: spacing(3),
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  qrText: { flex: 1, fontSize: font.small, fontFamily: fontFamily.semibold, color: colors.navy },
  infoBox: {
    flexDirection: 'row',
    gap: spacing(3),
    backgroundColor: colors.skySoft,
    borderRadius: radius.md,
    padding: spacing(4),
    marginTop: spacing(3),
    alignItems: 'flex-start',
  },
  infoText: { flex: 1, fontSize: font.small, color: colors.navy, lineHeight: 19, fontFamily: fontFamily.regular },
});
