import TelegramBot from 'node-telegram-bot-api';
import { config } from 'dotenv';

import { startHandler } from './handlers/startHandler';
import { callbackHandler } from './handlers/callbackHandler';
import { messageHandler } from './handlers/messageHandler';
import { resetUserData, getUserData, setUserData } from './handlers/userData';
import { startProgramCreation } from './utils/programCreation';
// import { photoHandler } from './handlers/photoHandler';

config();

const token = process.env.BOT_TOKEN;
if (!token) throw new Error('BOT_TOKEN не найден в .env');

const bot = new TelegramBot(token, { polling: true });

// /start
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  resetUserData(chatId);
  startHandler(bot, chatId);
});

// /createprogram — пошаговый мастер
bot.onText(/\/createprogram/, (msg) => {
  const chatId = msg.chat.id;
  const u = getUserData(chatId);
  setUserData(chatId, { ...u, programData: undefined, currentStep: undefined });
  startProgramCreation(bot, chatId);
});

// /rateexercise — только выбор упражнения, без пола/возраста
bot.onText(/\/rateexercise/, (msg) => {
  const chatId = msg.chat.id;
  // сбрасываем только режим оценки и связанные поля
  setUserData(chatId, { ratingMode: true, ratingExercise: undefined, weight: undefined, age: undefined });
  bot.sendMessage(chatId, '💪 Выбери упражнение для оценки:', {
    reply_markup: {
      inline_keyboard: [[
        { text: 'Жим лёжа', callback_data: 'rate_bench' },
        { text: 'Подтягивания', callback_data: 'rate_pullups' },
        { text: 'Брусья', callback_data: 'rate_dips' },
      ]]
    }
  });
});

// /trainingplan — ввод плана текстом
bot.onText(/\/trainingplan/, (msg) => {
  bot.sendMessage(msg.chat.id,
    '📝 Отправь программу в текстовом виде.\n\n' +
    '*Пример 1 (проценты):*\n' +
    'Пн: 70% 4x2\n' +
    'Ср: 75% 4x2\n' +
    'Пт: 80% 4x2\n\n' +
    '*Пример 2 (веса):*\n' +
    'Жим: 60кг 3x5\n' +
    'Присед: 80кг 3x5',
    { parse_mode: 'Markdown' }
  );
});

// коллбеки (для /rateexercise)
bot.on('callback_query', (q) => callbackHandler(bot, q));

// фото (если нужно OCR)
// bot.on('photo', (msg) => photoHandler(bot, msg));

// единый обработчик обычных сообщений
bot.on('message', (msg) => {
  if (msg.text && !msg.text.startsWith('/')) {
    messageHandler(bot, msg);
  }
});

console.log('Бот запущен…');
