import { useEffect, useMemo, useState } from 'react';
import { router } from 'expo-router';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { leerEventosGuardados, guardarEventosGuardados, guardarNotificacionEvento, quitarNotificacionEvento } from '../../almacenamiento/eventos';
import { listarEventos } from '../../servicios/eventos';
import { cancelarRecordatorio, programarRecordatorio } from '../../servicios/notificaciones';
import { Evento } from '../../tipos/modelos';

const estadoTexto: Record<Evento['estado'], string> = { programado: 'Programado', suspendido: 'Suspendido', cancelado: 'Cancelado', finalizado: 'Finalizado' };

export default function AgendaScreen() {
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [guardados, setGuardados] = useState<string[]>([]);

  useEffect(() => { void Promise.all([listarEventos(), leerEventosGuardados()]).then(([items, ids]) => { setEventos(items); setGuardados(ids); }); }, []);

  const visibles = useMemo(() => eventos.filter((evento) => evento.estado !== 'finalizado').sort((a, b) => a.inicio.localeCompare(b.inicio)), [eventos]);

  const alternarEvento = async (evento: Evento) => {
    if (evento.estado !== 'programado') return;
    const estaGuardado = guardados.includes(evento.id);
    if (estaGuardado) {
      const siguiente = guardados.filter((id) => id !== evento.id);
      setGuardados(siguiente); await guardarEventosGuardados(siguiente);
      const notificationId = await quitarNotificacionEvento(evento.id);
      if (notificationId) await cancelarRecordatorio(notificationId);
      Alert.alert('Recordatorio quitado', 'No recibirás el aviso de este evento.');
      return;
    }
    const fechaAviso = new Date(new Date(evento.inicio).getTime() - 60 * 60 * 1000);
    const id = await programarRecordatorio(evento.titulo, fechaAviso);
    if (id) await guardarNotificacionEvento(evento.id, id);
    const siguiente = [...guardados, evento.id];
    setGuardados(siguiente); await guardarEventosGuardados(siguiente);
    Alert.alert(id ? 'Evento guardado' : 'Evento guardado en el teléfono', id ? 'Te avisaremos una hora antes.' : 'Las notificaciones están desactivadas, pero el evento quedó en tu agenda.');
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.eyebrow}>AGENDA LOCAL</Text>
      <Text style={styles.title}>Lo que pasa hoy y después</Text>
      <Text style={styles.intro}>Guardá una actividad y Mi Ciudad te ayuda a no perderla. Si se suspende, el estado queda visible.</Text>
      {visibles.map((evento) => {
        const fecha = new Date(evento.inicio);
        const guardado = guardados.includes(evento.id);
        const bloqueado = evento.estado === 'cancelado' || evento.estado === 'suspendido';
        return <View key={evento.id} style={styles.card}>
          <View style={[styles.date, bloqueado && styles.dateDisabled]}><Text style={styles.day}>{fecha.getDate()}</Text><Text style={styles.month}>{fecha.toLocaleDateString('es-AR', { month: 'short' }).toUpperCase()}</Text></View>
          <View style={styles.copy}><Text style={[styles.status, bloqueado && styles.statusDisabled]}>{estadoTexto[evento.estado].toUpperCase()}</Text><Pressable onPress={() => router.push(`/evento/${evento.id}`)}><Text style={styles.cardTitle}>{evento.titulo}</Text></Pressable><Text style={styles.cardText}>{evento.descripcion}</Text><Text style={styles.meta}>{fecha.toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' })} · {evento.precio === 0 ? 'Gratis' : evento.precio == null ? 'Consultar' : `$${evento.precio.toLocaleString('es-AR')}`}</Text><Text style={styles.location}>{evento.direccionLibre ?? (evento.lugarId ? 'Lugar incluido en el catálogo' : 'Ubicación a confirmar')}</Text><Pressable disabled={bloqueado} style={[styles.button, bloqueado && styles.buttonDisabled]} onPress={() => void alternarEvento(evento)}><Text style={styles.buttonText}>{bloqueado ? estadoTexto[evento.estado] : guardado ? '✓ Guardado' : 'Guardar y avisarme'}</Text></Pressable></View>
        </View>;
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FAF7F1' }, content: { padding: 18, paddingBottom: 30 }, eyebrow: { color: '#0E5A74', fontSize: 10, fontFamily: 'Manrope_800ExtraBold', fontWeight: '900', letterSpacing: 1.1 }, title: { color: '#0E5A74', fontSize: 30, fontFamily: 'Manrope_800ExtraBold', fontWeight: '900', marginTop: 5 }, intro: { color: '#547180', fontSize: 14, lineHeight: 20, marginTop: 6, marginBottom: 18 }, card: { flexDirection: 'row', backgroundColor: '#FFFFFF', borderRadius: 20, borderColor: '#E7DCCB', borderWidth: 1, padding: 14, marginBottom: 14 }, date: { width: 52, height: 58, borderRadius: 15, backgroundColor: '#D7B98E', alignItems: 'center', justifyContent: 'center', marginRight: 12 }, dateDisabled: { backgroundColor: '#e4e0db' }, day: { color: '#0E5A74', fontFamily: 'Manrope_800ExtraBold', fontWeight: '900', fontSize: 22 }, month: { color: '#0E5A74', fontFamily: 'Manrope_700Bold', fontWeight: '800', fontSize: 9 }, copy: { flex: 1 }, status: { color: '#6C8C4A', fontFamily: 'Manrope_800ExtraBold', fontWeight: '900', fontSize: 9, letterSpacing: 1 }, statusDisabled: { color: '#718B96' }, cardTitle: { color: '#0E5A74', fontSize: 16, fontFamily: 'Manrope_800ExtraBold', fontWeight: '900', marginTop: 3 }, cardText: { color: '#547180', fontSize: 12, lineHeight: 17, marginTop: 4 }, meta: { color: '#718B96', fontSize: 11, marginTop: 7 }, location: { color: '#6C8C4A', fontSize: 11, marginTop: 5 }, button: { alignSelf: 'flex-start', marginTop: 11, borderRadius: 13, backgroundColor: '#0E5A74', paddingHorizontal: 12, paddingVertical: 8 }, buttonDisabled: { backgroundColor: '#9AAEB5' }, buttonText: { color: '#fff', fontSize: 12, fontFamily: 'Manrope_700Bold', fontWeight: '800' },
});
