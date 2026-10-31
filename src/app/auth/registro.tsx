import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useAplicacion } from '../../contexto/AplicacionContext';

export default function RegistroScreen() {
  const { register } = useAplicacion(); const [nombre, setNombre] = useState(''); const [email, setEmail] = useState(''); const [password, setPassword] = useState('');
  const submit = async () => { try { await register(nombre, email, password); Alert.alert('Cuenta creada', 'Tu sesión quedó guardada en este dispositivo.'); router.back(); } catch (error) { Alert.alert('No pudimos crear la cuenta', error instanceof Error ? error.message : 'Revisá los datos.'); } };
  return <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}><View style={styles.content}><Text style={styles.eyebrow}>REGISTRO</Text><Text style={styles.title}>Creá tu cuenta</Text><Text style={styles.description}>La cuenta permite conservar tus favoritos y visitas cuando vuelvas a Colón.</Text><TextInput value={nombre} onChangeText={setNombre} placeholder="Nombre" placeholderTextColor="#aaa49d" style={styles.input} /><TextInput value={email} onChangeText={setEmail} placeholder="Email" placeholderTextColor="#aaa49d" autoCapitalize="none" style={styles.input} /><TextInput value={password} onChangeText={setPassword} placeholder="Contraseña" placeholderTextColor="#aaa49d" secureTextEntry style={styles.input} /><Pressable style={styles.primary} onPress={submit}><Text style={styles.primaryText}>Crear cuenta</Text></Pressable></View></KeyboardAvoidingView>;
}

const styles = StyleSheet.create({ screen: { flex: 1, backgroundColor: '#FAF7F1' }, content: { padding: 24, paddingTop: 70 }, eyebrow: { color: '#0E5A74', fontSize: 10, fontFamily: 'Manrope_800ExtraBold', fontWeight: '900', letterSpacing: 1.1 }, title: { color: '#0E5A74', fontSize: 31, fontFamily: 'Manrope_800ExtraBold', fontWeight: '900', marginTop: 5 }, description: { color: '#547180', fontSize: 14, lineHeight: 20, marginTop: 8, marginBottom: 20 }, input: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E7DCCB', borderRadius: 15, padding: 14, color: '#0E5A74', marginBottom: 10 }, primary: { backgroundColor: '#0E5A74', borderRadius: 16, padding: 15, alignItems: 'center', marginTop: 8 }, primaryText: { color: '#fff', fontFamily: 'Manrope_800ExtraBold', fontWeight: '900' },
});
