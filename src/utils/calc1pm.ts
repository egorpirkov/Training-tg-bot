import TelegramBot from "node-telegram-bot-api";
import { getUserData, setUserData } from "../types/UserData";

export function get1PMFactor(reps: number): number {
  if (reps <= 1) return 1.0;
  if (reps <= 10) {
    // Формула Бржицки 
    return 1 / (1.0278 - 0.0278 * reps);
  }
  // Для многоповторок Ломбарди
  return 1.059 * Math.pow(reps, 0.10);
}

export function calculate1PM(weight: number, reps: number): number {
  return weight * get1PMFactor(reps);
}

export function calculateWeighted1PM(bw: number, extra: number, reps: number): { total1PM: number; extra1PM: number } {
  const totalWeight = bw + extra;
  const total1PM = totalWeight * get1PMFactor(reps);
  const extra1PM = total1PM - bw;
  return { total1PM, extra1PM: Math.max(0, extra1PM) };
}

const exerciseNames: Record<string, string> = {
  bench: "Жим лёжа",
  pullups: "Подтягивания с доп. весом",
  dips: "Брусья с доп. весом",
  arm_bicep: "Кисть / Арм движения (Пронатор, Подьем на луч) / Бицепс"
};

export async function startCalc1pm(bot: TelegramBot, chatId: number) {
  setUserData(chatId, {
    currentStep: null,
    calc1pm_exercise: null,
    calc1pm_bw: undefined,
    calc1pm_extra: undefined,
    calc1pm_weight: undefined,
    calc1pm_reps: undefined
  });

  const keyboard = {
    inline_keyboard: [
      [{ text: " Жим лёжа", callback_data: "calc1pm_type_bench" }],
      [{ text: " Подтягивания с доп. весом", callback_data: "calc1pm_type_pullups" }],
      [{ text: " Брусья с доп. весом", callback_data: "calc1pm_type_dips" }],
      [{ text: " Кисть / Подьем на луч / Бицепс / Пронатор", callback_data: "calc1pm_type_arm_bicep" }]
    ]
  };

  await bot.sendMessage(
    chatId,
    `*Калькулятор 1ПМ (Одноповторного максимума)* \n\n` +
    `Выбери упражнение, для которого ты хочешь рассчитать свой максимум на 1 раз (1ПМ):`,
    {
      parse_mode: "Markdown",
      reply_markup: keyboard
    }
  );
}

export async function handleCalc1pmCallback(bot: TelegramBot, query: TelegramBot.CallbackQuery) {
  const chatId = query.message?.chat.id;
  const data = query.data;
  if (!chatId || !data) return;

  if (data.startsWith("calc1pm_type_")) {
    const exercise = data.replace("calc1pm_type_", "") as any;
    setUserData(chatId, { calc1pm_exercise: exercise });
    await bot.answerCallbackQuery(query.id).catch(() => { });

    if (exercise === "pullups" || exercise === "dips") {
      setUserData(chatId, { currentStep: "calc1pm_bw" });
      await bot.sendMessage(chatId, "*Шаг 1 из 3: Введи собственный вес тела* (в кг):\n\nПример: 80кг или 72.5кг", {
        parse_mode: "Markdown"
      });
    } else {
      setUserData(chatId, { currentStep: "calc1pm_weight" });
      await bot.sendMessage(chatId, "*Шаг 1 из 2: Введи рабочий вес на снаряде* (в кг):\n\nПример: 100кг или 62.5кг", {
        parse_mode: "Markdown"
      });
    }
  }
}

export async function handleCalc1pmMessage(bot: TelegramBot, chatId: number, text: string) {
  const u = getUserData(chatId);
  const step = u.currentStep;
  const exercise = u.calc1pm_exercise;

  if (!step || !exercise) return;

  const value = parseFloat(text.replace(",", "."));
  if (isNaN(value) || value < 0) {
    await bot.sendMessage(chatId, "🤔 *Введи корректное число* (например: 70 или 85.5):", {
      parse_mode: "Markdown"
    });
    return;
  }

  if (step === "calc1pm_bw") {
    if (value <= 30 || value > 250) {
      await bot.sendMessage(chatId, "🤔 *Введи реальный вес тела* (от 30 до 250 кг):", { parse_mode: "Markdown" });
      return;
    }
    setUserData(chatId, { calc1pm_bw: value, currentStep: "calc1pm_extra" });
    const actionWord = exercise === "pullups" ? "подтягиваешься" : "отжимаешься";
    await bot.sendMessage(chatId, `*Шаг 2 из 3: Введи вес доп. веса* (в кг):\n\nЕсли ${actionWord} без веса, напиши 0.`, {
      parse_mode: "Markdown"
    });
    return;
  }

  if (step === "calc1pm_extra") {
    if (value > 200) {
      await bot.sendMessage(chatId, "🤔 *Введи реальный доп. вес* (до 200 кг):", { parse_mode: "Markdown" });
      return;
    }
    setUserData(chatId, { calc1pm_extra: value, currentStep: "calc1pm_reps" });
    
    let promptMsg = "";
    if (value === 0) {
      if (exercise === "pullups") {
        promptMsg = "*Шаг 3 из 3: Введи количество повторений*\n\nВведи сколько раз максимум было подтягиваний:";
      } else {
        promptMsg = "*Шаг 3 из 3: Введи количество повторений*\n\nВведи сколько раз максимум было отжиманий на брусьях:";
      }
    } else {
      if (exercise === "pullups") {
        promptMsg = `*Шаг 3 из 3: Введи количество повторений*\n\nВведи сколько раз максимум подтягиваешься с этим весом (+${value} кг):`;
      } else {
        promptMsg = `*Шаг 3 из 3: Введи количество повторений*\n\nВведи сколько раз максимум отжимаешься с этим весом (+${value} кг):`;
      }
    }

    await bot.sendMessage(chatId, promptMsg, {
      parse_mode: "Markdown"
    });
    return;
  }

  if (step === "calc1pm_weight") {
    if (value < 0 || value > 600) {
      await bot.sendMessage(chatId, "🤔 *Введи реальный вес* (от 0 до 600 кг):", { parse_mode: "Markdown" });
      return;
    }
    setUserData(chatId, { calc1pm_weight: value, currentStep: "calc1pm_reps" });
    await bot.sendMessage(chatId, `*Шаг 2 из 2: Введи количество повторений*:`, {
      parse_mode: "Markdown"
    });
    return;
  }

  if (step === "calc1pm_reps") {
    const reps = Math.round(value);
    if (reps <= 0 || reps > 200) {
      await bot.sendMessage(chatId, "🤔 *Введи реальное количество повторений* (от 1 до 200):", { parse_mode: "Markdown" });
      return;
    }

    setUserData(chatId, {
      currentStep: null,
      calc1pm_exercise: null
    });

    const exName = exerciseNames[exercise] || "Упражнение";

    if (exercise === "pullups" || exercise === "dips") {
      const bw = u.calc1pm_bw || 80;
      const extra = u.calc1pm_extra ?? 0;
      const { total1PM, extra1PM } = calculateWeighted1PM(bw, extra, reps);

      const rTotal = Math.round(total1PM * 10) / 10;
      const rExtra = Math.round(extra1PM * 10) / 10;

      const actionVerb = exercise === "pullups" ? "подтягиваешься с доп. весом" : "отжимаешься на брусьях с доп. весом";

      let resultText = `*Результат расчета 1ПМ*\n\n` +
        `*Упражнение:* ${exName}\n` +
        `*Вес тела:* ${bw} кг\n` +
        `*Доп. вес:* ${extra} кг\n` +
        `*Повторения:* ${reps}\n\n` +
        `*Твой расчетный максимум (1ПМ):*\n` +
        `• *Предположительно ты ${actionVerb} на 1 повтор:* ${rExtra > 0 ? `+${rExtra}` : `${rExtra}`} кг\n` +
        `• *Суммарный вес (тело + доп):* ${rTotal} кг\n`;

      if (reps > 30) {
        resultText += `\n*Примечание:* Так как ты сделал более 30 повторений, расчет является примерным. При большом числе повторений решающую роль играет мышечная выносливость и твои наработанные митохондрии, а не максимальная сила.`;
      }

      await bot.sendMessage(chatId, resultText, { parse_mode: "Markdown" });
    } else {
      const w = u.calc1pm_weight ?? 0;
      const total1PM = calculate1PM(w, reps);
      const rTotal = Math.round(total1PM * 10) / 10;

      const verb = exercise === "bench" ? "пожмешь" : "осилишь";

      let resultText = `*Результат расчета 1ПМ*\n\n` +
        `*Упражнение:* ${exName}\n` +
        `*Рабочий вес:* ${w} кг\n` +
        `*Повторения:* ${reps}\n\n` +
        `*Ты примерно ${verb} на раз (1ПМ):* *${rTotal} кг*\n`;

      if (reps > 30) {
        resultText += `\n*Примечание:* Так как ты сделал более 30 повторений, расчет является примерным. При большом числе повторений решающую роль играет мышечная выносливость и твои наработанные митохондрии, а не максимальная сила.`;
      }

      await bot.sendMessage(chatId, resultText, { parse_mode: "Markdown" });
    }
  }
}
