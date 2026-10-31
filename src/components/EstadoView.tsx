import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

export function EstadoView({ loading, error, onRetry }: { loading?: boolean; error?: string | null; onRetry?: () => void }) {
  if (loading) return <View style={styles.center}><ActivityIndicator color="#0E5A74" /><Text style={styles.text}>Cargando información...</Text></View>;
  if (error) return <View style={styles.center}><Text style={styles.title}>No pudimos cargar esto</Text><Text style={styles.text}>{error}</Text>{onRetry && <Pressable onPress={onRetry} style={styles.button}><Text style={styles.buttonText}>Reintentar</Text></Pressable>}</View>;
  return null;
}

const styles = StyleSheet.create({
  center: { padding: 25, alignItems: 'center', gap: 8 },
  title: { color: '#0E5A74', fontFamily: 'Manrope_700Bold', fontWeight: '800', fontSize: 16 },
  text: { color: '#547180', textAlign: 'center' },
  button: { backgroundColor: '#0E5A74', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 14, marginTop: 8 },
  buttonText: { color: '#fff', fontFamily: 'Manrope_700Bold', fontWeight: '800' },
});
