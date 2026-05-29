process.env.NTBA_FIX_319 = "1";
import TelegramBot from 'node-telegram-bot-api';
import { config } from 'dotenv';
config();

import { startHandler } from './handlers/startHandler';
import { callbackHandler, callBackHandlerOfHelp } from './handlers/callbackHandler';
import { messageHandler } from './handlers/messageHandler';
import { resetUserData, getUserData, setUserData } from './types/UserData'
import { startProgramCreation } from './utils/programCreation';
import { sendRandomVideo } from './EditedVideos/sendEditedVideos/sendVideo';
import { getVideoHandler } from './EditedVideos/getEditedVideos/getVideo';
import express from 'express';
import { helpHandler } from './handlers/helpHandler';
import { saveUser, getStats } from './utils/db';

const token = process.env.BOT_TOKEN;
if (!token) throw new Error('BOT_TOKEN не найден в .env');

const webhookUrl = process.env.WEBHOOK_URL;
const bot = new TelegramBot(token, webhookUrl ? { webHook: true } : { polling: true });

if (webhookUrl) {
  const app = express();
  app.use(express.json());

  app.get('/', (req, res) => res.send('Bot is alive '));

  app.post(`/bot${token}`, (req, res) => {
    bot.processUpdate(req.body);
    res.sendStatus(200);
  });

  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server alive on port ${PORT}`);
    bot.setWebHook(`${webhookUrl}/bot${token}`);
  });
} else {
  bot.deleteWebHook()
    .then(() => {
      console.log('Предыдущий Webhook удален, бот запущен в режиме Long Polling...');
    })
    .catch((err) => {
      console.error('Ошибка при удалении Webhook:', err);
    });
}


bot.setMyCommands([
  { command: 'start', description: 'Запуск бота' },
  { command: 'help', description: 'ответы на вопросы' },
  { command: 'createprogram', description: 'Создать тренировочную программу' },
  { command: 'rateexercise', description: 'Оценить силовые показатели' },
  { command: 'trainingplan', description: 'Ввести готовую программу(в разработке)' },
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
  bot.sendMessage(msg.chat.id,
    'Отправь программу в текстовом виде.\n\n' +
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
