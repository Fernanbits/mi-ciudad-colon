import { Platform } from 'react-native';

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
