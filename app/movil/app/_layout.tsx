import { Text, TextInput } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  useFonts,
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
} from '@expo-google-fonts/manrope';
import { colors, fontFamily } from '../src/theme';

// Manrope como fuente por defecto de toda la app, sin tener que tocar cada
// pantalla: React Native respeta defaultProps.style en Text/TextInput.
const TextAny = Text as unknown as { defaultProps?: { style?: unknown } };
const TextInputAny = TextInput as unknown as { defaultProps?: { style?: unknown } };
TextAny.defaultProps = TextAny.defaultProps ?? {};
TextAny.defaultProps.style = [{ fontFamily: fontFamily.regular }, TextAny.defaultProps.style];
TextInputAny.defaultProps = TextInputAny.defaultProps ?? {};
TextInputAny.defaultProps.style = [{ fontFamily: fontFamily.regular }, TextInputAny.defaultProps.style];

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
  });

  if (!fontsLoaded) return null;

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="noticias" options={{ presentation: 'card' }} />
        <Stack.Screen name="invitado-nuevo" options={{ presentation: 'modal' }} />
      </Stack>
    </SafeAreaProvider>
  );
}
