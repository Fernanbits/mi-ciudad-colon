import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { guardarEventosGuardados, leerEventosGuardados, guardarNotificacionEvento, quitarNotificacionEvento } from '../../almacenamiento/eventos';
import { cancelarRecordatorio, programarRecordatorio } from '../../servicios/notificaciones';
import { obtenerEvento } from '../../servicios/eventos';
import { Evento } from '../../tipos/modelos';
import { EstadoView } from '../../components/EstadoView';
import { useAplicacion } from '../../contexto/AplicacionContext';
import { useTema } from '../../contexto/TemaContext';

export default function EventoDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colores } = useTema();
  const { session } = useAplicacion();
  const usuarioActivoId = session?.id ?? 'anonimo';
  const [evento, setEvento] = useState<Evento | null>(null);
  const [guardado, setGuardado] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const cargar = async () => {
    try {
      setLoading(true);
      setError(null);
      const [item, ids] = await Promise.all([obtenerEvento(id), leerEventosGuardados(usuarioActivoId)]);
      setEvento(item);
      setGuardado(ids.includes(id));
    } catch {
      setError('No pudimos cargar el evento. Revisá tu conexión e intentá nuevamente.');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { void cargar(); }, [id, usuarioActivoId]);
  if (loading || error) return <EstadoView loading={loading} error={error} onRetry={cargar} />;
  if (!evento) return <View style={StyleSheet.flatten([styles.center, { backgroundColor: colores.fondo }])}><Text style={[styles.title, { color: colores.texto }]}>Evento no encontrado</Text><Pressable accessibilityRole="button" onPress={() => router.back()}><Text style={[styles.link, { color: colores.principal }]}>Volver</Text></Pressable></View>;

  const inicio = new Date(evento.inicio);
  const alternar = async () => {
    const ids = await leerEventosGuardados(usuarioActivoId);
    if (ids.includes(evento.id)) {
      const siguiente = ids.filter((item) => item !== evento.id);
      await guardarEventosGuardados(usuarioActivoId, siguiente);
      const notificationId = await quitarNotificacionEvento(usuarioActivoId, evento.id);
      if (notificationId) await cancelarRecordatorio(notificationId);
      setGuardado(false);
      Alert.alert('Recordatorio quitado', 'El evento sigue visible en la agenda.');
      return;
    }
    const idNotificacion = evento.estado === 'programado' ? await programarRecordatorio(evento.titulo, new Date(inicio.getTime() - 60 * 60 * 1000)) : null;
    if (idNotificacion) await guardarNotificacionEvento(usuarioActivoId, evento.id, idNotificacion);
    await guardarEventosGuardados(usuarioActivoId, [...ids, evento.id]); setGuardado(true); Alert.alert('Evento guardado', idNotificacion ? 'Te avisaremos una hora antes.' : 'Quedó guardado aunque las notificaciones estén desactivadas.');
  };

  return <ScrollView style={StyleSheet.flatten([styles.screen, { backgroundColor: colores.fondo }])} contentContainerStyle={styles.content}><Pressable accessibilityRole="button" accessibilityLabel="Volver a la agenda" onPress={() => router.back()}><Text style={[styles.back, { color: colores.principal }]}>‹ Volver a la agenda</Text></Pressable><Text style={[styles.eyebrow, { color: colores.verde }]}>{evento.estado.toUpperCase()}</Text><Text style={[styles.title, { color: colores.texto }]}>{evento.titulo}</Text><Text style={[styles.description, { color: colores.textoSuave }]}>{evento.descripcion}</Text><View style={[styles.info, { backgroundColor: colores.superficie, borderColor: colores.borde }]}><Text style={[styles.infoTitle, { color: colores.texto }]}>Cuándo</Text><Text style={[styles.infoText, { color: colores.texto }]}>{inicio.toLocaleString('es-AR', { dateStyle: 'full', timeStyle: 'short' })}{evento.fin ? ` · termina ${new Date(evento.fin).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}` : ''}</Text><Text style={[styles.infoTitle, { color: colores.texto }]}>Dónde</Text><Text style={[styles.infoText, { color: colores.texto }]}>{evento.direccionLibre ?? (evento.lugarId ? 'Lugar incluido en el catálogo' : 'Ubicación a confirmar')}</Text><Text style={[styles.infoTitle, { color: colores.texto }]}>Entrada</Text><Text style={[styles.infoText, { color: colores.texto }]}>{evento.precio === 0 ? 'Gratis' : evento.precio == null ? 'Consultar' : `$${evento.precio.toLocaleString('es-AR')}`}</Text></View><Pressable accessibilityRole="button" disabled={evento.estado === 'cancelado' || evento.estado === 'suspendido'} style={[styles.button, { backgroundColor: colores.principal }, (evento.estado === 'cancelado' || evento.estado === 'suspendido') && styles.disabled]} onPress={() => void alternar()}><Text style={[styles.buttonText, { color: colores.principalTexto }]}>{evento.estado === 'cancelado' || evento.estado === 'suspendido' ? 'Actividad no disponible' : guardado ? '✓ Evento guardado' : 'Guardar y avisarme'}</Text></Pressable></ScrollView>;
}

const styles = StyleSheet.create({ screen: { flex: 1, backgroundColor: '#FAF7F1' }, content: { padding: 18, paddingBottom: 30 }, center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FAF7F1', padding: 20 }, back: { color: '#0E5A74', fontFamily: 'Manrope_700Bold', fontWeight: '800', marginBottom: 24 }, eyebrow: { color: '#6C8C4A', fontSize: 10, fontFamily: 'Manrope_800ExtraBold', fontWeight: '900', letterSpacing: 1.1 }, title: { color: '#0E5A74', fontSize: 31, lineHeight: 36, fontFamily: 'Manrope_800ExtraBold', fontWeight: '900', marginTop: 6 }, description: { color: '#547180', fontSize: 16, lineHeight: 24, marginTop: 14 }, info: { backgroundColor: '#FFFFFF', borderColor: '#E7DCCB', borderWidth: 1, borderRadius: 20, padding: 16, gap: 7, marginTop: 22 }, infoTitle: { color: '#0E5A74', fontFamily: 'Manrope_800ExtraBold', fontWeight: '900', fontSize: 12, marginTop: 8 }, infoText: { color: '#0E5A74', fontSize: 14, lineHeight: 20 }, button: { backgroundColor: '#0E5A74', borderRadius: 16, padding: 15, alignItems: 'center', marginTop: 18 }, disabled: { backgroundColor: '#9AAEB5' }, buttonText: { color: '#fff', fontFamily: 'Manrope_800ExtraBold', fontWeight: '900' }, link: { color: '#0E5A74', fontFamily: 'Manrope_700Bold', fontWeight: '800', marginTop: 10 },
});
