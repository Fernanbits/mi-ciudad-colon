import axios from 'axios';
import type { ErrorApi } from '../tipos/modelos';

export interface RespuestaListaApi<T> {
  datos: T[];
  meta: { total: number; pagina: number; porPagina: number };
}

export interface RespuestaUnoApi<T> {
  datos: T;
  meta: null;
}

export interface SesionApi {
  token: string;
  usuario: {
    id: string;
    nombre: string;
    email: string;
    avatarUrl: string | null;
    creadoEn: string;
    preferencias: {
      categoriasFavoritas: string[];
      avisarProximidad: boolean;
      radioAvisoMetros: number;
      tema: 'claro' | 'oscuro' | 'sistema';
    };
  };
}

export class ApiHttpError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string,
  ) {
    super(message);
    this.name = 'ApiHttpError';
  }
}

const baseConfigurada = process.env.EXPO_PUBLIC_API_URL?.trim().replace(/\/+$/, '') ?? '';
const clienteApi = axios.create({
  baseURL: baseConfigurada,
  timeout: 8000,
  headers: { Accept: 'application/json' },
});

export function apiConfigurada(): boolean {
  return baseConfigurada.length > 0;
}

export async function pedirApi<T>(
  path: string,
  opciones: {
    method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
    token?: string | null;
    body?: unknown;
    timeoutMs?: number;
  } = {},
): Promise<T> {
  if (!apiConfigurada()) throw new ApiHttpError('La API no está configurada.', 0, 'API_NO_CONFIGURADA');

  try {
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (opciones.body !== undefined && !(opciones.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }
    if (opciones.token) headers.Authorization = `Bearer ${opciones.token}`;

    const respuesta = await clienteApi.request<T>({
      url: path,
      method: opciones.method ?? 'GET',
      headers,
      data: opciones.body,
      timeout: opciones.timeoutMs ?? 8000,
    });
    return (respuesta.data === '' ? null : respuesta.data) as T;
  } catch (error) {
    if (error instanceof ApiHttpError) throw error;
    if (axios.isAxiosError<ErrorApi>(error)) {
      if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
        throw new ApiHttpError('La API tardó demasiado en responder.', 408, 'API_TIMEOUT');
      }
      if (error.response) {
        throw new ApiHttpError(
          error.response.data?.error?.mensaje ?? `La API respondió con estado ${error.response.status}.`,
          error.response.status,
          error.response.data?.error?.codigo,
        );
      }
    }
    if (error instanceof Error && error.name === 'CanceledError') {
      throw new ApiHttpError('La API tardó demasiado en responder.', 408, 'API_TIMEOUT');
    }
    throw new ApiHttpError('No se pudo conectar con la API.', 0, 'API_SIN_CONEXION');
  }
}
