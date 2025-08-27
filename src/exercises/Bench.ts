import TelegramBot, { Message } from "node-telegram-bot-api";
import { setUserData, getUserData } from '../types/UserData'

export const Bench = (bot: TelegramBot, msg: Message) => {
  const chatId = msg.chat.id;
  const text = msg.text?.trim();
  if (!text) return;

  const userData = getUserData(chatId);

  if (userData.BS === undefined) {
    const BS = parseFloat(text);
    if (!isNaN(BS) && BS > 0) {
      setUserData(chatId, { BS });

      const age = userData.age ?? 25;
      const weight = userData.weight ?? 70;
      const gender = userData.gender ?? 'male';

      let evaluation = '';

      // отдельная проверка на маленький вес
      if (weight === 40 || weight === 50 || weight === 60) {
        evaluation = '💥 Мал да удал, силен, но можно поднабрать!';
      }

      // супер-тяжёлый жим
      else if (BS > 250) {
        evaluation = '💥 Мэддокс, ты ли это?! ';
      }
      else if (age >= 12 && age <= 14) {
        if (BS >= weight * 1.5) evaluation = '💥 Ебать, ты монстр на скамье!';
        else if (BS >= weight * 1.2) evaluation = '🔥 Сильный, чисто как маленький Смаев!';
        else if (BS >= weight) evaluation = '💪 Неплохо, но есть куда расти!';
        else evaluation = '👌базар нет ты немощ брат дальше менше!';
      } else if (age >= 15 && age <= 17) {
        if (BS >= weight * 2) evaluation = ' Чеза КамАЗ в зале! 💪';
        else if (BS >= weight * 1.5) evaluation = '🔥 Сильный юнец, держи тунец';
        else if (BS >= weight * 1.2) evaluation = '💪 Нормально, держи темп!';
        else evaluation = '🤏 Так себе, тут не стоит оставаться...';
      } else if (age >= 18 && age <= 25) {
        if (BS >= weight * 2.5) evaluation = '💥Супермен чисто!';
        else if (BS >= weight * 2) evaluation = '🔥 трактор жимовойы, силен!';
        else if (BS >= weight * 1.5) evaluation = '💪 Отличный результат, сила есть!';
        else if (BS >= weight * 1.2) evaluation = '👌 Неплохо, но можешь больше!';
        else evaluation = '😅 Сойдет, качайся, станешь монстром!';
      } else if (age > 25) {
        if (BS >= weight * 2) evaluation = '💥 Старик, но еще дает форму молодым! Супер жим!';
        else if (BS >= weight * 1.5) evaluation = '🔥 Хороший уровень, держи форму!';
        else if (BS >= weight * 1.2) evaluation = '💪 Средне, развивай потенциал!';
        else evaluation = '😅 Нужно больше тренироваться, не расслабляйся работай!';
      }

      if (gender === 'female') evaluation += 'Сильна ты девочка,держи буську';

      bot.sendMessage(chatId, evaluation);
      bot.sendMessage(chatId, 'Спасибо! Все данные получены.');
    } else {
      bot.sendMessage(chatId, 'Пожалуйста, введи корректный жим (в кг).');
    }
  }
};
