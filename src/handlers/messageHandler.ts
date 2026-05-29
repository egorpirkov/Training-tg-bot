import TelegramBot, { Message } from 'node-telegram-bot-api';
import { getUserData, setUserData } from '../types/UserData'
import { trainingMemory } from './trainingMemory';
import { calculateWeights } from '../utils/calculateWeight';
import { parseTrainingText, textLooksLikeProgram } from '../utils/parseTrainingText';
import { handleProgramCreationMessage } from '../utils/programCreation';
import { Bench } from '../exercises/Bench/Bench';
import { PullUp } from '../exercises/Pull-Ups/PullUp';
import { Dips } from '../exercises/Dips/Dips';
import { tiktokHandler } from './tiktokHandler';

export const messageHandler = async (bot: TelegramBot, msg: Message) => {
  const chatId = msg.chat.id;
  const text = msg.text?.trim();
  if (!text) return;

  const userData = getUserData(chatId);

  const tiktokRegex = /https?:\/\/(www\.)?(tiktok\.com|vm\.tiktok\.com)\/\S+/i;
  if (tiktokRegex.test(text)) {
    await tiktokHandler(bot, chatId, text);
    return;
  }


  if (userData.currentStep) {
    await handleProgramCreationMessage(bot, chatId, text);
    return;
  }

  //Режим оценки упражнений
  if (userData.ratingMode) {
    //Обработка возраста
    if (!userData.age) {
      const age = parseInt(text, 10);
      if (!isNaN(age) && age > 0 && age < 120) {
        setUserData(chatId, { age });

        if (userData.ratingExercise === 'bench') {
          await bot.sendMessage(chatId, '✅ Возраст установлен. Теперь введи свой вес тела (в кг):');
        } else {
          await bot.sendMessage(chatId, '✅ Возраст установлен. Теперь введи свой вес тела (в кг):');
        }
        return;
      } else {
        await bot.sendMessage(chatId, 'Пожалуйста, введи корректный возраст (число от 1 до 120).');
        return;
      }
    }

    // Обработка веса
    if (!userData.weight) {
      const weight = parseFloat(text.replace(',', '.'));
      if (!isNaN(weight) && weight >= 30 && weight <= 150) {
        setUserData(chatId, { weight });

        if (userData.ratingExercise === 'bench') {
          await bot.sendMessage(chatId, '✅ Вес установлен. Теперь введи свой максимальный результат в жиме лежа (в кг):');
        } else if (userData.ratingExercise === 'pullups') {
          await bot.sendMessage(chatId, '✅ Вес установлен. Теперь введи свое максимальное количество подтягиваний:');
        } else if (userData.ratingExercise === 'dips') {
          await bot.sendMessage(chatId, '✅ Вес установлен. Теперь введи свое максимальное количество отжиманий на брусьях:');
        }
        return;
      } else {
        await bot.sendMessage(chatId, 'Пожалуйста, введи реальный вес тела (число от 30 до 150 кг).');
        return;
      }
    }

    // обрабатываем упражнение
    switch (userData.ratingExercise) {
      case 'bench':
        await Bench(bot, msg);
        return;
      case 'pullups':
        await PullUp(bot, msg);
        return;
      case 'dips':
        await Dips(bot, msg);
        return;
    }
  }


};