import { useEffect, useMemo, useState } from 'react';
import { router } from 'expo-router';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { leerEventosGuardados, guardarEventosGuardados, guardarNotificacionEvento, quitarNotificacionEvento } from '../../almacenamiento/eventos';
import { listarEventos } from '../../servicios/eventos';
import { cancelarRecordatorio, programarRecordatorio } from '../../servicios/notificaciones';
import { Evento } from '../../tipos/modelos';
import { EstadoView } from '../../components/EstadoView';
import { useAplicacion } from '../../contexto/AplicacionContext';
import { useTema } from '../../contexto/TemaContext';

const estadoTexto: Record<Evento['estado'], string> = { programado: 'Programado', suspendido: 'Suspendido', cancelado: 'Cancelado', finalizado: 'Finalizado' };

export default function AgendaScreen() {
  const { colores } = useTema();
  const { session } = useAplicacion();
  const usuarioActivoId = session?.id ?? 'anonimo';
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [guardados, setGuardados] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cargar = async () => {
    try {
      setLoading(true);
      setError(null);
      const [items, ids] = await Promise.all([listarEventos(), leerEventosGuardados(usuarioActivoId)]);
      setEventos(items);
      setGuardados(ids);
    } catch {
      setError('No pudimos cargar la agenda. Revisá tu conexión e intentá nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void cargar(); }, [usuarioActivoId]);

  const visibles = useMemo(() => eventos.filter((evento) => evento.estado !== 'finalizado').sort((a, b) => a.inicio.localeCompare(b.inicio)), [eventos]);

  const alternarEvento = async (evento: Evento) => {
    if (evento.estado !== 'programado') return;
    const estaGuardado = guardados.includes(evento.id);
    if (estaGuardado) {
      const siguiente = guardados.filter((id) => id !== evento.id);
      setGuardados(siguiente); await guardarEventosGuardados(usuarioActivoId, siguiente);
      const notificationId = await quitarNotificacionEvento(usuarioActivoId, evento.id);
      if (notificationId) await cancelarRecordatorio(notificationId);
      Alert.alert('Recordatorio quitado', 'No recibirás el aviso de este evento.');
      return;
    }
    const fechaAviso = new Date(new Date(evento.inicio).getTime() - 60 * 60 * 1000);
    const id = await programarRecordatorio(evento.titulo, fechaAviso);
    if (id) await guardarNotificacionEvento(usuarioActivoId, evento.id, id);
    const siguiente = [...guardados, evento.id];
    setGuardados(siguiente); await guardarEventosGuardados(usuarioActivoId, siguiente);
    Alert.alert(id ? 'Evento guardado' : 'Evento guardado en el teléfono', id ? 'Te avisaremos una hora antes.' : 'Las notificaciones están desactivadas, pero el evento quedó en tu agenda.');
  };

  return (
    <ScrollView style={StyleSheet.flatten([styles.screen, { backgroundColor: colores.fondo }])} contentContainerStyle={styles.content}>
      <Text style={[styles.eyebrow, { color: colores.texto }]}>AGENDA LOCAL</Text>
      <Text style={[styles.title, { color: colores.texto }]}>Lo que pasa hoy y después</Text>
      <Text style={[styles.intro, { color: colores.textoSuave }]}>Guardá una actividad y Mi Ciudad te ayuda a no perderla. Si se suspende, el estado queda visible.</Text>
      {loading || error ? <EstadoView loading={loading} error={error} onRetry={cargar} /> : visibles.length === 0 ? <Text style={[styles.intro, { color: colores.textoSuave }]}>No hay actividades próximas para mostrar.</Text> : visibles.map((evento) => {
        const fecha = new Date(evento.inicio);
        const guardado = guardados.includes(evento.id);
        const bloqueado = evento.estado === 'cancelado' || evento.estado === 'suspendido';
        return <View key={evento.id} style={[styles.card, { backgroundColor: colores.superficie, borderColor: colores.borde }]}>
          <View style={[styles.date, { backgroundColor: colores.arena }, bloqueado && styles.dateDisabled]}><Text style={[styles.day, { color: colores.texto }]}>{fecha.getDate()}</Text><Text style={[styles.month, { color: colores.texto }]}>{fecha.toLocaleDateString('es-AR', { month: 'short' }).toUpperCase()}</Text></View>
          <View style={styles.copy}><Text style={[styles.status, { color: colores.verde }, bloqueado && { color: colores.textoMuted }]}>{estadoTexto[evento.estado].toUpperCase()}</Text><Pressable accessibilityRole="button" accessibilityLabel={`Abrir ${evento.titulo}`} onPress={() => router.push(`/evento/${evento.id}`)}><Text style={[styles.cardTitle, { color: colores.texto }]}>{evento.titulo}</Text></Pressable><Text style={[styles.cardText, { color: colores.textoSuave }]}>{evento.descripcion}</Text><Text style={[styles.meta, { color: colores.textoMuted }]}>{fecha.toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' })} · {evento.precio === 0 ? 'Gratis' : evento.precio == null ? 'Consultar' : `$${evento.precio.toLocaleString('es-AR')}`}</Text><Text style={[styles.location, { color: colores.verde }]}>{evento.direccionLibre ?? (evento.lugarId ? 'Lugar incluido en el catálogo' : 'Ubicación a confirmar')}</Text><Pressable accessibilityRole="button" disabled={bloqueado} style={[styles.button, { backgroundColor: colores.principal }, bloqueado && styles.buttonDisabled]} onPress={() => void alternarEvento(evento)}><Text style={[styles.buttonText, { color: colores.principalTexto }]}>{bloqueado ? estadoTexto[evento.estado] : guardado ? '✓ Guardado' : 'Guardar y avisarme'}</Text></Pressable></View>
        </View>;
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FAF7F1' }, content: { padding: 18, paddingBottom: 30 }, eyebrow: { color: '#0E5A74', fontSize: 10, fontFamily: 'Manrope_800ExtraBold', fontWeight: '900', letterSpacing: 1.1 }, title: { color: '#0E5A74', fontSize: 30, fontFamily: 'Manrope_800ExtraBold', fontWeight: '900', marginTop: 5 }, intro: { color: '#547180', fontSize: 14, lineHeight: 20, marginTop: 6, marginBottom: 18 }, card: { flexDirection: 'row', backgroundColor: '#FFFFFF', borderRadius: 20, borderColor: '#E7DCCB', borderWidth: 1, padding: 14, marginBottom: 14 }, date: { width: 52, height: 58, borderRadius: 15, backgroundColor: '#D7B98E', alignItems: 'center', justifyContent: 'center', marginRight: 12 }, dateDisabled: { backgroundColor: '#e4e0db' }, day: { color: '#0E5A74', fontFamily: 'Manrope_800ExtraBold', fontWeight: '900', fontSize: 22 }, month: { color: '#0E5A74', fontFamily: 'Manrope_700Bold', fontWeight: '800', fontSize: 9 }, copy: { flex: 1 }, status: { color: '#6C8C4A', fontFamily: 'Manrope_800ExtraBold', fontWeight: '900', fontSize: 9, letterSpacing: 1 }, statusDisabled: { color: '#718B96' }, cardTitle: { color: '#0E5A74', fontSize: 16, fontFamily: 'Manrope_800ExtraBold', fontWeight: '900', marginTop: 3 }, cardText: { color: '#547180', fontSize: 12, lineHeight: 17, marginTop: 4 }, meta: { color: '#718B96', fontSize: 11, marginTop: 7 }, location: { color: '#6C8C4A', fontSize: 11, marginTop: 5 }, button: { alignSelf: 'flex-start', marginTop: 11, borderRadius: 13, backgroundColor: '#0E5A74', paddingHorizontal: 12, paddingVertical: 8 }, buttonDisabled: { backgroundColor: '#9AAEB5' }, buttonText: { color: '#fff', fontSize: 12, fontFamily: 'Manrope_700Bold', fontWeight: '800' },
});
