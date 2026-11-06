import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { pedirApi } from './api';

type ModuloNotificaciones = typeof import('expo-notifications');

let moduloPromise: Promise<ModuloNotificaciones | null> | null = null;

async function cargarModuloNotificaciones(): Promise<ModuloNotificaciones | null> {
  if (Platform.OS === 'web') return null;
  if (!moduloPromise) {
    moduloPromise = import('expo-notifications')
      .then((Notifications) => {
        Notifications.setNotificationHandler({
          handleNotification: async () => ({
            shouldPlaySound: false,
            shouldSetBadge: false,
            shouldShowBanner: true,
            shouldShowList: true,
          }),
        });
        return Notifications;
      })
      .catch((error) => {
        console.warn('Notificaciones nativas no disponibles en este cliente:', error);
        return null;
      });
  }
  return moduloPromise;
}

export async function pedirPermisoNotificaciones(): Promise<boolean> {
  const Notifications = await cargarModuloNotificaciones();
  if (!Notifications) return false;
  const actuales = await Notifications.getPermissionsAsync();
  if (actuales.granted) return true;
  const solicitados = await Notifications.requestPermissionsAsync();
  return solicitados.granted;
}

export async function programarRecordatorio(titulo: string, fecha: Date): Promise<string | null> {
  const Notifications = await cargarModuloNotificaciones();
  if (!Notifications) return null;
  if (!(await pedirPermisoNotificaciones())) return null;
  return Notifications.scheduleNotificationAsync({
    content: { title: 'Mi Ciudad', body: titulo, data: { tipo: 'evento' } },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: fecha },
  });
}

export async function cancelarRecordatorio(notificationId: string): Promise<void> {
  const Notifications = await cargarModuloNotificaciones();
  if (!Notifications) return;
  await Notifications.cancelScheduledNotificationAsync(notificationId);
}

export async function registrarDispositivoPush(tokenSesion: string): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  const Notifications = await cargarModuloNotificaciones();
  if (!Notifications) return false;
  const permisos = await Notifications.getPermissionsAsync();
  if (!permisos.granted) return false;

  const projectId = Constants.expoConfig?.extra?.eas?.projectId;
  if (!projectId) {
    console.warn('Push remoto omitido: falta configurar expo.extra.eas.projectId.');
    return false;
  }

  try {
    const pushToken = await Notifications.getExpoPushTokenAsync({ projectId });
    await pedirApi('/dispositivos', {
      method: 'POST',
      token: tokenSesion,
      body: { tokenExpo: pushToken.data, plataforma: Platform.OS === 'ios' ? 'ios' : 'android' },
    });
    return true;
  } catch (error) {
    console.warn('No se pudo registrar el dispositivo para push:', error);
    return false;
  }
}
