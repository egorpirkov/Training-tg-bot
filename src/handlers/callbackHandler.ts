import TelegramBot, { CallbackQuery } from 'node-telegram-bot-api';
import { setUserData, getUserData } from '../types/UserData'

export const callbackHandler = async (bot: TelegramBot, query: CallbackQuery) => {
  const chatId = query.message?.chat.id;
  const data = query.data;
  if (!chatId || !data) return;

  // --- Выбор упражнения ---
  if (data === 'rate_bench') {
    setUserData(chatId, {
      ratingExercise: 'bench',
      ratingMode: true,
      BS: undefined,
      weight: undefined,
      age: undefined,
      gender: undefined
    });

    await bot.sendMessage(chatId, '👤 Укажи свой пол:', {
      reply_markup: {
        inline_keyboard: [
          [
            { text: ' Мужчина', callback_data: 'gender_male_bench' },
            { text: ' Женщина', callback_data: 'gender_female_bench' }
          ]
        ]
      }
    });
    return;
  }

  if (data === 'rate_pullups') {
    setUserData(chatId, {
      ratingExercise: 'pullups',
      ratingMode: true,
      PullUp: undefined,
      weight: undefined,
      age: undefined,
      gender: undefined
    });

    // Сразу запрашиваем все необходимые данные
    await bot.sendMessage(chatId, '👤 Укажи свой пол:', {
      reply_markup: {
        inline_keyboard: [
          [
            { text: ' Мужчина', callback_data: 'gender_male_pullups' },
            { text: ' Женщина', callback_data: 'gender_female_pullups' }
          ]
        ]
      }
    });
    return;
  }

  if (data === 'rate_dips') {
    setUserData(chatId, {
      ratingExercise: 'dips',
      ratingMode: true,
      Dips: undefined,
      weight: undefined,
      age: undefined,
      gender: undefined
    });

    await bot.sendMessage(chatId, '👤 Укажи свой пол:', {
      reply_markup: {
        inline_keyboard: [
          [
            { text: ' Мужчина', callback_data: 'gender_male_dips' },
            { text: ' Женщина', callback_data: 'gender_female_dips' }
          ]
        ]
      }
    });
    return;
  }

  // --- Выбор пола для подтягиваний ---
  if (data === 'gender_male_pullups' || data === 'gender_female_pullups') {
    const gender = data.startsWith('gender_male') ? 'male' : 'female';
    setUserData(chatId, { gender });

    await bot.sendMessage(chatId, `✅ Пол установлен: ${gender === 'male' ? 'Мужчина' : 'Женщина'}`);
    await bot.sendMessage(chatId, ' Введи свой возраст:');
    return;
  }

  if (data === 'gender_male_dips' || data === 'gender_female_dips') {
    const gender = data.startsWith('gender_male') ? 'male' : 'female';
    setUserData(chatId, { gender });

    await bot.sendMessage(chatId, `✅ Пол установлен: ${gender === 'male' ? 'Мужчина' : 'Женщина'}`);
    await bot.sendMessage(chatId, ' Введи свой возраст:');
    return;
  }

  if (data === 'gender_male_bench' || data === 'gender_female_bench') {
    const gender = data.startsWith('gender_male') ? 'male' : 'female';
    setUserData(chatId, { gender });

    await bot.sendMessage(chatId, `✅ Пол установлен: ${gender === 'male' ? 'Мужчина' : 'Женщина'}`);
    await bot.sendMessage(chatId, ' Введи свой возраст:');
    return;
  }



  // --- Выбор пола для жима (если нужно) ---
  if (data === 'gender_male') {
    setUserData(chatId, { gender: 'male' });
    await bot.sendMessage(chatId, '✅ Пол установлен: Мужчина. Теперь введи свой вес тела (в кг):');
    return;
  }

  if (data === 'gender_female') {
    setUserData(chatId, { gender: 'female' });
    await bot.sendMessage(chatId, '✅ Пол установлен: Женщина. Теперь введи свой вес тела (в кг):');
    return;
  }
};

// --- Эхо чат для помощи из help.ts --- //

export const callBackHandlerOfHelp = (bot: TelegramBot, query: TelegramBot.CallbackQuery) => {
  const chatId = query.message?.chat.id;
  const data = query.data;
  //id — айди запроса
  ///from — данные о пользователе
  //message — сообщение, к которому прикреплена кнопка
  //data — то, что передается в callback_data

  if (!chatId || !data) return;

  if (data === 'faq_1pm') {
    bot.sendMessage(chatId, '1ПМ — это твой максимум в одном повторении (One Rep Max).Допустим,ты жмешь свой максимальный вес,предположим что это 100кг на 1 повторение.Это и есть твой 1ПМ.');
  } else if (data === 'faq_percent') {
    bot.sendMessage(chatId, 'Проценты от 1ПМ нужны, чтобы подобрать правильный вес для тренировок.Предположим,что в твоей программе тренировок указано 70% от 1ПМ на 3 подхода по 5 повторений - это значит что ты чтобы достичь результатов,тебе нужно взять вес равный 70кг(так как это 70% от твоего 1ПМ).');
  } else if (data === 'faq_createprogram') {
    bot.sendMessage(chatId, 'Команда /createprogram пошагово создаёт программу: дни → проценты → подходы × повторы → 1ПМ.Зачем оно?чтобы исходя из твоей выбранной программы,бот мог составить тебе все по дням,весам и подходам,которые указаны в программе выбранной тобой.');
  } else if (data === 'faq_edit') {
    bot.sendMessage(chatId, 'Эдиты можно присылать админу, чтобы он их посмотрел и, возможно, добавил в коллекцию эдитов,чтобы и другие пользователи могли их увидеть используя команду /sendvideo.');
  }
  bot.answerCallbackQuery(query.id);
}