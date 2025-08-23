import TelegramBot from 'node-telegram-bot-api';
import { resetUserData } from './userData';

export const startHandler = (bot: TelegramBot, chatId: number) => {
  resetUserData(chatId);
  bot.sendMessage(chatId,
    '🏋️ Добро пожаловать!\n\n' +
    'Команды:\n' +
    '/createprogram — создать программу пошагово (дни → проценты → подходы×повторы → 1ПМ)\n' +
    '/trainingplan — ввести готовую программу текстом\n' +
    '/rateexercise — оценить силовые (жим, подтягивания, брусья)',
    { parse_mode: 'Markdown' }
  );
};
