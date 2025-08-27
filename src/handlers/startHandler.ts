import TelegramBot from 'node-telegram-bot-api';
import { resetUserData } from '../types/UserData';

export const startHandler = (bot: TelegramBot, chatId: number) => {
  resetUserData(chatId);
  bot.sendMessage(chatId,
    '🏋️ Добро пожаловать в Mike Mentzer Bot!\n\n' +
    'Что я умею:\n' +
    '/createprogram — создать программу пошагово (дни → проценты → подходы × повторы → 1ПМ)\n' +
    '/trainingplan — ввести готовую программу текстом (в разработке)\n' +
    '/rateexercise — оценить силовые (жим, подтягивания, брусья)\n' +
    '/sendvideo — отправить случайный эдит',
    { parse_mode: 'Markdown' }
  );
};
