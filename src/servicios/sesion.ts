import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { usuarioDemo } from '../mocks/datos';
import { Usuario } from '../tipos/modelos';
import { apiConfigurada, pedirApi, RespuestaUnoApi, SesionApi } from './api';
import { parsearObjetoJsonSeguro } from '../almacenamiento/seguro';

const CLAVE_TOKEN = 'mi-ciudad.session.token';
const CLAVE_USUARIO = 'mi-ciudad.session.user';
const MINIMO_CONTRASENA = 8;

async function guardarSesion(usuario: Usuario, token: string): Promise<void> {
  await SecureStore.setItemAsync(CLAVE_TOKEN, token);
  await SecureStore.setItemAsync(CLAVE_USUARIO, JSON.stringify(usuario));
}

function validarCredenciales(email: string, password: string): void {
  if (!email.trim() || !email.includes('@')) throw new Error('Ingresá un email válido.');
  if (!password.trim()) throw new Error('Ingresá tu contraseña.');
  if (password.length < MINIMO_CONTRASENA) throw new Error('La contraseña debe tener al menos 8 caracteres.');
}

export async function iniciarSesion(email: string, password: string): Promise<Usuario> {
  validarCredenciales(email, password);
  if (apiConfigurada()) {
    const respuesta = await pedirApi<RespuestaUnoApi<SesionApi>>('/auth/ingreso', {
      method: 'POST',
      body: { email: email.trim(), contrasena: password },
      timeoutMs: 30000,
    });
    await guardarSesion(respuesta.datos.usuario, respuesta.datos.token);
    return respuesta.datos.usuario;
  }
  const usuario = { ...usuarioDemo, email: email.trim() };
  await guardarSesion(usuario, `local-session-${usuario.id}`);
  return usuario;
}

export async function registrarUsuario(nombre: string, email: string, password: string): Promise<Usuario> {
  if (!nombre.trim()) throw new Error('Ingresá tu nombre.');
  validarCredenciales(email, password);
  if (apiConfigurada()) {
    const respuesta = await pedirApi<RespuestaUnoApi<SesionApi>>('/auth/registro', {
      method: 'POST',
      body: { nombre: nombre.trim(), email: email.trim(), contrasena: password },
      timeoutMs: 30000,
    });
    await guardarSesion(respuesta.datos.usuario, respuesta.datos.token);
    return respuesta.datos.usuario;
  }
  const usuario = { ...await iniciarSesion(email, password), nombre: nombre.trim() };
  await guardarSesion(usuario, `local-session-${usuario.id}`);
  return usuario;
}

export async function obtenerTokenSesion(): Promise<string | null> {
  return SecureStore.getItemAsync(CLAVE_TOKEN);
}

export async function recuperarSesion(): Promise<Usuario | null> {
  const token = await SecureStore.getItemAsync(CLAVE_TOKEN);
  const usuario = await SecureStore.getItemAsync(CLAVE_USUARIO);
  if (!token || !usuario) return null;
  if (apiConfigurada() && token.startsWith('local-session-')) {
    await cerrarSesion();
    return null;
  }
  const datos = parsearObjetoJsonSeguro<Usuario>(usuario);
  if (!datos || typeof datos.id !== 'string' || typeof datos.email !== 'string') {
    await cerrarSesion();
    return null;
  }
  return datos;
}

export async function cerrarSesion(): Promise<void> {
  await SecureStore.deleteItemAsync(CLAVE_TOKEN);
  await SecureStore.deleteItemAsync(CLAVE_USUARIO);
}

export async function autenticarConBiometria(): Promise<boolean> {
  const disponible = await LocalAuthentication.hasHardwareAsync();
  const inscripta = await LocalAuthentication.isEnrolledAsync();
  if (!disponible || !inscripta) return false;
  const resultado = await LocalAuthentication.authenticateAsync({ promptMessage: 'Ingresá a Mi Ciudad' });
  return resultado.success;
}
