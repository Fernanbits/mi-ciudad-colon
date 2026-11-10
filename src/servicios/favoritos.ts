import { aplicarFavoritosRemotos, confirmarCambioFavorito, leerCambiosFavoritos, leerFavoritos } from '../almacenamiento/preferencias';
import { Favorito } from '../tipos/modelos';
import { apiConfigurada, pedirApi, RespuestaListaApi } from './api';

const sincronizaciones = new Map<string, Promise<Favorito[]>>();

async function listarFavoritosRemotos(token: string): Promise<Favorito[]> {
  const favoritos: Favorito[] = [];
  let pagina = 1;
  while (true) {
    const respuesta = await pedirApi<RespuestaListaApi<Favorito>>(`/yo/favoritos?pagina=${pagina}&porPagina=100`, { token });
    favoritos.push(...respuesta.datos);
    if (favoritos.length >= respuesta.meta.total || respuesta.datos.length === 0) return favoritos;
    pagina += 1;
  }
}

export async function sincronizarFavoritos(usuarioId: string, token: string): Promise<Favorito[]> {
  if (!apiConfigurada() || usuarioId === 'anonimo') return leerFavoritos(usuarioId);
  const existente = sincronizaciones.get(usuarioId);
  if (existente) return existente;

  const tarea = (async () => {
    while (true) {
      const cambios = await leerCambiosFavoritos(usuarioId);
      for (const cambio of cambios) {
        await pedirApi(`/yo/favoritos/${encodeURIComponent(cambio.lugarId)}`, {
          method: cambio.marcado ? 'PUT' : 'DELETE', token,
        });
        // Confirmar solo esta operación; puede haber un cambio posterior.
        await confirmarCambioFavorito(usuarioId, cambio.id);
      }
      await aplicarFavoritosRemotos(usuarioId, await listarFavoritosRemotos(token));
      if ((await leerCambiosFavoritos(usuarioId)).length === 0) return leerFavoritos(usuarioId);
    }
  })();
  sincronizaciones.set(usuarioId, tarea);
  try {
    return await tarea;
  } finally {
    if (sincronizaciones.get(usuarioId) === tarea) sincronizaciones.delete(usuarioId);
  }
}
