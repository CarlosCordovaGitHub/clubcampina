// Encabezado de pantalla — versión plana y moderna (sin el banner curvo pesado).
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { colors, font, fontFamily, spacing } from '../theme';

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
    <View style={[styles.wrap, { paddingTop: insets.top + spacing(3) }]}>
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
    </View>
  );
}

export function StackHeader({ titulo }: { titulo: string }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.stackWrap, { paddingTop: insets.top + spacing(2) }]}>
      <View style={styles.stackRow}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={styles.back}>
          <Ionicons name="chevron-back" size={22} color={colors.navy} />
        </Pressable>
        <Text style={styles.stackTitle}>{titulo}</Text>
        <View style={{ width: 22 }} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: spacing(5),
    paddingBottom: spacing(4),
    backgroundColor: colors.bg,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing(3) },
  saludo: { color: colors.textSoft, fontSize: font.small, fontFamily: fontFamily.medium, marginBottom: 2 },
  titulo: { color: colors.text, fontSize: font.h1, fontFamily: fontFamily.semibold, letterSpacing: -0.3 },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.navy,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontFamily: fontFamily.bold, fontSize: font.body },
  stackWrap: {
    paddingHorizontal: spacing(4),
    paddingBottom: spacing(3),
    backgroundColor: colors.bg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.line,
  },
  stackRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  stackTitle: { color: colors.text, fontSize: font.h2, fontFamily: fontFamily.semibold },
  back: { width: 22 },
});
