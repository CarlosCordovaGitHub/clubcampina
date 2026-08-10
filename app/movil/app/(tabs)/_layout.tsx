import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ColorValue, Platform, Text } from 'react-native';
import { colors, fontFamily, shadow } from '../../src/theme';

type TabIcon = { color: ColorValue; size: number };

// Etiqueta propia (en vez de tabBarLabelStyle): el <Label> por defecto de
// @react-navigation/bottom-tabs en web recorta su propio contenedor de texto
// a una altura fija que no respeta nuestro lineHeight y corta las letras.
function TabLabel(title: string) {
  return ({ color, focused }: { color: ColorValue; focused: boolean }) => (
    <Text
      style={{
        fontSize: 11,
        lineHeight: 15,
        color,
        fontFamily: focused ? fontFamily.semibold : fontFamily.medium,
      }}
    >
      {title}
    </Text>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.navy,
        tabBarInactiveTintColor: colors.textFaint,
        tabBarStyle: {
          height: Platform.OS === 'ios' ? 86 : Platform.OS === 'web' ? 78 : 66,
          paddingTop: 8,
          paddingBottom: Platform.OS === 'ios' ? 28 : Platform.OS === 'web' ? 16 : 10,
          borderTopWidth: 0,
          backgroundColor: '#fff',
          ...shadow(2),
        },
        tabBarItemStyle: { paddingBottom: 2 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inicio',
          tabBarIcon: ({ color, size }: TabIcon) => <Ionicons name="home" size={size} color={color} />,
          tabBarLabel: TabLabel('Inicio'),
        }}
      />
      <Tabs.Screen
        name="reservas"
        options={{
          title: 'Reservas',
          tabBarIcon: ({ color, size }: TabIcon) => <Ionicons name="calendar" size={size} color={color} />,
          tabBarLabel: TabLabel('Reservas'),
        }}
      />
      <Tabs.Screen
        name="invitados"
        options={{
          title: 'Invitados',
          tabBarIcon: ({ color, size }: TabIcon) => <Ionicons name="people" size={size} color={color} />,
          tabBarLabel: TabLabel('Invitados'),
        }}
      />
      <Tabs.Screen
        name="parqueadero"
        options={{
          title: 'Parqueadero',
          tabBarIcon: ({ color, size }: TabIcon) => <Ionicons name="car" size={size} color={color} />,
          tabBarLabel: TabLabel('Parqueadero'),
        }}
      />
      <Tabs.Screen
        name="perfil"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color, size }: TabIcon) => <Ionicons name="person" size={size} color={color} />,
          tabBarLabel: TabLabel('Perfil'),
        }}
      />
    </Tabs>
  );
}
