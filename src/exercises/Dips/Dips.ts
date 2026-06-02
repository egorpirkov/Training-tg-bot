import TelegramBot, { Message } from "node-telegram-bot-api";
import { setUserData, getUserData } from '../../types/UserData';
import { dipsRules, femaleDipsVariants } from './dipsRules';

export const Dips = async (bot: TelegramBot, msg: Message) => {
  const chatId = msg.chat.id;
  const text = msg.text?.trim();
  if (!text) return;

  const userData = getUserData(chatId);

  if (userData.Dips === undefined) {
    const dips = parseInt(text, 10);
    
    if (!isNaN(dips) && dips >= 0) {
      const weight = userData.weight ?? 70;

      setUserData(chatId, { Dips: dips });

      const age = userData.age ?? 25;
      const gender = userData.gender ?? 'male';

      function getRandom(arr: string[]) {
        return arr[Math.floor(Math.random() * arr.length)];
      }

      let evaluation = '';
      for (const rule of dipsRules) {
        const [minAge, maxAge] = rule.age;
        const [minDips, maxDips] = rule.dips;

        if (age >= minAge && age <= maxAge && dips >= minDips && dips <= maxDips) {
          
          if (rule.weight) {
            const [minWeight, maxWeight] = rule.weight;
            if (weight >= minWeight && weight <= maxWeight) {
              evaluation = getRandom(rule.variants);
              break;
            }
          } else {
            evaluation = getRandom(rule.variants);
            break;
          }
        }
      }

      if (!evaluation) {
        evaluation = 'Хороший результат на брусьях! Продолжай тренироваться!';
      }

      if (gender === 'female') {
        evaluation += ' ' + getRandom(femaleDipsVariants);
      }

      await bot.sendMessage(chatId, evaluation);
      await bot.sendMessage(chatId, 'Спасибо! Все данные по брусьям получены,удачи на тренировках.');
      
      setUserData(chatId, { ratingMode: false, ratingExercise: undefined, Dips: undefined });
    } else {
      await bot.sendMessage(chatId, 'Пожалуйста, введи корректное количество отжиманий на брусьях.');
    }
  }
};