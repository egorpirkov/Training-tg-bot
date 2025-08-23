import TelegramBot, { CallbackQuery } from 'node-telegram-bot-api';
import { setUserData } from './userData';

export const callbackHandler = (bot: TelegramBot, query: CallbackQuery) => {
  const chatId = query.message?.chat.id;
  const data = query.data;
  if (!chatId || !data) return;

  // Только режимы оценки; без выбора пола
  if (data === 'rate_bench') {
    setUserData(chatId, { ratingExercise: 'bench', ratingMode: true, weight: undefined, BS: undefined });
    bot.sendMessage(chatId, '💪 Введи вес тела (в кг):');
    return;
  }

  if (data === 'rate_pullups') {
    setUserData(chatId, { ratingExercise: 'pullups', ratingMode: true, PullUp: undefined });
    bot.sendMessage(chatId, '💪 Введи количество подтягиваний:');
    return;
  }

  if (data === 'rate_dips') {
    setUserData(chatId, { ratingExercise: 'dips', ratingMode: true, PushUp: undefined });
    bot.sendMessage(chatId, '💪 Введи количество отжиманий на брусьях:');
    return;
  }
};
