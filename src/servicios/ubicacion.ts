import * as Location from 'expo-location';

export async function pedirUbicacionActual(): Promise<Location.LocationObject | null> {
  const permiso = await Location.requestForegroundPermissionsAsync();
  if (permiso.status !== 'granted') return null;
  return Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
}
