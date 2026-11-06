import { Tabs } from 'expo-router';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { useTema } from '../../contexto/TemaContext';

export default function TabsLayout() {
  const { colores } = useTema();
  return (
    <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: colores.principal, tabBarInactiveTintColor: colores.textoMuted, tabBarStyle: { height: 70, paddingBottom: 8, paddingTop: 6, backgroundColor: colores.superficie, borderTopColor: colores.borde }, tabBarLabelStyle: { fontFamily: 'Manrope_600SemiBold' } }}>
      <Tabs.Screen name="index" options={{ title: 'Mapa', tabBarIcon: ({ color, size }) => <Ionicons name="map-outline" color={color} size={size} /> }} />
      <Tabs.Screen name="lugares" options={{ title: 'Lugares', tabBarIcon: ({ color, size }) => <Ionicons name="compass-outline" color={color} size={size} /> }} />
      <Tabs.Screen name="agenda" options={{ title: 'Agenda', tabBarIcon: ({ color, size }) => <Ionicons name="calendar-outline" color={color} size={size} /> }} />
      <Tabs.Screen name="recorrido" options={{ title: 'Recorrido', tabBarIcon: ({ color, size }) => <Ionicons name="footsteps-outline" color={color} size={size} /> }} />
      <Tabs.Screen name="yo" options={{ title: 'Yo', tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" color={color} size={size} /> }} />
    </Tabs>
  );
}
