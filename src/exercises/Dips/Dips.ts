import TelegramBot, { Message } from "node-telegram-bot-api";
import { setUserData, getUserData } from '../../types/UserData';
import { dipsRules, femaleDipsVariants, DipsRules } from './dipsRules';

export const Dips = (bot: TelegramBot, msg: Message) => {
  const chatId = msg.chat.id;
  const text = msg.text?.trim();
  if (!text) return;

  const userData = getUserData(chatId);

  if (userData.Dips === undefined) {
    const dips = parseInt(text, 10);
    if (!isNaN(dips) && dips >= 0) {
      setUserData(chatId, { Dips: dips });

      const age = userData.age ?? 25;
      const weight = userData.weight ?? 70;
      const gender = userData.gender ?? 'male';

      function getRandom(arr: string[]) {
        return arr[Math.floor(Math.random() * arr.length)];
      }

      // Поиск подходящего правила
      let evaluation = '';
      for (const rule of dipsRules) {
        let matches = true;

        // Проверка возраста
        if (rule.age && !(age >= rule.age[0] && age <= rule.age[1])) {
          matches = false;
        }

        // Проверка веса
        if (rule.weightCondition && !(weight >= rule.weightCondition[0] && weight <= rule.weightCondition[1])) {
          matches = false;
        }

        // Проверка абсолютного значения
        if (rule.dipsAbsolute && !(dips >= rule.dipsAbsolute)) {
          matches = false;
        }

        // Проверка множителя веса (если нужно будет добавить)
        if (rule.dipsMultiplier && !(dips >= weight * rule.dipsMultiplier)) {
          matches = false;
        }

        if (matches) {
          evaluation = getRandom(rule.variants);
          break;
        }
      }

      // Если правило не найдено, используем дефолтное
      if (!evaluation) {
        evaluation = '💪 Хороший результат на брусьях! Продолжай тренироваться!';
      }

      // Женский вариант
      if (gender === 'female') {
        evaluation += ' ' + getRandom(femaleDipsVariants);
      }

      bot.sendMessage(chatId, evaluation);
      bot.sendMessage(chatId, 'Спасибо! Все данные по брусьям получены.');
    } else {
      bot.sendMessage(chatId, 'Пожалуйста, введи корректное количество отжиманий на брусьях.');
    }
  }
};