import { SQLiteDatabase } from 'expo-sqlite';
import { Visita } from '../tipos/modelos';

export async function inicializarBase(db: SQLiteDatabase) {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS visitas (
      id TEXT PRIMARY KEY NOT NULL,
      usuarioId TEXT NOT NULL,
      lugarId TEXT NOT NULL,
      fechaHora TEXT NOT NULL,
      origen TEXT NOT NULL,
      fotoUri TEXT,
      nota TEXT,
      sincronizada INTEGER NOT NULL DEFAULT 0
    );
  `);
}

export async function listarVisitas(db: SQLiteDatabase, usuarioId: string): Promise<Visita[]> {
  return db.getAllAsync<Visita>('SELECT * FROM visitas WHERE usuarioId = ? ORDER BY fechaHora DESC', usuarioId);
}

export async function guardarVisita(db: SQLiteDatabase, visita: Visita): Promise<void> {
  await db.runAsync(
    'INSERT OR REPLACE INTO visitas (id, usuarioId, lugarId, fechaHora, origen, fotoUri, nota, sincronizada) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    visita.id, visita.usuarioId, visita.lugarId, visita.fechaHora, visita.origen, visita.fotoUri, visita.nota, visita.sincronizada ? 1 : 0,
  );
}

export async function marcarVisitaSincronizada(db: SQLiteDatabase, id: string): Promise<void> {
  await db.runAsync('UPDATE visitas SET sincronizada = 1 WHERE id = ?', id);
}
