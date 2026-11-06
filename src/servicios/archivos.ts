import { Directory, File, Paths } from 'expo-file-system';
import { ApiHttpError, apiConfigurada, urlApi } from './api';

export async function guardarFotoVisita(uri: string, visitaId: string): Promise<string> {
  const directorio = new Directory(Paths.document, 'visitas');
  directorio.create({ idempotent: true, intermediates: true });
  const destino = new File(directorio, `${visitaId}.jpg`);
  const origen = new File(uri);
  origen.copy(destino);
  return destino.uri;
}

export async function guardarAudioguia(url: string, lugarId: string): Promise<string> {
  const directorio = new Directory(Paths.document, 'audioguias');
  directorio.create({ idempotent: true, intermediates: true });
  const extension = /\.([a-z0-9]+)(?:\?|$)/i.exec(url)?.[1]?.toLowerCase() ?? 'mp3';
  const destino = new File(directorio, `${lugarId}.${extension}`);
  const archivo = await File.downloadFileAsync(url, destino);
  return archivo.uri;
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
