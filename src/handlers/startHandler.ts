import TelegramBot from 'node-telegram-bot-api';
import { resetUserData } from '../types/UserData';

export const startHandler = (bot: TelegramBot, chatId: number) => {
  resetUserData(chatId);
  bot.sendMessage(chatId,
    '🏋️ Добро пожаловать в Mike Mentzer Bot!\n\n' +
    'Что я умею:\n' +
    '/createProgram — создать программу пошагово (дни → проценты → подходы × повторы → 1ПМ)\n' +
    '/trainingPlan — ввести готовую программу текстом (в разработке)\n' +
    '/rateExercise — оценить силовые (жим, подтягивания, брусья)\n' +
    '/getEdit — получить случайный эдит\n' +
    '/sendEdit — отправить свой эдит администратору\n' +
    '/help — что-то непонятно? используй эту команду',
    { parse_mode: 'Markdown' }
  );
};
