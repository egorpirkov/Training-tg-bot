import TelegramBot, { Message } from "node-telegram-bot-api";
import { setUserData, getUserData } from '../../types/UserData';
import { benchRules, femaleBenchVariants } from './benchRules';

export const Bench = async (bot: TelegramBot, msg: Message) => {
  const chatId = msg.chat.id;
  const text = msg.text?.trim();
  if (!text) return;

  const userData = getUserData(chatId); 

  if (userData.BS === undefined) {
    const BS = parseFloat(text);
    
    if (!isNaN(BS) && BS > 0) {
      const weight = userData.weight || 70;

      // Сохраняем временное значение жима для сессии
      setUserData(chatId, { BS });

      const age = userData.age ?? 25;
      const gender = userData.gender ?? 'male';

      function getRandom(arr: string[]) {
        return arr[Math.floor(Math.random() * arr.length)];
      }

      // Поиск подходящего правила
      let evaluation = '';
      for (const rule of benchRules) {
        let matches = true;

        // Проверка возраста
        if (rule.age && !(age >= rule.age[0] && age <= rule.age[1])) {
          matches = false;
        }

        // Проверка веса 
        if (rule.weightCondition && !(weight >= rule.weightCondition[0] && weight <= rule.weightCondition[1])) {
          matches = false;
        }

        // Проверка жима
        if (rule.bsAbsolute && !(BS > rule.bsAbsolute)) {
          matches = false;
        }

        // Проверка множителя веса
        if (rule.bsMultiplier && !(BS >= weight * rule.bsMultiplier)) {
          matches = false;
        }

        if (matches) {
          evaluation = getRandom(rule.variants);
          break;
        }
      }

      // Если правило не найдено, используем дефолт
      if (!evaluation) {
        evaluation = 'Хороший результат! Продолжай тренироваться!';
      }

      // Женский вариант
      if (gender === 'female') {
        evaluation += ' ' + getRandom(femaleBenchVariants).trim();
      }

      await bot.sendMessage(chatId, evaluation);
      await bot.sendMessage(chatId, 'Спасибо! Все данные получены.');

      // Полностью очищаем стейт после завершения оценки
      setUserData(chatId, { 
        ratingMode: false, 
        ratingExercise: undefined, 
        BS: undefined // Сброс жима для будущих тестов
      });
    } else {
      await bot.sendMessage(chatId, 'Пожалуйста, введи корректный жим (в кг).');
    }
  }
};