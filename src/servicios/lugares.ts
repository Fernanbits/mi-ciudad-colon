import { leerCategoriasLocal, leerCatalogoLocal, guardarCategoriasLocal, guardarCatalogoLocal } from '../almacenamiento/catalogo';
import { categorias, lugares } from '../mocks/datos';
import { Categoria, Lugar, RespuestaApi } from '../tipos/modelos';
import { apiConfigurada, pedirApi, RespuestaListaApi, RespuestaUnoApi } from './api';

const CLAVE_ACTUALIZACION_INICIAL = '2000-01-01T00:00:00-03:00';
let catalogoEnMemoria: Lugar[] | null = null;
let categoriasEnMemoria: Categoria[] | null = null;

function conservarImagenesCuradas(catalogoRemoto: Lugar[]): Lugar[] {
  const imagenesLocales = new Map<string, string[]>(lugares.map((lugar) => [lugar.id, lugar.imagenes]));
  imagenesLocales.set('lug-003', [
    'https://commons.wikimedia.org/wiki/Special:FilePath/Entrada_del_Camping_Piedras_Coloradas.JPG?width=1280',
  ]);
  return catalogoRemoto.map((lugar) => ({
    ...lugar,
    // Las imágenes seleccionadas para la entrega tienen prioridad en los lugares que ya
    // documentamos localmente. Los lugares nuevos de la API conservan su imagen remota.
    imagenes: imagenesLocales.get(lugar.id)?.length ? imagenesLocales.get(lugar.id)! : lugar.imagenes,
  }));
}

async function cargarCatalogoRemoto(): Promise<Lugar[]> {
  const respuesta = await pedirApi<RespuestaListaApi<Lugar>>(
    `/lugares?porPagina=500&actualizadoDesde=${encodeURIComponent(CLAVE_ACTUALIZACION_INICIAL)}`,
  );
  const datos = conservarImagenesCuradas(respuesta.datos);
  await guardarCatalogoLocal(datos);
  catalogoEnMemoria = datos;
  return datos;
}

async function catalogoDisponible(): Promise<Lugar[]> {
  if (catalogoEnMemoria) return catalogoEnMemoria;
  if (apiConfigurada()) {
    try {
      return await cargarCatalogoRemoto();
    } catch {
      // La copia local mantiene la app usable si la API está apagada o el teléfono está offline.
    }
  }
  const cache = await leerCatalogoLocal();
  if (cache) {
    const normalizado = conservarImagenesCuradas(cache);
    catalogoEnMemoria = normalizado;
    await guardarCatalogoLocal(normalizado);
    return normalizado;
  }
  await guardarCatalogoLocal(lugares);
  catalogoEnMemoria = lugares;
  return lugares;
}

export async function listarLugares(filtros?: { texto?: string; categoriaId?: string }): Promise<RespuestaApi<Lugar[]>> {
  const catalogo = await catalogoDisponible();
  const texto = filtros?.texto?.trim().toLowerCase();
  const datos = catalogo.filter((lugar) => {
    if (!lugar.activo) return false;
    if (filtros?.categoriaId && lugar.categoriaId !== filtros.categoriaId) return false;
    if (texto && !`${lugar.nombre} ${lugar.descripcionCorta}`.toLowerCase().includes(texto)) return false;
    return true;
  });
  return { datos, meta: { total: datos.length, pagina: 1, porPagina: datos.length } };
}

export async function obtenerLugar(id: string): Promise<Lugar | null> {
  if (apiConfigurada()) {
    try {
      const respuesta = await pedirApi<RespuestaUnoApi<Lugar>>(`/lugares/${encodeURIComponent(id)}`);
      return conservarImagenesCuradas([respuesta.datos])[0] ?? null;
    } catch {
      // Continúa con la copia local para permitir navegación offline.
    }
  }
  return (await catalogoDisponible()).find((lugar) => lugar.id === id && lugar.activo) ?? null;
}

export async function listarCategorias(): Promise<Categoria[]> {
  if (categoriasEnMemoria) return categoriasEnMemoria;
  if (apiConfigurada()) {
    try {
      const respuesta = await pedirApi<RespuestaListaApi<Categoria>>('/categorias');
      categoriasEnMemoria = respuesta.datos;
      await guardarCategoriasLocal(respuesta.datos);
      return respuesta.datos;
    } catch {
      // Usa la última copia conocida.
    }
  }
  const cache = await leerCategoriasLocal();
  if (cache) {
    categoriasEnMemoria = cache;
    return cache;
  }
  await guardarCategoriasLocal(categorias);
  categoriasEnMemoria = categorias;
  return categorias;
}

export async function obtenerLugarPorQr(codigo: string): Promise<Lugar | null> {
  if (apiConfigurada()) {
    try {
      const respuesta = await pedirApi<RespuestaUnoApi<Lugar>>(`/lugares/qr/${encodeURIComponent(codigo)}`);
      return conservarImagenesCuradas([respuesta.datos])[0] ?? null;
    } catch {
      // El catálogo local también permite validar QR durante una demo sin red.
    }
  }
  return (await catalogoDisponible()).find((lugar) => lugar.codigoQr === codigo && lugar.activo) ?? null;
}
