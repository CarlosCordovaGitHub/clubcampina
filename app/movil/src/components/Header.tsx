// Encabezado de marca con degradado azul marino y detalle dorado.
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { colors, font, gradients, spacing } from '../theme';

export function BrandHeader({
  saludo,
  titulo,
  avatar,
  right,
}: {
  saludo?: string;
  titulo: string;
  avatar?: string;
  right?: React.ReactNode;
}) {
  const insets = useSafeAreaInsets();
  return (
    <LinearGradient colors={gradients.brand} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.wrap, { paddingTop: insets.top + spacing(3) }]}>
      <View style={styles.goldLine} />
      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          {saludo ? <Text style={styles.saludo}>{saludo}</Text> : null}
          <Text style={styles.titulo}>{titulo}</Text>
        </View>
        {right}
        {avatar && (
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{avatar}</Text>
          </View>
        )}
      </View>
    </LinearGradient>
  );
}

export function StackHeader({ titulo }: { titulo: string }) {
  const insets = useSafeAreaInsets();
  return (
    <LinearGradient colors={gradients.brand} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.stackWrap, { paddingTop: insets.top + spacing(2) }]}>
      <View style={styles.goldLine} />
      <View style={styles.stackRow}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={styles.back}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </Pressable>
        <Text style={styles.stackTitle}>{titulo}</Text>
        <View style={{ width: 24 }} />
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: spacing(5),
    paddingBottom: spacing(6),
    borderBottomLeftRadius: 26,
    borderBottomRightRadius: 26,
  },
  goldLine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: colors.gold,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing(3) },
  saludo: { color: '#BFE0F5', fontSize: font.small, fontWeight: '600', marginBottom: 2 },
  titulo: { color: '#fff', fontSize: font.h1, fontWeight: '800' },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  avatarText: { color: colors.navyDeep, fontWeight: '900', fontSize: font.body },
  stackWrap: {
    paddingHorizontal: spacing(4),
    paddingBottom: spacing(4),
    borderBottomLeftRadius: 22,
    borderBottomRightRadius: 22,
  },
  stackRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  stackTitle: { color: '#fff', fontSize: font.h2, fontWeight: '800' },
  back: { width: 24 },
});
