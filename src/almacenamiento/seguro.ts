export function parsearListaJsonSeguro<T>(raw: string | null): T[] | null {
  if (!raw) return null;
  try {
    const valor: unknown = JSON.parse(raw);
    return Array.isArray(valor) ? valor as T[] : null;
  } catch {
    return null;
  }
}

export function parsearObjetoJsonSeguro<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    const valor: unknown = JSON.parse(raw);
    return valor && typeof valor === 'object' && !Array.isArray(valor) ? valor as T : null;
  } catch {
    return null;
  }
}
