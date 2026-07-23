// RESERVAS — canchas y espacios del club + eventos con cupos.
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BrandHeader } from '../../src/components/Header';
import { Badge, Button, Card, SectionTitle } from '../../src/components/UI';
import { colors, font, fontFamily, radius, shadow, spacing } from '../../src/theme';
import { canchas, eventos, misReservas } from '../../src/data/mock';

const HORAS = ['06:00', '07:00', '08:00', '17:00', '18:00', '19:00'];

export default function Reservas() {
  const [sel, setSel] = useState(canchas[0].id);
  const [hora, setHora] = useState<string | null>(null);
  const cancha = canchas.find((c) => c.id === sel)!;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <BrandHeader saludo="Reserva tu espacio" titulo="Reservas" />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <SectionTitle title="Canchas y espacios" />
        <View style={styles.grid}>
          {canchas.map((c) => {
            const activo = c.id === sel;
            return (
              <Pressable
                key={c.id}
                onPress={() => {
                  setSel(c.id);
                  setHora(null);
                }}
                style={[styles.cancha, activo && { borderColor: c.color, backgroundColor: '#fff' }, shadow(1)]}
              >
                <View style={[styles.canchaIcon, { backgroundColor: c.color }]}>
                  <Ionicons name={c.icono as any} size={22} color="#fff" />
                </View>
                <Text style={styles.canchaName}>{c.nombre}</Text>
                <Text style={styles.canchaDisp}>{c.disponibles} libres</Text>
              </Pressable>
            );
          })}
        </View>

        <Card style={{ marginTop: spacing(4) }} level={2}>
          <View style={styles.rowBetween}>
            <View>
              <Text style={styles.selTitle}>{cancha.nombre}</Text>
              <Text style={styles.selSub}>Disponible desde las {cancha.desde}</Text>
            </View>
            <Badge tono="sky">{cancha.disponibles} horarios</Badge>
          </View>

          <Text style={styles.pickLabel}>Elige un horario</Text>
          <View style={styles.horas}>
            {HORAS.map((h) => {
              const activo = h === hora;
              return (
                <Pressable key={h} onPress={() => setHora(h)} style={[styles.hora, activo && styles.horaActiva]}>
                  <Text style={[styles.horaText, activo && { color: '#fff' }]}>{h}</Text>
                </Pressable>
              );
            })}
          </View>

          <Button
            title={hora ? `Reservar ${cancha.nombre} · ${hora}` : 'Selecciona un horario'}
            icon="checkmark-circle"
            onPress={() => {}}
            disabled={!hora}
            style={{ marginTop: spacing(4) }}
          />
        </Card>

        <SectionTitle title="Mis reservas" />
        {misReservas.map((rv) => (
          <Card key={rv.id} style={{ marginBottom: spacing(3) }}>
            <View style={styles.rowBetween}>
              <View style={styles.rowCenter}>
                <View style={[styles.miniIcon, { backgroundColor: colors.greenSoft }]}>
                  <Ionicons name={rv.icono as any} size={18} color={colors.green} />
                </View>
                <View style={{ marginLeft: spacing(3) }}>
                  <Text style={styles.selTitle}>{rv.cancha}</Text>
                  <Text style={styles.selSub}>
                    {rv.fecha} · {rv.hora}
                  </Text>
                </View>
              </View>
              <Badge tono="green">{rv.estado}</Badge>
            </View>
          </Card>
        ))}

        <SectionTitle title="Eventos y salones" />
        {eventos.map((e) => {
          const pct = Math.round((e.registrados / e.permitidos) * 100);
          return (
            <Card key={e.id} style={{ marginBottom: spacing(3) }}>
              <View style={styles.rowCenter}>
                <View style={[styles.miniIcon, { backgroundColor: colors.amberSoft }]}>
                  <Ionicons name={e.icono as any} size={18} color={colors.amber} />
                </View>
                <View style={{ flex: 1, marginLeft: spacing(3) }}>
                  <Text style={styles.selTitle}>{e.titulo}</Text>
                  <Text style={styles.selSub}>
                    {e.fecha} · {e.lugar}
                  </Text>
                </View>
              </View>
              <View style={styles.barTrack}>
                <View style={[styles.barFill, { width: `${pct}%` }]} />
              </View>
              <View style={styles.rowBetween}>
                <Text style={styles.selSub}>
                  {e.registrados}/{e.permitidos} registrados
                </Text>
                <Text style={styles.inscribir}>Inscribirme ›</Text>
              </View>
            </Card>
          );
        })}

        <View style={{ height: spacing(8) }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: spacing(5), paddingTop: spacing(4) },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing(3) },
  cancha: {
    width: '30.5%',
    backgroundColor: '#fff',
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: 'transparent',
    padding: spacing(3),
    alignItems: 'center',
  },
  canchaIcon: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', marginBottom: spacing(2) },
  canchaName: { fontSize: font.small, fontFamily: fontFamily.semibold, color: colors.text },
  canchaDisp: { fontSize: font.tiny, color: colors.textSoft, marginTop: 1 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rowCenter: { flexDirection: 'row', alignItems: 'center' },
  selTitle: { fontSize: font.body, fontFamily: fontFamily.semibold, color: colors.text },
  selSub: { fontSize: font.small, color: colors.textSoft, marginTop: 1 },
  pickLabel: { fontSize: font.small, fontFamily: fontFamily.medium, color: colors.textSoft, marginTop: spacing(4), marginBottom: spacing(2) },
  horas: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing(2) },
  hora: { paddingVertical: spacing(2.5), paddingHorizontal: spacing(4), borderRadius: radius.sm, backgroundColor: colors.surfaceAlt, borderWidth: 1, borderColor: colors.line },
  horaActiva: { backgroundColor: colors.navy, borderColor: colors.navy },
  horaText: { fontSize: font.small, fontFamily: fontFamily.medium, color: colors.text },
  miniIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  barTrack: { height: 8, borderRadius: 5, backgroundColor: colors.line, marginTop: spacing(3), marginBottom: spacing(2), overflow: 'hidden' },
  barFill: { height: 8, borderRadius: 5, backgroundColor: colors.gold },
  inscribir: { fontSize: font.small, color: colors.sky, fontFamily: fontFamily.medium },
});
