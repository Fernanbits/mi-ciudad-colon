import kvStore from 'expo-sqlite/kv-store';
import { Categoria, Lugar } from '../tipos/modelos';

// Se cambia la clave al incorporar fotografías reales para no servir una versión
// vieja del catálogo que haya quedado guardada en el dispositivo.
// La clave anterior no se borra: favoritos, visitas y otros datos siguen intactos.
const CLAVE_LUGARES = 'mi-ciudad.catalogo.lugares.fotos-reales-v1';
const CLAVE_CATEGORIAS = 'mi-ciudad.catalogo.categorias';

export async function leerCatalogoLocal(): Promise<Lugar[] | null> {
  const raw = await kvStore.getItem(CLAVE_LUGARES);
  return raw ? JSON.parse(raw) as Lugar[] : null;
}

export async function guardarCatalogoLocal(lugares: Lugar[]): Promise<void> {
  await kvStore.setItem(CLAVE_LUGARES, JSON.stringify(lugares));
}

export async function leerCategoriasLocal(): Promise<Categoria[] | null> {
  const raw = await kvStore.getItem(CLAVE_CATEGORIAS);
  return raw ? JSON.parse(raw) as Categoria[] : null;
}

export async function guardarCategoriasLocal(categorias: Categoria[]): Promise<void> {
  await kvStore.setItem(CLAVE_CATEGORIAS, JSON.stringify(categorias));
}
