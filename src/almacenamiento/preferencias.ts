import kvStore from 'expo-sqlite/kv-store';
import { Favorito } from '../tipos/modelos';

function claveFavoritos(usuarioId: string): string {
  return `mi-ciudad.favoritos.v2.${usuarioId || 'anonimo'}`;
}

export async function leerFavoritos(usuarioId: string): Promise<Favorito[]> {
  const raw = await kvStore.getItem(claveFavoritos(usuarioId));
  return raw ? JSON.parse(raw) as Favorito[] : [];
}

export async function guardarFavoritos(usuarioId: string, favoritos: Favorito[]): Promise<void> {
  await kvStore.setItem(claveFavoritos(usuarioId), JSON.stringify(favoritos));
}
