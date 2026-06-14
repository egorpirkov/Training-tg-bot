import TelegramBot from "node-telegram-bot-api";
import { getUserData, setUserData } from "../types/UserData";
import { UserProgramData, DayConfig, ProgramConfig, repMaxTable } from "../types/training";
import { saveActiveProgram } from "./db";

async function saveCustomProgramToDb(chatId: number, programData: UserProgramData) {
  const { weeks, maxWeight } = programData;
  if (!weeks || !weeks.length || !maxWeight) return;

  const unifiedWeeks = weeks.map((week, wi) => {
    const daysList = [];
    for (const [dayName, configs] of Object.entries(week)) {
      const exercisesList = configs.map((cfg, idx) => {
        let percentage = cfg.percentage;
        if (!percentage && cfg.pm) {
          percentage = repMaxTable[cfg.pm] || 85;
        }
        const weightKg = Math.round(((percentage || 0) / 100) * maxWeight);
        return {
          name: `Упражнение ${idx + 1}`,
          sets: cfg.sets,
          reps: cfg.reps,
          weightKg: weightKg,
          note: cfg.pm ? `ПМ${cfg.pm}` : `${cfg.percentage}%`
        };
      });
      daysList.push({
        dayName: dayName.toLowerCase(),
        exercises: exercisesList
      });
    }
    return {
      weekIndex: wi,
      days: daysList
    };
  });

  const unifiedProgram = {
    title: "Индивидуальная программа",
    weeks: unifiedWeeks
  };

  await saveActiveProgram(chatId, "Индивидуальная программа", unifiedProgram);
}

function pmToPercentage(pm: number): number {
  return repMaxTable[pm] || 85; 
}

function generateProgramText(programData: UserProgramData) {
  const { weeks, maxWeight } = programData;
  if (!weeks || !weeks.length || !maxWeight) {
    return "🤔 Нет данных для программы.";
  }

  let resp = ` *Вот готовая программа на основе твоего плана* \n`;
  resp += ` *1ПМ: ${maxWeight} кг*\n\n`;

  weeks.forEach((week, wi) => {
    resp += ` *НЕДЕЛЯ ${wi + 1}*\n`;

    for (const [day, configs] of Object.entries(week)) {
      resp += `*${day.toUpperCase()}*\n`;

      configs.forEach((cfg, index) => {
        let percentage: number;
        let description = '';

        if (cfg.percentage) {
          percentage = cfg.percentage;
          description = `${cfg.percentage}%`;
        } else if (cfg.pm) { 
          percentage = pmToPercentage(cfg.pm);
          description = `ПМ${cfg.pm}`;
        } else {
          percentage = 0;
          description = '?';
        }

        const weightKg = Math.round((percentage / 100) * maxWeight);
        resp += `  ${index + 1}. ${weightKg} кг (${description}) - ${cfg.sets}×${cfg.reps}\n`;
      });
      resp += `\n`;
    }
  });

  return resp;
}

function parseSegment(segment: string): DayConfig | null {
  segment = segment.trim().toLowerCase();

  // Паттерн 1 подходы x вес/повторения, например 2x60%/5 или 2x6пм/5
  let m = segment.match(/^(\d+)\s*[x×х]\s*(\d+)\s*(%|пм)\s*\/\s*(\d+)$/i);
  if (m) {
    const sets = parseInt(m[1]);
    const val = parseInt(m[2]);
    const isPercent = m[3] === '%';
    const reps = parseInt(m[4]);
    return isPercent ? { percentage: val, sets, reps } : { pm: val, sets, reps };
  }

  // Паттерн 2 вес/повторения (1 подход), например 40%/10 или 6пм/5
  m = segment.match(/^(\d+)\s*(%|пм)\s*\/\s*(\d+)$/i);
  if (m) {
    const val = parseInt(m[1]);
    const isPercent = m[2] === '%';
    const reps = parseInt(m[3]);
    return isPercent ? { percentage: val, sets: 1, reps } : { pm: val, sets: 1, reps };
  }

  // Паттерн 3 вес подходы x повторения, например 80% 3x5 или 6пм 3x5
  m = segment.match(/^(\d+)\s*(%|пм)\s+(\d+)[x×х](\d+)/i);
  if (m) {
    const val = parseInt(m[1]);
    const isPercent = m[2] === '%';
    const sets = parseInt(m[3]);
    const reps = parseInt(m[4]);
    return isPercent ? { percentage: val, sets, reps } : { pm: val, sets, reps };
  }

  // Паттерн 4 вес x повторения (1 подход), например 70% x5 или 6пм x5
  m = segment.match(/^(\d+)\s*(%|пм)\s*[x×х]\s*(\d+)$/i);
  if (m) {
    const val = parseInt(m[1]);
    const isPercent = m[2] === '%';
    const reps = parseInt(m[3]);
    return isPercent ? { percentage: val, sets: 1, reps } : { pm: val, sets: 1, reps };
  }

  return null;
}

export async function startProgramCreation(bot: TelegramBot, chatId: number) {
  setUserData(chatId, {
    programData: { weeks: [] },
    currentStep: "days",
  });

  await bot.sendMessage(
    chatId,
    " *Рассчитаем тебе план на основе твоей программы!*\n\n" +
    " *В какие дни тренируешься?*\n" +
    "  Примеры ввода:\n" +
    "  - пн ср пт\n" +
    "  - вт, чт, сб\n" +
    "  - понедельник, среда, пятница",
    { parse_mode: "Markdown" }
  );
}

// Обработка шагов программы
export async function handleProgramCreationMessage(
  bot: TelegramBot,
  chatId: number,
  text: string
) {

  text = text.replace(/[\u200b\u200c\u200d\ufeff]/g, "");

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
        .split(/[,\s\n;]+/)
        .map((s) => s.trim())
        .filter(Boolean)
        .map(normDay)
        .filter((d) => ["пн", "вт", "ср", "чт", "пт", "сб", "вс"].includes(d));

      if (!days.length) {
        await bot.sendMessage(
          chatId,
          "🤔 *Не понял дни*\n\n" +
          " *Примеры ввода:*\n" +
          " пн ср пт\n" +
          " вт, чт, сб\n" +
          " понедельник, среда, пятница",
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
        "📝 *Теперь укажи нагрузки для каждого дня :*\n\n" +
        ` *Для каждого из дней (${days.join(', ')}) введи ПМ/процент, подходы и повторения:*\n` +
        "   Примеры форматов:\n" +
        "   - 80% 4×3 \n" +
        "   - 6ПМ 3×5 \n" +
        "   - 40%/\u200B10 ; 2x60%/\u200B5 ; 3x72%/\u200B5 (или более обьемные тренировки)\n\n" +
        " *Каждый день пиши с новой строки (через Enter)*\n\n",
        { parse_mode: "Markdown" }
      );
      return;
    }

    case "dayPercentSetsReps": {
      const lines = text.split(/\n+/).map((s) => s.trim()).filter(Boolean);
      const configs: DayConfig[][] = [];

      for (let line of lines) {

        line = line.replace(/^(пн|вт|ср|чт|пт|сб|вс|понедельник|вторник|среда|четверг|пятница|суббота|воскресенье)\s*[:\-–-]?\s*/i, "");

        const segments = line.split(/[;\n]+/).map((s) => s.trim()).filter(Boolean);
        const dayConfigs: DayConfig[] = [];

        for (const segment of segments) {
          const parsed = parseSegment(segment);
          if (parsed) {
            dayConfigs.push(parsed);
          }
        }

        if (dayConfigs.length > 0) {
          configs.push(dayConfigs);
        }
      }

      if (!configs.length) {
        await bot.sendMessage(
          chatId,
          "🤔 *Не понял*\n\n" +
          " *Примеры:*\n" +
          "▫️ 6ПМ 3×5\n" +
          "▫️ 80% 4×3\n" +
          "▫️ 40%/\u200B10 ; 50%/\u200B5 ; 2x60%/\u200B5 ; 3x72%/\u200B5\n\n" +
          `*Нужно ${u.tempDays?.length || 3} строки для дней:* ${u.tempDays?.join(', ') || 'пн, ср, пт'}`,
          { parse_mode: "Markdown" }
        );
        return;
      }

      // Проверяем, что количество конфигов совпадает с количеством дней
      if (u.tempDays && configs.length !== u.tempDays.length) {
        let helpText = '';
        u.tempDays.forEach((day, idx) => {
          const sample = idx === 0 ? "40%/\u200B10 ; 2x60%/\u200B5" : idx === 1 ? "80% 4×3" : "6ПМ ×5";
          helpText += `▫️ ${day.toUpperCase()}: ${sample}\n`;
        });

        await bot.sendMessage(
          chatId,
          `🤔 *Количество не совпадает!*\n\n` +
          ` Ты выбрал ${u.tempDays.length} дня/дней: *${u.tempDays.join(', ')}*\n` +
          ` А прислал ${configs.length} нагрузок.\n\n` +
          ` *Впиши нагрузку для каждого из дней (по одной строке на день):*\n` +
          helpText,
          { parse_mode: "Markdown" }
        );
        return;
      }

      // Ищем первый встретившийся ПМ в конфигурациях
      let targetPm: number | null = null;
      for (const dayConfigs of configs) {
        for (const cfg of dayConfigs) {
          if (cfg.pm) {
            targetPm = cfg.pm;
            break;
          }
        }
        if (targetPm) break;
      }

      const pd: UserProgramData = u.programData || { weeks: [] };
      if (pd.maxWeight) {
        const weekConfig: ProgramConfig = {};
        if (u.tempDays) {
          u.tempDays.forEach((day, index) => {
            if (configs[index]) {
              weekConfig[day] = configs[index];
            }
          });
        }
        pd.weeks.push(weekConfig);

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
          " 🤔*Добавить ещё одну неделю?*\n\n" +
          " *Да* - добавлю новую неделю\n" +
          " *Нет* - завершаю программу",
          { parse_mode: "Markdown" }
        );
        return;
      }

      setUserData(chatId, {
        tempDayConfigs: configs,
        currentStep: "maxWeight",
      });

      if (targetPm && targetPm > 1) {
        await bot.sendMessage(
          chatId,
          ` *Отлично! Теперь укажи свой ${targetPm}ПМ:*\n\n` +
          ` Пример: 50кг\n` +
          ` Или: 120кг\n\n` +
          ` *${targetPm}ПМ* - максимальный вес, которую ты можешь выполнить на ${targetPm} раз`,
          { parse_mode: "Markdown" }
        );
      } else {
        await bot.sendMessage(
          chatId,
          " *Отлично! Теперь укажи свой 1ПМ:*\n\n" +
          " Пример: 50кг\n" +
          " Или: 120кг\n\n" +
          " *1ПМ* - максимальный вес, которую ты можешь выполнить на 1 раз",
          { parse_mode: "Markdown" }
        );
      }
      return;
    }

    case "maxWeight": {
      const max = parseInt(text);
      if (isNaN(max) || max <= 0) {
        await bot.sendMessage(
          chatId,
          "🤔 *Нужно число!*\n\n" +
          " *Пример:* 50 или 120",
          { parse_mode: "Markdown" }
        );
        return;
      }

      let targetPm: number | null = null;
      if (u.tempDayConfigs) {
        for (const dayConfigs of u.tempDayConfigs) {
          if (Array.isArray(dayConfigs)) {
            for (const cfg of dayConfigs) {
              if (cfg.pm) {
                targetPm = cfg.pm;
                break;
              }
            }
          }
          if (targetPm) break;
        }
      }

      const pd: UserProgramData = u.programData || { weeks: [] };

      const weekConfig: ProgramConfig = {};
      if (u.tempDays && u.tempDayConfigs) {
        u.tempDays.forEach((day, index) => {
          if (u.tempDayConfigs && u.tempDayConfigs[index]) {
            const val = u.tempDayConfigs[index];
            if (Array.isArray(val)) {
              weekConfig[day] = val;
            } else {
              weekConfig[day] = [val as any];
            }
          }
        });
      }

      pd.weeks.push(weekConfig);

      if (targetPm && targetPm > 1) {
        const pct = pmToPercentage(targetPm);
        pd.maxWeight = Math.round(max / (pct / 100));
      } else {
        pd.maxWeight = max;
      }

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
        " 🤔 *Добавить ещё одну неделю?*\n\n" +
        " *Да* - добавлю новую неделю\n" +
        " *Нет* - завершаю программу",
        { parse_mode: "Markdown" }
      );
      return;
    }

    case "addWeek": {
      if (text.toLowerCase().startsWith("д")) {
        setUserData(chatId, { currentStep: "days" });
        await bot.sendMessage(
          chatId,
          " *Укажи дни для следующей недели:*\n\n" +
          " Пример: пн, ср, пт",
          { parse_mode: "Markdown" }
        );
      } else {
        setUserData(chatId, { currentStep: null });

        if (u.programData) {
          saveCustomProgramToDb(chatId, u.programData).catch((err) => {
            console.error("Ошибка при сохранении кастомной программы в БД:", err);
          });
        }

        await bot.sendMessage(
          chatId,
          "🎉 *ПРОГРАММА СОЗДАНА!*\n\n" +
          " *Удачи в тренировках!*",
          { parse_mode: "Markdown" }
        );
      }
      return;
    }
  }
}