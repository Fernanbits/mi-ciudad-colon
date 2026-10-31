import { Directory, File, Paths } from 'expo-file-system';

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
  const destino = new File(directorio, `${lugarId}.m4a`);
  const archivo = await File.downloadFileAsync(url, destino);
  return archivo.uri;
}
