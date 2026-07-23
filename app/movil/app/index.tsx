// Pantalla de bienvenida / login del socio (prototipo — sin backend aún).
import React, { useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, font, fontFamily, gradients, radius, shadow, spacing } from '../src/theme';
import { Button } from '../src/components/UI';

export default function Login() {
  const [usuario, setUsuario] = useState('');
  const [clave, setClave] = useState('');
  const [cargando, setCargando] = useState(false);
  const [foco, setFoco] = useState<'usuario' | 'clave' | null>(null);

  const entrar = () => {
    setCargando(true);
    setTimeout(() => {
      setCargando(false);
      router.replace('/(tabs)');
    }, 600);
  };

  return (
    <LinearGradient colors={gradients.brand} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1 }}>
      <View pointerEvents="none" style={styles.glow} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.logoWrap}>
            <View style={styles.logoCircle}>
              <Image source={require('../assets/logo.png')} style={{ width: 88, height: 88 }} resizeMode="contain" />
            </View>
            <Text style={styles.marca}>La Campiña</Text>
            <Text style={styles.marcaSub}>COUNTRY CLUB</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.bienvenida}>Bienvenido</Text>
            <Text style={styles.sub}>Ingresa con tu usuario de socio</Text>

            <Text style={styles.label}>Usuario</Text>
            <View style={[styles.inputWrap, foco === 'usuario' && styles.inputWrapFoco]}>
              <Ionicons name="person-outline" size={18} color={foco === 'usuario' ? colors.navy : colors.textFaint} />
              <TextInput
                placeholder="Usuario o Nº de derecho"
                placeholderTextColor={colors.textFaint}
                style={styles.input}
                autoCapitalize="none"
                value={usuario}
                onChangeText={setUsuario}
                onFocus={() => setFoco('usuario')}
                onBlur={() => setFoco(null)}
              />
            </View>

            <Text style={styles.label}>Contraseña</Text>
            <View style={[styles.inputWrap, foco === 'clave' && styles.inputWrapFoco]}>
              <Ionicons name="lock-closed-outline" size={18} color={foco === 'clave' ? colors.navy : colors.textFaint} />
              <TextInput
                placeholder="••••••••"
                placeholderTextColor={colors.textFaint}
                style={styles.input}
                secureTextEntry
                value={clave}
                onChangeText={setClave}
                onFocus={() => setFoco('clave')}
                onBlur={() => setFoco(null)}
              />
            </View>

            <Button title="Ingresar" icon="log-in-outline" onPress={entrar} loading={cargando} style={{ marginTop: spacing(3) }} />

            <View style={styles.divisorFila}>
              <View style={styles.divisor} />
              <Text style={styles.divisorTexto}>o</Text>
              <View style={styles.divisor} />
            </View>

            <Button title="Acceso con rostro" icon="scan-outline" variant="outline" onPress={entrar} />

            <Text style={styles.olvido}>¿Olvidaste tu contraseña?</Text>
          </View>

          <Text style={styles.pie}>App oficial de socios · v0.1</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  glow: {
    position: 'absolute',
    top: -120,
    left: -80,
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: 'rgba(0, 120, 192, 0.35)',
  },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: spacing(6) },
  logoWrap: { alignItems: 'center', marginBottom: spacing(7) },
  logoCircle: {
    width: 116,
    height: 116,
    borderRadius: 58,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow(2),
  },
  marca: { color: '#fff', fontSize: 26, fontFamily: fontFamily.semibold, marginTop: spacing(4), letterSpacing: 0.3 },
  marcaSub: { color: colors.gold, fontSize: font.tiny, fontFamily: fontFamily.semibold, letterSpacing: 3, marginTop: 3 },
  card: { backgroundColor: '#fff', borderRadius: radius.xl, padding: spacing(6), ...shadow(3) },
  bienvenida: { fontSize: font.h2, fontFamily: fontFamily.semibold, color: colors.text },
  sub: { fontSize: font.small, color: colors.textSoft, marginTop: 2, marginBottom: spacing(5) },
  label: { fontSize: font.tiny, fontFamily: fontFamily.medium, color: colors.textSoft, marginBottom: spacing(1.5) },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(2),
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1.5,
    borderColor: colors.line,
    borderRadius: radius.md,
    paddingHorizontal: spacing(3.5),
    marginBottom: spacing(3.5),
  },
  inputWrapFoco: { borderColor: colors.sky, backgroundColor: '#fff' },
  input: { flex: 1, paddingVertical: spacing(3.5), fontSize: font.body, color: colors.text, fontFamily: fontFamily.regular },
  divisorFila: { flexDirection: 'row', alignItems: 'center', gap: spacing(3), marginVertical: spacing(4) },
  divisor: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: colors.line },
  divisorTexto: { fontSize: font.tiny, color: colors.textFaint, fontFamily: fontFamily.medium },
  olvido: { textAlign: 'center', color: colors.sky, fontFamily: fontFamily.medium, fontSize: font.small, marginTop: spacing(5) },
  pie: { textAlign: 'center', color: 'rgba(255,255,255,0.7)', fontSize: font.tiny, marginTop: spacing(6) },
});
