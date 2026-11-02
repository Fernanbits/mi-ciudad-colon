import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { categorias } from '../../mocks/datos';
import { guardarFotoVisita } from '../../servicios/archivos';
import { distanciaEnMetros } from '../../servicios/distancias';
import { listarLugares } from '../../servicios/lugares';
import { pedirUbicacionActual } from '../../servicios/ubicacion';
import { Lugar, Visita } from '../../tipos/modelos';
import { useAplicacion } from '../../contexto/AplicacionContext';

export default function RecorridoScreen() {
  const { visitas, session, registrarVisita } = useAplicacion();
  const [lugares, setLugares] = useState<Lugar[]>([]);
  const [lugarId, setLugarId] = useState<string | null>(null);
  const [nota, setNota] = useState('');
  const [foto, setFoto] = useState<string | null>(null);

  useEffect(() => { void listarLugares().then((res) => { setLugares(res.datos); setLugarId(res.datos[0]?.id ?? null); }); }, []);

  const lugaresVisitados = useMemo(() => new Set(visitas.map((visita) => visita.lugarId)), [visitas]);
  const lugaresDescubiertos = useMemo(() => lugares.filter((lugar) => lugaresVisitados.has(lugar.id)), [lugares, lugaresVisitados]);
  const progreso = lugares.length ? Math.round((lugaresDescubiertos.length / lugares.length) * 100) : 0;
  const categoriasDescubiertas = useMemo(() => categorias.filter((categoria) => lugaresDescubiertos.some((lugar) => lugar.categoriaId === categoria.id)), [lugaresDescubiertos]);
  const insignias = [
    { id: 'primera', simbolo: '✦', titulo: 'Primera huella', desbloqueada: lugaresDescubiertos.length >= 1 },
    { id: 'explorador', simbolo: '◆', titulo: 'Explorador', desbloqueada: lugaresDescubiertos.length >= 3 },
    { id: 'pasaporte', simbolo: '★', titulo: 'Pasaporte completo', desbloqueada: lugares.length > 0 && lugaresDescubiertos.length === lugares.length },
  ];
  const sellos = useMemo(() => lugares.map((lugar) => ({
    lugar,
    desbloqueado: lugaresVisitados.has(lugar.id),
    categoria: categorias.find((categoria) => categoria.id === lugar.categoriaId),
  })), [lugares, lugaresVisitados]);

  const elegirFoto = async () => {
    const permiso = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permiso.granted) { Alert.alert('Foto opcional', 'Podés registrar la visita sin agregar una imagen.'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 });
    if (!result.canceled) setFoto(result.assets[0].uri);
  };

  const sacarFoto = async () => {
    const permiso = await ImagePicker.requestCameraPermissionsAsync();
    if (!permiso.granted) { Alert.alert('Cámara opcional', 'Podés registrar la visita sin agregar una foto. Si querés usarla, habilitá el permiso desde Ajustes.'); return; }
    const result = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.8 });
    if (!result.canceled) setFoto(result.assets[0].uri);
  };

  const registrar = async (origen: Visita['origen'], elegido = lugarId) => {
    const lugar = lugares.find((item) => item.id === elegido);
    if (!lugar) { Alert.alert('Elegí un lugar', 'Seleccioná dónde estás para guardar la visita.'); return; }
    const id = `vis-${Date.now()}`;
    const fotoUri = foto ? await guardarFotoVisita(foto, id).catch(() => foto) : null;
    const visita: Visita = { id, usuarioId: session?.id ?? 'anonimo', lugarId: lugar.id, fechaHora: new Date().toISOString(), origen, fotoUri, nota: nota.trim() || null, sincronizada: false };
    await registrarVisita(visita); setNota(''); setFoto(null);
    Alert.alert('Visita guardada', `${lugar.nombre} quedó en tu recorrido. Se sincronizará cuando vuelva la conexión.`);
  };

  const registrarPorGps = async () => {
    const actual = await pedirUbicacionActual();
    if (!actual) { Alert.alert('Ubicación no disponible', 'Podés elegir el lugar y registrarlo manualmente.'); return; }
    const candidatos = lugares.map((lugar) => ({ lugar, metros: distanciaEnMetros({ latitud: actual.coords.latitude, longitud: actual.coords.longitude }, lugar.coordenadas) })).sort((a, b) => a.metros - b.metros);
    const cercano = candidatos[0];
    if (!cercano || cercano.metros > 500) { Alert.alert('No encontramos un lugar cerca', 'Acercate a un lugar del catálogo o registrá la visita manualmente.'); return; }
    setLugarId(cercano.lugar.id); await registrar('gps', cercano.lugar.id);
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.eyebrow}>MI RECORRIDO</Text>
      <Text style={styles.title}>La visita queda con vos</Text>
      <Text style={styles.intro}>Registrá un lugar por QR, por cercanía o manualmente. La memoria se guarda primero en el teléfono.</Text>
      <View style={styles.permissionNotice}><Text style={styles.permissionTitle}>Permisos, solo cuando hacen falta</Text><Text style={styles.permissionText}>Ubicación para “Estoy acá”, cámara para QR o fotos, galería para elegir una imagen y notificaciones al guardar un recordatorio.</Text></View>
      <View style={styles.passport} accessibilityLabel={`Pasaporte de Colón: ${lugaresDescubiertos.length} de ${lugares.length} lugares descubiertos`}>
        <View style={styles.passportHeader}><View style={styles.passportCopy}><Text style={styles.passportEyebrow}>PASAPORTE DE COLÓN</Text><Text style={styles.passportTitle}>Tus huellas hacen el mapa</Text></View><Text style={styles.passportScore}>{lugaresDescubiertos.length}/{lugares.length}</Text></View>
        <Text style={styles.passportText}>{lugaresDescubiertos.length === 0 ? 'Visitá tu primer lugar para empezar a completar la ciudad.' : `${progreso}% de Colón recorrido. Cada visita queda guardada en tu teléfono.`}</Text>
        <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${progreso}%` }]} /></View>
        <View style={styles.passportMeta}><Text style={styles.passportMetaText}>{categoriasDescubiertas.length} categorías descubiertas</Text><Text style={styles.passportMetaText}>{lugaresDescubiertos.length} lugares únicos</Text></View>
        <View style={styles.badgesRow}>{insignias.map((insignia) => <View key={insignia.id} style={[styles.badge, !insignia.desbloqueada && styles.badgeLocked]}><Text style={styles.badgeSymbol}>{insignia.simbolo}</Text><Text style={styles.badgeTitle}>{insignia.desbloqueada ? insignia.titulo : 'Por descubrir'}</Text></View>)}</View>
      </View>
      <View style={styles.stampsSection}>
        <Text style={styles.sectionTitle}>Tu colección de sellos</Text>
        <Text style={styles.intro}>Cada visita desbloquea la imagen de un lugar y suma una nueva huella a tu pasaporte.</Text>
        <View style={styles.stampsGrid}>
          {sellos.map(({ lugar, desbloqueado, categoria }) => <View key={lugar.id} style={styles.stampCard}>
            {lugar.imagenes[0] ? <Image source={{ uri: lugar.imagenes[0] }} style={[styles.stampImage, !desbloqueado && styles.stampImageLocked]} resizeMode="cover" accessibilityLabel={`Imagen de ${lugar.nombre}`} /> : <View style={styles.stampImageFallback}><Text style={styles.stampImageFallbackText}>Sin imagen</Text></View>}
            <View style={styles.stampBody}>
              <Text style={styles.stampTitle} numberOfLines={2}>{desbloqueado ? lugar.nombre : 'Sello por descubrir'}</Text>
              <Text style={styles.stampCategory}>{desbloqueado ? categoria?.nombre ?? 'Lugar turístico' : 'Visitá este lugar para desbloquearlo'}</Text>
            </View>
          </View>)}
        </View>
      </View>
      <View style={styles.actions}><Pressable style={styles.primary} onPress={() => router.push('/modal/qr')}><Text style={styles.primaryText}>Escanear QR</Text></Pressable><Pressable style={styles.secondary} onPress={() => void registrarPorGps()}><Text style={styles.secondaryText}>Estoy acá</Text></Pressable></View>
      <Text style={styles.sectionTitle}>¿Qué lugar visitaste?</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.placeList}>{lugares.map((lugar) => <Pressable key={lugar.id} onPress={() => setLugarId(lugar.id)} style={[styles.placeChip, lugarId === lugar.id && styles.placeChipActive]}><Text style={[styles.placeChipText, lugarId === lugar.id && styles.placeChipTextActive]}>{lugar.nombre}</Text></Pressable>)}</ScrollView>
      <View style={styles.photoActions}><Pressable style={styles.photoButton} onPress={() => void sacarFoto()}><Text style={styles.photoButtonText}>Sacar foto</Text></Pressable><Pressable style={styles.photoButton} onPress={() => void elegirFoto()}><Text style={styles.photoButtonText}>Elegir de galería</Text></Pressable></View>
      {foto && <Image source={{ uri: foto }} style={styles.preview} accessibilityLabel="Foto elegida para la visita" />}
      <TextInput value={nota} onChangeText={setNota} placeholder="Una nota corta sobre este momento" placeholderTextColor="#aaa49d" style={styles.input} multiline maxLength={180} />
      <Pressable style={styles.manual} onPress={() => void registrar('manual')}><Text style={styles.manualText}>Guardar visita manual</Text></Pressable>
      <Text style={styles.subTitle}>Visitas guardadas ({visitas.length})</Text>
      {visitas.length === 0 ? <View style={styles.empty}><Text style={styles.emptyTitle}>Todavía no registraste visitas</Text><Text style={styles.intro}>Escaneá un QR o elegí un lugar para comenzar.</Text></View> : visitas.map((visita) => <View key={visita.id} style={styles.visit}><Text style={styles.visitTitle}>{lugares.find((lugar) => lugar.id === visita.lugarId)?.nombre ?? 'Lugar visitado'}</Text><Text style={styles.visitMeta}>{new Date(visita.fechaHora).toLocaleString('es-AR')} · {visita.origen.toUpperCase()} · {visita.sincronizada ? 'sincronizada' : 'pendiente'}</Text>{visita.fotoUri && <Image source={{ uri: visita.fotoUri }} style={styles.visitPhoto} />}{visita.nota && <Text style={styles.visitNote}>{visita.nota}</Text>}</View>)}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FAF7F1' }, content: { padding: 18, paddingBottom: 30 }, eyebrow: { color: '#0E5A74', fontSize: 10, fontFamily: 'Manrope_800ExtraBold', fontWeight: '900', letterSpacing: 1.1 }, title: { color: '#0E5A74', fontSize: 30, fontFamily: 'Manrope_800ExtraBold', fontWeight: '900', marginTop: 5 }, intro: { color: '#547180', fontSize: 14, lineHeight: 20, marginTop: 6 }, permissionNotice: { backgroundColor: '#E4F0EA', borderRadius: 16, padding: 13, marginTop: 14 }, permissionTitle: { color: '#0E5A74', fontFamily: 'Manrope_700Bold', fontWeight: '800', fontSize: 13 }, permissionText: { color: '#547180', fontSize: 12, lineHeight: 18, marginTop: 4 }, passport: { backgroundColor: '#0E5A74', borderRadius: 22, padding: 16, marginTop: 14 }, passportHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }, passportCopy: { flex: 1, paddingRight: 10 }, passportEyebrow: { color: '#D7B98E', fontFamily: 'Manrope_800ExtraBold', fontWeight: '900', fontSize: 10, letterSpacing: 1.2 }, passportTitle: { color: '#FFFFFF', fontFamily: 'Manrope_800ExtraBold', fontWeight: '900', fontSize: 19, marginTop: 5 }, passportScore: { color: '#FFFFFF', fontFamily: 'Manrope_800ExtraBold', fontWeight: '900', fontSize: 24 }, passportText: { color: '#D9EDF0', fontSize: 12, lineHeight: 18, marginTop: 12 }, progressTrack: { height: 9, backgroundColor: 'rgba(255, 255, 255, 0.22)', borderRadius: 10, overflow: 'hidden', marginTop: 13 }, progressFill: { height: '100%', backgroundColor: '#1CA7A6', borderRadius: 10 }, passportMeta: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }, passportMetaText: { color: '#D9EDF0', fontSize: 10 }, badgesRow: { flexDirection: 'row', gap: 8, marginTop: 15 }, badge: { flex: 1, minHeight: 72, backgroundColor: 'rgba(255, 255, 255, 0.12)', borderColor: '#D7B98E', borderWidth: 1, borderRadius: 15, padding: 9, alignItems: 'center', justifyContent: 'center' }, badgeLocked: { opacity: 0.42, borderColor: 'rgba(255, 255, 255, 0.4)' }, badgeSymbol: { color: '#D7B98E', fontSize: 21 }, badgeTitle: { color: '#FFFFFF', fontFamily: 'Manrope_700Bold', fontWeight: '800', fontSize: 10, textAlign: 'center', marginTop: 5 }, stampsSection: { marginTop: 4 }, stampsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 10 }, stampCard: { width: '48%', backgroundColor: '#FFFFFF', borderRadius: 17, borderColor: '#E7DCCB', borderWidth: 1, overflow: 'hidden' }, stampImage: { width: '100%', height: 106, backgroundColor: '#E4F0EA' }, stampImageLocked: { opacity: 0.48 }, stampImageFallback: { width: '100%', height: 106, backgroundColor: '#E4F0EA', alignItems: 'center', justifyContent: 'center' }, stampImageFallbackText: { color: '#6C8C4A', fontSize: 11, fontFamily: 'Manrope_700Bold', fontWeight: '800' }, stampBody: { padding: 11, minHeight: 70 }, stampTitle: { color: '#0E5A74', fontFamily: 'Manrope_700Bold', fontWeight: '800', fontSize: 12, lineHeight: 17 }, stampCategory: { color: '#718B96', fontSize: 10, lineHeight: 14, marginTop: 4 }, actions: { flexDirection: 'row', gap: 10, marginTop: 18 }, primary: { flex: 1, backgroundColor: '#0E5A74', borderRadius: 15, padding: 13, alignItems: 'center' }, primaryText: { color: '#fff', fontFamily: 'Manrope_800ExtraBold', fontWeight: '900' }, secondary: { flex: 1, borderColor: '#0E5A74', borderWidth: 1, borderRadius: 15, padding: 13, alignItems: 'center' }, secondaryText: { color: '#0E5A74', fontFamily: 'Manrope_800ExtraBold', fontWeight: '900' }, sectionTitle: { color: '#0E5A74', fontSize: 19, fontFamily: 'Manrope_800ExtraBold', fontWeight: '900', marginTop: 24 }, placeList: { marginTop: 10 }, placeChip: { maxWidth: 180, borderRadius: 14, borderColor: '#E7DCCB', borderWidth: 1, backgroundColor: '#FFFFFF', paddingHorizontal: 12, paddingVertical: 10, marginRight: 8 }, placeChipActive: { backgroundColor: '#0E5A74', borderColor: '#0E5A74' }, placeChipText: { color: '#547180', fontSize: 12, fontFamily: 'Manrope_700Bold', fontWeight: '700' }, placeChipTextActive: { color: '#fff' }, photoActions: { flexDirection: 'row', gap: 10, marginTop: 15 }, photoButton: { flex: 1, backgroundColor: '#E4F0EA', borderRadius: 14, padding: 12, alignItems: 'center' }, photoButtonText: { color: '#6C8C4A', fontFamily: 'Manrope_700Bold', fontWeight: '800', fontSize: 12 }, preview: { width: '100%', height: 170, borderRadius: 18, marginTop: 14 }, input: { backgroundColor: '#FFFFFF', borderColor: '#E7DCCB', borderWidth: 1, borderRadius: 16, padding: 13, color: '#0E5A74', minHeight: 80, textAlignVertical: 'top', marginTop: 14 }, manual: { backgroundColor: '#0E5A74', borderRadius: 15, padding: 13, alignItems: 'center', marginTop: 10 }, manualText: { color: '#fff', fontFamily: 'Manrope_800ExtraBold', fontWeight: '900' }, subTitle: { color: '#0E5A74', fontSize: 20, fontFamily: 'Manrope_800ExtraBold', fontWeight: '900', marginTop: 28, marginBottom: 12 }, empty: { backgroundColor: '#FFFFFF', borderRadius: 18, padding: 18, alignItems: 'center' }, emptyTitle: { color: '#0E5A74', fontFamily: 'Manrope_700Bold', fontWeight: '800' }, visit: { backgroundColor: '#FFFFFF', borderColor: '#E7DCCB', borderWidth: 1, borderRadius: 16, padding: 14, marginBottom: 10 }, visitTitle: { color: '#0E5A74', fontFamily: 'Manrope_800ExtraBold', fontWeight: '900', fontSize: 15 }, visitMeta: { color: '#718B96', fontSize: 11, marginTop: 4 }, visitPhoto: { width: '100%', height: 130, borderRadius: 12, marginTop: 10 }, visitNote: { color: '#547180', fontSize: 13, marginTop: 8 },
});
