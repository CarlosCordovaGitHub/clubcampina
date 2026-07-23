import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ColorValue, Platform } from 'react-native';
import { colors, fontFamily, shadow } from '../../src/theme';

type TabIcon = { color: ColorValue; size: number };

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.navy,
        tabBarInactiveTintColor: colors.textFaint,
        tabBarStyle: {
          height: Platform.OS === 'ios' ? 86 : 66,
          paddingTop: 8,
          paddingBottom: Platform.OS === 'ios' ? 28 : 10,
          borderTopWidth: 0,
          backgroundColor: '#fff',
          ...shadow(2),
        },
        tabBarLabelStyle: { fontSize: 11, fontFamily: fontFamily.semibold },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: 'Inicio', tabBarIcon: ({ color, size }: TabIcon) => <Ionicons name="home" size={size} color={color} /> }}
      />
      <Tabs.Screen
        name="reservas"
        options={{ title: 'Reservas', tabBarIcon: ({ color, size }: TabIcon) => <Ionicons name="calendar" size={size} color={color} /> }}
      />
      <Tabs.Screen
        name="invitados"
        options={{ title: 'Invitados', tabBarIcon: ({ color, size }: TabIcon) => <Ionicons name="people" size={size} color={color} /> }}
      />
      <Tabs.Screen
        name="parqueadero"
        options={{ title: 'Parqueadero', tabBarIcon: ({ color, size }: TabIcon) => <Ionicons name="car" size={size} color={color} /> }}
      />
      <Tabs.Screen
        name="perfil"
        options={{ title: 'Perfil', tabBarIcon: ({ color, size }: TabIcon) => <Ionicons name="person" size={size} color={color} /> }}
      />
    </Tabs>
  );
}
