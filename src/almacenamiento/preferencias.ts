import kvStore from 'expo-sqlite/kv-store';
import { Favorito } from '../tipos/modelos';
import { generarId } from '../utilidades/ids';
import { parsearListaJsonSeguro, parsearObjetoJsonSeguro } from './seguro';

export interface CambioFavorito {
  id: string;
  lugarId: string;
  marcado: boolean;
}

interface EstadoFavoritos {
  favoritos: Favorito[];
  pendientes: CambioFavorito[];
}

const escrituras = new Map<string, Promise<EstadoFavoritos>>();

function favoritosValidos(valores: unknown, usuarioId: string): Favorito[] {
  if (!Array.isArray(valores)) return [];
  const unicos = new Map<string, Favorito>();
  for (const valor of valores) {
    if (valor && typeof valor.id === 'string' && valor.usuarioId === usuarioId &&
        typeof valor.lugarId === 'string' && valor.lugarId.startsWith('lug-') && typeof valor.creadoEn === 'string') {
      unicos.set(valor.lugarId, valor as Favorito);
    }
  }
  return [...unicos.values()];
}

async function cargarEstado(usuarioId: string): Promise<EstadoFavoritos> {
  const clave = `mi-ciudad.favoritos.v3.${usuarioId}`;
  const estado = parsearObjetoJsonSeguro<EstadoFavoritos>(await kvStore.getItem(clave));
  if (estado && Array.isArray(estado.favoritos) && Array.isArray(estado.pendientes)) {
    return {
      favoritos: favoritosValidos(estado.favoritos, usuarioId),
      pendientes: estado.pendientes.filter((cambio) => cambio && typeof cambio.id === 'string' &&
        typeof cambio.lugarId === 'string' && cambio.lugarId.startsWith('lug-') && typeof cambio.marcado === 'boolean'),
    };
  }

  const anteriores = parsearListaJsonSeguro<Favorito>(await kvStore.getItem(`mi-ciudad.favoritos.v2.${usuarioId}`));
  const favoritos = favoritosValidos(anteriores, usuarioId);
  const inicial: EstadoFavoritos = {
    favoritos,
    pendientes: usuarioId === 'anonimo' ? [] : favoritos.map((favorito) => ({
      id: generarId('cambio'), lugarId: favorito.lugarId, marcado: true,
    })),
  };
  await kvStore.setItem(clave, JSON.stringify(inicial));
  return inicial;
}

// Serializar las escrituras por usuario para evitar cambios perdidos.
async function actualizarEstado(usuarioId: string, cambiar: (estado: EstadoFavoritos) => EstadoFavoritos): Promise<EstadoFavoritos> {
  const anterior = escrituras.get(usuarioId);
  const tarea = Promise.resolve(anterior).catch(() => undefined).then(async () => {
    const estado = await cargarEstado(usuarioId);
    const siguiente = cambiar(estado);
    if (siguiente !== estado) {
      await kvStore.setItem(`mi-ciudad.favoritos.v3.${usuarioId}`, JSON.stringify(siguiente));
    }
    return siguiente;
  });
  escrituras.set(usuarioId, tarea);
  try {
    return await tarea;
  } finally {
    if (escrituras.get(usuarioId) === tarea) escrituras.delete(usuarioId);
  }
}

export async function leerFavoritos(usuarioId: string): Promise<Favorito[]> {
  return (await actualizarEstado(usuarioId, (estado) => estado)).favoritos;
}

export async function leerCambiosFavoritos(usuarioId: string): Promise<CambioFavorito[]> {
  return (await actualizarEstado(usuarioId, (estado) => estado)).pendientes;
}

export async function alternarFavoritoLocal(usuarioId: string, lugarId: string): Promise<Favorito[]> {
  const estado = await actualizarEstado(usuarioId, (actual) => {
    const existe = actual.favoritos.some((favorito) => favorito.lugarId === lugarId);
    const favoritos = existe ? actual.favoritos.filter((favorito) => favorito.lugarId !== lugarId) : [
      ...actual.favoritos,
      { id: generarId('fav'), usuarioId, lugarId, creadoEn: new Date().toISOString() },
    ];
    const pendientes = actual.pendientes.filter((cambio) => cambio.lugarId !== lugarId);
    if (usuarioId !== 'anonimo') pendientes.push({ id: generarId('cambio'), lugarId, marcado: !existe });
    return { favoritos, pendientes };
  });
  return estado.favoritos;
}

export async function confirmarCambioFavorito(usuarioId: string, cambioId: string): Promise<void> {
  await actualizarEstado(usuarioId, (estado) => ({
    ...estado, pendientes: estado.pendientes.filter((cambio) => cambio.id !== cambioId),
  }));
}

export async function aplicarFavoritosRemotos(usuarioId: string, remotos: Favorito[]): Promise<Favorito[]> {
  const estado = await actualizarEstado(usuarioId, (actual) => {
    const combinados = new Map(favoritosValidos(remotos, usuarioId).map((favorito) => [favorito.lugarId, favorito]));
    for (const cambio of actual.pendientes) {
      if (!cambio.marcado) combinados.delete(cambio.lugarId);
      else {
        const local = actual.favoritos.find((favorito) => favorito.lugarId === cambio.lugarId);
        if (local) combinados.set(cambio.lugarId, local);
      }
    }
    return { favoritos: [...combinados.values()], pendientes: actual.pendientes };
  });
  return estado.favoritos;
}
