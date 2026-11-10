import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Keyboard, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput } from 'react-native';
import { useAplicacion } from '../../contexto/AplicacionContext';
import { useTema } from '../../contexto/TemaContext';

export default function RegistroScreen() {
  const { register } = useAplicacion();
  const { colores } = useTema();
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (loading) return;
    Keyboard.dismiss();
    try {
      setLoading(true);
      await register(nombre, email, password);
      Alert.alert('Cuenta creada', 'Tu sesión quedó guardada en este dispositivo.');
      router.dismissTo('/(tabs)/yo');
    } catch (error) {
      Alert.alert('No pudimos crear la cuenta', error instanceof Error ? error.message : 'Revisá los datos.');
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
        <Text style={[styles.eyebrow, { color: colores.texto }]}>REGISTRO</Text>
        <Text style={[styles.title, { color: colores.texto }]}>Creá tu cuenta</Text>
        <Text style={[styles.description, { color: colores.textoSuave }]}>Creá una cuenta para sincronizar tus favoritos y visitas. Podés explorar lugares sin registrarte.</Text>
        <TextInput
          value={nombre} onChangeText={setNombre} placeholder="Nombre" placeholderTextColor={colores.placeholder}
          autoComplete="name" maxLength={100} editable={!loading} accessibilityLabel="Nombre"
          style={[styles.input, { backgroundColor: colores.superficie, borderColor: colores.borde, color: colores.texto }]}
        />
        <TextInput
          value={email} onChangeText={setEmail} placeholder="Email" placeholderTextColor={colores.placeholder}
          autoCapitalize="none" autoCorrect={false} keyboardType="email-address" autoComplete="email"
          editable={!loading} accessibilityLabel="Email"
          style={[styles.input, { backgroundColor: colores.superficie, borderColor: colores.borde, color: colores.texto }]}
        />
        <TextInput
          value={password} onChangeText={setPassword} placeholder="Contraseña (mínimo 8 caracteres)" placeholderTextColor={colores.placeholder}
          secureTextEntry autoComplete="new-password" editable={!loading} accessibilityLabel="Contraseña, mínimo 8 caracteres"
          returnKeyType="done" onSubmitEditing={() => void submit()}
          style={[styles.input, { backgroundColor: colores.superficie, borderColor: colores.borde, color: colores.texto }]}
        />
        <Pressable
          accessibilityRole="button" accessibilityState={{ disabled: loading, busy: loading }} disabled={loading}
          style={[styles.primary, { backgroundColor: colores.principal }, loading && styles.disabled]} onPress={submit}
        >
          <Text style={[styles.primaryText, { color: colores.principalTexto }]}>{loading ? 'Creando cuenta...' : 'Crear cuenta'}</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({ screen: { flex: 1, backgroundColor: '#FAF7F1' }, content: { flexGrow: 1, padding: 24 }, eyebrow: { color: '#0E5A74', fontSize: 10, fontFamily: 'Manrope_800ExtraBold', fontWeight: '900', letterSpacing: 1.1 }, title: { color: '#0E5A74', fontSize: 31, fontFamily: 'Manrope_800ExtraBold', fontWeight: '900', marginTop: 5 }, description: { color: '#547180', fontSize: 14, lineHeight: 20, marginTop: 8, marginBottom: 20 }, input: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E7DCCB', borderRadius: 15, padding: 14, color: '#0E5A74', marginBottom: 10 }, primary: { backgroundColor: '#0E5A74', borderRadius: 16, padding: 15, alignItems: 'center', marginTop: 8 }, disabled: { opacity: 0.6 }, primaryText: { color: '#fff', fontFamily: 'Manrope_800ExtraBold', fontWeight: '900' },
});
