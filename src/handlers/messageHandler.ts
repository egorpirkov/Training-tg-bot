import TelegramBot, { Message } from 'node-telegram-bot-api';
import { getUserData, setUserData } from './userData';
import { trainingMemory } from './trainingMemory';
import { calculateWeights } from '../utils/calculateWeight';
import { parseTrainingText, textLooksLikeProgram } from '../utils/parseTrainingText';
import { handleProgramCreationMessage } from '../utils/programCreation';

// Логика упражнений
import { Bench } from '../exercises/Bench';
import { PullUp } from '../exercises/PullUp';
import { Dips } from '../exercises/Dips';

export const messageHandler = async (bot: TelegramBot, msg: Message) => {
  const chatId = msg.chat.id;
  const text = msg.text?.trim();
  if (!text) return;

  const userData = getUserData(chatId);

  // 0) Пошаговый мастер программы
  if (userData.currentStep) {
    await handleProgramCreationMessage(bot, chatId, text);
    return;
  }

  // 1) Режим оценки упражнений
  if (userData.ratingMode) {
    // если нет пола → спрашиваем
    if (!userData.gender) {
      await bot.sendMessage(chatId, '👤 Укажи свой пол:', {
        reply_markup: {
          inline_keyboard: [
            [
              { text: '👨 Мужчина', callback_data: 'gender_male' },
              { text: '👩 Женщина', callback_data: 'gender_female' }
            ]
          ]
        }
      });
      return;
    }

    // когда пол выбран → обрабатываем упражнение
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

  // 2) Если ждём 1ПМ для программы
  if (trainingMemory[chatId]?.schedule && !trainingMemory[chatId]?.maxWeight) {
    const max = parseFloat(text.replace(',', '.'));
    if (isNaN(max) || max <= 0) {
      await bot.sendMessage(chatId, 'Пожалуйста, введи корректное положительное число (1ПМ в кг).');
      return;
    }

    trainingMemory[chatId].maxWeight = max;
    const calculated = calculateWeights(max, trainingMemory[chatId].schedule!);

    let resp = `🏋️‍♂️ Программа с рабочими весами (1ПМ = ${max} кг):\n\n`;
    for (const [day, items] of Object.entries(calculated)) {
      if (!items.length) continue;
      resp += `*${day}:*\n`;
      items.forEach((ex, i) => (resp += `${i + 1}. ${ex.weight} кг x ${ex.reps}\n`));
      resp += '\n';
    }

    delete trainingMemory[chatId];
    await bot.sendMessage(chatId, resp, { parse_mode: 'Markdown' });
    return;
  }

  // 3) Текстовая программа
  if (textLooksLikeProgram(text)) {
    const schedule = parseTrainingText(text);
    if (schedule && Object.keys(schedule).length) {
      trainingMemory[chatId] = { text, schedule, timestamp: Date.now() };

      let resp = '📋 Распознанная программа:\n\n';
      let hasPct = false;
      for (const [day, items] of Object.entries(schedule)) {
        if (!items.length) continue;
        resp += `*${day}:*\n`;
        items.forEach((ex, i) => {
          if (ex.weight > 0 && ex.weight <= 1) {
            hasPct = true;
            resp += `${i + 1}. ${Math.round(ex.weight * 100)}% x ${ex.reps}\n`;
          } else {
            resp += `${i + 1}. ${ex.weight}кг x ${ex.reps}\n`;
          }
        });
        resp += '\n';
      }
      if (hasPct) resp += '\n⚠ Процентные значения будут рассчитаны от твоего 1ПМ.';
      await bot.sendMessage(chatId, resp, { parse_mode: 'Markdown' });
      await bot.sendMessage(chatId, '💪 Введи свой одноповторный максимум (1ПМ) в кг:');
      return;
    }
  }

  // 4) Fallback
  await bot.sendMessage(
    chatId,
    'Я тебя не понял. Используй:\n' +
      '/createprogram — пошагово\n' +
      '/trainingplan — текстом\n' +
      '/rateexercise — оценка упражнений'
  );
};
