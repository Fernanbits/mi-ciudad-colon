import kvStore from 'expo-sqlite/kv-store';
import { parsearListaJsonSeguro, parsearObjetoJsonSeguro } from './seguro';

const CLAVE_ANTERIOR = 'mi-ciudad.eventos.guardados';
const CLAVE_NOTIFICACIONES_ANTERIOR = 'mi-ciudad.eventos.notificaciones';

function claveEventos(usuarioId: string): string {
  return `mi-ciudad.eventos.guardados.v2.${usuarioId || 'anonimo'}`;
}

function claveNotificaciones(usuarioId: string): string {
  return `mi-ciudad.eventos.notificaciones.v2.${usuarioId || 'anonimo'}`;
}

export async function leerEventosGuardados(usuarioId = 'anonimo'): Promise<string[]> {
  const raw = await kvStore.getItem(claveEventos(usuarioId));
  const nuevos = parsearListaJsonSeguro<string>(raw);
  if (nuevos) return nuevos;
  if (usuarioId !== 'anonimo') return [];
  return parsearListaJsonSeguro<string>(await kvStore.getItem(CLAVE_ANTERIOR)) ?? [];
}

export async function guardarEventosGuardados(usuarioId: string, ids: string[]): Promise<void> {
  await kvStore.setItem(claveEventos(usuarioId), JSON.stringify(ids));
}

export async function leerNotificacionesEventos(usuarioId = 'anonimo'): Promise<Record<string, string>> {
  const raw = await kvStore.getItem(claveNotificaciones(usuarioId));
  const nuevas = parsearObjetoJsonSeguro<Record<string, string>>(raw);
  if (nuevas) return nuevas;
  if (usuarioId !== 'anonimo') return {};
  return parsearObjetoJsonSeguro<Record<string, string>>(await kvStore.getItem(CLAVE_NOTIFICACIONES_ANTERIOR)) ?? {};
}

export async function guardarNotificacionEvento(usuarioId: string, eventoId: string, notificationId: string): Promise<void> {
  const actuales = await leerNotificacionesEventos(usuarioId);
  await kvStore.setItem(claveNotificaciones(usuarioId), JSON.stringify({ ...actuales, [eventoId]: notificationId }));
}

export async function quitarNotificacionEvento(usuarioId: string, eventoId: string): Promise<string | null> {
  const actuales = await leerNotificacionesEventos(usuarioId);
  const notificationId = actuales[eventoId] ?? null;
  delete actuales[eventoId];
  await kvStore.setItem(claveNotificaciones(usuarioId), JSON.stringify(actuales));
  return notificationId;
}
