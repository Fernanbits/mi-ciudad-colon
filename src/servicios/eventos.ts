import { eventos } from '../mocks/datos';
import { Evento } from '../tipos/modelos';
import { apiConfigurada, pedirApi, RespuestaListaApi, RespuestaUnoApi } from './api';

let eventosEnMemoria: Evento[] | null = null;

async function cargarEventosDisponibles(): Promise<Evento[]> {
  if (eventosEnMemoria) return eventosEnMemoria;
  if (apiConfigurada()) {
    try {
      const respuesta = await pedirApi<RespuestaListaApi<Evento>>('/eventos?porPagina=100');
      if (respuesta.datos.length === 0) throw new Error('La API respondió sin eventos.');
      eventosEnMemoria = respuesta.datos;
      return respuesta.datos;
    } catch {
      // Conservar la agenda local si falla la API.
    }
  }
  eventosEnMemoria = eventos;
  return eventos;
}

export async function listarEventos(): Promise<Evento[]> {
  const datos = await cargarEventosDisponibles();
  return datos.filter((evento) => evento.estado !== 'finalizado');
}

export async function obtenerEvento(id: string): Promise<Evento | null> {
  if (apiConfigurada()) {
    try {
      const respuesta = await pedirApi<RespuestaUnoApi<Evento>>(`/eventos/${encodeURIComponent(id)}`);
      return respuesta.datos;
    } catch {
    }
  }
  return (await cargarEventosDisponibles()).find((evento) => evento.id === id) ?? null;
}
