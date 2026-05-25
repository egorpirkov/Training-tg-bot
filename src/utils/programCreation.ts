import TelegramBot from "node-telegram-bot-api";
import { getUserData, setUserData } from "../types/UserData";
import { UserProgramData, DayConfig, ProgramConfig, repMaxTable } from "../types/training";

// Функция для преобразования ПМ в проценты то есть 6ПМ это 85%
function pmToPercentage(pm: number): number {
  return repMaxTable[pm] || 85; 
}

// Генерация текста программы для вывода пользователю
function generateProgramText(programData: UserProgramData) {
  const { weeks, maxWeight } = programData;
  if (!weeks || !weeks.length || !maxWeight) {
    return "❌ Нет данных для программы.";
  }

  let resp = `💪 *ТВОЯ ПРОГРАММА ТРЕНИРОВОК на основе твоего плана* 💪\n`;
  resp += `🔸 *1ПМ: ${maxWeight} кг*\n\n`;

  weeks.forEach((week, wi) => {
    resp += `📅 *НЕДЕЛЯ ${wi + 1}*\n`;

    for (const [day, configs] of Object.entries(week)) {
      resp += `*${day.toUpperCase()}*\n`;

      configs.forEach((cfg, index) => {// sfg это конфиг упражнения(pm:5,sets:2,reps:8)
        let percentage: number;
        let description = '';

        if (cfg.percentage) {
          percentage = cfg.percentage;
          description = `${cfg.percentage}%`;
        } else if (cfg.pm) { // если есть кол-во повторов до отказа,переводим через pmToPercentage,типо pm=5 > 87%
          percentage = pmToPercentage(cfg.pm);
          description = `ПМ${cfg.pm}`;
        } else {
          percentage = 0;
          description = '?';
        }

        const weightKg = Math.round((percentage / 100) * maxWeight);
        resp += `  ${index + 1}. ${weightKg} кг (${description}) — ${cfg.sets}×${cfg.reps}\n`;
      });
      resp += `\n`;
    }
  });

  return resp;
}

// Первый шаг: запуск программы
export async function startProgramCreation(bot: TelegramBot, chatId: number) {
  setUserData(chatId, {
    programData: { weeks: [] },
    currentStep: "days",
  });

  await bot.sendMessage(
    chatId,
    "🏋️ *Создадим тебе план на основе твоей программы!*\n\n" +
    "📅 *В какие дни тренируешься?*\n" +
    "▫️ Пример: пн, ср, пт\n" +
    "▫️ Или: вт, чт, сб\n\n" +
    "(Укажи дни через запятую)",
    { parse_mode: "Markdown" }
  );
}

// Обработка шагов программы
export async function handleProgramCreationMessage(
  bot: TelegramBot,
  chatId: number,
  text: string
) {
  const u = getUserData(chatId);
  const step = u.currentStep;
  if (!step) return;

  const normDay = (d: string) =>
    d
      .toLowerCase()
      .replace(/\./g, "")
      .replace(/^(пон.*)/, "пн")
      .replace(/^(вто.*)/, "вт")
      .replace(/^(сре.*)/, "ср")
      .replace(/^(чет.*)/, "чт")
      .replace(/^(пят.*)/, "пт")
      .replace(/^(суб.*)/, "сб")
      .replace(/^(вос.*)/, "вс");

  switch (step) {
    case "days": {
      const days = text
        .split(/[,\n;]+/)
        .map((s) => s.trim())
        .filter(Boolean)
        .map(normDay)
        .filter((d) => ["пн", "вт", "ср", "чт", "пт", "сб", "вс"].includes(d));

      if (!days.length) {
        await bot.sendMessage(
          chatId,
          "❌ *Не понял дни*\n\n" +
          "💡 *Попробуй так:*\n" +
          "▫️ пн, ср, пт\n" +
          "▫️ вт, чт, сб",
          { parse_mode: "Markdown" }
        );
        return;
      }

      setUserData(chatId, {
        tempDays: days,
        tempDayConfigs: [],
        programData: u.programData,
        currentStep: "dayPercentSetsReps",
      });

      await bot.sendMessage(
        chatId,
        "📝 *Теперь укажи нагрузки для каждого дня:*\n\n" +
        "💡 *Какой ПМ указан в твоей программе?(6ПМ,2ПМ)*\n" +
        "▫️ Примеры форматов тренировок:\n" +
        "   - 6ПМ 3×5 (для 6ПМ)\n" +
        "   - 80% 4×3 (для процентов)\n" +
        "   - 5ПМ ×8 (один подход)\n\n" +
        `💡 *Указывая такие строки, ты задаешь нагрузки для дней недели:* ${days.join(', ')}`,
        { parse_mode: "Markdown" }
      );
      return;
    }

    case "dayPercentSetsReps": {
      const lines = text.split(/\n+/).map((s) => s.trim()).filter(Boolean);
      const configs: DayConfig[] = [];

      for (const line of lines) {
        // х или латинский х

        // 6ПМ 3x5 или 6ПМ 3×5
        let m = line.match(/(\d+)\s*пм\s+(\d+)[x×](\d+)/i);
        if (m) {
          configs.push({
            pm: parseInt(m[1]),
            sets: parseInt(m[2]),
            reps: parseInt(m[3]),
          });
          continue;
        }

        //  80% 3x5 или 80% 3×5
        m = line.match(/(\d+)\s*%\s+(\d+)[x×](\d+)/i);
        if (m) {
          configs.push({
            percentage: parseInt(m[1]),
            sets: parseInt(m[2]),
            reps: parseInt(m[3]),
          });
          continue;
        }

        //  6ПМ x5 или 6ПМ ×5
        m = line.match(/(\d+)\s*пм\s*[x×]\s*(\d+)/i);
        if (m) {
          configs.push({
            pm: parseInt(m[1]),
            sets: 1,
            reps: parseInt(m[2]),
          });
          continue;
        }

        //  70% x5 или 70% ×5
        m = line.match(/(\d+)\s*%\s*[x×]\s*(\d+)/i);
        if (m) {
          configs.push({
            percentage: parseInt(m[1]),
            sets: 1,
            reps: parseInt(m[2]),
          });
          continue;
        }
      }

      if (!configs.length) {
        await bot.sendMessage(
          chatId,
          "❌ *Не понял \n\n" +
          "💡 *Примеры:*\n" +
          "▫️ 6ПМ 3×5\n" +
          "▫️ 80% 4×3\n" +
          "▫️ 5ПМ ×8\n\n" +
          `📌 *Нужно ${u.tempDays?.length || 3} строки для дней:* ${u.tempDays?.join(', ') || 'пн, ср, пт'}`,
          { parse_mode: "Markdown" }
        );
        return;
      }//здесь если пользователь ввел дни которые не соответсвуют заданным им же днями

      // Проверяем, что количество конфигов совпадает с количеством дней
      if (u.tempDays && configs.length !== u.tempDays.length) {
        await bot.sendMessage(
          chatId,
          `❌ *Количество не совпадает!*\n\n` +
          `📅 Ты указал ${u.tempDays.length} дней: ${u.tempDays.join(', ')}\n` +
          `📝 А прислал ${configs.length} настроек\n\n` +
          `💡 *Нужно по одной строке на каждый день:*\n` +
          `▫️ ${u.tempDays[0]}: 6ПМ 3×5\n` +
          `▫️ ${u.tempDays[1]}: 80% 4×3\n` +
          `▫️ ${u.tempDays[2]}: 6ПМ ×5`,
          { parse_mode: "Markdown" }
        );
        return;
      }

      setUserData(chatId, {
        tempDayConfigs: configs,
        currentStep: "maxWeight",
      });

      await bot.sendMessage(
        chatId,
        "💪 *Отлично! Теперь укажи свой 1ПМ:*\n\n" +
        "▫️ Пример: 50\n" +
        "▫️ Или: 120\n\n" +
        "💡 *1ПМ* — максимальный вес, который можешь поднять 1 раз",
        { parse_mode: "Markdown" }
      );
      return;
    }

    case "dayPercentSetsReps": {
      const lines = text.split(/\n+/).map((s) => s.trim()).filter(Boolean);
      const configs: DayConfig[] = [];

      for (const line of lines) {
        // Поддерживаем оба варианта: латинскую x и символ ×

        //  6ПМ 3x5 или 6ПМ 3×5
        let m = line.match(/(\d+)\s*пм\s+(\d+)[x×](\d+)/i);
        if (m) {
          configs.push({
            pm: parseInt(m[1]),
            sets: parseInt(m[2]),
            reps: parseInt(m[3]),
          });
          continue;
        }

        //  80% 3x5 или 80% 3×5
        m = line.match(/(\d+)\s*%\s+(\d+)[x×](\d+)/i);
        if (m) {
          configs.push({
            percentage: parseInt(m[1]),
            sets: parseInt(m[2]),
            reps: parseInt(m[3]),
          });
          continue;
        }

        //  6ПМ x5 или 6ПМ ×5
        m = line.match(/(\d+)\s*пм\s*[x×]\s*(\d+)/i);
        if (m) {
          configs.push({
            pm: parseInt(m[1]),
            sets: 1,
            reps: parseInt(m[2]),
          });
          continue;
        }

        //  70% x5 или 70% ×5
        m = line.match(/(\d+)\s*%\s*[x×]\s*(\d+)/i);
        if (m) {
          configs.push({
            percentage: parseInt(m[1]),
            sets: 1,
            reps: parseInt(m[2]),
          });
          continue;
        }
      }

      if (!configs.length) {
        await bot.sendMessage(
          chatId,
          "❌ *Не понял \n\n" +
          "💡 *Для каждого дня укажи в отдельной строке:*\n" +
          "▫️ *Понедельник:* 6ПМ 3×5\n" +
          "▫️ *Среда:* 80% 4×3\n" +
          "▫️ *Пятница:* 6ПМ ×5\n\n" +
          "📝 *Можно использовать x или ×:*\n" +
          "▫️ 6ПМ 3x5 = 6ПМ 3×5\n" +
          "▫️ 80% 4x3 = 80% 4×3",
          { parse_mode: "Markdown" }
        );
        return;
      }

      // Проверяем, что количество конфигов совпадает с количеством дней
      if (u.tempDays && configs.length !== u.tempDays.length) {
        await bot.sendMessage(
          chatId,
          `❌ *Количество не совпадает!*\n\n` +
          `📅 Ты указал ${u.tempDays.length} дней: ${u.tempDays.join(', ')}\n` +
          `📝 А прислал ${configs.length} настроек\n\n` +
          `💡 *Нужно по одной строке на каждый день:*\n` +
          `▫️ ${u.tempDays[0]}: 6ПМ 3×5\n` +
          `▫️ ${u.tempDays[1]}: 80% 4×3\n` +
          `▫️ ${u.tempDays[2]}: 6ПМ ×5`,
          { parse_mode: "Markdown" }
        );
        return;
      }

      setUserData(chatId, {
        tempDayConfigs: configs,
        currentStep: "maxWeight",
      });

      await bot.sendMessage(
        chatId,
        "💪 *Отлично! Теперь укажи свой 1ПМ:*\n\n" +
        "▫️ Пример: 50\n" +
        "▫️ Или: 120\n\n" +
        "💡 *1ПМ* — максимальный вес, который можешь поднять 1 раз",
        { parse_mode: "Markdown" }
      );
      return;
    }

    case "maxWeight": {
      const max = parseInt(text);
      if (isNaN(max) || max <= 0) {
        await bot.sendMessage(
          chatId,
          "❌ *Нужно число!*\n\n" +
          "💡 *Пример:* 50 или 120",
          { parse_mode: "Markdown" }
        );
        return;
      }

      const pd: UserProgramData = u.programData || { weeks: [] };

      // Создаем конфиг для недели
      const weekConfig: ProgramConfig = {};
      if (u.tempDays && u.tempDayConfigs) {
        u.tempDays.forEach((day, index) => {
          if (u.tempDayConfigs && u.tempDayConfigs[index]) {
            weekConfig[day] = [u.tempDayConfigs[index]];
          }
        });//создание готового конфига недели
      }

      pd.weeks.push(weekConfig);
      pd.maxWeight = max;

      setUserData(chatId, {
        programData: pd,
        tempDays: null,
        tempDayConfigs: null,
        currentStep: "addWeek",
      });

      await bot.sendMessage(chatId, generateProgramText(pd), {
        parse_mode: "Markdown",
      });

      await bot.sendMessage(
        chatId,
        "❓ *Добавить ещё одну неделю?*\n\n" +
        "▫️ *Да* — добавлю новую неделю\n" +
        "▫️ *Нет* — завершаю программу",
        { parse_mode: "Markdown" }
      );
      return;
    }

    case "addWeek": {
      if (text.toLowerCase().startsWith("д")) {
        setUserData(chatId, { currentStep: "days" });
        await bot.sendMessage(
          chatId,
          "📅 *Укажи дни для следующей недели:*\n\n" +
          "💡 Пример: пн, ср, пт",
          { parse_mode: "Markdown" }
        );
      } else {
        setUserData(chatId, { currentStep: null });
        await bot.sendMessage(
          chatId,
          "🎉 *ПРОГРАММА СОЗДАНА!*\n\n" +
          "💪 *Удачи в тренировках родной!*",
          { parse_mode: "Markdown" }
        );
      }
      return;
    }
  }
}