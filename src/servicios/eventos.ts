import { eventos } from '../mocks/datos';
import { Evento } from '../tipos/modelos';
import { apiConfigurada, pedirApi, RespuestaListaApi, RespuestaUnoApi } from './api';

let eventosEnMemoria: Evento[] | null = null;

async function cargarEventosDisponibles(): Promise<Evento[]> {
  if (eventosEnMemoria) return eventosEnMemoria;
  if (apiConfigurada()) {
    try {
      const respuesta = await pedirApi<RespuestaListaApi<Evento>>('/eventos?porPagina=100');
      eventosEnMemoria = respuesta.datos;
      return respuesta.datos;
    } catch {
      // La agenda local sigue disponible si el servidor no responde.
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
      // Continúa con los datos locales.
    }
  }
  return (await cargarEventosDisponibles()).find((evento) => evento.id === id) ?? null;
}
