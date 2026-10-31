import kvStore from 'expo-sqlite/kv-store';
import { Favorito } from '../tipos/modelos';

const CLAVE = 'mi-ciudad.favoritos';

export async function leerFavoritos(): Promise<Favorito[]> {
  const raw = await kvStore.getItem(CLAVE);
  return raw ? JSON.parse(raw) as Favorito[] : [];
}

export async function guardarFavoritos(favoritos: Favorito[]): Promise<void> {
  await kvStore.setItem(CLAVE, JSON.stringify(favoritos));
}
