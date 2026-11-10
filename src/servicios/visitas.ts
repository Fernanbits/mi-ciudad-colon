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
      // Conservar la visita pendiente para reintentar.
    }
  }
  return sincronizadas;
}

export async function listarVisitasRemotas(token: string): Promise<Visita[]> {
  const visitas: Visita[] = [];
  let pagina = 1;
  while (true) {
    const respuesta = await pedirApi<RespuestaListaApi<Visita>>(`/yo/visitas?pagina=${pagina}&porPagina=100`, { token });
    visitas.push(...respuesta.datos.map((visita) => ({ ...visita, sincronizada: true })));
    if (visitas.length >= respuesta.meta.total || respuesta.datos.length === 0) return visitas;
    pagina += 1;
  }
}

const sincronizaciones = new Map<string, Promise<void>>();

export async function sincronizarVisitasCuenta(db: SQLiteDatabase, usuarioId: string, token: string): Promise<void> {
  const existente = sincronizaciones.get(usuarioId);
  if (existente) return existente;
  const tarea = (async () => {
    await sincronizarVisitasPendientes(db, usuarioId, token);
    const remotas = await listarVisitasRemotas(token);
    const locales = await listarVisitas(db, usuarioId);
    const pendientes = new Set(locales.filter((visita) => !visita.sincronizada).map((visita) => visita.id));
    for (const visita of remotas) {
      // No sobrescribir cambios locales pendientes.
      if (visita.usuarioId === usuarioId && !pendientes.has(visita.id)) await guardarVisita(db, visita);
    }
  })();
  sincronizaciones.set(usuarioId, tarea);
  try {
    await tarea;
  } finally {
    if (sincronizaciones.get(usuarioId) === tarea) sincronizaciones.delete(usuarioId);
  }
}
