import { Pool } from 'pg';
import sqlite3 from 'sqlite3';
import path from 'path';

const connectionString = process.env.DATABASE_URL;

let pgPool: Pool | null = null;
let sqliteDb: sqlite3.Database | null = null;

if (connectionString) {
  console.log('Подключение к облачной базе данных PostgreSQL...');
  pgPool = new Pool({
    connectionString,
    ssl: connectionString.includes('localhost') ? false : { rejectUnauthorized: false }
  });

  pgPool.on('error', (err) => {
    console.error('Неожиданная ошибка пула подключений PostgreSQL:', err);
  });
  
  pgPool.query(`
    CREATE TABLE IF NOT EXISTS users (
      chat_id BIGINT PRIMARY KEY,
      username VARCHAR(255),
      first_name VARCHAR(255),
      joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      last_active_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )
  `).then(() => {
    console.log('Таблица users в PostgreSQL успешно создана/проверена.');
  }).catch((err) => {
    console.error('Ошибка создания таблицы в PostgreSQL:', err);
  });
} else {
  console.log('DATABASE_URL не найден. Локальный запуск: подключение к SQLite (users.db)...');
  const dbPath = path.resolve(process.cwd(), 'users.db');
  sqliteDb = new sqlite3.Database(dbPath);
  
  sqliteDb.serialize(() => {
    sqliteDb!.run(`
      CREATE TABLE IF NOT EXISTS users (
        chat_id INTEGER PRIMARY KEY,
        username TEXT,
        first_name TEXT,
        joined_at TEXT,
        last_active_at TEXT
      )
    `);
  });
}


export const saveUser = async (chatId: number, username: string, firstName: string) => {
  const now = new Date();
  
  if (pgPool) {
    try {
      await pgPool.query(`
        INSERT INTO users (chat_id, username, first_name, joined_at, last_active_at)
        VALUES ($1, $2, $3, $4, $4)
        ON CONFLICT (chat_id)
        DO UPDATE SET 
          username = EXCLUDED.username,
          first_name = EXCLUDED.first_name,
          last_active_at = EXCLUDED.last_active_at
      `, [chatId, username, firstName, now]);
    } catch (err) {
      console.error('Ошибка записи пользователя в PostgreSQL:', err);
    }
  } else if (sqliteDb) {
    const isoNow = now.toISOString();
    sqliteDb.get('SELECT chat_id FROM users WHERE chat_id = ?', [chatId], (err, row) => {
      if (err) {
        console.error('Ошибка SELECT из SQLite:', err);
        return;
      }
      if (!row) {
        sqliteDb!.run(
          'INSERT INTO users (chat_id, username, first_name, joined_at, last_active_at) VALUES (?, ?, ?, ?, ?)',
          [chatId, username, firstName, isoNow, isoNow]
        );
      } else {
        sqliteDb!.run(
          'UPDATE users SET last_active_at = ? WHERE chat_id = ?',
          [isoNow, chatId]
        );
      }
    });
  }
};


export const getStats = async (): Promise<{ total: number; active24h: number }> => {
  if (pgPool) {
    try {
      const totalRes = await pgPool.query('SELECT COUNT(*) as total FROM users');
      const total = parseInt(totalRes.rows[0].total, 10);

      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const activeRes = await pgPool.query('SELECT COUNT(*) as active FROM users WHERE last_active_at >= $1', [oneDayAgo]);
      const active24h = parseInt(activeRes.rows[0].active, 10);

      return { total, active24h };
    } catch (err) {
      console.error('Ошибка получения статистики из PostgreSQL:', err);
      return { total: 0, active24h: 0 };
    }
  } else if (sqliteDb) {
    return new Promise((resolve) => {
      sqliteDb!.get('SELECT COUNT(*) as total FROM users', (err, row: any) => {
        const total = row ? row.total : 0;
        
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        sqliteDb!.get('SELECT COUNT(*) as active FROM users WHERE last_active_at >= ?', [oneDayAgo], (activeErr, activeRow: any) => {
          const active24h = activeRow ? activeRow.active : 0;
          resolve({ total, active24h });
        });
      });
    });
  }
  
  return { total: 0, active24h: 0 };
};
