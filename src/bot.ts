process.env.NTBA_FIX_319 = "1";
import TelegramBot from 'node-telegram-bot-api';
import { config } from 'dotenv';
config({ override: true });

import { startHandler } from './handlers/startHandler';
import { callbackHandler, callBackHandlerOfHelp } from './handlers/callbackHandler';
import { messageHandler } from './handlers/messageHandler';
import { resetUserData, getUserData, setUserData } from './types/UserData'
import { startProgramCreation } from './utils/programCreation';
import { startTrainingPlanCreation } from './utils/trainingPlanCreation';
import { startCalc1pm } from './utils/calc1pm';
import { sendRandomVideo } from './EditedVideos/sendEditedVideos/sendVideo';
import { getVideoHandler } from './EditedVideos/getEditedVideos/getVideo';
import express from 'express';
import path from 'path';
import { helpHandler } from './handlers/helpHandler';
import { 
  saveUser, 
  getStats, 
  getActiveProgram, 
  saveActiveProgram, 
  getCompletedSets, 
  logSetCompletion, 
  removeSetCompletion, 
  getUserStats, 
  getAllActivePrograms, 
  getReminderSentDate, 
  setReminderSentDate,
  addUserRecord,
  getUserRecords,
  deleteUserRecord,
  getGlobalRecords,
  getActivePrograms,
  deleteActiveProgram,
  removeProgramCompletedSets,
  likeUserRecord,
  unlikeUserRecord
} from './utils/db';
import fs from 'fs';
import multer from 'multer';

const isLocal = !process.env.PORT;
const token = (isLocal && process.env.TEST_BOT_TOKEN) ? process.env.TEST_BOT_TOKEN : process.env.BOT_TOKEN;

if (!token) throw new Error('Токен бота не найден в .env');

const bot = new TelegramBot(token, isLocal ? { polling: true } : { webHook: true });

const app = express();
app.use(express.json());

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, DELETE');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

app.post('/api/log', (req, res) => {
  console.log('[FRONTEND LOG]', req.body.message);
  res.json({ success: true });
});


app.get('/api/program', async (req, res) => {
  const chatId = parseInt(req.query.chatId as string, 10);
  if (isNaN(chatId)) {
    return res.status(400).json({ error: 'Не указан или некорректный chatId' });
  }
  try {
    const programs = await getActivePrograms(chatId);
    res.json(programs);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка БД' });
  }
});

app.post('/api/program', async (req, res) => {
  const { chatId, title, programData } = req.body;
  if (chatId === undefined || !title || !programData) {
    return res.status(400).json({ error: 'Недостаточно параметров' });
  }
  try {
    await saveActiveProgram(chatId, title, programData);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Ошибка БД' });
  }
});

app.delete('/api/program', async (req, res) => {
  const chatId = parseInt(req.query.chatId as string, 10);
  const title = req.query.title as string;
  
  if (isNaN(chatId) || !title) {
    return res.status(400).json({ error: 'Недостаточно параметров' });
  }
  
  try {
    await deleteActiveProgram(chatId, title);
    
    let minExIdx = -1;
    let maxExIdx = -1;
    
    if (title.includes('Подтягивания')) {
      minExIdx = 100;
      maxExIdx = 199;
    } else if (title.includes('кисть') || title.includes('пронатор') || title.includes('давление') || title.includes('Скручивание')) {
      minExIdx = 200;
      maxExIdx = 299;
    } else if (title.includes('Жим') || title.includes('Брусья')) {
      minExIdx = 300;
      maxExIdx = 399;
    }
    
    if (minExIdx !== -1) {
      await removeProgramCompletedSets(chatId, minExIdx, maxExIdx);
    }
    
    res.json({ success: true });
  } catch (err) {
    console.error('Ошибка удаления программы:', err);
    res.status(500).json({ error: 'Ошибка БД' });
  }
});

app.get('/api/completed-sets', async (req, res) => {
  const chatId = parseInt(req.query.chatId as string, 10);
  if (isNaN(chatId)) {
    return res.status(400).json({ error: 'Не указан или некорректный chatId' });
  }
  try {
    const sets = await getCompletedSets(chatId);
    res.json(sets);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка БД' });
  }
});

app.post('/api/completed-sets', async (req, res) => {
  const { chatId, weekIndex, dayName, exerciseIndex, setIndex, weight, reps, completed } = req.body;
  if (
    chatId === undefined || 
    weekIndex === undefined || 
    dayName === undefined || 
    exerciseIndex === undefined || 
    setIndex === undefined
  ) {
    return res.status(400).json({ error: 'Недостаточно параметров' });
  }
  try {
    if (completed) {
      await logSetCompletion(chatId, weekIndex, dayName, exerciseIndex, setIndex, weight || 0, reps || 0);
    } else {
      await removeSetCompletion(chatId, weekIndex, dayName, exerciseIndex, setIndex);
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Ошибка БД' });
  }
});

app.get('/api/stats', async (req, res) => {
  const chatId = parseInt(req.query.chatId as string, 10);
  if (isNaN(chatId)) {
    return res.status(400).json({ error: 'Не указан или некорректный chatId' });
  }
  try {
    const stats = await getUserStats(chatId);
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка БД' });
  }
});

app.post('/api/complete-week', async (req, res) => {
  const { chatId, weekIndex, programTitle } = req.body;
  if (chatId === undefined || weekIndex === undefined) {
    return res.status(400).json({ error: 'Недостаточно параметров' });
  }
  try {
    const activeProg = await getActiveProgram(chatId, programTitle);
    if (!activeProg) {
      return res.status(404).json({ error: 'Программа не найдена' });
    }
    const program = activeProg.programData;
    const totalWeeks = program.weeks.length;
    
    if (weekIndex === totalWeeks - 1) {
      await bot.sendMessage(
        chatId,
        `🏆 *ПОЗДРАВЛЯЕМ! ВЫ ЗАВЕРШИЛИ ВСЮ ПРОГРАММУ!* \n\n` +
        `Все ${totalWeeks} недель тренировочной программы *"${program.title}"* успешно пройдены!\n\n` +
        `📢 *Рекомендация:*\n` +
        `Отдохните и поспите 3-7 дней и попробуйте установить новый рекорд 1пм! \n\n` +
        `Вы проделали отличную работу. Зафиксируйте свои новые показатели через /rateexercise или рассчитайте 1ПМ заново!`,
        { parse_mode: 'Markdown' }
      );
    } else {
      await bot.sendMessage(
        chatId,
        `💪 *Неделя ${weekIndex + 1} успешно завершена!* \n\n` +
        `Все запланированные тренировки и подходы за эту неделю выполнены!\n\n` +
        `Отличная работа! Отдыхайте, восстанавливайтесь и переходите к Неделе ${weekIndex + 2} в вашем дневнике. 🏋️‍♂️`,
        { parse_mode: 'Markdown' }
      );
    }
    res.json({ success: true });
  } catch (err) {
    console.error('Ошибка завершения недели:', err);
    res.status(500).json({ error: 'Ошибка сервера при отправке сообщения в Telegram' });
  }
});

app.get('/api/records', async (req, res) => {
  const chatId = parseInt(req.query.chatId as string, 10);
  if (isNaN(chatId)) {
    return res.status(400).json({ error: 'Не указан или некорректный chatId' });
  }
  try {
    const records = await getUserRecords(chatId);
    res.json(records);
  } catch (err) {
    console.error('Ошибка получения рекордов:', err);
    res.status(500).json({ error: 'Ошибка БД' });
  }
});

app.get('/api/records/global', async (req, res) => {
  try {
    const records = await getGlobalRecords(50);
    res.json(records);
  } catch (err) {
    console.error('Ошибка получения глобальных рекордов:', err);
    res.status(500).json({ error: 'Ошибка БД' });
  }
});

app.post('/api/records/:id/like', async (req, res) => {
  const recordId = parseInt(req.params.id, 10);
  if (isNaN(recordId)) {
    return res.status(400).json({ error: 'Некорректный id рекорда' });
  }
  try {
    await likeUserRecord(recordId);
    res.json({ success: true });
  } catch (err) {
    console.error('Ошибка лайка рекорда:', err);
    res.status(500).json({ error: 'Ошибка БД' });
  }
});

app.post('/api/records/:id/unlike', async (req, res) => {
  const recordId = parseInt(req.params.id, 10);
  if (isNaN(recordId)) {
    return res.status(400).json({ error: 'Некорректный id рекорда' });
  }
  try {
    await unlikeUserRecord(recordId);
    res.json({ success: true });
  } catch (err) {
    console.error('Ошибка анлайка рекорда:', err);
    res.status(500).json({ error: 'Ошибка БД' });
  }
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../public/uploads');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'record-' + uniqueSuffix + ext);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 15 * 1024 * 1024 }, 
  fileFilter: (req, file, cb) => {
    const allowedExts = ['.mp4', '.mov', '.avi', '.mkv'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedExts.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Разрешены только файлы видео (.mp4, .mov, .avi, .mkv)'));
    }
  }
});

const getUserBodyWeight = async (chatId: number): Promise<number> => {
  try {
    const programs = await getActivePrograms(chatId);
    for (const prog of programs) {
      if (prog.programData && typeof prog.programData.userWeight === 'number') {
        return prog.programData.userWeight;
      }
    }
  } catch (err) {
    console.error('Ошибка при получении веса тела:', err);
  }
  return 80; 
};

app.post('/api/records', (req, res) => {
  upload.single('video')(req, res, async (err) => {
    if (err) {
      console.error('Ошибка загрузки файла multer:', err);
      return res.status(400).json({ error: err.message || 'Ошибка загрузки видео-файла' });
    }
    
    try {
      const chatId = parseInt(req.body.chatId, 10);
      const { movement, category } = req.body;
      const weight = parseFloat(req.body.weight);
      const reps = parseInt(req.body.reps, 10);
      
      if (isNaN(chatId) || !movement || !category || isNaN(weight) || isNaN(reps)) {
        return res.status(400).json({ error: 'Недостаточно параметров или неверный формат' });
      }
      
      const isWeighted = category === 'pullups' || category === 'dips';
      let factor = 1.0;
      if (reps > 1) {
        if (reps <= 10) {
          factor = 1 / (1.0278 - 0.0278 * reps);
        } else {
          factor = 1.059 * Math.pow(reps, 0.10);
        }
      }
      
      let onePm = 0;
      if (isWeighted) {
        const bw = await getUserBodyWeight(chatId);
        const totalWeight = bw + weight;
        const total1PM = totalWeight * factor;
        onePm = Math.max(0, total1PM - bw);
      } else {
        onePm = weight * factor;
      }
      
      const videoPath = req.file ? `/uploads/${req.file.filename}` : null;
      
      await addUserRecord(chatId, movement, category, weight, reps, onePm, videoPath);
      res.json({ success: true });
    } catch (dbErr) {
      console.error('Ошибка добавления рекорда в БД:', dbErr);
      res.status(500).json({ error: 'Ошибка БД' });
    }
  });
});

app.delete('/api/records/:id', async (req, res) => {
  const recordId = parseInt(req.params.id, 10);
  const chatId = parseInt(req.query.chatId as string, 10);
  
  if (isNaN(recordId) || isNaN(chatId)) {
    return res.status(400).json({ error: 'Не указан или некорректный id/chatId' });
  }
  
  try {
    const videoPath = await deleteUserRecord(chatId, recordId);
    
    if (videoPath) {
      const fullPath = path.join(__dirname, '../public', videoPath);
      if (fs.existsSync(fullPath)) {
        fs.unlink(fullPath, (unlinkErr) => {
          if (unlinkErr) console.error('Ошибка удаления файла видео с диска:', unlinkErr);
        });
      }
    }
    
    res.json({ success: true });
  } catch (err) {
    console.error('Ошибка удаления рекорда:', err);
    res.status(500).json({ error: 'Ошибка БД' });
  }
});

app.post('/api/share-record', async (req, res) => {
  const { chatId, movement, category, weight, reps, onePm, videoPath } = req.body;
  
  if (chatId === undefined || !movement || !category || weight === undefined || reps === undefined) {
    return res.status(400).json({ error: 'Недостаточно параметров для отправки' });
  }
  
  const formattedCategory: Record<string, string> = {
    bench: 'Жим лёжа ',
    dips: 'Отжимания на брусьях ',
    pullups: 'Подтягивания ',
    other: 'Другое упражнение '
  };
  const categoryLabel = formattedCategory[category] || category;
  const rounded1PM = Math.round(onePm * 10) / 10;
  
  const captionText = 
    `🏆 *НОВЫЙ РЕКОРД В ЗАЛЕ СЛАВЫ!* \n\n` +
    ` *Сообщение от пользователя:* ${movement}\n` +
    ` *Упражнение:* ${categoryLabel}\n` +
    ` *Результат:* ${weight} кг на ${reps} повт.\n` +
    ` *Расчетный 1ПМ:* ~${rounded1PM} кг\n\n` +
    `Поздравляем с новым достижением! Так держать!🏆`;
    
  try {
    if (videoPath) {
      const fullPath = path.join(__dirname, '../public', videoPath);
      if (fs.existsSync(fullPath)) {
        await bot.sendVideo(chatId, fullPath, {
          caption: captionText,
          parse_mode: 'Markdown'
        });
        return res.json({ success: true });
      }
    }
    
    await bot.sendMessage(chatId, captionText, {
      parse_mode: 'Markdown'
    });
    res.json({ success: true });
  } catch (err) {
    console.error('Ошибка отправки рекорда в Телеграм:', err);
    res.status(500).json({ error: 'Ошибка отправки в Telegram' });
  }
});



const staticPath = path.join(__dirname, '../public');
app.use(express.static(staticPath));

if (!isLocal) {
  app.post(`/bot${token}`, (req, res) => {
    bot.processUpdate(req.body);
    res.sendStatus(200);
  });
}

app.use((req, res, next) => {
  if (req.method !== 'GET') {
    return next();
  }
  if (req.path.startsWith('/api/') || req.path.startsWith('/bot')) {
    return next();
  }
  res.sendFile(path.join(staticPath, 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Сервер Express запущен на порту ${PORT}`);
  
  const webAppUrl = process.env.WEBAPP_URL || 'https://training-tg-bot-1.onrender.com/';
  
  bot.setChatMenuButton({
    menu_button: {
      type: 'web_app',
      text: 'Дневник ',
      web_app: { url: webAppUrl }
    }
  }).then(() => {
    console.log('Кнопка меню Дневник успешно установлена.');
  }).catch((err) => {
    console.error('Ошибка установки ChatMenuButton:', err);
  });

  if (!isLocal) {
    bot.setWebHook(`https://training-tg-bot-1.onrender.com/bot${token}`)
      .then(() => console.log('Вебхук успешно установлен.'))
      .catch(err => console.error('Ошибка установки вебхука:', err));
  }
});


bot.setMyCommands([
  { command: 'start', description: 'Запуск бота' },
  { command: 'help', description: 'ответы на вопросы' },
  { command: 'createprogram', description: 'Создать тренировочную программу' },
  { command: 'rateexercise', description: 'Оценить силовые показатели' },
  { command: 'trainingplan', description: 'Получить готовую программу тренировок на силу' },
  { command: 'calc1pm', description: 'Рассчитать 1ПМ (одноповторный максимум)' },
  { command: 'getedit', description: 'Получить случайный эдит' },
  { command: 'sendedit', description: 'Отправить свой эдит админу' },
]);



// /start
bot.onText(/\/start/i, (msg) => {
  const chatId = msg.chat.id;
  resetUserData(chatId);
  startHandler(bot, chatId);
});

// /createprogram 
bot.onText(/\/createprogram/i, (msg) => {
  const chatId = msg.chat.id;
  const u = getUserData(chatId);
  setUserData(chatId, { ...u, programData: undefined, currentStep: undefined });
  startProgramCreation(bot, chatId);
});

// /rateexercise
bot.onText(/\/rateexercise/i, (msg) => {
  const chatId = msg.chat.id;
  setUserData(chatId, { ratingMode: true, ratingExercise: undefined, weight: undefined, age: undefined });
  bot.sendMessage(chatId, 'Выбери упражнение для оценки:', {
    reply_markup: {
      inline_keyboard: [[
        { text: 'Жим лёжа', callback_data: 'rate_bench' },
        { text: 'Подтягивания', callback_data: 'rate_pullups' },
        { text: 'Брусья', callback_data: 'rate_dips' },
      ]]
    }
  });
});

// /trainingplan
bot.onText(/\/trainingplan/i, (msg) => {
  const chatId = msg.chat.id;
  startTrainingPlanCreation(bot, chatId);
});

// /calc1pm
bot.onText(/\/calc1pm/i, (msg) => {
  const chatId = msg.chat.id;
  startCalc1pm(bot, chatId);
});


bot.on('callback_query', (q) => callbackHandler(bot, q));

// единый обработчик сообщений
bot.on('message', (msg) => {
  // Сохраняем пользователя в бд при любой активности
  const chatId = msg.chat.id;
  const username = msg.from?.username || '';
  const firstName = msg.from?.first_name || '';
  saveUser(chatId, username, firstName);

  if (msg.text && !msg.text.startsWith('/')) {
    messageHandler(bot, msg);
  }
});

//рандом эдит
bot.onText(/\/getedit/i, (msg) => {
  const chatId = msg.chat.id;
  sendRandomVideo(bot, chatId);
});

//help
bot.onText(/\/help/i, (msg) => {
  const chatId = msg.chat.id;
  helpHandler(bot, chatId);
})

//получение эдита 
getVideoHandler(bot);

// Получение статистики (для меня только)
bot.onText(/\/stats/i, async (msg) => {
  const chatId = msg.chat.id;
  const username = msg.from?.username || '';

  if (username === 'MusashiHammer' || username === 'obj ' || username === '@elkamadness') {
    try {
      const { total, active24h } = await getStats();
      await bot.sendMessage(
        chatId, 
        `Статистика бота:\n\n` +
        `Всего уникальных пользователей: ${total}\n` +
        `Активных за последние 24ч: ${active24h}`
      );
    } catch (err) {
      await bot.sendMessage(chatId, 'Ошибка при получении статистики.');
    }
  } else {
    await bot.sendMessage(chatId, 'У вас нет прав для просмотра статистики.');
  }
});

console.log('Бот запущен…');

const daysOfWeekMap = ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб'];

async function checkAndSendReminders() {
  const now = new Date();
  
  // напоминания о тренировке в 9 утра
  const currentHour = now.getHours();
  if (currentHour !== 9) return;
  
  const todayDayName = daysOfWeekMap[now.getDay()]; 
  const todayStr = now.toISOString().split('T')[0];  
  
  try {
    const activePrograms = await getAllActivePrograms();
    for (const prog of activePrograms) {
      const { chatId, programData } = prog;
      
      const lastSent = await getReminderSentDate(chatId);
      if (lastSent === todayStr) continue;
      
      const completed = await getCompletedSets(chatId);
      
      const currentWeek = programData.weeks.find((w: any) => {
        return w.days.some((day: any) => {
          return day.exercises.some((ex: any, exIdx: number) => {
            const setsCount = typeof ex.sets === 'number' ? ex.sets : (ex.repsList?.length || 1);
            for (let s = 1; s <= setsCount; s++) {
              const isDone = completed.some(c => 
                c.weekIndex === w.weekIndex && 
                c.dayName === day.dayName && 
                c.exerciseIndex === exIdx && 
                c.setIndex === s
              );
              if (!isDone) return true;
            }
            return false;
          });
        });
      });
      
      if (!currentWeek) continue;
      
      const todayWorkout = currentWeek.days.find((d: any) => d.dayName === todayDayName);
      if (todayWorkout && todayWorkout.exercises && todayWorkout.exercises.length > 0) {
        const exercisesListText = todayWorkout.exercises
          .map((ex: any, idx: number) => `${idx + 1}. *${ex.name}* (${ex.sets} подходов)`)
          .join('\n');
          
        await bot.sendMessage(
          chatId,
          `*Сегодня день тренировки!* \n\n` +
          `Неделя ${currentWeek.weekIndex + 1} · ${todayDayName.toUpperCase()}\n\n` +
          `*Программа на сегодня:*\n${exercisesListText}\n\n` +
          `Обязательно разомнитесь перед началом тренировки и не забудьте отметить выполненные подходы в тренировочном дневнике!`,
          { parse_mode: 'Markdown' }
        ).then(async () => {
          console.log(`Напоминание успешно отправлено пользователю ${chatId}`);
          await setReminderSentDate(chatId, todayStr);
        }).catch((err) => {
          console.error(`Ошибка при отправке напоминания пользователю ${chatId}:`, err);
        });
      }
    }
  } catch (err) {
    console.error('Ошибка в планировщике напоминаний:', err);
  }
}

setInterval(checkAndSendReminders, 30 * 60 * 1000);
