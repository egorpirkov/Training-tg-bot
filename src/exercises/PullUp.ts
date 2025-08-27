import TelegramBot, { Message } from 'node-telegram-bot-api';
import { getUserData, setUserData } from '../types/UserData'

export const PullUp = async (bot: TelegramBot, msg: Message) => {
  const chatId = msg.chat.id;
  const text = msg.text?.trim();
  if (!text) return;

  const userData = getUserData(chatId);

  if (userData.PullUp === undefined) {
    const pullUps = parseInt(text, 10);
    if (!isNaN(pullUps) && pullUps >= 0) {
      setUserData(chatId, { PullUp: pullUps });

      const age = userData.age || 25;
      const weight = userData.weight || 70;
      const gender = userData.gender || 'male';

      let evaluation = '';

      if (age >= 12 && age <= 14) {
        if (pullUps >= 30) evaluation = '💥 Ебать, ты монстр нахуй! 🚀';
        else if (pullUps >= 20 && weight > 100) evaluation = '🔥 Андрей Смаев, ты ли это?! 💪';
        else if (pullUps >= 20) evaluation = '💪 Ты реально крепкий, кайф!';
        else evaluation = '👌 Норм, но не расслабляйся, есть куда расти.';
      } else if (age >= 15 && age <= 17) {
        if (pullUps >= 40 && weight <= 60) evaluation = '🚛💨 чеза камаз, вай биля!'; 
        else if (pullUps >= 25 && weight > 100) evaluation = '🔥 Тяжелый, но мощный как легкий! 💪';
        else if (pullUps >= 25) evaluation = '💪 Крепкий юнец, держи тунец!';
        else evaluation = '🤏 Ай тигр, дальше меньше.';
      } else if (age >= 18 && age <= 25) {
        if (pullUps >= 50 && weight <= 70) evaluation = 'Базару нет, ты мощь брат! 💥';
        else if (pullUps >= 30 && weight > 100) evaluation = '🔥 Андрей Смаев своего рода!';
        else if (pullUps >= 20) evaluation = '💪 Молодец, сила присуствует!';
        else evaluation = '😅 Базар нет, ты немощь брат!';
      } else if (age > 25) {
        if (pullUps >= 40 && weight <= 70) evaluation = '💥 чеза Брюс Ли, на, хорош!';
        else if (pullUps >= 25 && weight > 100) evaluation = '🚛 Тяжеловес, ты внебрачный сын Смаева?';
        else if (pullUps >= 15) evaluation = '💪 Ну и монстр!';
        else evaluation = '😅 Средне, нельзя тут оставаться, двигайся в том же темпе браток.';
      }

      if (gender === 'female') evaluation += 'Довольно сильна для девочки, держи корону 👑!';

      await bot.sendMessage(chatId, evaluation);
      await bot.sendMessage(chatId, 'Спасибо! Все данные получены.Что-то еще?');

      setUserData(chatId, { ratingMode: false, ratingExercise: undefined });
    } else {
      await bot.sendMessage(chatId, 'Пожалуйста, введи корректное число подтягиваний.');
    }
  }
};
