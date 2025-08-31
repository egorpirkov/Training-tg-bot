process.env.NTBA_FIX_319 = "1";
import TelegramBot from 'node-telegram-bot-api';
import { config } from 'dotenv';

import { startHandler } from './handlers/startHandler';
import { callbackHandler, callBackHandlerOfHelp } from './handlers/callbackHandler';
import { messageHandler } from './handlers/messageHandler';
import { resetUserData, getUserData, setUserData } from './types/UserData'
import { startProgramCreation } from './utils/programCreation';
import { sendRandomVideo } from './EditedVideos/sendEditedVideos/sendVideo';
import { getVideoHandler } from './EditedVideos/getEditedVideos/getVideo';
import express from 'express';
import { helpHandler } from './handlers/helpHandler';
const app = express();
app.get('/', (req, res) => res.send('Bot is alive 🚀'));
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server is alive on port ${PORT}`));

config();


const token = process.env.BOT_TOKEN;
if (!token) throw new Error('BOT_TOKEN не найден в .env');

const bot = new TelegramBot(token, { polling: true });

bot.setMyCommands([
  { command: 'start', description: 'Запуск бота' },
  { command: 'help', description: 'ответы на вопросы' },
  { command: 'createprogram', description: 'Создать тренировочную программу' },
  { command: 'rateexercise', description: 'Оценить силовые показатели(подтягивание,брусья и тд)' },
  { command: 'trainingplan', description: 'Ввести готовую программу(в разработке)' },
  { command: 'sendvideo', description: 'Получить случайный эдит' },
  { command: 'sendedit', description: 'Отправить свой эдит админу' },
]);



// /start
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  resetUserData(chatId);
  startHandler(bot, chatId);
});

// /createprogram 
bot.onText(/\/createprogram/, (msg) => {
  const chatId = msg.chat.id;
  const u = getUserData(chatId);
  setUserData(chatId, { ...u, programData: undefined, currentStep: undefined });
  startProgramCreation(bot, chatId);
});

// /rateexercise
bot.onText(/\/rateexercise/, (msg) => {
  const chatId = msg.chat.id;
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

// /trainingplan
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

// общий обработчик callback_query
bot.on('callback_query', (q) => callbackHandler(bot, q));

// единый обработчик сообщений
bot.on('message', (msg) => {
  if (msg.text && !msg.text.startsWith('/')) {
    messageHandler(bot, msg);
  }
});

//рандом эдит
bot.onText(/\/sendvideo/, (msg) => {
  const chatId = msg.chat.id;
  sendRandomVideo(bot, chatId);
});

//help
bot.onText(/\/help/, (msg) => {
  const chatId = msg.chat.id;
  helpHandler(bot, chatId);
})

bot.on('callback_query', (query) => {
  callBackHandlerOfHelp(bot, query);
})

//получение эдита 
getVideoHandler(bot);

console.log('Бот запущен…');
