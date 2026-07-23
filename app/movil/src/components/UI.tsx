// Kit de componentes de presentación reutilizables (sin lógica de negocio).
import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, font, fontFamily, gradients, radius, shadow, spacing } from '../theme';

export function Card({
  children,
  style,
  onPress,
  level = 1,
}: {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  onPress?: () => void;
  level?: 1 | 2 | 3;
}) {
  // Un View no acepta style-función (API exclusiva de Pressable): en nativo
  // descartaría todos los estilos de la tarjeta. Por eso las dos ramas.
  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.card,
          shadow(level),
          pressed ? { opacity: 0.92, transform: [{ scale: 0.995 }] } : null,
          style,
        ]}
      >
        {children}
      </Pressable>
    );
  }
  return <View style={[styles.card, shadow(level), style]}>{children}</View>;
}

type Tono = 'navy' | 'gold' | 'sky' | 'green' | 'red' | 'amber' | 'gris';
const tonoMap: Record<Tono, { bg: string; fg: string }> = {
  navy: { bg: colors.skySoft, fg: colors.navy },
  gold: { bg: '#F7EFD9', fg: colors.goldDeep },
  sky: { bg: colors.skySoft, fg: colors.sky },
  green: { bg: colors.greenSoft, fg: colors.green },
  red: { bg: colors.redSoft, fg: colors.red },
  amber: { bg: colors.amberSoft, fg: colors.amber },
  gris: { bg: '#EEF1F6', fg: colors.textSoft },
};

export function Badge({ children, tono = 'navy' }: { children: React.ReactNode; tono?: Tono }) {
  const c = tonoMap[tono];
  return (
    <View style={[styles.badge, { backgroundColor: c.bg }]}>
      <Text style={[styles.badgeText, { color: c.fg }]}>{children}</Text>
    </View>
  );
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  icon,
  loading,
  disabled,
  style,
}: {
  title: string;
  onPress?: () => void;
  variant?: 'primary' | 'gold' | 'ghost' | 'outline';
  icon?: keyof typeof Ionicons.glyphMap;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
}) {
  const content = (
    <View style={styles.btnInner}>
      {loading ? (
        <ActivityIndicator color={variant === 'ghost' || variant === 'outline' ? colors.navy : '#fff'} />
      ) : (
        <>
          {icon && (
            <Ionicons
              name={icon}
              size={18}
              color={variant === 'ghost' || variant === 'outline' ? colors.navy : '#fff'}
            />
          )}
          <Text
            style={[
              styles.btnText,
              (variant === 'ghost' || variant === 'outline') && { color: colors.navy },
            ]}
          >
            {title}
          </Text>
        </>
      )}
    </View>
  );

  if (variant === 'primary' || variant === 'gold') {
    return (
      <Pressable
        onPress={disabled ? undefined : onPress}
        style={({ pressed }) => [{ opacity: disabled ? 0.55 : pressed ? 0.9 : 1 }, style]}
      >
        <LinearGradient
          colors={variant === 'gold' ? gradients.gold : gradients.brand}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.btn, shadow(1)]}
        >
          {content}
        </LinearGradient>
      </Pressable>
    );
  }
  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      style={({ pressed }) => [
        styles.btn,
        variant === 'outline' ? styles.btnOutline : styles.btnGhost,
        { opacity: disabled ? 0.55 : pressed ? 0.85 : 1 },
        style,
      ]}
    >
      {content}
    </Pressable>
  );
}

export function SectionTitle({
  title,
  action,
  onAction,
}: {
  title: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.sectionTitle}>
      <Text style={styles.sectionTitleText}>{title}</Text>
      {action && (
        <Pressable onPress={onAction} hitSlop={8}>
          <Text style={styles.sectionAction}>{action}</Text>
        </Pressable>
      )}
    </View>
  );
}

export function IconCircle({
  name,
  bg = colors.skySoft,
  color = colors.navy,
  size = 44,
}: {
  name: keyof typeof Ionicons.glyphMap;
  bg?: string;
  color?: string;
  size?: number;
}) {
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }}>
      <Ionicons name={name} size={size * 0.5} color={color} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing(4),
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing(2.5),
    paddingVertical: spacing(1),
    borderRadius: radius.pill,
  },
  badgeText: { fontSize: font.tiny, fontFamily: fontFamily.semibold, letterSpacing: 0.3 },
  btn: {
    borderRadius: radius.md,
    paddingVertical: spacing(3.5),
    paddingHorizontal: spacing(4),
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnInner: { flexDirection: 'row', alignItems: 'center', gap: spacing(2) },
  btnText: { color: '#fff', fontFamily: fontFamily.semibold, fontSize: font.body },
  btnGhost: { backgroundColor: colors.skySoft },
  btnOutline: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: colors.navy },
  sectionTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing(3),
    marginTop: spacing(1),
  },
  sectionTitleText: { fontSize: font.h3, fontFamily: fontFamily.semibold, color: colors.text },
  sectionAction: { fontSize: font.small, fontFamily: fontFamily.semibold, color: colors.sky },
});
