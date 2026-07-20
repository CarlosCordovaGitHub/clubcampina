// Pantalla de bienvenida / login del socio (prototipo — sin backend aún).
import React, { useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, font, gradients, radius, shadow, spacing } from '../src/theme';
import { Button } from '../src/components/UI';

export default function Login() {
  const [usuario, setUsuario] = useState('');
  const [clave, setClave] = useState('');
  const [cargando, setCargando] = useState(false);

  const entrar = () => {
    setCargando(true);
    setTimeout(() => {
      setCargando(false);
      router.replace('/(tabs)');
    }, 600);
  };

  return (
    <LinearGradient colors={gradients.brand} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1 }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.logoWrap}>
            <View style={styles.logoCircle}>
              <Image source={require('../assets/logo.png')} style={{ width: 96, height: 96 }} resizeMode="contain" />
            </View>
            <Text style={styles.marca}>La Campiña</Text>
            <Text style={styles.marcaSub}>COUNTRY CLUB</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.bienvenida}>Bienvenido</Text>
            <Text style={styles.sub}>Ingresa con tu usuario de socio</Text>

            <View style={styles.inputWrap}>
              <Ionicons name="person-outline" size={18} color={colors.textSoft} />
              <TextInput
                placeholder="Usuario o Nº de derecho"
                placeholderTextColor={colors.textFaint}
                style={styles.input}
                autoCapitalize="none"
                value={usuario}
                onChangeText={setUsuario}
              />
            </View>
            <View style={styles.inputWrap}>
              <Ionicons name="lock-closed-outline" size={18} color={colors.textSoft} />
              <TextInput
                placeholder="Contraseña"
                placeholderTextColor={colors.textFaint}
                style={styles.input}
                secureTextEntry
                value={clave}
                onChangeText={setClave}
              />
            </View>

            <Button title="Ingresar" icon="log-in-outline" onPress={entrar} loading={cargando} style={{ marginTop: spacing(2) }} />
            <Button title="Acceso con rostro" icon="scan-outline" variant="ghost" onPress={entrar} style={{ marginTop: spacing(2.5) }} />

            <Text style={styles.olvido}>¿Olvidaste tu contraseña?</Text>
          </View>

          <Text style={styles.pie}>App oficial de socios · v0.1</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 1, justifyContent: 'center', padding: spacing(6) },
  logoWrap: { alignItems: 'center', marginBottom: spacing(7) },
  logoCircle: {
    width: 132,
    height: 132,
    borderRadius: 66,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow(2),
  },
  marca: { color: '#fff', fontSize: 30, fontWeight: '800', marginTop: spacing(4), letterSpacing: 0.5 },
  marcaSub: { color: colors.gold, fontSize: font.small, fontWeight: '800', letterSpacing: 4, marginTop: 2 },
  card: { backgroundColor: '#fff', borderRadius: radius.xl, padding: spacing(6), ...shadow(3) },
  bienvenida: { fontSize: font.h2, fontWeight: '800', color: colors.text },
  sub: { fontSize: font.small, color: colors.textSoft, marginTop: 2, marginBottom: spacing(5) },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(2),
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    paddingHorizontal: spacing(3.5),
    marginBottom: spacing(3),
  },
  input: { flex: 1, paddingVertical: spacing(3.5), fontSize: font.body, color: colors.text },
  olvido: { textAlign: 'center', color: colors.sky, fontWeight: '700', fontSize: font.small, marginTop: spacing(4) },
  pie: { textAlign: 'center', color: 'rgba(255,255,255,0.7)', fontSize: font.tiny, marginTop: spacing(6) },
});
