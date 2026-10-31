import { useState } from 'react';
import { Image, ImageSourcePropType, Pressable, StyleSheet, Text, View } from 'react-native';
import { Lugar } from '../tipos/modelos';
import { categorias } from '../mocks/datos';

const placeholder = require('../../assets/icon-mi-ciudad.png') as ImageSourcePropType;

export function imagenDeLugar(url?: string): ImageSourcePropType {
  return url?.startsWith('http') ? { uri: url } : placeholder;
}

export function LugarCard({ lugar, onPress, favorito = false }: { lugar: Lugar; onPress: () => void; favorito?: boolean }) {
  const [imagenFallida, setImagenFallida] = useState(false);
  const categoria = categorias.find((item) => item.id === lugar.categoriaId);
  const precio = lugar.precioEntrada === 0 ? 'Gratis' : lugar.precioEntrada == null ? 'Consultar precio' : `$${lugar.precioEntrada.toLocaleString('es-AR')}`;
  const acceso = lugar.accesible === true ? 'Accesible' : lugar.accesible === false ? 'Accesibilidad limitada' : 'Accesibilidad a confirmar';

  return (
    <Pressable style={styles.card} onPress={onPress} accessibilityRole="button" accessibilityLabel={`Abrir ${lugar.nombre}`}>
      <Image source={imagenFallida ? placeholder : imagenDeLugar(lugar.imagenes[0])} style={styles.image} onError={() => setImagenFallida(true)} />
      <View style={styles.body}>
        <View style={styles.row}>
          <Text style={[styles.category, { color: categoria?.color ?? '#6C8C4A' }]}>{(categoria?.nombre ?? lugar.categoriaId).toUpperCase()}</Text>
          <Text style={styles.favorite} accessibilityLabel={favorito ? 'Lugar favorito' : 'Lugar no favorito'}>{favorito ? '♥' : '♡'}</Text>
        </View>
        <Text style={styles.title}>{lugar.nombre}</Text>
        <Text style={styles.description} numberOfLines={2}>{lugar.descripcionCorta}</Text>
        <Text style={styles.meta}>{precio} · {acceso}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#FFFFFF', borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: '#E7DCCB', marginBottom: 14 },
  image: { width: '100%', height: 145, backgroundColor: '#E4F0EA' },
  body: { padding: 14 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  category: { fontSize: 10, fontFamily: 'Manrope_700Bold', fontWeight: '800', letterSpacing: 1 },
  favorite: { color: '#0E5A74', fontSize: 22 },
  title: { color: '#0E5A74', fontSize: 18, fontFamily: 'Manrope_700Bold', fontWeight: '800', marginTop: 5 },
  description: { color: '#547180', fontSize: 13, lineHeight: 19, marginTop: 5 },
  meta: { color: '#718B96', fontSize: 11, marginTop: 10 },
});
