import { leerCategoriasLocal, leerCatalogoLocal, guardarCategoriasLocal, guardarCatalogoLocal } from '../almacenamiento/catalogo';
import { categorias, lugares } from '../mocks/datos';
import { Categoria, Lugar, RespuestaApi } from '../tipos/modelos';
import { apiConfigurada, pedirApi, RespuestaListaApi, RespuestaUnoApi } from './api';

const CLAVE_ACTUALIZACION_INICIAL = '2000-01-01T00:00:00-03:00';
let catalogoEnMemoria: Lugar[] | null = null;
let categoriasEnMemoria: Categoria[] | null = null;

// Excluir las imágenes de prueba del catálogo remoto.
const MEDIOS_DE_PRUEBA = new Set([
  'beaches-1.png',
  'beaches-2.png',
  'crafts-1.png',
  'crafts-2.png',
  'gastronomy-1.png',
  'gastronomy-2.png',
  'hot-springs-1.png',
  'hot-springs-2.png',
  'lodging-1.png',
  'lodging-2.png',
  'museums-1.png',
  'museums-2.png',
  'nature-1.png',
  'nature-2.png',
]);

function esMedioDePrueba(url: string): boolean {
  const nombreArchivo = url.split('?')[0].split('/').pop()?.toLowerCase();
  return nombreArchivo ? MEDIOS_DE_PRUEBA.has(nombreArchivo) : false;
}

function conservarImagenesCuradas(catalogoRemoto: Lugar[]): Lugar[] {
  const imagenesLocales = new Map<string, string[]>(lugares.map((lugar) => [lugar.id, lugar.imagenes]));
  imagenesLocales.set('lug-003', ['local://fotos-reales/piedras-coloradas.jpg']);
  imagenesLocales.set('lug-007', ['local://fotos-reales/puerto-viejo.jpg']);
  imagenesLocales.set('lug-014', [
    'https://colon.gov.ar/wp-content/uploads/2023/09/OBRA-COSTANERA-balaustres-1-9-2023-2-scaled.jpg',
  ]);
  imagenesLocales.set('lug-015', [
    'https://colon.gov.ar/wp-content/uploads/2025/12/WhatsApp-Image-2025-12-16-at-19.31.19.jpeg',
  ]);
  imagenesLocales.set('lug-008', ['https://media.elentrerios.com/fotos-emb/2024/08/09/o_1723200219.jpg']);
  imagenesLocales.set('lug-016', ['https://www.argentinaviajera.com.ar/2023/img/entrerios/colon/puente.jpg']);
  imagenesLocales.set('lug-011', ['https://www.turismoentrerios.com/quehacemos/img-actividades/167-uno.jpeg']);
  imagenesLocales.set('lug-012', ['https://www.entreriosturismo.com.ar/img/palacio-san-jose-entre-rios.jpg']);
  imagenesLocales.set('lug-013', ['https://www.welcomeargentina.com/paseos/museo-colonia-san-jose/museo-historico-colonia-san-jose-1.jpg']);
  imagenesLocales.set('lug-018', ['https://termasvillaelisa.com/wp-content/uploads/2023/07/termas-villa-elisa-1.jpg']);
  return catalogoRemoto.map((lugar) => ({
    ...lugar,
    // Priorizar las fotografías verificadas.
    imagenes: imagenesLocales.get(lugar.id)?.length
      ? imagenesLocales.get(lugar.id)!
      : lugar.imagenes.filter((url) => !esMedioDePrueba(url)),
  }));
}

async function cargarCatalogoRemoto(): Promise<Lugar[]> {
  const respuesta = await pedirApi<RespuestaListaApi<Lugar>>(
    `/lugares?porPagina=500&actualizadoDesde=${encodeURIComponent(CLAVE_ACTUALIZACION_INICIAL)}`,
  );
  if (respuesta.datos.length === 0) {
    throw new Error('La API respondió un catálogo vacío. Se conserva la última copia disponible.');
  }
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
      // Conservar el catálogo local si falla la API.
    }
  }
  const cache = await leerCatalogoLocal();
  if (cache?.length) {
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
    }
  }
  return (await catalogoDisponible()).find((lugar) => lugar.id === id && lugar.activo) ?? null;
}

export async function listarCategorias(): Promise<Categoria[]> {
  if (categoriasEnMemoria) return categoriasEnMemoria;
  if (apiConfigurada()) {
    try {
      const respuesta = await pedirApi<RespuestaListaApi<Categoria>>('/categorias');
      if (respuesta.datos.length === 0) throw new Error('La API respondió sin categorías.');
      categoriasEnMemoria = respuesta.datos;
      await guardarCategoriasLocal(respuesta.datos);
      return respuesta.datos;
    } catch {
    }
  }
  const cache = await leerCategoriasLocal();
  if (cache?.length) {
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
      // Permitir la validación local de QR sin conexión.
    }
  }
  return (await catalogoDisponible()).find((lugar) => lugar.codigoQr === codigo && lugar.activo) ?? null;
}
