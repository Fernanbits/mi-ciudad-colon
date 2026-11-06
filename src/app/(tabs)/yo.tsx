import { Link, router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { listarLugares } from '../../servicios/lugares';
import { Lugar } from '../../tipos/modelos';
import { useAplicacion } from '../../contexto/AplicacionContext';
import { EstadoView } from '../../components/EstadoView';
import { ModoTema, useTema } from '../../contexto/TemaContext';

const opcionesTema: { id: ModoTema; nombre: string }[] = [
  { id: 'sistema', nombre: 'Sistema' },
  { id: 'claro', nombre: 'Claro' },
  { id: 'oscuro', nombre: 'Oscuro' },
];

export default function YoScreen() {
  const { session, favoritos, visitas, logout, biometricLogin } = useAplicacion();
  const { colores, modo, cambiarModo } = useTema();
  const [lugares, setLugares] = useState<Lugar[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const cargar = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await listarLugares();
      setLugares(res.datos);
    } catch {
      setError('No pudimos cargar tus lugares guardados.');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { void cargar(); }, []);
  if (loading || error) return <EstadoView loading={loading} error={error} onRetry={cargar} />;
  const favoritosVisibles = favoritos.map((favorito) => lugares.find((lugar) => lugar.id === favorito.lugarId)).filter((lugar): lugar is Lugar => Boolean(lugar));

  return <ScrollView style={StyleSheet.flatten([styles.screen, { backgroundColor: colores.fondo }])} contentContainerStyle={styles.content}>
    <Text style={[styles.eyebrow, { color: colores.texto }]}>MI CUENTA</Text><Text style={[styles.title, { color: colores.texto }]}>{session ? `Hola, ${session.nombre.split(' ')[0]}` : 'Tu viaje, guardado'}</Text>
    {session ? <><View style={[styles.profile, { backgroundColor: colores.superficie, borderColor: colores.borde }]}><View style={[styles.avatar, { backgroundColor: colores.arena }]}><Text style={[styles.avatarText, { color: colores.texto }]}>{session.nombre.slice(0, 2).toUpperCase()}</Text></View><View><Text style={[styles.profileName, { color: colores.texto }]}>{session.nombre}</Text><Text style={[styles.profileEmail, { color: colores.textoSuave }]}>{session.email}</Text></View></View><View style={[styles.stats, { backgroundColor: colores.superficieSuave }]}><View><Text style={[styles.stat, { color: colores.verde }]}>{favoritos.length}</Text><Text style={[styles.label, { color: colores.verde }]}>Favoritos</Text></View><View><Text style={[styles.stat, { color: colores.verde }]}>{visitas.length}</Text><Text style={[styles.label, { color: colores.verde }]}>Visitas</Text></View></View><Text style={[styles.sectionTitle, { color: colores.texto }]}>Tus lugares guardados</Text>{favoritosVisibles.length ? favoritosVisibles.map((lugar) => <Pressable key={lugar.id} accessibilityRole="button" accessibilityLabel={`Abrir favorito ${lugar.nombre}`} style={[styles.favoriteRow, { backgroundColor: colores.superficie, borderColor: colores.borde }]} onPress={() => router.push(`/lugar/${lugar.id}`)}><Text style={[styles.favoriteIcon, { color: colores.texto }]}>♥</Text><Text style={[styles.favoriteName, { color: colores.texto }]}>{lugar.nombre}</Text><Text style={[styles.arrow, { color: colores.texto }]}>›</Text></Pressable>) : <Text style={[styles.empty, { color: colores.textoSuave, backgroundColor: colores.superficie }]}>Todavía no guardaste lugares.</Text>}<Pressable accessibilityRole="button" style={[styles.button, { backgroundColor: colores.principal }]} onPress={async () => { const ok = await biometricLogin(); Alert.alert(ok ? 'Acceso validado' : 'Biometría no disponible', ok ? 'El reingreso seguro está funcionando.' : 'Podés ingresar con tu contraseña.'); }}><Text style={[styles.buttonText, { color: colores.principalTexto }]}>Entrar con huella o rostro</Text></Pressable><Pressable accessibilityRole="button" style={styles.linkButton} onPress={logout}><Text style={[styles.linkText, { color: colores.principal }]}>Cerrar sesión</Text></Pressable></> : <><Text style={[styles.description, { color: colores.textoSuave }]}>Podés explorar el mapa sin registrarte. Creá una cuenta para guardar favoritos, visitas y continuar tu recorrido desde otro teléfono cuando la API esté conectada.</Text><Link href="/auth/login" asChild><Pressable accessibilityRole="button" style={StyleSheet.flatten([styles.button, { backgroundColor: colores.principal }])}><Text style={[styles.buttonText, { color: colores.principalTexto }]}>Ingresar</Text></Pressable></Link><Link href="/auth/registro" asChild><Pressable accessibilityRole="button" style={styles.linkButton}><Text style={[styles.linkText, { color: colores.principal }]}>Crear una cuenta</Text></Pressable></Link></>}
    <View style={[styles.themePanel, { backgroundColor: colores.superficie, borderColor: colores.borde }]} accessibilityLabel="Preferencia de apariencia"><Text style={[styles.themeTitle, { color: colores.texto }]}>Apariencia</Text><Text style={[styles.themeDescription, { color: colores.textoSuave }]}>Elegí cómo querés ver Mi Ciudad. Sistema sigue la configuración del teléfono.</Text><View style={styles.themeOptions}>{opcionesTema.map((opcion) => <Pressable key={opcion.id} accessibilityRole="radio" accessibilityState={{ selected: modo === opcion.id }} accessibilityLabel={`Tema ${opcion.nombre}`} onPress={() => void cambiarModo(opcion.id)} style={[styles.themeOption, { borderColor: colores.borde, backgroundColor: colores.superficie }, modo === opcion.id && { backgroundColor: colores.principal, borderColor: colores.principal }]}><Text style={[styles.themeOptionText, { color: colores.textoSuave }, modo === opcion.id && { color: colores.principalTexto }]}>{opcion.nombre}</Text></Pressable>)}</View></View>
  </ScrollView>;
}

const styles = StyleSheet.create({ screen: { flex: 1, backgroundColor: '#FAF7F1' }, content: { padding: 18, paddingBottom: 30 }, eyebrow: { color: '#0E5A74', fontSize: 10, fontFamily: 'Manrope_800ExtraBold', fontWeight: '900', letterSpacing: 1.1 }, title: { color: '#0E5A74', fontSize: 30, fontFamily: 'Manrope_800ExtraBold', fontWeight: '900', marginTop: 5 }, description: { color: '#547180', fontSize: 15, lineHeight: 22, marginTop: 12 }, profile: { backgroundColor: '#FFFFFF', borderRadius: 20, borderColor: '#E7DCCB', borderWidth: 1, padding: 16, flexDirection: 'row', alignItems: 'center', marginTop: 20 }, avatar: { width: 54, height: 54, borderRadius: 18, backgroundColor: '#D7B98E', alignItems: 'center', justifyContent: 'center', marginRight: 12 }, avatarText: { color: '#0E5A74', fontFamily: 'Manrope_800ExtraBold', fontWeight: '900' }, profileName: { color: '#0E5A74', fontSize: 17, fontFamily: 'Manrope_800ExtraBold', fontWeight: '900' }, profileEmail: { color: '#547180', marginTop: 3 }, stats: { flexDirection: 'row', justifyContent: 'space-around', backgroundColor: '#E4F0EA', borderRadius: 20, paddingVertical: 16, marginTop: 14 }, stat: { color: '#6C8C4A', fontSize: 25, fontFamily: 'Manrope_800ExtraBold', fontWeight: '900', textAlign: 'center' }, label: { color: '#6C8C4A', fontSize: 11, marginTop: 3 }, sectionTitle: { color: '#0E5A74', fontSize: 20, fontFamily: 'Manrope_800ExtraBold', fontWeight: '900', marginTop: 24, marginBottom: 10 }, favoriteRow: { backgroundColor: '#FFFFFF', borderColor: '#E7DCCB', borderWidth: 1, borderRadius: 14, padding: 13, flexDirection: 'row', alignItems: 'center', marginBottom: 8 }, favoriteIcon: { color: '#0E5A74', fontSize: 20, marginRight: 10 }, favoriteName: { color: '#0E5A74', fontFamily: 'Manrope_700Bold', fontWeight: '800', flex: 1 }, arrow: { color: '#0E5A74', fontSize: 24 }, empty: { color: '#547180', backgroundColor: '#FFFFFF', borderRadius: 14, padding: 14 }, button: { backgroundColor: '#0E5A74', borderRadius: 16, padding: 14, alignItems: 'center', marginTop: 20 }, buttonText: { color: '#fff', fontFamily: 'Manrope_800ExtraBold', fontWeight: '900' }, linkButton: { padding: 14, alignItems: 'center' }, linkText: { color: '#0E5A74', fontFamily: 'Manrope_800ExtraBold', fontWeight: '900' }, themePanel: { borderRadius: 20, borderWidth: 1, padding: 16, marginTop: 24 }, themeTitle: { fontSize: 17, fontFamily: 'Manrope_800ExtraBold', fontWeight: '900' }, themeDescription: { fontSize: 12, lineHeight: 18, marginTop: 5 }, themeOptions: { flexDirection: 'row', gap: 8, marginTop: 13 }, themeOption: { flex: 1, borderRadius: 12, borderWidth: 1, paddingVertical: 11, alignItems: 'center' }, themeOptionText: { fontFamily: 'Manrope_700Bold', fontWeight: '800', fontSize: 12 },
});
