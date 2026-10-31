import { ErrorApi } from '../tipos/modelos';

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

export function apiConfigurada(): boolean {
  return baseConfigurada.length > 0;
}

export function urlApi(path: string): string {
  return `${baseConfigurada}${path.startsWith('/') ? path : `/${path}`}`;
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

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), opciones.timeoutMs ?? 8000);
  try {
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (opciones.body !== undefined) headers['Content-Type'] = 'application/json';
    if (opciones.token) headers.Authorization = `Bearer ${opciones.token}`;

    const respuesta = await fetch(urlApi(path), {
      method: opciones.method ?? 'GET',
      headers,
      body: opciones.body === undefined ? undefined : JSON.stringify(opciones.body),
      signal: controller.signal,
    });
    const texto = await respuesta.text();
    let contenido: unknown = null;
    try {
      contenido = texto ? JSON.parse(texto) : null;
    } catch {
      contenido = null;
    }

    if (!respuesta.ok) {
      const error = contenido as ErrorApi | null;
      throw new ApiHttpError(
        error?.error?.mensaje ?? `La API respondió con estado ${respuesta.status}.`,
        respuesta.status,
        error?.error?.codigo,
      );
    }
    return contenido as T;
  } catch (error) {
    if (error instanceof ApiHttpError) throw error;
    if (error instanceof Error && error.name === 'AbortError') {
      throw new ApiHttpError('La API tardó demasiado en responder.', 408, 'API_TIMEOUT');
    }
    throw new ApiHttpError('No se pudo conectar con la API.', 0, 'API_SIN_CONEXION');
  } finally {
    clearTimeout(timeout);
  }
}
