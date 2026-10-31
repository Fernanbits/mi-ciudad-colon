import { listarVisitas, marcarVisitaSincronizada } from '../almacenamiento/base';
import { SQLiteDatabase } from 'expo-sqlite';
import { Visita } from '../tipos/modelos';
import { apiConfigurada, pedirApi, RespuestaListaApi, RespuestaUnoApi } from './api';

export async function enviarVisita(visita: Visita, token: string): Promise<Visita> {
  const respuesta = await pedirApi<RespuestaUnoApi<Visita>>('/yo/visitas', {
    method: 'POST',
    token,
    body: {
      id: visita.id,
      lugarId: visita.lugarId,
      fechaHora: visita.fechaHora,
      origen: visita.origen,
      // Un archivo local no se puede enviar al servidor todavía. La visita sí se sincroniza;
      // la foto queda en el teléfono hasta implementar la subida multipart a /archivos.
      fotoUri: visita.fotoUri?.startsWith('http') ? visita.fotoUri : null,
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
  const locales = await listarVisitas(db);
  const pendientes = locales.filter((visita) => visita.usuarioId === usuarioId && !visita.sincronizada);
  let sincronizadas = 0;
  for (const visita of pendientes) {
    try {
      await enviarVisita(visita, token);
      await marcarVisitaSincronizada(db, visita.id);
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
