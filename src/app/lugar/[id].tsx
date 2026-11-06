import * as Haptics from 'expo-haptics';
import * as Speech from 'expo-speech';
import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { Link, router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { guardarAudioguia } from '../../servicios/archivos';
import { listarCategorias, obtenerLugar } from '../../servicios/lugares';
import { LugarImagen } from '../../components/LugarCard';
import { Categoria, Lugar } from '../../tipos/modelos';
import { useAplicacion } from '../../contexto/AplicacionContext';
import { EstadoView } from '../../components/EstadoView';
import { useTema } from '../../contexto/TemaContext';

export default function LugarDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colores } = useTema();
  const [lugar, setLugar] = useState<Lugar | null>(null);
  const [categoria, setCategoria] = useState<Categoria | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { favoritos, toggleFavorito } = useAplicacion();

  const cargar = async () => {
    try {
      setLoading(true);
      setError(null);
      const [encontrado, categorias] = await Promise.all([obtenerLugar(id), listarCategorias()]);
      setLugar(encontrado);
      setCategoria(categorias.find((item) => item.id === encontrado?.categoriaId) ?? null);
    } catch {
      setError('No pudimos cargar este lugar. Revisá tu conexión e intentá nuevamente.');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { void cargar(); }, [id]);
  if (loading || error) return <EstadoView loading={loading} error={error} onRetry={cargar} />;
  if (!lugar) return <View style={StyleSheet.flatten([styles.center, { backgroundColor: colores.fondo }])}><Text style={[styles.notFound, { color: colores.texto }]}>No encontramos este lugar.</Text><Link href="/lugares" style={{ color: colores.principal }}>Volver a lugares</Link></View>;

  const favorito = favoritos.some((item) => item.lugarId === lugar.id);
  const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lugar.coordenadas.latitud},${lugar.coordenadas.longitud}`;
  const acceso = lugar.accesible === true ? 'Accesible' : lugar.accesible === false ? 'Accesibilidad limitada' : 'Accesibilidad a confirmar';
  const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

  return <ScrollView style={StyleSheet.flatten([styles.screen, { backgroundColor: colores.fondo }])} contentContainerStyle={styles.content}>
    <View style={styles.top}><Pressable accessibilityRole="button" accessibilityLabel="Volver" onPress={() => router.back()}><Text style={[styles.back, { color: colores.principal }]}>‹ Volver</Text></Pressable><Pressable accessibilityRole="button" onPress={() => void toggleFavorito(lugar.id)} accessibilityLabel={favorito ? 'Quitar de favoritos' : 'Agregar a favoritos'}><Text style={[styles.favorite, { color: colores.texto }]}>{favorito ? '♥' : '♡'}</Text></Pressable></View>
    <LugarImagen uri={lugar.imagenes[0]} nombre={lugar.nombre} categoria={categoria?.nombre} style={[styles.hero, { backgroundColor: colores.superficieSuave }]} />
    <Text style={[styles.category, { color: categoria?.color ?? colores.verde }]}>{(categoria?.nombre ?? 'LUGAR').toUpperCase()}</Text>
    <Text style={[styles.title, { color: colores.texto }]}>{lugar.nombre}</Text>
    <Text style={[styles.status, { color: colores.verde }]}>{lugar.horarios.length ? 'Horario disponible para consultar' : 'Horario a confirmar'} · {acceso}</Text>
    <Text style={[styles.description, { color: colores.textoSuave }]}>{lugar.descripcion}</Text>
    <View style={[styles.info, { backgroundColor: colores.superficie, borderColor: colores.borde }]}><Text style={[styles.infoText, { color: colores.texto }]}>📍 {lugar.direccion}</Text><Text style={[styles.infoText, { color: colores.texto }]}>🎟️ {lugar.precioEntrada === 0 ? 'Entrada gratuita' : lugar.precioEntrada == null ? 'Precio a confirmar' : `$${lugar.precioEntrada.toLocaleString('es-AR')}`}</Text>{lugar.telefono && <Text style={[styles.infoText, { color: colores.texto }]}>☎️ {lugar.telefono}</Text>}{lugar.sitioWeb && <Text style={[styles.infoText, { color: colores.texto }]}>🌐 Sitio web disponible</Text>}</View>
    <View style={[styles.schedule, { backgroundColor: colores.superficie, borderColor: colores.borde }]}><Text style={[styles.scheduleTitle, { color: colores.texto }]}>Horarios informados</Text>{lugar.horarios.length ? lugar.horarios.map((horario, indice) => <Text key={`${horario.dia}-${horario.abre}-${horario.cierra}-${indice}`} style={[styles.scheduleRow, { color: colores.textoSuave }]}>{dias[horario.dia]} · {horario.abre} a {horario.cierra}</Text>) : <Text style={[styles.scheduleRow, { color: colores.textoSuave }]}>Consultar antes de ir</Text>}</View>
    {lugar.audioguia && <AudioControl url={lugar.audioguia.url} lugarId={lugar.id} duracion={lugar.audioguia.duracionSegundos} texto={lugar.descripcion} />}
    {!lugar.audioguia && <SpeechControl texto={lugar.descripcion} remotoDisponible={false} />}
    {lugar.telefono && <Pressable accessibilityRole="button" style={[styles.secondaryButton, { borderColor: colores.principal }]} onPress={() => Linking.openURL(`tel:${lugar.telefono}`)}><Text style={[styles.secondaryText, { color: colores.principal }]}>Llamar al lugar</Text></Pressable>}
    <Pressable accessibilityRole="button" style={[styles.secondaryButton, { borderColor: colores.principal }]} onPress={() => Linking.openURL(mapsUrl)}><Text style={[styles.secondaryText, { color: colores.principal }]}>Cómo llegar</Text></Pressable>
    <Pressable accessibilityRole="button" style={[styles.primaryButton, { backgroundColor: colores.principal }]} onPress={async () => { await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); router.push(`/modal/qr?lugarId=${lugar.id}`); }}><Text style={[styles.primaryText, { color: colores.principalTexto }]}>Registrar visita con QR</Text></Pressable>
  </ScrollView>;
}

type EstadoVoz = 'sistema';

function useVozNarradora() {
  const estadoVoz: EstadoVoz = 'sistema';

  useEffect(() => {
    return () => { void Speech.stop(); };
  }, []);

  return { estadoVoz };
}

function descripcionEstadoVoz(estadoVoz: EstadoVoz): string {
  return estadoVoz === 'sistema' ? 'Usando la voz configurada en Android' : 'Usando la voz del teléfono';
}

function AudioControl({ url, lugarId, duracion, texto }: { url: string; lugarId: string; duracion: number; texto: string }) {
  const { colores } = useTema();
  const { estadoVoz } = useVozNarradora();
  const esUrlDePrueba = url.startsWith('demo://');
  const [source, setSource] = useState(url);
  const [descargada, setDescargada] = useState(false);
  const [usarVozLocal, setUsarVozLocal] = useState(esUrlDePrueba);
  const [hablando, setHablando] = useState(false);
  const [pausada, setPausada] = useState(false);
  const player = useAudioPlayer(esUrlDePrueba ? null : source);
  const status = useAudioPlayerStatus(player);
  useEffect(() => { void setAudioModeAsync({ playsInSilentMode: true, shouldPlayInBackground: true }); }, []);
  useEffect(() => {
    if (esUrlDePrueba || status.isLoaded) return;
    const temporizador = setTimeout(() => setUsarVozLocal(true), 1800);
    return () => clearTimeout(temporizador);
  }, [esUrlDePrueba, status.isLoaded]);
  const total = status.duration || duracion;
  const actual = Math.floor(status.currentTime);
  const restante = Math.max(0, Math.floor(total - actual));
  const descargar = async () => {
    if (usarVozLocal || esUrlDePrueba) {
      Alert.alert('Audioguía lista para usar', 'La narración se genera con la voz del teléfono y no necesita descargarse.');
      return;
    }
    try {
      const local = await guardarAudioguia(url, lugarId);
      setSource(local);
      setDescargada(true);
      Alert.alert('Audioguía guardada', 'Podés escucharla aunque después no tengas señal.');
    } catch {
      Alert.alert('No se pudo guardar', 'Podés reproducirla mientras tengas conexión.');
    }
  };
  const hablar = () => {
    setHablando(true);
    setPausada(false);
    Speech.speak(texto, {
      onDone: () => { setHablando(false); setPausada(false); },
      onStopped: () => { setHablando(false); setPausada(false); },
      onError: () => { setHablando(false); setPausada(false); },
    });
  };
  const alternarVoz = async () => {
    if (!hablando) {
      hablar();
      return;
    }
    try {
      if (pausada) {
        await Speech.resume();
        setPausada(false);
      } else {
        await Speech.pause();
        setPausada(true);
      }
    } catch {
      await Speech.stop();
      setHablando(false);
      setPausada(false);
    }
  };
  const detenerVoz = async () => {
    await Speech.stop();
    setHablando(false);
    setPausada(false);
  };
  const alternarReproduccion = () => {
    if (usarVozLocal || !status.isLoaded) {
      setUsarVozLocal(true);
      void alternarVoz();
      return;
    }
    if (status.playing) {
      player.pause();
      return;
    }
    if (status.didJustFinish || actual >= total) void player.seekTo(0);
    player.play();
  };
  const meta = usarVozLocal
    ? `${descripcionEstadoVoz(estadoVoz)} · ${hablando ? pausada ? 'Pausada' : 'Reproduciendo' : 'Lista para escuchar'}`
    : `${Math.floor(actual / 60)}:${String(actual % 60).padStart(2, '0')} / ${Math.floor(total / 60)}:${String(Math.floor(total % 60)).padStart(2, '0')} · faltan ${Math.floor(restante / 60)}:${String(restante % 60).padStart(2, '0')}`;
  return <View style={[styles.audio, { backgroundColor: colores.superficieSuave }]}><View style={styles.audioCopy}><Text style={[styles.audioLabel, { color: colores.verde }]}>AUDIOGUÍA</Text><Text style={[styles.audioTitle, { color: colores.texto }]}>Escuchar la historia del lugar</Text><Text style={[styles.audioMeta, { color: colores.verde }]}>{meta}</Text><View style={styles.audioTools}>{usarVozLocal ? <Pressable accessibilityRole="button" accessibilityLabel="Detener narración" onPress={() => void detenerVoz()}><Text style={[styles.audioLink, { color: colores.verde }]}>Detener</Text></Pressable> : <><Pressable accessibilityRole="button" accessibilityLabel="Retroceder 15 segundos" onPress={() => void player.seekTo(Math.max(0, actual - 15))}><Text style={[styles.audioLink, { color: colores.verde }]}>-15 s</Text></Pressable><Pressable accessibilityRole="button" accessibilityLabel="Avanzar 30 segundos" onPress={() => void player.seekTo(Math.min(total, actual + 30))}><Text style={[styles.audioLink, { color: colores.verde }]}>+30 s</Text></Pressable></>}<Pressable accessibilityRole="button" accessibilityLabel={descargada ? 'Audioguía guardada sin conexión' : 'Guardar audioguía'} onPress={() => void descargar()}><Text style={[styles.audioLink, { color: colores.verde }]}>{descargada ? '✓ Sin señal' : 'Guardar'}</Text></Pressable></View></View><Pressable accessibilityRole="button" accessibilityLabel={hablando && !pausada ? 'Pausar audioguía' : 'Reproducir audioguía'} style={[styles.audioButton, { backgroundColor: colores.verde }]} onPress={usarVozLocal ? () => void alternarVoz() : alternarReproduccion}><Text style={styles.audioButtonText}>{usarVozLocal ? hablando && !pausada ? '❚❚' : '▶' : status.playing ? '❚❚' : '▶'}</Text></Pressable></View>;
}

function SpeechControl({ texto, remotoDisponible }: { texto: string; remotoDisponible: boolean }) {
  const { colores } = useTema();
  const { estadoVoz } = useVozNarradora();
  const [hablando, setHablando] = useState(false);

  const alternarVoz = async () => {
    if (hablando) {
      await Speech.stop();
      setHablando(false);
      return;
    }
    setHablando(true);
    Speech.speak(texto, {
      onDone: () => setHablando(false),
      onStopped: () => setHablando(false),
      onError: () => setHablando(false),
    });
  };

  return <View style={[styles.speech, { backgroundColor: colores.superficieSuave }]}><View style={styles.speechCopy}><Text style={[styles.speechLabel, { color: colores.verde }]}>{remotoDisponible ? 'ALTERNATIVA DE VOZ' : 'AUDIOGUÍA'}</Text><Text style={[styles.speechTitle, { color: colores.texto }]}>Escuchar la descripción</Text><Text style={[styles.speechMeta, { color: colores.textoSuave }]}>{descripcionEstadoVoz(estadoVoz)}</Text></View><Pressable accessibilityRole="button" accessibilityLabel={hablando ? 'Detener lectura de la descripción' : 'Leer descripción del lugar en voz alta'} style={[styles.speechButton, { backgroundColor: colores.verde }]} onPress={() => void alternarVoz()}><Text style={styles.speechButtonText}>{hablando ? 'Detener' : 'Escuchar'}</Text></Pressable></View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FAF7F1' }, content: { padding: 18, paddingBottom: 35 }, center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FAF7F1' }, notFound: { color: '#0E5A74', fontFamily: 'Manrope_700Bold', fontWeight: '800', marginBottom: 10 }, top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }, back: { color: '#0E5A74', fontFamily: 'Manrope_700Bold', fontWeight: '800', fontSize: 15 }, favorite: { color: '#0E5A74', fontSize: 28 }, hero: { width: '100%', height: 235, borderRadius: 23, marginBottom: 18, backgroundColor: '#E4F0EA' }, category: { fontSize: 10, fontFamily: 'Manrope_800ExtraBold', fontWeight: '900', letterSpacing: 1.1 }, title: { color: '#0E5A74', fontSize: 31, lineHeight: 35, fontFamily: 'Manrope_800ExtraBold', fontWeight: '900', marginTop: 5 }, status: { color: '#6C8C4A', fontSize: 12, fontFamily: 'Manrope_700Bold', fontWeight: '700', marginTop: 8 }, description: { color: '#547180', fontSize: 15, lineHeight: 23, marginTop: 13 }, info: { backgroundColor: '#FFFFFF', borderRadius: 18, borderColor: '#E7DCCB', borderWidth: 1, padding: 14, gap: 9, marginTop: 17 }, infoText: { color: '#0E5A74', fontSize: 13 }, schedule: { backgroundColor: '#FFFFFF', borderRadius: 18, borderColor: '#E7DCCB', borderWidth: 1, padding: 14, gap: 6, marginTop: 12 }, scheduleTitle: { color: '#0E5A74', fontFamily: 'Manrope_800ExtraBold', fontWeight: '900', fontSize: 14 }, scheduleRow: { color: '#547180', fontSize: 13 }, audio: { backgroundColor: '#E4F0EA', borderRadius: 18, padding: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 14 }, audioCopy: { flex: 1 }, audioLabel: { color: '#6C8C4A', fontSize: 9, fontFamily: 'Manrope_800ExtraBold', fontWeight: '900', letterSpacing: 1 }, audioTitle: { color: '#0E5A74', fontSize: 14, fontFamily: 'Manrope_700Bold', fontWeight: '800', marginTop: 3 }, audioMeta: { color: '#6C8C4A', fontSize: 11, marginTop: 4 }, audioTools: { flexDirection: 'row', gap: 12, marginTop: 7 }, audioLink: { color: '#6C8C4A', fontSize: 11, fontFamily: 'Manrope_700Bold', fontWeight: '800' }, audioButton: { backgroundColor: '#6C8C4A', width: 46, height: 46, borderRadius: 15, alignItems: 'center', justifyContent: 'center' }, audioButtonText: { color: '#fff', fontSize: 18 }, primaryButton: { backgroundColor: '#0E5A74', borderRadius: 16, padding: 15, alignItems: 'center', marginTop: 12 }, primaryText: { color: '#fff', fontFamily: 'Manrope_800ExtraBold', fontWeight: '900' }, secondaryButton: { borderColor: '#0E5A74', borderWidth: 1, borderRadius: 16, padding: 14, alignItems: 'center', marginTop: 12 }, secondaryText: { color: '#0E5A74', fontFamily: 'Manrope_800ExtraBold', fontWeight: '900' },
  speech: { backgroundColor: '#E4F0EA', borderRadius: 18, padding: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }, speechCopy: { flex: 1, paddingRight: 10 }, speechLabel: { color: '#6C8C4A', fontSize: 9, fontFamily: 'Manrope_800ExtraBold', fontWeight: '900', letterSpacing: 1 }, speechTitle: { color: '#0E5A74', fontSize: 14, fontFamily: 'Manrope_700Bold', fontWeight: '800', marginTop: 3 }, speechMeta: { color: '#547180', fontSize: 11, marginTop: 4 }, speechButton: { backgroundColor: '#6C8C4A', borderRadius: 13, paddingHorizontal: 14, paddingVertical: 11 }, speechButtonText: { color: '#FFFFFF', fontFamily: 'Manrope_800ExtraBold', fontWeight: '900', fontSize: 12 },
});
