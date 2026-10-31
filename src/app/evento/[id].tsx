import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { guardarEventosGuardados, leerEventosGuardados, guardarNotificacionEvento, quitarNotificacionEvento } from '../../almacenamiento/eventos';
import { cancelarRecordatorio, programarRecordatorio } from '../../servicios/notificaciones';
import { obtenerEvento } from '../../servicios/eventos';
import { Evento } from '../../tipos/modelos';

export default function EventoDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [evento, setEvento] = useState<Evento | null>(null);
  const [guardado, setGuardado] = useState(false);
  useEffect(() => { void Promise.all([obtenerEvento(id), leerEventosGuardados()]).then(([item, ids]) => { setEvento(item); setGuardado(ids.includes(id)); }); }, [id]);
  if (!evento) return <View style={styles.center}><Text style={styles.title}>Evento no encontrado</Text><Pressable onPress={() => router.back()}><Text style={styles.link}>Volver</Text></Pressable></View>;

  const inicio = new Date(evento.inicio);
  const alternar = async () => {
    const ids = await leerEventosGuardados();
    if (ids.includes(evento.id)) {
      const siguiente = ids.filter((item) => item !== evento.id);
      await guardarEventosGuardados(siguiente);
      const notificationId = await quitarNotificacionEvento(evento.id);
      if (notificationId) await cancelarRecordatorio(notificationId);
      setGuardado(false);
      Alert.alert('Recordatorio quitado', 'El evento sigue visible en la agenda.');
      return;
    }
    const idNotificacion = evento.estado === 'programado' ? await programarRecordatorio(evento.titulo, new Date(inicio.getTime() - 60 * 60 * 1000)) : null;
    if (idNotificacion) await guardarNotificacionEvento(evento.id, idNotificacion);
    await guardarEventosGuardados([...ids, evento.id]); setGuardado(true); Alert.alert('Evento guardado', idNotificacion ? 'Te avisaremos una hora antes.' : 'Quedó guardado aunque las notificaciones estén desactivadas.');
  };

  return <ScrollView style={styles.screen} contentContainerStyle={styles.content}><Pressable onPress={() => router.back()}><Text style={styles.back}>‹ Volver a la agenda</Text></Pressable><Text style={styles.eyebrow}>{evento.estado.toUpperCase()}</Text><Text style={styles.title}>{evento.titulo}</Text><Text style={styles.description}>{evento.descripcion}</Text><View style={styles.info}><Text style={styles.infoTitle}>Cuándo</Text><Text style={styles.infoText}>{inicio.toLocaleString('es-AR', { dateStyle: 'full', timeStyle: 'short' })}{evento.fin ? ` · termina ${new Date(evento.fin).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}` : ''}</Text><Text style={styles.infoTitle}>Dónde</Text><Text style={styles.infoText}>{evento.direccionLibre ?? (evento.lugarId ? 'Lugar incluido en el catálogo' : 'Ubicación a confirmar')}</Text><Text style={styles.infoTitle}>Entrada</Text><Text style={styles.infoText}>{evento.precio === 0 ? 'Gratis' : evento.precio == null ? 'Consultar' : `$${evento.precio.toLocaleString('es-AR')}`}</Text></View><Pressable disabled={evento.estado === 'cancelado' || evento.estado === 'suspendido'} style={[styles.button, (evento.estado === 'cancelado' || evento.estado === 'suspendido') && styles.disabled]} onPress={() => void alternar()}><Text style={styles.buttonText}>{evento.estado === 'cancelado' || evento.estado === 'suspendido' ? 'Actividad no disponible' : guardado ? '✓ Evento guardado' : 'Guardar y avisarme'}</Text></Pressable></ScrollView>;
}

const styles = StyleSheet.create({ screen: { flex: 1, backgroundColor: '#FAF7F1' }, content: { padding: 18, paddingBottom: 30 }, center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FAF7F1', padding: 20 }, back: { color: '#0E5A74', fontFamily: 'Manrope_700Bold', fontWeight: '800', marginBottom: 24 }, eyebrow: { color: '#6C8C4A', fontSize: 10, fontFamily: 'Manrope_800ExtraBold', fontWeight: '900', letterSpacing: 1.1 }, title: { color: '#0E5A74', fontSize: 31, lineHeight: 36, fontFamily: 'Manrope_800ExtraBold', fontWeight: '900', marginTop: 6 }, description: { color: '#547180', fontSize: 16, lineHeight: 24, marginTop: 14 }, info: { backgroundColor: '#FFFFFF', borderColor: '#E7DCCB', borderWidth: 1, borderRadius: 20, padding: 16, gap: 7, marginTop: 22 }, infoTitle: { color: '#0E5A74', fontFamily: 'Manrope_800ExtraBold', fontWeight: '900', fontSize: 12, marginTop: 8 }, infoText: { color: '#0E5A74', fontSize: 14, lineHeight: 20 }, button: { backgroundColor: '#0E5A74', borderRadius: 16, padding: 15, alignItems: 'center', marginTop: 18 }, disabled: { backgroundColor: '#9AAEB5' }, buttonText: { color: '#fff', fontFamily: 'Manrope_800ExtraBold', fontWeight: '900' }, link: { color: '#0E5A74', fontFamily: 'Manrope_700Bold', fontWeight: '800', marginTop: 10 },
});
