import { Directory, File, Paths } from 'expo-file-system';
import { ApiHttpError, apiConfigurada, urlApi } from './api';
import { generarId } from '../utilidades/ids';

export async function guardarFotoVisita(uri: string, visitaId: string): Promise<string> {
  const directorio = new Directory(Paths.document, 'visitas');
  directorio.create({ idempotent: true, intermediates: true });
  const destino = new File(directorio, `${visitaId}.jpg`);
  const origen = new File(uri);
  origen.copy(destino);
  return destino.uri;
}

function archivoAudioguia(url: string, lugarId: string): File {
  const extension = /\.(mp3|m4a|aac|wav|ogg)(?:\?|$)/i.exec(url)?.[1]?.toLowerCase() ?? 'mp3';
  // El nombre remoto distingue versiones del mismo audio.
  const nombre = url.split('?')[0].split('/').pop()?.replace(/[^a-z0-9._-]/gi, '').slice(-100) || 'audio';
  return new File(Paths.document, 'audioguias', `${lugarId}-${nombre.endsWith('.' + extension) ? nombre : nombre + '.' + extension}`);
}

export function buscarAudioguiaGuardada(url: string, lugarId: string): string | null {
  const archivo = archivoAudioguia(url, lugarId);
  return archivo.exists && archivo.size > 0 ? archivo.uri : null;
}

export async function guardarAudioguia(url: string, lugarId: string): Promise<string> {
  const guardada = buscarAudioguiaGuardada(url, lugarId);
  if (guardada) return guardada;
  const directorio = new Directory(Paths.document, 'audioguias');
  directorio.create({ idempotent: true, intermediates: true });
  const destino = archivoAudioguia(url, lugarId);
  const temporal = new File(directorio, generarId('descarga'));
  let completada = false;
  try {
    const archivo = await File.downloadFileAsync(url, temporal);
    if (!archivo.exists || archivo.size === 0) throw new Error('El archivo de audio está vacío.');
    if (destino.exists) destino.delete();
    archivo.move(destino);
    completada = true;
    return destino.uri;
  } finally {
    // move() puede cambiar la URI del temporal; no borrar el archivo ya movido.
    if (!completada && temporal.exists) temporal.delete();
  }
}

export async function subirFotoVisita(uri: string, visitaId: string, token: string): Promise<string> {
  if (!apiConfigurada()) throw new ApiHttpError('La API no está configurada.', 0, 'API_NO_CONFIGURADA');

  const formulario = new FormData();
  formulario.append('archivo', {
    uri,
    name: `${visitaId}.jpg`,
    type: 'image/jpeg',
  } as unknown as Blob);

  const respuesta = await fetch(urlApi('/archivos'), {
    method: 'POST',
    headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
    body: formulario,
  });
  const texto = await respuesta.text();
  let contenido: unknown = null;
  try {
    contenido = texto ? JSON.parse(texto) : null;
  } catch {
    contenido = null;
  }
  if (!respuesta.ok) {
    const error = contenido as { error?: { mensaje?: string; codigo?: string } } | null;
    throw new ApiHttpError(
      error?.error?.mensaje ?? `La API respondió con estado ${respuesta.status}.`,
      respuesta.status,
      error?.error?.codigo,
    );
  }
  const url = (contenido as { datos?: { url?: string } } | null)?.datos?.url;
  if (!url) throw new ApiHttpError('La API no devolvió la URL de la foto.', respuesta.status, 'ARCHIVO_SIN_URL');
  return url;
}
