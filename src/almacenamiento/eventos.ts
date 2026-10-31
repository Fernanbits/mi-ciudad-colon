import kvStore from 'expo-sqlite/kv-store';

const CLAVE = 'mi-ciudad.eventos.guardados';
const CLAVE_NOTIFICACIONES = 'mi-ciudad.eventos.notificaciones';

export async function leerEventosGuardados(): Promise<string[]> {
  const raw = await kvStore.getItem(CLAVE);
  return raw ? JSON.parse(raw) as string[] : [];
}

export async function guardarEventosGuardados(ids: string[]): Promise<void> {
  await kvStore.setItem(CLAVE, JSON.stringify(ids));
}

export async function leerNotificacionesEventos(): Promise<Record<string, string>> {
  const raw = await kvStore.getItem(CLAVE_NOTIFICACIONES);
  return raw ? JSON.parse(raw) as Record<string, string> : {};
}

export async function guardarNotificacionEvento(eventoId: string, notificationId: string): Promise<void> {
  const actuales = await leerNotificacionesEventos();
  await kvStore.setItem(CLAVE_NOTIFICACIONES, JSON.stringify({ ...actuales, [eventoId]: notificationId }));
}

export async function quitarNotificacionEvento(eventoId: string): Promise<string | null> {
  const actuales = await leerNotificacionesEventos();
  const notificationId = actuales[eventoId] ?? null;
  delete actuales[eventoId];
  await kvStore.setItem(CLAVE_NOTIFICACIONES, JSON.stringify(actuales));
  return notificationId;
}
