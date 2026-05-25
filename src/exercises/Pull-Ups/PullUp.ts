import TelegramBot, { Message } from 'node-telegram-bot-api';
import { getUserData, setUserData } from '../../types/UserData';
import { pullUpsRules, femaleVariants } from './pullUpsRules';

export const PullUp = async (bot: TelegramBot, msg: Message) => {
  const chatId = msg.chat.id;
  const text = msg.text?.trim();
  if (!text) return;

  const userData = getUserData(chatId);

  if (userData.PullUp === undefined) {
    const pullUps = parseInt(text, 10);
    
    if (!isNaN(pullUps) && pullUps >= 0) {
      const weight = userData.weight || 70;

      // Сохраняем временное значение подтягиваний для сессии
      setUserData(chatId, { PullUp: pullUps });

      const age = userData.age || 25;
      const gender = userData.gender || 'male';

      function getRandom(arr: string[]) {
        return arr[Math.floor(Math.random() * arr.length)];
      }

      // Поиск подходящего правила
      let evaluation = '';
      for (const rule of pullUpsRules) {
        const [minAge, maxAge] = rule.age;
        const [minPullUps, maxPullUps] = rule.pullUps;
        
        // Проверка возраста и количества подтягиваний
        if (age >= minAge && age <= maxAge && 
            pullUps >= minPullUps && pullUps <= maxPullUps) {
          
          // Проверка веса, если он указан в правиле
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

      // Если правило не найдено, используем дефолтик
      if (!evaluation) {
        evaluation = 'Неплохой результат! Продолжай тренироваться!';
      }

      // Женский вариант 
      if (gender === 'female') {
        evaluation += ' ' + getRandom(femaleVariants).trim(); // trim() на всякий случай уберет лишние пробелы
      }

      await bot.sendMessage(chatId, evaluation);
      await bot.sendMessage(chatId, 'Спасибо! Все данные получены. Что-то еще?');

      // Полностью очищаем стейт после завершения оценки
      setUserData(chatId, { 
        ratingMode: false, 
        ratingExercise: undefined, 
        PullUp: undefined // СБРОС подтягиваний для будущих тестов
      });
    } else {
      await bot.sendMessage(chatId, 'Пожалуйста, введи корректное число подтягиваний.');
    }
  }
};