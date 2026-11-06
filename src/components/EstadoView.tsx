import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTema } from '../contexto/TemaContext';

export function EstadoView({ loading, error, onRetry }: { loading?: boolean; error?: string | null; onRetry?: () => void }) {
  const { colores } = useTema();
  if (loading) return <View style={[styles.center, { backgroundColor: colores.fondo }]}><ActivityIndicator color={colores.principal} /><Text style={[styles.text, { color: colores.textoSuave }]}>Cargando información...</Text></View>;
  if (error) return <View style={[styles.center, { backgroundColor: colores.fondo }]}><Text style={[styles.title, { color: colores.texto }]}>No pudimos cargar esto</Text><Text style={[styles.text, { color: colores.textoSuave }]}>{error}</Text>{onRetry && <Pressable accessibilityRole="button" onPress={onRetry} style={[styles.button, { backgroundColor: colores.principal }]}><Text style={[styles.buttonText, { color: colores.principalTexto }]}>Reintentar</Text></Pressable>}</View>;
  return null;
}

const styles = StyleSheet.create({
  center: { padding: 25, alignItems: 'center', gap: 8 },
  title: { color: '#0E5A74', fontFamily: 'Manrope_700Bold', fontWeight: '800', fontSize: 16 },
  text: { color: '#547180', textAlign: 'center' },
  button: { backgroundColor: '#0E5A74', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 14, marginTop: 8 },
  buttonText: { color: '#fff', fontFamily: 'Manrope_700Bold', fontWeight: '800' },
});
