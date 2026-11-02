import * as Haptics from 'expo-haptics';
import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { Link, router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Image, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { guardarAudioguia } from '../../servicios/archivos';
import { listarCategorias, obtenerLugar } from '../../servicios/lugares';
import { imagenDeLugar } from '../../components/LugarCard';
import { Categoria, Lugar } from '../../tipos/modelos';
import { useAplicacion } from '../../contexto/AplicacionContext';

export default function LugarDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [lugar, setLugar] = useState<Lugar | null>(null);
  const [categoria, setCategoria] = useState<Categoria | null>(null);
  const [loading, setLoading] = useState(true);
  const [imagenFallida, setImagenFallida] = useState(false);
  const { favoritos, toggleFavorito } = useAplicacion();

  useEffect(() => { void Promise.all([obtenerLugar(id), listarCategorias()]).then(([encontrado, categorias]) => { setLugar(encontrado); setCategoria(categorias.find((item) => item.id === encontrado?.categoriaId) ?? null); }).finally(() => setLoading(false)); }, [id]);
  if (loading) return <View style={styles.center}><Text>Cargando lugar...</Text></View>;
  if (!lugar) return <View style={styles.center}><Text style={styles.notFound}>No encontramos este lugar.</Text><Link href="/lugares">Volver a lugares</Link></View>;

  const favorito = favoritos.some((item) => item.lugarId === lugar.id);
  const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lugar.coordenadas.latitud},${lugar.coordenadas.longitud}`;
  const acceso = lugar.accesible === true ? 'Accesible' : lugar.accesible === false ? 'Accesibilidad limitada' : 'Accesibilidad a confirmar';
  const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

  return <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
    <View style={styles.top}><Pressable onPress={() => router.back()}><Text style={styles.back}>‹ Volver</Text></Pressable><Pressable onPress={() => void toggleFavorito(lugar.id)} accessibilityLabel={favorito ? 'Quitar de favoritos' : 'Agregar a favoritos'}><Text style={styles.favorite}>{favorito ? '♥' : '♡'}</Text></Pressable></View>
    <Image source={imagenFallida ? imagenDeLugar() : imagenDeLugar(lugar.imagenes[0])} style={styles.hero} onError={() => setImagenFallida(true)} />
    <Text style={[styles.category, { color: categoria?.color ?? '#6C8C4A' }]}>{(categoria?.nombre ?? 'LUGAR').toUpperCase()}</Text>
    <Text style={styles.title}>{lugar.nombre}</Text>
    <Text style={styles.status}>{lugar.horarios.length ? 'Horario disponible para consultar' : 'Horario a confirmar'} · {acceso}</Text>
    <Text style={styles.description}>{lugar.descripcion}</Text>
    <View style={styles.info}><Text style={styles.infoText}>📍 {lugar.direccion}</Text><Text style={styles.infoText}>🎟️ {lugar.precioEntrada === 0 ? 'Entrada gratuita' : lugar.precioEntrada == null ? 'Precio a confirmar' : `$${lugar.precioEntrada.toLocaleString('es-AR')}`}</Text>{lugar.telefono && <Text style={styles.infoText}>☎️ {lugar.telefono}</Text>}{lugar.sitioWeb && <Text style={styles.infoText}>🌐 Sitio web disponible</Text>}</View>
    <View style={styles.schedule}><Text style={styles.scheduleTitle}>Horarios informados</Text>{lugar.horarios.length ? lugar.horarios.map((horario) => <Text key={horario.dia} style={styles.scheduleRow}>{dias[horario.dia]} · {horario.abre} a {horario.cierra}</Text>) : <Text style={styles.scheduleRow}>Consultar antes de ir</Text>}</View>
    {lugar.audioguia && <AudioControl url={lugar.audioguia.url} lugarId={lugar.id} duracion={lugar.audioguia.duracionSegundos} />}
    {lugar.telefono && <Pressable style={styles.secondaryButton} onPress={() => Linking.openURL(`tel:${lugar.telefono}`)}><Text style={styles.secondaryText}>Llamar al lugar</Text></Pressable>}
    <Pressable style={styles.secondaryButton} onPress={() => Linking.openURL(mapsUrl)}><Text style={styles.secondaryText}>Cómo llegar</Text></Pressable>
    <Pressable style={styles.primaryButton} onPress={async () => { await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); router.push(`/modal/qr?lugarId=${lugar.id}`); }}><Text style={styles.primaryText}>Registrar visita con QR</Text></Pressable>
  </ScrollView>;
}

function AudioControl({ url, lugarId, duracion }: { url: string; lugarId: string; duracion: number }) {
  const [source, setSource] = useState(url);
  const [descargada, setDescargada] = useState(false);
  const player = useAudioPlayer(source);
  const status = useAudioPlayerStatus(player);
  useEffect(() => { void setAudioModeAsync({ playsInSilentMode: true, shouldPlayInBackground: true }); }, []);
  const total = status.duration || duracion;
  const actual = Math.floor(status.currentTime);
  const restante = Math.max(0, Math.floor(total - actual));
  const descargar = async () => { try { const local = await guardarAudioguia(url, lugarId); setSource(local); setDescargada(true); Alert.alert('Audioguía guardada', 'Podés escucharla aunque después no tengas señal.'); } catch { Alert.alert('No se pudo guardar', 'Podés reproducirla mientras tengas conexión.'); } };
  return <View style={styles.audio}><View style={styles.audioCopy}><Text style={styles.audioLabel}>AUDIOGUÍA</Text><Text style={styles.audioTitle}>Escuchar la historia del lugar</Text><Text style={styles.audioMeta}>{Math.floor(actual / 60)}:{String(actual % 60).padStart(2, '0')} / {Math.floor(total / 60)}:{String(Math.floor(total % 60)).padStart(2, '0')} · faltan {Math.floor(restante / 60)}:{String(restante % 60).padStart(2, '0')}</Text><View style={styles.audioTools}><Pressable onPress={() => player.seekTo(Math.max(0, actual - 15))}><Text style={styles.audioLink}>-15 s</Text></Pressable><Pressable onPress={() => player.seekTo(Math.min(total, actual + 30))}><Text style={styles.audioLink}>+30 s</Text></Pressable><Pressable onPress={() => void descargar()}><Text style={styles.audioLink}>{descargada ? '✓ Sin señal' : 'Guardar'}</Text></Pressable></View></View><Pressable style={styles.audioButton} onPress={() => status.playing ? player.pause() : player.play()}><Text style={styles.audioButtonText}>{status.playing ? '❚❚' : '▶'}</Text></Pressable></View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FAF7F1' }, content: { padding: 18, paddingBottom: 35 }, center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FAF7F1' }, notFound: { color: '#0E5A74', fontFamily: 'Manrope_700Bold', fontWeight: '800', marginBottom: 10 }, top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }, back: { color: '#0E5A74', fontFamily: 'Manrope_700Bold', fontWeight: '800', fontSize: 15 }, favorite: { color: '#0E5A74', fontSize: 28 }, hero: { width: '100%', height: 235, borderRadius: 23, marginBottom: 18, backgroundColor: '#E4F0EA' }, category: { fontSize: 10, fontFamily: 'Manrope_800ExtraBold', fontWeight: '900', letterSpacing: 1.1 }, title: { color: '#0E5A74', fontSize: 31, lineHeight: 35, fontFamily: 'Manrope_800ExtraBold', fontWeight: '900', marginTop: 5 }, status: { color: '#6C8C4A', fontSize: 12, fontFamily: 'Manrope_700Bold', fontWeight: '700', marginTop: 8 }, description: { color: '#547180', fontSize: 15, lineHeight: 23, marginTop: 13 }, info: { backgroundColor: '#FFFFFF', borderRadius: 18, borderColor: '#E7DCCB', borderWidth: 1, padding: 14, gap: 9, marginTop: 17 }, infoText: { color: '#0E5A74', fontSize: 13 }, schedule: { backgroundColor: '#FFFFFF', borderRadius: 18, borderColor: '#E7DCCB', borderWidth: 1, padding: 14, gap: 6, marginTop: 12 }, scheduleTitle: { color: '#0E5A74', fontFamily: 'Manrope_800ExtraBold', fontWeight: '900', fontSize: 14 }, scheduleRow: { color: '#547180', fontSize: 13 }, audio: { backgroundColor: '#E4F0EA', borderRadius: 18, padding: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 14 }, audioCopy: { flex: 1 }, audioLabel: { color: '#6C8C4A', fontSize: 9, fontFamily: 'Manrope_800ExtraBold', fontWeight: '900', letterSpacing: 1 }, audioTitle: { color: '#0E5A74', fontSize: 14, fontFamily: 'Manrope_700Bold', fontWeight: '800', marginTop: 3 }, audioMeta: { color: '#6C8C4A', fontSize: 11, marginTop: 4 }, audioTools: { flexDirection: 'row', gap: 12, marginTop: 7 }, audioLink: { color: '#6C8C4A', fontSize: 11, fontFamily: 'Manrope_700Bold', fontWeight: '800' }, audioButton: { backgroundColor: '#6C8C4A', width: 46, height: 46, borderRadius: 15, alignItems: 'center', justifyContent: 'center' }, audioButtonText: { color: '#fff', fontSize: 18 }, primaryButton: { backgroundColor: '#0E5A74', borderRadius: 16, padding: 15, alignItems: 'center', marginTop: 12 }, primaryText: { color: '#fff', fontFamily: 'Manrope_800ExtraBold', fontWeight: '900' }, secondaryButton: { borderColor: '#0E5A74', borderWidth: 1, borderRadius: 16, padding: 14, alignItems: 'center', marginTop: 12 }, secondaryText: { color: '#0E5A74', fontFamily: 'Manrope_800ExtraBold', fontWeight: '900' },
});
