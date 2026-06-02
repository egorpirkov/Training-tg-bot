import TelegramBot from 'node-telegram-bot-api';
import { resetUserData } from '../types/UserData';

export const startHandler = (bot: TelegramBot, chatId: number) => {
  resetUserData(chatId);
  bot.sendMessage(chatId,
    '👋 *Добро пожаловать в Mike Mentzer Bot!*\n\n' +
    '⚠️ *Важное примечание:* Если вы *новичок*, у вас могут возникнуть вопросы по поводу работы бота. Для корректного использования программы требуются базовые тренировочные знания и опыт в силовых тренировках.\n\n' +
    '💡 Если у тебя возникнут вопросы что делает бот, используй команду /help.\n\n' +
    '*Что я умею:*\n' +
    '/createprogram — создать и рассчитать твою программу пошагово (дни → проценты → подходы × повторы → 1ПМ)\n' +
    '/trainingplan — готовые программы тренировок на силу(Затесщенный автором)\n' +
    '/rateexercise — оценить свои силовые показатели (жим, подтягивания, брусья)\n' +
    '/getedit — получить случайный эдит\n' +
    '/sendedit — отправить свой эдит администратору\n' +
    '/help — справка и ответы на вопросы',
    { parse_mode: 'Markdown' }
  );
};
