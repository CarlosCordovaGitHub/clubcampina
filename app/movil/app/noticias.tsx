// NOTICIAS — feed de comunicados del club por secciones.
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StackHeader } from '../src/components/Header';
import { colors, font, radius, shadow, spacing } from '../src/theme';
import { noticias } from '../src/data/mock';

const SECCIONES = ['Todas', 'INSTITUCIONAL', 'Generales', 'Convenios CLC'] as const;

export default function Noticias() {
  const [filtro, setFiltro] = useState<(typeof SECCIONES)[number]>('Todas');
  const lista = filtro === 'Todas' ? noticias : noticias.filter((n) => n.seccion === filtro);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <StackHeader titulo="Noticias del club" />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtros}>
          {SECCIONES.map((s) => {
            const activo = s === filtro;
            return (
              <Pressable key={s} onPress={() => setFiltro(s)} style={[styles.filtro, activo && styles.filtroActivo]}>
                <Text style={[styles.filtroText, activo && { color: '#fff' }]}>{s}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {lista.map((n) => (
          <View key={n.id} style={[styles.card, shadow(1)]}>
            <LinearGradient colors={[n.color, '#00243f']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.banner}>
              <Ionicons name={n.icono as any} size={40} color="rgba(255,255,255,0.9)" />
              <View style={styles.tag}>
                <Text style={styles.tagText}>{n.seccion}</Text>
              </View>
            </LinearGradient>
            <View style={styles.body}>
              <Text style={styles.titular}>{n.titular}</Text>
              <Text style={styles.resumen}>{n.resumen}</Text>
              <View style={styles.metaRow}>
                <Text style={styles.fecha}>{n.fecha}</Text>
                <View style={styles.acciones}>
                  <View style={styles.accion}>
                    <Ionicons name="heart-outline" size={17} color={colors.textSoft} />
                    <Text style={styles.accionText}>{n.meGusta}</Text>
                  </View>
                  <View style={styles.accion}>
                    <Ionicons name="chatbubble-outline" size={16} color={colors.textSoft} />
                    <Text style={styles.accionText}>{n.comentarios}</Text>
                  </View>
                  <Ionicons name="share-social-outline" size={17} color={colors.textSoft} />
                </View>
              </View>
            </View>
          </View>
        ))}
        <View style={{ height: spacing(8) }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: spacing(5) },
  filtros: { gap: spacing(2), paddingBottom: spacing(4) },
  filtro: { paddingHorizontal: spacing(4), paddingVertical: spacing(2), borderRadius: 999, backgroundColor: '#fff', borderWidth: 1, borderColor: colors.line },
  filtroActivo: { backgroundColor: colors.navy, borderColor: colors.navy },
  filtroText: { fontSize: font.small, fontWeight: '700', color: colors.textSoft },
  card: { backgroundColor: '#fff', borderRadius: radius.lg, overflow: 'hidden', marginBottom: spacing(4) },
  banner: { height: 120, alignItems: 'center', justifyContent: 'center' },
  tag: { position: 'absolute', top: 10, left: 10, backgroundColor: 'rgba(0,0,0,0.3)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  tagText: { color: '#fff', fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  body: { padding: spacing(4) },
  titular: { fontSize: font.h3, fontWeight: '800', color: colors.text },
  resumen: { fontSize: font.small, color: colors.textSoft, lineHeight: 20, marginTop: spacing(2) },
  metaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing(4) },
  fecha: { fontSize: font.tiny, color: colors.textFaint, fontWeight: '600' },
  acciones: { flexDirection: 'row', alignItems: 'center', gap: spacing(4) },
  accion: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  accionText: { fontSize: font.small, color: colors.textSoft, fontWeight: '700' },
});
