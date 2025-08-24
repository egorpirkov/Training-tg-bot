import TelegramBot, { CallbackQuery } from 'node-telegram-bot-api';
import { setUserData } from './userData';

export const callbackHandler = (bot: TelegramBot, query: CallbackQuery) => {
  const chatId = query.message?.chat.id;
  const data = query.data;
  if (!chatId || !data) return;

  // --- Выбор упражнения ---
  if (data === 'rate_bench') {
    setUserData(chatId, { ratingExercise: 'bench', ratingMode: true, BS: undefined, weight: undefined, age: undefined, gender: undefined });
    bot.sendMessage(chatId, '💪 Введи вес тела (в кг):');
    return;
  }

  if (data === 'rate_pullups') {
    setUserData(chatId, { ratingExercise: 'pullups', ratingMode: true, PullUp: undefined, weight: undefined, age: undefined, gender: undefined });
    bot.sendMessage(chatId, '💪 Введи количество подтягиваний:');
    return;
  }

  if (data === 'rate_dips') {
    setUserData(chatId, { ratingExercise: 'dips', ratingMode: true, Dips: undefined, weight: undefined, age: undefined, gender: undefined });
    bot.sendMessage(chatId, '💪 Введи количество повторов на брусьях:');
    return;
  }

  // --- Выбор пола ---
  if (data === 'gender_male') {
    setUserData(chatId, { gender: 'male' });
    bot.sendMessage(chatId, '✅ Пол установлен: Мужчина. Теперь продолжай ввод.');
    return;
  }
  if (data === 'gender_female') {
    setUserData(chatId, { gender: 'female' });
    bot.sendMessage(chatId, '✅ Пол установлен: Женщина. Теперь продолжай ввод.');
    return;
  }
};
