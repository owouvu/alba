import * as SQLite from 'expo-sqlite';

// Módulo de base de datos local (SQLite) de Alba.
// Toda la app usa estas funciones; nadie escribe SQL directo fuera de aquí.

let db;

// Abre la BD y crea las tablas si no existen. Se llama una vez al iniciar la app.
export async function initDatabase() {
  db = await SQLite.openDatabaseAsync('alba.db');
  await db.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS alarmas (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      hora       TEXT    NOT NULL,          -- "08:00"
      activa     INTEGER NOT NULL DEFAULT 1,-- 1 encendida, 0 apagada
      dias       TEXT    NOT NULL DEFAULT '',-- "L,M,X,J,V" ('' = una sola vez)
      tipo_reto  TEXT    NOT NULL,          -- pasos | lagartijas | saltos
      meta       INTEGER NOT NULL           -- cantidad a cumplir
    );

    CREATE TABLE IF NOT EXISTS historial (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      id_alarma  INTEGER,
      fecha      TEXT    NOT NULL,          -- "2026-09-18 08:03"
      reto       TEXT    NOT NULL,
      meta       INTEGER NOT NULL,
      completado INTEGER NOT NULL,          -- 1 logrado, 0 no
      segundos   INTEGER NOT NULL DEFAULT 0,-- cuánto tardó en apagarla
      FOREIGN KEY (id_alarma) REFERENCES alarmas(id)
    );
  `);
}

// ---- CRUD de alarmas ----

export async function getAlarmas() {
  return db.getAllAsync('SELECT * FROM alarmas ORDER BY hora ASC');
}

export async function getAlarma(id) {
  return db.getFirstAsync('SELECT * FROM alarmas WHERE id = ?', id);
}

export async function crearAlarma({ hora, dias, tipo_reto, meta }) {
  const r = await db.runAsync(
    'INSERT INTO alarmas (hora, activa, dias, tipo_reto, meta) VALUES (?, 1, ?, ?, ?)',
    hora, dias, tipo_reto, meta
  );
  return r.lastInsertRowId;
}

export async function actualizarAlarma(id, { hora, dias, tipo_reto, meta }) {
  await db.runAsync(
    'UPDATE alarmas SET hora = ?, dias = ?, tipo_reto = ?, meta = ? WHERE id = ?',
    hora, dias, tipo_reto, meta, id
  );
}

export async function toggleAlarma(id, activa) {
  await db.runAsync('UPDATE alarmas SET activa = ? WHERE id = ?', activa ? 1 : 0, id);
}

export async function eliminarAlarma(id) {
  await db.runAsync('DELETE FROM alarmas WHERE id = ?', id);
}

// ---- Historial ----

export async function registrarHistorial({ id_alarma, reto, meta, completado, segundos }) {
  const fecha = new Date().toISOString().slice(0, 16).replace('T', ' ');
  await db.runAsync(
    'INSERT INTO historial (id_alarma, fecha, reto, meta, completado, segundos) VALUES (?, ?, ?, ?, ?, ?)',
    id_alarma ?? null, fecha, reto, meta, completado ? 1 : 0, segundos
  );
}

export async function getHistorial() {
  return db.getAllAsync('SELECT * FROM historial ORDER BY id DESC LIMIT 100');
}
