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

  // Таблица программ пользователей
  pgPool.query(`
    CREATE TABLE IF NOT EXISTS user_programs (
      chat_id BIGINT,
      title VARCHAR(255),
      program_data TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (chat_id, title)
    )
  `).then(() => {
    // Для старых БД пересоздаем PK на (chat_id, title)
    pgPool!.query(`
      ALTER TABLE user_programs DROP CONSTRAINT IF EXISTS user_programs_pkey;
      ALTER TABLE user_programs ADD CONSTRAINT user_programs_pkey PRIMARY KEY (chat_id, title);
    `).catch(() => {});
  }).catch((err) => {
    console.error('Ошибка создания таблицы user_programs в PostgreSQL:', err);
  });

  // Таблица выполненных подходов
  pgPool.query(`
    CREATE TABLE IF NOT EXISTS completed_sets (
      id SERIAL PRIMARY KEY,
      chat_id BIGINT,
      week_index INTEGER,
      day_name VARCHAR(10),
      exercise_index INTEGER,
      set_index INTEGER,
      weight REAL,
      reps INTEGER,
      completed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT unique_set UNIQUE(chat_id, week_index, day_name, exercise_index, set_index)
    )
  `).catch((err) => {
    console.error('Ошибка создания таблицы completed_sets в PostgreSQL:', err);
  });

  // Таблица отправленных напоминаний
  pgPool.query(`
    CREATE TABLE IF NOT EXISTS sent_reminders (
      chat_id BIGINT PRIMARY KEY,
      last_sent_date VARCHAR(10)
    )
  `).catch((err) => {
    console.error('Ошибка создания таблицы sent_reminders в PostgreSQL:', err);
  });

  // Таблица рекордов пользователя
  pgPool.query(`
    CREATE TABLE IF NOT EXISTS user_records (
      id SERIAL PRIMARY KEY,
      chat_id BIGINT,
      movement VARCHAR(255),
      category VARCHAR(50),
      weight REAL,
      reps INTEGER,
      one_pm REAL,
      video_path VARCHAR(500),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      likes INTEGER DEFAULT 0
    )
  `).then(() => {
    pgPool!.query('ALTER TABLE user_records ADD COLUMN IF NOT EXISTS likes INTEGER DEFAULT 0').catch(() => {});
  }).catch((err) => {
    console.error('Ошибка создания таблицы user_records в PostgreSQL:', err);
  });

} else {
  console.log('DATABASE_URL не найден. Локальный запуск: подключение к SQLite (users.db)...');
  const dbPath = path.resolve(process.cwd(), process.env.SQLITE_PATH || 'users.db');
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

    sqliteDb!.run(`
      CREATE TABLE IF NOT EXISTS user_programs (
        chat_id INTEGER,
        title TEXT,
        program_data TEXT,
        created_at TEXT,
        PRIMARY KEY (chat_id, title)
      )
    `, [], (err) => {
      if (!err) {
        // Миграция SQLite: проверяем схему
        sqliteDb!.get("SELECT sql FROM sqlite_master WHERE type='table' AND name='user_programs'", [], (err2, row: any) => {
          if (row && row.sql && !row.sql.includes('PRIMARY KEY ("chat_id", "title")') && !row.sql.includes('PRIMARY KEY (chat_id, title)') && !row.sql.includes('PRIMARY KEY(chat_id, title)')) {
            console.log('Миграция SQLite: обновление первичного ключа user_programs...');
            sqliteDb!.serialize(() => {
              sqliteDb!.run('BEGIN TRANSACTION;');
              sqliteDb!.run('CREATE TABLE IF NOT EXISTS user_programs_new (chat_id INTEGER, title TEXT, program_data TEXT, created_at TEXT, PRIMARY KEY (chat_id, title))');
              sqliteDb!.run('INSERT OR IGNORE INTO user_programs_new (chat_id, title, program_data, created_at) SELECT chat_id, title, program_data, created_at FROM user_programs');
              sqliteDb!.run('DROP TABLE user_programs');
              sqliteDb!.run('ALTER TABLE user_programs_new RENAME TO user_programs');
              sqliteDb!.run('COMMIT;', (commitErr) => {
                if (commitErr) console.error('Ошибка миграции SQLite:', commitErr);
                else console.log('Миграция SQLite завершена успешно.');
              });
            });
          }
        });
      }
    });

    sqliteDb!.run(`
      CREATE TABLE IF NOT EXISTS completed_sets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        chat_id INTEGER,
        week_index INTEGER,
        day_name TEXT,
        exercise_index INTEGER,
        set_index INTEGER,
        weight REAL,
        reps INTEGER,
        completed_at TEXT,
        UNIQUE(chat_id, week_index, day_name, exercise_index, set_index)
      )
    `);

    sqliteDb!.run(`
      CREATE TABLE IF NOT EXISTS sent_reminders (
        chat_id INTEGER PRIMARY KEY,
        last_sent_date TEXT
      )
    `);

    sqliteDb!.run(`
      CREATE TABLE IF NOT EXISTS user_records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        chat_id INTEGER,
        movement TEXT,
        category TEXT,
        weight REAL,
        reps INTEGER,
        one_pm REAL,
        video_path TEXT,
        created_at TEXT,
        likes INTEGER DEFAULT 0
      )
    `);
    sqliteDb!.run(`
      ALTER TABLE user_records ADD COLUMN likes INTEGER DEFAULT 0
    `, (err) => {
      // Игнорируем ошибку, если колонка уже создана
    });
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

// --- Функции для работы с Mini App ---

export const saveActiveProgram = async (chatId: number, title: string, programData: any) => {
  const dataStr = JSON.stringify(programData);
  const now = new Date();
  if (pgPool) {
    await pgPool.query(`
      INSERT INTO user_programs (chat_id, title, program_data, created_at)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (chat_id, title)
      DO UPDATE SET program_data = EXCLUDED.program_data, created_at = EXCLUDED.created_at
    `, [chatId, title, dataStr, now]);
  } else if (sqliteDb) {
    const isoNow = now.toISOString();
    return new Promise<void>((resolve, reject) => {
      sqliteDb!.run(
        'INSERT OR REPLACE INTO user_programs (chat_id, title, program_data, created_at) VALUES (?, ?, ?, ?)',
        [chatId, title, dataStr, isoNow],
        (err) => err ? reject(err) : resolve()
      );
    });
  }
};

export const getActiveProgram = async (chatId: number, title?: string): Promise<{ title: string; programData: any } | null> => {
  if (pgPool) {
    let query = 'SELECT title, program_data FROM user_programs WHERE chat_id = $1';
    const params: any[] = [chatId];
    if (title) {
      query += ' AND title = $2';
      params.push(title);
    }
    const res = await pgPool.query(query, params);
    if (res.rows.length === 0) return null;
    return {
      title: res.rows[0].title,
      programData: JSON.parse(res.rows[0].program_data)
    };
  } else if (sqliteDb) {
    return new Promise((resolve, reject) => {
      let query = 'SELECT title, program_data FROM user_programs WHERE chat_id = ?';
      const params: any[] = [chatId];
      if (title) {
        query += ' AND title = ?';
        params.push(title);
      }
      sqliteDb!.get(query, params, (err, row: any) => {
        if (err) return reject(err);
        if (!row) return resolve(null);
        resolve({
          title: row.title,
          programData: JSON.parse(row.program_data)
        });
      });
    });
  }
  return null;
};

export const getActivePrograms = async (chatId: number): Promise<Array<{ title: string; programData: any }>> => {
  if (pgPool) {
    const res = await pgPool.query('SELECT title, program_data FROM user_programs WHERE chat_id = $1', [chatId]);
    return res.rows.map(row => ({
      title: row.title,
      programData: JSON.parse(row.program_data)
    }));
  } else if (sqliteDb) {
    return new Promise((resolve, reject) => {
      sqliteDb!.all('SELECT title, program_data FROM user_programs WHERE chat_id = ?', [chatId], (err, rows: any[]) => {
        if (err) return reject(err);
        resolve((rows || []).map(row => ({
          title: row.title,
          programData: JSON.parse(row.program_data)
        })));
      });
    });
  }
  return [];
};

export const deleteActiveProgram = async (chatId: number, title: string) => {
  if (pgPool) {
    await pgPool.query('DELETE FROM user_programs WHERE chat_id = $1 AND title = $2', [chatId, title]);
  } else if (sqliteDb) {
    return new Promise<void>((resolve, reject) => {
      sqliteDb!.run('DELETE FROM user_programs WHERE chat_id = ? AND title = ?', [chatId, title], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }
};

export const removeProgramCompletedSets = async (chatId: number, minExerciseIdx: number, maxExerciseIdx: number) => {
  if (pgPool) {
    await pgPool.query(
      'DELETE FROM completed_sets WHERE chat_id = $1 AND exercise_index >= $2 AND exercise_index <= $3',
      [chatId, minExerciseIdx, maxExerciseIdx]
    );
  } else if (sqliteDb) {
    return new Promise<void>((resolve, reject) => {
      sqliteDb!.run(
        'DELETE FROM completed_sets WHERE chat_id = ? AND exercise_index >= ? AND exercise_index <= ?',
        [chatId, minExerciseIdx, maxExerciseIdx],
        (err) => err ? reject(err) : resolve()
      );
    });
  }
};

export const logSetCompletion = async (
  chatId: number,
  weekIndex: number,
  dayName: string,
  exerciseIndex: number,
  setIndex: number,
  weight: number,
  reps: number
) => {
  const now = new Date();
  if (pgPool) {
    await pgPool.query(`
      INSERT INTO completed_sets (chat_id, week_index, day_name, exercise_index, set_index, weight, reps, completed_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (chat_id, week_index, day_name, exercise_index, set_index)
      DO UPDATE SET weight = EXCLUDED.weight, reps = EXCLUDED.reps, completed_at = EXCLUDED.completed_at
    `, [chatId, weekIndex, dayName, exerciseIndex, setIndex, weight, reps, now]);
  } else if (sqliteDb) {
    const isoNow = now.toISOString();
    return new Promise<void>((resolve, reject) => {
      // Чтобы избежать проблем со старыми версиями SQLite без поддержки ON CONFLICT DO UPDATE,
      // делаем сначала DELETE, потом INSERT
      sqliteDb!.run(`
        DELETE FROM completed_sets 
        WHERE chat_id = ? AND week_index = ? AND day_name = ? AND exercise_index = ? AND set_index = ?
      `, [chatId, weekIndex, dayName, exerciseIndex, setIndex], (err) => {
        if (err) return reject(err);
        sqliteDb!.run(`
          INSERT INTO completed_sets (chat_id, week_index, day_name, exercise_index, set_index, weight, reps, completed_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [chatId, weekIndex, dayName, exerciseIndex, setIndex, weight, reps, isoNow], (err2) => {
          if (err2) reject(err2);
          else resolve();
        });
      });
    });
  }
};

export const removeSetCompletion = async (
  chatId: number,
  weekIndex: number,
  dayName: string,
  exerciseIndex: number,
  setIndex: number
) => {
  if (pgPool) {
    await pgPool.query(`
      DELETE FROM completed_sets 
      WHERE chat_id = $1 AND week_index = $2 AND day_name = $3 AND exercise_index = $4 AND set_index = $5
    `, [chatId, weekIndex, dayName, exerciseIndex, setIndex]);
  } else if (sqliteDb) {
    return new Promise<void>((resolve, reject) => {
      sqliteDb!.run(`
        DELETE FROM completed_sets 
        WHERE chat_id = ? AND week_index = ? AND day_name = ? AND exercise_index = ? AND set_index = ?
      `, [chatId, weekIndex, dayName, exerciseIndex, setIndex], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }
};

export const getCompletedSets = async (chatId: number): Promise<Array<{ weekIndex: number; dayName: string; exerciseIndex: number; setIndex: number; weight: number; reps: number }>> => {
  if (pgPool) {
    const res = await pgPool.query(`
      SELECT week_index, day_name, exercise_index, set_index, weight, reps 
      FROM completed_sets 
      WHERE chat_id = $1
    `, [chatId]);
    return res.rows.map(row => ({
      weekIndex: row.week_index,
      dayName: row.day_name,
      exerciseIndex: row.exercise_index,
      setIndex: row.set_index,
      weight: parseFloat(row.weight),
      reps: row.reps
    }));
  } else if (sqliteDb) {
    return new Promise((resolve, reject) => {
      sqliteDb!.all(`
        SELECT week_index, day_name, exercise_index, set_index, weight, reps 
        FROM completed_sets 
        WHERE chat_id = ?
      `, [chatId], (err, rows: any[]) => {
        if (err) return reject(err);
        resolve((rows || []).map(row => ({
          weekIndex: row.week_index,
          dayName: row.day_name,
          exerciseIndex: row.exercise_index,
          setIndex: row.set_index,
          weight: row.weight,
          reps: row.reps
        })));
      });
    });
  }
  return [];
};

export const getUserStats = async (chatId: number): Promise<{ totalTonnage: number; completedSetsCount: number; activeDaysCount: number }> => {
  try {
    const activeProgs = await getActivePrograms(chatId);
    const isPullups = activeProgs.some(p => p.title.includes('Подтягивания'));
    const userWeight = activeProgs.find(p => p.programData?.userWeight)?.programData?.userWeight || 80;

    const sets = await getCompletedSets(chatId);
    let totalTonnage = 0;
    
    for (const set of sets) {
      const liftWeight = isPullups ? (userWeight + set.weight) : set.weight;
      totalTonnage += liftWeight * set.reps;
    }
    
    const activeDaysSet = new Set(sets.map(s => `${s.weekIndex}-${s.dayName}`));
    
    return {
      totalTonnage: Math.round(totalTonnage),
      completedSetsCount: sets.length,
      activeDaysCount: activeDaysSet.size
    };
  } catch (err) {
    console.error('Ошибка расчета статистики:', err);
    return { totalTonnage: 0, completedSetsCount: 0, activeDaysCount: 0 };
  }
};

export const getAllActivePrograms = async (): Promise<Array<{ chatId: number; title: string; programData: any }>> => {
  if (pgPool) {
    const res = await pgPool.query('SELECT chat_id, title, program_data FROM user_programs');
    return res.rows.map(row => ({
      chatId: parseInt(row.chat_id, 10),
      title: row.title,
      programData: JSON.parse(row.program_data)
    }));
  } else if (sqliteDb) {
    return new Promise((resolve, reject) => {
      sqliteDb!.all('SELECT chat_id, title, program_data FROM user_programs', (err, rows: any[]) => {
        if (err) return reject(err);
        resolve((rows || []).map(row => ({
          chatId: row.chat_id,
          title: row.title,
          programData: JSON.parse(row.program_data)
        })));
      });
    });
  }
  return [];
};

export const getReminderSentDate = async (chatId: number): Promise<string | null> => {
  if (pgPool) {
    const res = await pgPool.query('SELECT last_sent_date FROM sent_reminders WHERE chat_id = $1', [chatId]);
    if (res.rows.length === 0) return null;
    return res.rows[0].last_sent_date;
  } else if (sqliteDb) {
    return new Promise((resolve, reject) => {
      sqliteDb!.get('SELECT last_sent_date FROM sent_reminders WHERE chat_id = ?', [chatId], (err, row: any) => {
        if (err) return reject(err);
        if (!row) return resolve(null);
        resolve(row.last_sent_date);
      });
    });
  }
  return null;
};

export const setReminderSentDate = async (chatId: number, dateStr: string) => {
  if (pgPool) {
    await pgPool.query(`
      INSERT INTO sent_reminders (chat_id, last_sent_date)
      VALUES ($1, $2)
      ON CONFLICT (chat_id)
      DO UPDATE SET last_sent_date = EXCLUDED.last_sent_date
    `, [chatId, dateStr]);
  } else if (sqliteDb) {
    return new Promise<void>((resolve, reject) => {
      sqliteDb!.run(
        'INSERT OR REPLACE INTO sent_reminders (chat_id, last_sent_date) VALUES (?, ?)',
        [chatId, dateStr],
        (err) => err ? reject(err) : resolve()
      );
    });
  }
};

export const addUserRecord = async (
  chatId: number,
  movement: string,
  category: string,
  weight: number,
  reps: number,
  onePm: number,
  videoPath: string | null
) => {
  const now = new Date();
  if (pgPool) {
    await pgPool.query(`
      INSERT INTO user_records (chat_id, movement, category, weight, reps, one_pm, video_path, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `, [chatId, movement, category, weight, reps, onePm, videoPath, now]);
  } else if (sqliteDb) {
    const isoNow = now.toISOString();
    return new Promise<void>((resolve, reject) => {
      sqliteDb!.run(`
        INSERT INTO user_records (chat_id, movement, category, weight, reps, one_pm, video_path, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [chatId, movement, category, weight, reps, onePm, videoPath, isoNow], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }
};

export const getUserRecords = async (chatId: number): Promise<any[]> => {
  if (pgPool) {
    const res = await pgPool.query(`
      SELECT id, chat_id, movement, category, weight, reps, one_pm, video_path, created_at, likes
      FROM user_records
      WHERE chat_id = $1
      ORDER BY created_at DESC
    `, [chatId]);
    return res.rows.map(row => ({
      id: row.id,
      chatId: parseInt(row.chat_id, 10),
      movement: row.movement,
      category: row.category,
      weight: row.weight,
      reps: row.reps,
      onePm: row.one_pm,
      videoPath: row.video_path,
      createdAt: row.created_at,
      likes: row.likes || 0
    }));
  } else if (sqliteDb) {
    return new Promise((resolve, reject) => {
      sqliteDb!.all(`
        SELECT id, chat_id, movement, category, weight, reps, one_pm, video_path, created_at, likes
        FROM user_records
        WHERE chat_id = ?
        ORDER BY created_at DESC
      `, [chatId], (err, rows: any[]) => {
        if (err) return reject(err);
        resolve((rows || []).map(row => ({
          id: row.id,
          chatId: row.chat_id,
          movement: row.movement,
          category: row.category,
          weight: row.weight,
          reps: row.reps,
          onePm: row.one_pm,
          videoPath: row.video_path,
          createdAt: row.created_at,
          likes: row.likes || 0
        })));
      });
    });
  }
  return [];
};

export const getGlobalRecords = async (limit: number = 50): Promise<any[]> => {
  if (pgPool) {
    const res = await pgPool.query(`
      SELECT id, movement, category, weight, reps, one_pm, video_path, created_at, likes
      FROM user_records
      ORDER BY created_at DESC
      LIMIT $1
    `, [limit]);
    return res.rows.map(row => ({
      id: row.id,
      movement: row.movement,
      category: row.category,
      weight: row.weight,
      reps: row.reps,
      onePm: row.one_pm,
      videoPath: row.video_path,
      createdAt: row.created_at,
      likes: row.likes || 0
    }));
  } else if (sqliteDb) {
    return new Promise((resolve, reject) => {
      sqliteDb!.all(`
        SELECT id, movement, category, weight, reps, one_pm, video_path, created_at, likes
        FROM user_records
        ORDER BY created_at DESC
        LIMIT ?
      `, [limit], (err, rows: any[]) => {
        if (err) return reject(err);
        resolve((rows || []).map(row => ({
          id: row.id,
          movement: row.movement,
          category: row.category,
          weight: row.weight,
          reps: row.reps,
          onePm: row.one_pm,
          videoPath: row.video_path,
          createdAt: row.created_at,
          likes: row.likes || 0
        })));
      });
    });
  }
  return [];
};

export const deleteUserRecord = async (chatId: number, id: number): Promise<string | null> => {
  let videoPath: string | null = null;
  
  if (pgPool) {
    const res = await pgPool.query('SELECT video_path FROM user_records WHERE chat_id = $1 AND id = $2', [chatId, id]);
    if (res.rows.length > 0) {
      videoPath = res.rows[0].video_path;
      await pgPool.query('DELETE FROM user_records WHERE chat_id = $1 AND id = $2', [chatId, id]);
    }
  } else if (sqliteDb) {
    videoPath = await new Promise<string | null>((resolve, reject) => {
      sqliteDb!.get('SELECT video_path FROM user_records WHERE chat_id = ? AND id = ?', [chatId, id], (err, row: any) => {
        if (err) return reject(err);
        if (!row) return resolve(null);
        resolve(row.video_path);
      });
    });
    
    await new Promise<void>((resolve, reject) => {
      sqliteDb!.run('DELETE FROM user_records WHERE chat_id = ? AND id = ?', [chatId, id], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }
  
  return videoPath;
};

export const likeUserRecord = async (id: number): Promise<void> => {
  if (pgPool) {
    await pgPool.query('UPDATE user_records SET likes = likes + 1 WHERE id = $1', [id]);
  } else if (sqliteDb) {
    return new Promise((resolve, reject) => {
      sqliteDb!.run('UPDATE user_records SET likes = likes + 1 WHERE id = ?', [id], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }
};

export const unlikeUserRecord = async (id: number): Promise<void> => {
  if (pgPool) {
    await pgPool.query('UPDATE user_records SET likes = CASE WHEN likes > 0 THEN likes - 1 ELSE 0 END WHERE id = $1', [id]);
  } else if (sqliteDb) {
    return new Promise((resolve, reject) => {
      sqliteDb!.run('UPDATE user_records SET likes = CASE WHEN likes > 0 THEN likes - 1 ELSE 0 END WHERE id = ?', [id], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }
};
