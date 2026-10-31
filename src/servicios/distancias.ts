import { Coordenadas, Lugar } from '../tipos/modelos';

const RADIO_TIERRA_METROS = 6371000;

export function distanciaEnMetros(origen: Coordenadas, destino: Coordenadas): number {
  const lat1 = origen.latitud * Math.PI / 180;
  const lat2 = destino.latitud * Math.PI / 180;
  const deltaLat = (destino.latitud - origen.latitud) * Math.PI / 180;
  const deltaLong = (destino.longitud - origen.longitud) * Math.PI / 180;
  const a = Math.sin(deltaLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLong / 2) ** 2;
  return Math.round(2 * RADIO_TIERRA_METROS * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

export function ordenarPorDistancia(lugares: Lugar[], origen: Coordenadas): Lugar[] {
  return [...lugares].sort((a, b) => distanciaEnMetros(origen, a.coordenadas) - distanciaEnMetros(origen, b.coordenadas));
}

export function rumboHacia(origen: Coordenadas, destino: Coordenadas): number {
  const lat1 = origen.latitud * Math.PI / 180;
  const lat2 = destino.latitud * Math.PI / 180;
  const deltaLong = (destino.longitud - origen.longitud) * Math.PI / 180;
  return (Math.atan2(Math.sin(deltaLong) * Math.cos(lat2), Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(deltaLong)) * 180 / Math.PI + 360) % 360;
}

export function textoDistancia(metros: number): string {
  return metros < 1000 ? `${metros} m` : `${(metros / 1000).toFixed(1).replace('.', ',')} km`;
}
