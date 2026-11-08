export function generarId(prefijo: string): string {
  const tiempo = Date.now().toString(36);
  const aleatorio = Math.random().toString(36).slice(2, 9);
  return `${prefijo}-${tiempo}-${aleatorio}`;
}
