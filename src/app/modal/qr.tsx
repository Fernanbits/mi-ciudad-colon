import { CameraView, useCameraPermissions } from 'expo-camera';
import { router, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { obtenerLugar, obtenerLugarPorQr } from '../../servicios/lugares';
import { useAplicacion } from '../../contexto/AplicacionContext';
import { useTema } from '../../contexto/TemaContext';
import { generarId } from '../../utilidades/ids';

export default function QrScreen() {
  const [permission, requestPermission] = useCameraPermissions(); const [scanned, setScanned] = useState(false); const { lugarId } = useLocalSearchParams<{ lugarId?: string }>(); const { session, registrarVisita } = useAplicacion(); const { colores } = useTema();
  if (!permission) return <View style={StyleSheet.flatten([styles.center, { backgroundColor: colores.fondo }])}><Text style={{ color: colores.textoSuave }}>Consultando permiso de cámara...</Text></View>;
  if (!permission.granted) return <View style={StyleSheet.flatten([styles.center, { backgroundColor: colores.fondo }])}><Text style={[styles.title, { color: colores.texto }]}>Necesitamos usar la cámara</Text><Text style={[styles.body, { color: colores.textoSuave }]}>La cámara se usa solamente para leer el QR del lugar.</Text><Pressable accessibilityRole="button" style={[styles.button, { backgroundColor: colores.principal }]} onPress={requestPermission}><Text style={[styles.buttonText, { color: colores.principalTexto }]}>Dar permiso</Text></Pressable><Pressable accessibilityRole="button" onPress={() => router.back()}><Text style={[styles.cancel, { color: colores.principal }]}>Cancelar</Text></Pressable></View>;
  const scan = async ({ data }: { data: string }) => {
    if (scanned) return;
    setScanned(true);
    try {
      const lugarEsperado = lugarId ? await obtenerLugar(lugarId) : null;
      const lugarEscaneado = await obtenerLugarPorQr(data);
      if (!lugarEscaneado) {
        Alert.alert('QR no reconocido', 'Este código no pertenece a Mi Ciudad.', [{ text: 'Intentar de nuevo', onPress: () => setScanned(false) }]);
        return;
      }
      if (lugarEsperado && lugarEscaneado.id !== lugarEsperado.id) {
        Alert.alert('QR no corresponde', `Este código pertenece a “${lugarEscaneado.nombre}”, no a “${lugarEsperado.nombre}”.`, [{ text: 'Intentar de nuevo', onPress: () => setScanned(false) }]);
        return;
      }
      await registrarVisita({ id: generarId('vis'), usuarioId: session?.id ?? 'anonimo', lugarId: lugarEscaneado.id, fechaHora: new Date().toISOString(), origen: 'qr', fotoUri: null, nota: null, sincronizada: false });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Visita registrada', lugarEscaneado.nombre, [{ text: 'Continuar', onPress: () => router.back() }]);
    } catch {
      setScanned(false);
      Alert.alert('No pudimos registrar la visita', 'Probá nuevamente o elegí el registro manual.');
    }
  };
  return <View style={styles.camera}><CameraView style={StyleSheet.absoluteFill} facing="back" barcodeScannerSettings={{ barcodeTypes: ['qr'] }} onBarcodeScanned={scanned ? undefined : scan} /><View style={styles.overlay}><Text style={styles.instructions} accessibilityRole="header">Apuntá al código QR del lugar</Text><View style={styles.frame} accessibilityLabel="Área de lectura del código QR" /><Pressable accessibilityRole="button" style={styles.close} onPress={() => router.back()}><Text style={styles.closeText}>Cerrar</Text></Pressable></View></View>;
}

const styles = StyleSheet.create({ camera: { flex: 1, backgroundColor: '#111' }, overlay: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.28)' }, instructions: { color: '#fff', fontSize: 16, fontFamily: 'Manrope_700Bold', fontWeight: '800', marginBottom: 30 }, frame: { width: 245, height: 245, borderColor: '#fff', borderWidth: 3, borderRadius: 24 }, close: { position: 'absolute', bottom: 50, backgroundColor: '#fff', borderRadius: 16, paddingHorizontal: 22, paddingVertical: 12 }, closeText: { color: '#0E5A74', fontFamily: 'Manrope_800ExtraBold', fontWeight: '900' }, center: { flex: 1, backgroundColor: '#FAF7F1', alignItems: 'center', justifyContent: 'center', padding: 25 }, title: { color: '#0E5A74', fontFamily: 'Manrope_800ExtraBold', fontWeight: '900', fontSize: 20, textAlign: 'center' }, body: { color: '#547180', textAlign: 'center', marginTop: 8, marginBottom: 18 }, button: { backgroundColor: '#0E5A74', borderRadius: 15, paddingHorizontal: 20, paddingVertical: 13 }, buttonText: { color: '#fff', fontFamily: 'Manrope_800ExtraBold', fontWeight: '900' }, cancel: { color: '#0E5A74', fontFamily: 'Manrope_800ExtraBold', fontWeight: '900', marginTop: 20 },
});
