import { Tabs } from 'expo-router';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTema } from '../../contexto/TemaContext';

export default function TabsLayout() {
  const { colores } = useTema();
  const insets = useSafeAreaInsets();
  const { fontScale } = useWindowDimensions();
  const espacioTexto = Math.max(0, fontScale - 1) * 16;
  return (
    <Tabs
      safeAreaInsets={{ left: 0, right: 0 }}
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colores.principal,
        tabBarInactiveTintColor: colores.textoMuted,
        tabBarHideOnKeyboard: true,
        tabBarLabelPosition: 'below-icon',
        tabBarStyle: {
          height: 70 + insets.bottom + espacioTexto,
          paddingBottom: 8 + insets.bottom,
          paddingTop: 6,
          backgroundColor: colores.superficie,
          borderTopColor: colores.borde,
        },
        tabBarLabelStyle: { fontFamily: 'Manrope_600SemiBold', fontSize: 11, lineHeight: 16 },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Mapa', tabBarIcon: ({ color, size }) => <Ionicons name="map-outline" color={color} size={size} /> }} />
      <Tabs.Screen name="lugares" options={{ title: 'Lugares', tabBarIcon: ({ color, size }) => <Ionicons name="compass-outline" color={color} size={size} /> }} />
      <Tabs.Screen name="agenda" options={{ title: 'Agenda', tabBarIcon: ({ color, size }) => <Ionicons name="calendar-outline" color={color} size={size} /> }} />
      <Tabs.Screen name="recorrido" options={{ title: 'Recorrido', tabBarIcon: ({ color, size }) => <Ionicons name="footsteps-outline" color={color} size={size} /> }} />
      <Tabs.Screen name="yo" options={{ title: 'Yo', tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" color={color} size={size} /> }} />
    </Tabs>
  );
}
