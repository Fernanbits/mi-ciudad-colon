import { Link, router } from 'expo-router';
import { useState } from 'react';
import { Alert, Keyboard, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput } from 'react-native';
import { useAplicacion } from '../../contexto/AplicacionContext';
import { useTema } from '../../contexto/TemaContext';

export default function LoginScreen() {
  const { login, biometricLogin } = useAplicacion();
  const { colores } = useTema();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (loading) return;
    Keyboard.dismiss();
    try {
      setLoading(true);
      await login(email, password);
      router.back();
    } catch (error) {
      Alert.alert('No pudimos ingresar', error instanceof Error ? error.message : 'Revisá tus datos.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={StyleSheet.flatten([styles.screen, { backgroundColor: colores.fondo }])}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
        <Text style={[styles.brand, { color: colores.texto }]}>Mi Ciudad</Text>
        <Text style={[styles.eyebrow, { color: colores.texto }]}>INGRESO</Text>
        <Text style={[styles.title, { color: colores.texto }]}>Guardá tu viaje</Text>
        <Text style={[styles.description, { color: colores.textoSuave }]}>Ingresá para guardar favoritos, visitas y continuar tu recorrido.</Text>
        <TextInput
          value={email} onChangeText={setEmail} placeholder="Email" placeholderTextColor={colores.placeholder}
          autoCapitalize="none" autoCorrect={false} keyboardType="email-address" autoComplete="email"
          editable={!loading} accessibilityLabel="Email"
          style={[styles.input, { backgroundColor: colores.superficie, borderColor: colores.borde, color: colores.texto }]}
        />
        <TextInput
          value={password} onChangeText={setPassword} placeholder="Contraseña" placeholderTextColor={colores.placeholder}
          secureTextEntry autoComplete="current-password" editable={!loading} accessibilityLabel="Contraseña"
          returnKeyType="done" onSubmitEditing={() => void submit()}
          style={[styles.input, { backgroundColor: colores.superficie, borderColor: colores.borde, color: colores.texto }]}
        />
        <Pressable
          accessibilityRole="button" accessibilityState={{ disabled: loading, busy: loading }} disabled={loading}
          style={[styles.primary, { backgroundColor: colores.principal }, loading && styles.disabled]} onPress={submit}
        >
          <Text style={[styles.primaryText, { color: colores.principalTexto }]}>{loading ? 'Ingresando...' : 'Ingresar'}</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button" disabled={loading} style={[styles.secondary, { borderColor: colores.principal }]}
          onPress={async () => {
            const ok = await biometricLogin();
            if (ok) router.back();
            else Alert.alert('Biometría no disponible', 'Podés ingresar con email y contraseña.');
          }}
        >
          <Text style={[styles.secondaryText, { color: colores.principal }]}>Ingresar con huella o rostro</Text>
        </Pressable>
        <Link href="/auth/registro" style={[styles.link, { color: colores.principal }]}>Crear una cuenta</Link>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({ screen: { flex: 1, backgroundColor: '#FAF7F1' }, content: { flexGrow: 1, padding: 24 }, brand: { color: '#0E5A74', fontSize: 29, fontFamily: 'Manrope_800ExtraBold', fontWeight: '900', marginBottom: 45 }, eyebrow: { color: '#0E5A74', fontSize: 10, fontFamily: 'Manrope_800ExtraBold', fontWeight: '900', letterSpacing: 1.1 }, title: { color: '#0E5A74', fontSize: 31, fontFamily: 'Manrope_800ExtraBold', fontWeight: '900', marginTop: 5 }, description: { color: '#547180', fontSize: 14, lineHeight: 20, marginTop: 8, marginBottom: 20 }, input: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E7DCCB', borderRadius: 15, padding: 14, color: '#0E5A74', marginBottom: 10 }, primary: { backgroundColor: '#0E5A74', borderRadius: 16, padding: 15, alignItems: 'center', marginTop: 8 }, disabled: { opacity: 0.6 }, primaryText: { color: '#fff', fontFamily: 'Manrope_800ExtraBold', fontWeight: '900' }, secondary: { borderColor: '#0E5A74', borderWidth: 1, borderRadius: 16, padding: 14, alignItems: 'center', marginTop: 10 }, secondaryText: { color: '#0E5A74', fontFamily: 'Manrope_800ExtraBold', fontWeight: '900' }, link: { color: '#0E5A74', fontFamily: 'Manrope_800ExtraBold', fontWeight: '900', textAlign: 'center', marginTop: 22 },
});
