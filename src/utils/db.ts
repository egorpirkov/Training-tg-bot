import sqlite3 from 'sqlite3';
import path from 'path';

const dbPath = path.resolve(process.cwd(), 'users.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      chat_id INTEGER PRIMARY KEY,
      username TEXT,
      first_name TEXT,
      joined_at TEXT,
      last_active_at TEXT
    )
  `);
});


export const saveUser = (chatId: number, username: string, firstName: string) => {
  const now = new Date().toISOString();
  db.get('SELECT chat_id FROM users WHERE chat_id = ?', [chatId], (err, row) => {
    if (err) {
      console.error('Ошибка поиска пользователя в БД:', err);
      return;
    }

    if (!row) {
      db.run(
        'INSERT INTO users (chat_id, username, first_name, joined_at, last_active_at) VALUES (?, ?, ?, ?, ?)',
        [chatId, username, firstName, now, now],
        (insertErr) => {
          if (insertErr) {
            console.error('Ошибка добавления пользователя в БД:', insertErr);
          } else {
            console.log(`Новый пользователь зарегистрирован в БД: ${chatId} (${username || firstName})`);
          }
        }
      );
    } else {
      db.run(
        'UPDATE users SET last_active_at = ? WHERE chat_id = ?',
        [now, chatId],
        (updateErr) => {
          if (updateErr) {
            console.error('Ошибка обновления активности в БД:', updateErr);
          }
        }
      );
    }
  });
};

export const getStats = (): Promise<{ total: number; active24h: number }> => {
  return new Promise((resolve) => {
    db.get('SELECT COUNT(*) as total FROM users', (err, row: any) => {
      const total = row ? row.total : 0;
      
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      db.get('SELECT COUNT(*) as active FROM users WHERE last_active_at >= ?', [oneDayAgo], (activeErr, activeRow: any) => {
        const active24h = activeRow ? activeRow.active : 0;
        resolve({ total, active24h });
      });
    });
  });
};
