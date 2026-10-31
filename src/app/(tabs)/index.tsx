import { Ionicons } from '@react-native-vector-icons/ionicons';
import { Link, router } from 'expo-router';
import { Magnetometer } from 'expo-sensors';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import MapView, { Callout, Marker, Region } from 'react-native-maps';
import { EstadoView } from '../../components/EstadoView';
import { LugarCard } from '../../components/LugarCard';
import { listarCategorias, listarLugares } from '../../servicios/lugares';
import { pedirUbicacionActual } from '../../servicios/ubicacion';
import { distanciaEnMetros, ordenarPorDistancia, rumboHacia, textoDistancia } from '../../servicios/distancias';
import { Categoria, Coordenadas, Lugar } from '../../tipos/modelos';
import { useAplicacion } from '../../contexto/AplicacionContext';
import { marca, tipografia } from '../../theme/marca';

const logoHorizontal = require('../../../assets/logo-mi-ciudad-horizontal-cropped.png');

const regionInicial: Region = { latitude: -32.219, longitude: -58.144, latitudeDelta: 0.11, longitudeDelta: 0.11 };

export default function MapaScreen() {
  const [lugares, setLugares] = useState<Lugar[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [categoria, setCategoria] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [region, setRegion] = useState(regionInicial);
  const [ubicacion, setUbicacion] = useState<Coordenadas | null>(null);
  const [rumbo, setRumbo] = useState(0);
  const { favoritos, online } = useAplicacion();

  const cargar = async () => {
    try {
      setLoading(true); setError(null);
      const [resultado, cats] = await Promise.all([listarLugares({ categoriaId: categoria }), listarCategorias()]);
      setLugares(resultado.datos); setCategorias(cats);
    } catch { setError('Revisá tu conexión e intentá nuevamente.'); } finally { setLoading(false); }
  };

  useEffect(() => { void cargar(); }, [categoria]);

  useEffect(() => {
    const subscription = Magnetometer.addListener(({ x, y }) => {
      const grados = (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
      setRumbo(Math.round(grados));
    });
    Magnetometer.setUpdateInterval(1000);
    return () => subscription.remove();
  }, []);

  const usarUbicacion = async () => {
    const actual = await pedirUbicacionActual();
    if (!actual) {
      Alert.alert('Ubicación opcional', 'No pudimos acceder a tu ubicación. Podés habilitarla desde Ajustes o seguir explorando el mapa sin este permiso.');
      return;
    }
    const punto = { latitud: actual.coords.latitude, longitud: actual.coords.longitude };
    setUbicacion(punto);
    setRegion({ ...regionInicial, latitude: punto.latitud, longitude: punto.longitud });
  };

  const cercanos = useMemo(() => {
    const filtrados = ubicacion ? ordenarPorDistancia(lugares, ubicacion) : lugares;
    return filtrados.slice(0, 3);
  }, [lugares, ubicacion]);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={styles.brandBlock}>
          <Image source={logoHorizontal} style={styles.brandLogo} resizeMode="contain" accessibilityLabel="Logo Mi Ciudad" />
          <Text style={styles.brandPlace}>Colón</Text>
          <Text style={styles.subtitle}>Para recorrer a tu ritmo</Text>
        </View>
        <Link href="/auth/login" style={styles.login}>Ingresar</Link>
      </View>
      {online === false && <View style={styles.offline}><Ionicons name="cloud-offline-outline" size={16} color="#A97932" /><Text style={styles.offlineText}>Sin conexión · usando tu guía guardada</Text></View>}
      <Text style={styles.question}>¿Qué tenés cerca?</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filters}>
        <Pressable onPress={() => setCategoria(undefined)} style={[styles.filter, !categoria && styles.filterActive]}><Text style={[styles.filterText, !categoria && styles.filterTextActive]}>Todo</Text></Pressable>
        {categorias.map((item) => <Pressable key={item.id} onPress={() => setCategoria(item.id)} style={[styles.filter, categoria === item.id && styles.filterActive]}><Text style={[styles.filterText, categoria === item.id && styles.filterTextActive]}>{item.nombre}</Text></Pressable>)}
      </ScrollView>
      <View style={styles.mapWrap}>
        <MapView style={styles.map} initialRegion={regionInicial} region={region} onRegionChangeComplete={setRegion} showsUserLocation={Boolean(ubicacion)} showsMyLocationButton={false}>
          {lugares.map((lugar) => <Marker key={lugar.id} coordinate={{ latitude: lugar.coordenadas.latitud, longitude: lugar.coordenadas.longitud }} pinColor={marca.azulPetroleo}>
            <Callout onPress={() => router.push(`/lugar/${lugar.id}`)}><View style={styles.callout}><Text style={styles.calloutTitle}>{lugar.nombre}</Text><Text style={styles.calloutText}>{ubicacion ? textoDistancia(distanciaEnMetros(ubicacion, lugar.coordenadas)) : 'Ver detalle y cómo llegar'}</Text></View></Callout>
          </Marker>)}
        </MapView>
        <Pressable style={styles.locationButton} onPress={usarUbicacion}><Ionicons name="locate-outline" color={marca.azulPetroleo} size={20} /><Text style={styles.locationText}>{ubicacion ? 'Ubicación activa' : 'Usar mi ubicación'}</Text></Pressable>
        <View style={styles.compass}><Ionicons name="navigate" color={marca.azulPetroleo} size={22} style={{ transform: [{ rotate: `${rumbo}deg` }] }} /><Text style={styles.compassText}>{rumbo}°</Text></View>
      </View>
      <View style={styles.sectionHeader}><View><Text style={styles.eyebrow}>CERCA TUYO</Text><Text style={styles.sectionTitle}>{ubicacion ? 'A pocos pasos' : 'Puntos para empezar'}</Text></View><Link href="/lugares" style={styles.seeAll}>Ver todo</Link></View>
      {ubicacion && <View style={styles.nearby}>{cercanos.map((lugar) => <Pressable key={`near-${lugar.id}`} style={styles.nearbyRow} onPress={() => router.push(`/lugar/${lugar.id}`)}><Ionicons name="navigate-outline" color="#0E5A74" size={20} style={{ transform: [{ rotate: `${rumboHacia(ubicacion, lugar.coordenadas) - rumbo}deg` }] }} /><Text style={styles.nearbyName}>{lugar.nombre}</Text><Text style={styles.nearbyDistance}>{textoDistancia(distanciaEnMetros(ubicacion, lugar.coordenadas))}</Text></Pressable>)}</View>}
      {loading || error ? <EstadoView loading={loading} error={error} onRetry={cargar} /> : cercanos.map((lugar) => <LugarCard key={lugar.id} lugar={lugar} favorito={favoritos.some((item) => item.lugarId === lugar.id)} onPress={() => router.push(`/lugar/${lugar.id}`)} />)}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FAF7F1' }, content: { padding: 18, paddingBottom: 30 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }, brandBlock: { flex: 1 }, brandLogo: { width: 165, height: 48, alignSelf: 'flex-start' }, brandPlace: { color: '#0E5A74', fontFamily: tipografia.semibold, fontSize: 14, marginTop: -3 }, subtitle: { color: '#547180', fontFamily: tipografia.regular, fontSize: 12, marginTop: 1 }, login: { color: '#0E5A74', fontFamily: tipografia.bold, fontWeight: '800', fontSize: 13 },
  question: { color: '#0E5A74', fontFamily: tipografia.extrabold, fontSize: 25, fontWeight: '900', marginTop: 6 }, filters: { marginVertical: 14 }, filter: { borderRadius: 15, borderColor: '#E7DCCB', borderWidth: 1, backgroundColor: '#FFFFFF', paddingHorizontal: 13, paddingVertical: 9, marginRight: 8 }, filterActive: { backgroundColor: '#0E5A74', borderColor: '#0E5A74' }, filterText: { color: '#547180', fontFamily: tipografia.medium, fontSize: 12, fontWeight: '700' }, filterTextActive: { color: '#fff', fontFamily: tipografia.semibold },
  offline: { backgroundColor: '#F4E4BC', borderRadius: 12, padding: 9, marginBottom: 10, flexDirection: 'row', alignItems: 'center', gap: 6 }, offlineText: { color: '#A97932', fontFamily: tipografia.medium, fontSize: 12, textAlign: 'center', fontWeight: '700' },
  mapWrap: { height: 310, borderRadius: 24, overflow: 'hidden', marginBottom: 24 }, map: { flex: 1 }, locationButton: { position: 'absolute', left: 14, bottom: 14, backgroundColor: '#FFFFFF', borderRadius: 16, paddingVertical: 10, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 6, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 6, elevation: 3 }, locationText: { color: '#0E5A74', fontSize: 12, fontWeight: '800' }, compass: { position: 'absolute', right: 14, bottom: 14, backgroundColor: '#FFFFFF', borderRadius: 16, padding: 9, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 6, elevation: 3 }, compassText: { color: '#0E5A74', fontSize: 9, fontWeight: '800' },
  callout: { width: 160, padding: 4 }, calloutTitle: { fontFamily: tipografia.bold, fontWeight: '800', color: '#0E5A74' }, calloutText: { color: '#547180', fontFamily: tipografia.regular, fontSize: 11, marginTop: 3 }, sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 12 }, eyebrow: { color: '#0E5A74', fontFamily: tipografia.extrabold, fontSize: 10, fontWeight: '900', letterSpacing: 1.1, marginBottom: 4 }, sectionTitle: { color: '#0E5A74', fontFamily: tipografia.extrabold, fontSize: 22, fontWeight: '900' }, seeAll: { color: '#0E5A74', fontFamily: tipografia.bold, fontWeight: '800', fontSize: 12, paddingBottom: 3 }, nearby: { backgroundColor: '#FFFFFF', borderRadius: 18, borderColor: '#E7DCCB', borderWidth: 1, padding: 8, marginBottom: 14 }, nearbyRow: { flexDirection: 'row', alignItems: 'center', padding: 8, gap: 8 }, nearbyName: { color: '#0E5A74', fontFamily: tipografia.bold, fontWeight: '800', flex: 1, fontSize: 13 }, nearbyDistance: { color: '#6C8C4A', fontFamily: tipografia.bold, fontWeight: '800', fontSize: 12 },
});
