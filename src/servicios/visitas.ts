import { guardarVisita, listarVisitas } from '../almacenamiento/base';
import { SQLiteDatabase } from 'expo-sqlite';
import { Visita } from '../tipos/modelos';
import { apiConfigurada, pedirApi, RespuestaListaApi, RespuestaUnoApi } from './api';
import { subirFotoVisita } from './archivos';

export async function enviarVisita(visita: Visita, token: string): Promise<Visita> {
  const fotoUri = visita.fotoUri && !visita.fotoUri.startsWith('http')
    ? await subirFotoVisita(visita.fotoUri, visita.id, token)
    : visita.fotoUri;
  const respuesta = await pedirApi<RespuestaUnoApi<Visita>>('/yo/visitas', {
    method: 'POST',
    token,
    body: {
      id: visita.id,
      lugarId: visita.lugarId,
      fechaHora: visita.fechaHora,
      origen: visita.origen,
      fotoUri,
      nota: visita.nota,
    },
  });
  return { ...respuesta.datos, sincronizada: true };
}

export async function sincronizarVisitasPendientes(
  db: SQLiteDatabase,
  usuarioId: string,
  token: string,
): Promise<number> {
  if (!apiConfigurada()) return 0;
  const locales = await listarVisitas(db, usuarioId);
  const pendientes = locales.filter((visita) => visita.usuarioId === usuarioId && !visita.sincronizada);
  let sincronizadas = 0;
  for (const visita of pendientes) {
    try {
      let preparada = visita;
      if (visita.fotoUri && !visita.fotoUri.startsWith('http')) {
        preparada = { ...visita, fotoUri: await subirFotoVisita(visita.fotoUri, visita.id, token) };
        await guardarVisita(db, preparada);
      }
      const remota = await enviarVisita(preparada, token);
      await guardarVisita(db, { ...preparada, ...remota, sincronizada: true });
      sincronizadas += 1;
    } catch {
      // La cola queda local para reintentar cuando vuelva la red o se abra la app.
    }
  }
  return sincronizadas;
}

export async function listarVisitasRemotas(token: string): Promise<Visita[]> {
  const respuesta = await pedirApi<RespuestaListaApi<Visita>>('/yo/visitas?porPagina=500', { token });
  return respuesta.datos.map((visita) => ({ ...visita, sincronizada: true }));
}
