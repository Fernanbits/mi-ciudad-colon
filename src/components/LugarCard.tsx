import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, ImageStyle, ImageResizeMode, Pressable, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Categoria, Lugar } from '../tipos/modelos';
import { useTema } from '../contexto/TemaContext';

type LugarImagenProps = {
  uri?: string;
  nombre: string;
  categoria?: string;
  style?: StyleProp<ImageStyle>;
  resizeMode?: ImageResizeMode;
};

const FOTOS_LOCALES: Record<string, number> = {
  'local://fotos-reales/puerto-viejo.jpg': require('../../assets/fotos-reales/puerto-viejo.jpg'),
  'local://fotos-reales/piedras-coloradas.jpg': require('../../assets/fotos-reales/piedras-coloradas.jpg'),
};

export function LugarImagen({ uri, nombre, categoria, style, resizeMode = 'cover' }: LugarImagenProps) {
  const { colores } = useTema();
  const uriValida = Boolean(uri?.trim());
  const fuenteLocal = uri ? FOTOS_LOCALES[uri] : undefined;
  const [estado, setEstado] = useState<'cargando' | 'lista' | 'fallida'>(uriValida ? 'cargando' : 'fallida');

  useEffect(() => {
    setEstado(uri?.trim() ? 'cargando' : 'fallida');
  }, [uri]);

  if (estado === 'fallida') {
    return (
      <View style={[styles.fallback, { backgroundColor: colores.superficieSuave }, style as StyleProp<ViewStyle>]} accessible accessibilityRole="image" accessibilityLabel={`Imagen no disponible de ${nombre}`}>
        <Text style={[styles.fallbackIcon, { color: colores.verde }]}>▧</Text>
        <Text style={[styles.fallbackTitle, { color: colores.texto }]}>{categoria ?? 'Lugar turístico'}</Text>
        <Text style={[styles.fallbackText, { color: colores.textoMuted }]}>Foto pendiente</Text>
      </View>
    );
  }

  return (
    <View style={[styles.mediaWrapper, style as StyleProp<ViewStyle>]} accessible accessibilityRole="image" accessibilityLabel={estado === 'cargando' ? `Cargando imagen de ${nombre}` : `Imagen de ${nombre}`}>
      <Image source={fuenteLocal ?? { uri: uri!.trim() }} style={styles.imageFill} resizeMode={resizeMode} onLoad={() => setEstado('lista')} onError={() => setEstado('fallida')} accessible={false} />
      {estado === 'cargando' && <View style={[styles.loadingOverlay, { backgroundColor: colores.superficieSuave }]}><ActivityIndicator color={colores.verde} /></View>}
    </View>
  );
}

export function LugarCard({ lugar, onPress, favorito = false, categorias = [] }: { lugar: Lugar; onPress: () => void; favorito?: boolean; categorias?: Categoria[] }) {
  const { colores } = useTema();
  const categoria = categorias.find((item) => item.id === lugar.categoriaId);
  const precio = lugar.precioEntrada === 0 ? 'Gratis' : lugar.precioEntrada == null ? 'Consultar precio' : `$${lugar.precioEntrada.toLocaleString('es-AR')}`;
  const acceso = lugar.accesible === true ? 'Accesible' : lugar.accesible === false ? 'Accesibilidad limitada' : 'Accesibilidad a confirmar';

  return (
    <Pressable style={[styles.card, { backgroundColor: colores.superficie, borderColor: colores.borde }]} onPress={onPress} accessibilityRole="button" accessibilityLabel={`Abrir ${lugar.nombre}`} accessibilityHint="Muestra la información, horarios y cómo llegar">
      <LugarImagen uri={lugar.imagenes[0]} nombre={lugar.nombre} categoria={categoria?.nombre} style={[styles.image, { backgroundColor: colores.superficieSuave }]} />
      <View style={styles.body}>
        <View style={styles.row}>
          <Text style={[styles.category, { color: categoria?.color ?? colores.verde }]}>{(categoria?.nombre ?? lugar.categoriaId).toUpperCase()}</Text>
          <Text style={[styles.favorite, { color: colores.texto }]} accessibilityLabel={favorito ? 'Lugar favorito' : 'Lugar no favorito'}>{favorito ? '♥' : '♡'}</Text>
        </View>
        <Text style={[styles.title, { color: colores.texto }]}>{lugar.nombre}</Text>
        <Text style={[styles.description, { color: colores.textoSuave }]} numberOfLines={2}>{lugar.descripcionCorta}</Text>
        <Text style={[styles.meta, { color: colores.textoMuted }]}>{precio} · {acceso}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#FFFFFF', borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: '#E7DCCB', marginBottom: 14 },
  image: { width: '100%', height: 145, backgroundColor: '#E4F0EA' },
  mediaWrapper: { overflow: 'hidden' },
  imageFill: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 },
  loadingOverlay: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, alignItems: 'center', justifyContent: 'center' },
  fallback: { width: '100%', height: 145, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12 },
  fallbackIcon: { fontSize: 25, lineHeight: 29 },
  fallbackTitle: { fontFamily: 'Manrope_700Bold', fontWeight: '800', fontSize: 11, textAlign: 'center', marginTop: 4 },
  fallbackText: { fontSize: 10, textAlign: 'center', marginTop: 2 },
  body: { padding: 14 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  category: { fontSize: 10, fontFamily: 'Manrope_700Bold', fontWeight: '800', letterSpacing: 1 },
  favorite: { color: '#0E5A74', fontSize: 22 },
  title: { color: '#0E5A74', fontSize: 18, fontFamily: 'Manrope_700Bold', fontWeight: '800', marginTop: 5 },
  description: { color: '#547180', fontSize: 13, lineHeight: 19, marginTop: 5 },
  meta: { color: '#718B96', fontSize: 11, marginTop: 10 },
});
