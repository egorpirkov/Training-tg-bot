import TelegramBot from 'node-telegram-bot-api';
import { resetUserData } from '../types/UserData';

export const startHandler = (bot: TelegramBot, chatId: number) => {
  resetUserData(chatId);
  const webAppUrl = process.env.WEBAPP_URL || 'https://training-tg-bot-1.onrender.com/';

  bot.sendMessage(chatId,
    '👋 *Добро пожаловать в Mentzer bot!*\n\n' +
    'KachBot - это тг-бот, который считает 1ПМ, оценивает рекорды по возрасту и весу и также составлять программу на силу которые проверены автором бота.\n\n' +
    '*Основные команды:*\n' +
    '/createprogram - создать и рассчитать твою программу пошагово (дни → проценты → подходы × повторы → 1ПМ)\n' +
    '/trainingplan - готовые программы тренировок на силу (проверенные автором)\n' +
    '/rateexercise - оценить свои силовые показатели (жим, подтягивания, брусья)\n' +
    '/calc1pm - рассчитать свой 1ПМ (одноповторный максимум)\n' +
    '/getedit - получить случайный эдит\n' +
    '/sendedit - отправить свой эдит администратору\n' +
    '/help - ответы на частые вопросы\n\n' +
    '*А также по мелочи:* бот умеет скачивать видео,фото или звук по ссылке из TikTok.Просто отправь ссылку в чат.',
    { 
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: '🏋️ Открыть Тренировочный Дневник', web_app: { url: webAppUrl } }]
        ]
      }
    }
  );
};
