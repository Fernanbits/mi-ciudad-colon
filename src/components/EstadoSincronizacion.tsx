import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useAplicacion } from '../contexto/AplicacionContext';
import { useTema } from '../contexto/TemaContext';

export function EstadoSincronizacion() {
  const { session, online, visitas, favoritosPendientes, sincronizando, errorSincronizacion,
    ultimaSincronizacion, sincronizarDatos } = useAplicacion();
  const { colores } = useTema();
  if (!session) return null;

  const pendientes = favoritosPendientes + visitas.filter((visita) => !visita.sincronizada).length;
  const disponible = online === true && !sincronizando;
  const mensaje = online !== true
    ? 'Sin conexión. Los cambios se guardan en este teléfono y se enviarán cuando vuelva internet.'
    : sincronizando ? 'Actualizando favoritos y visitas...'
    : errorSincronizacion ?? (pendientes
      ? `${pendientes} cambio${pendientes === 1 ? '' : 's'} pendiente${pendientes === 1 ? '' : 's'} de envío.`
      : ultimaSincronizacion
        ? `Cuenta actualizada a las ${new Date(ultimaSincronizacion).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}.`
        : 'Sincronizá para recuperar tus favoritos y visitas de otro teléfono.');

  return (
    <View style={[styles.panel, { backgroundColor: colores.superficie, borderColor: colores.borde }]}>
      <Text style={[styles.titulo, { color: colores.texto }]}>Tus datos, guardados</Text>
      <Text accessibilityLiveRegion="polite" style={[styles.mensaje, { color: colores.textoSuave }]}>{mensaje}</Text>
      <Pressable
        accessibilityRole="button" accessibilityState={{ disabled: !disponible, busy: sincronizando }}
        disabled={!disponible} onPress={() => void sincronizarDatos()}
        style={[styles.boton, { backgroundColor: colores.principal }, !disponible && styles.deshabilitado]}
      >
        <Text style={[styles.textoBoton, { color: colores.principalTexto }]}>
          {sincronizando ? 'Sincronizando...' : 'Sincronizar cuenta'}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: { borderWidth: 1, borderRadius: 18, padding: 16, marginVertical: 16 },
  titulo: { fontFamily: 'Manrope_700Bold', fontSize: 16 },
  mensaje: { fontSize: 14, lineHeight: 21, marginTop: 8 },
  boton: { minHeight: 48, borderRadius: 12, padding: 12, alignItems: 'center', justifyContent: 'center', marginTop: 12 },
  textoBoton: { fontFamily: 'Manrope_700Bold', fontSize: 14, textAlign: 'center' },
  deshabilitado: { opacity: 0.55 },
});
