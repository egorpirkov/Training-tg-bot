import TelegramBot from "node-telegram-bot-api";
import { getUserData, setUserData } from "../types/UserData";
import path from "path";
import fs from "fs";

// округление весов
function roundWeight(w: number): number {
  const floor = Math.floor(w);
  const diff = w - floor;
  if (Math.abs(diff - 0.5) < 0.01) {
    return w;
  }
  return Math.round(w);
}

const AUTHOR_NOTE = "\n💡 *Примечание от автора:* все эти программы были лично проверены моим собственным телом на практике и они рабочие,если будут программы которые по вашему рабочие пишите в личку используя команду /help\n";


interface ExerciseSet {
  pct: number;
  sets: number;
  reps: number | string;
  note?: string;
}

interface PlanTemplate {
  name: string;
  description: string;
  weightPrompt: string;
  weightType: '1pm' | '8pm' | '6-7pm';
  photo?: string;
  generate: (weight: number) => string;
}

const templates: Record<string, PlanTemplate> = {
  pullups: {
    name: "Подтягивания с доп. весом(пул)",
    description: ` *Программа: Подтягивания с доп. весом(пул)*\n` +
      ` Длительность: 9 недель (3 блока по 3 недели)\n` +
      ` Прогрессия: тройная прогрессия на основе твоего 8ПМ (+2.5 кг / +5 кг)\n` +
      ` Тренировки: Пн, Ср, Пт\n\n` +
      `*Результат: увеличится дополнительный рабочий вес в подтягиваниях с доп. весом. *`,
    weightPrompt: " *Укажи свой рабочий вес на 8ПМ* (вес,навесив на себя которую,ты сможешь подтянуться на 8 повторении):\n\n Пример: 15кг",
    weightType: '8pm',
    photo: path.join(process.cwd(), "src", "assets", "PullUps.webp"),
    generate: (weight: number) => {
      let resp = `*Твоя программа: Подтягивания с доп. весом*\n`;
      resp += `*Твой исходный 8ПМ: ${weight} кг*\n`;
      resp += AUTHOR_NOTE + `\n`;

      // Блок 1
      const w1 = roundWeight(weight);
      resp += `🟢 *БЛОК 1 (Недели 1–3) — Рабочий вес: ${w1} кг*\n\n`;
      resp += ` *Неделя 1:*\n  Пн, Ср, Пт — 3 × 5\n\n`;
      resp += ` *Неделя 2:*\n  Пн, Ср, Пт — 4 × 5\n\n`;
      resp += ` *Неделя 3:*\n  Пн, Ср, Пт — 4 × 6\n\n`;
      resp += `-----------------\n\n`;

      // Блок 2
      const w2 = roundWeight(weight + 2.5);
      resp += `🟡 *БЛОК 2 (Недели 4–6) — Рабочий вес: ${w2} кг*\n\n`;
      resp += ` *Неделя 4:*\n  Пн, Ср, Пт — 3 × 5\n\n`;
      resp += ` *Неделя 5:*\n  Пн, Ср, Пт — 4 × 5\n\n`;
      resp += ` *Неделя 6:*\n  Пн, Ср, Пт — 4 × 6\n\n`;
      resp += `-----------------\n\n`;

      // Блок 3
      const w3 = roundWeight(weight + 5);
      resp += `🔴 *БЛОК 3 (Недели 7–9) — Рабочий вес: ${w3} кг*\n\n`;
      resp += ` *Неделя 7:*\n  Пн, Ср, Пт — 3 × 5\n\n`;
      resp += ` *Неделя 8:*\n  Пн, Ср, Пт — 4 × 5\n\n`;
      resp += ` *Неделя 9:*\n  Пн, Ср, Пт — 4 × 6\n`;

      return resp;
    }
  },

  bench_dips: {
    name: "Жим / Брусья с доп. весом(выбери только 1 движение на всю программу)",
    description: ` *Программа для Жима или для Брусья с доп. весом*\n` +
      ` Длительность: 6 недель\n` +
      ` Прогрессия: волнообразная от 40% до 100% с взрывными днями\n` +
      ` Тренировки: Пн, Ср, Пт\n\n` +
      `*Будет составлена подробная программа на 6 недель для жима штанги лежа или отжиманий на брусьях с доп. весом.*` +
      `*Результат: увеличится силовые показатели на жиме/брусьях смотря что вы выбрали.*`,
    weightPrompt: " *Укажи свой 1ПМ* (твой одноповторный максимум):\n\n Пример: 75кг",
    weightType: '1pm',
    photo: path.join(process.cwd(), "src", "assets", "Bench.webp"),
    generate: (weight: number) => {
      let resp = `*Твоя программа: Жим / Брусья с доп. весом*\n`;
      resp += `*Твой 1ПМ: ${weight} кг*\n`;
      resp += AUTHOR_NOTE + `\n`;

      const weeksData: Record<number, Record<string, ExerciseSet[]>> = {
        1: {
          пн: [{ pct: 40, sets: 1, reps: 10 }, { pct: 50, sets: 1, reps: 5 }, { pct: 60, sets: 2, reps: 5 }, { pct: 72, sets: 3, reps: 5 }],
          ср: [{ pct: 40, sets: 1, reps: 10 }, { pct: 50, sets: 1, reps: 5 }, { pct: 60, sets: 1, reps: 5 }, { pct: 72, sets: 2, reps: 5 }, { pct: 75, sets: 2, reps: 6 }, { pct: 80, sets: 2, reps: 3 }, { pct: 85, sets: 3, reps: 2 }],
          пт: [{ pct: 40, sets: 1, reps: 10 }, { pct: 50, sets: 1, reps: 5 }, { pct: 60, sets: 1, reps: 5 }, { pct: 72, sets: 4, reps: 5 }]
        },
        2: {
          пн: [{ pct: 40, sets: 1, reps: 10 }, { pct: 50, sets: 1, reps: 5 }, { pct: 60, sets: 7, reps: 3, note: "(взрыв)" }],
          ср: [{ pct: 40, sets: 1, reps: 10 }, { pct: 50, sets: 1, reps: 5 }, { pct: 60, sets: 1, reps: 5 }, { pct: 72, sets: 1, reps: 5 }, { pct: 75, sets: 2, reps: 4 }, { pct: 80, sets: 2, reps: 3 }, { pct: 85, sets: 6, reps: 2 }],
          пт: [{ pct: 40, sets: 1, reps: 10 }, { pct: 50, sets: 1, reps: 5 }, { pct: 60, sets: 1, reps: 5 }, { pct: 72, sets: 6, reps: 5 }]
        },
        3: {
          пн: [{ pct: 40, sets: 1, reps: 10 }, { pct: 50, sets: 1, reps: 5 }, { pct: 60, sets: 7, reps: 3, note: "(взрыв)" }],
          ср: [{ pct: 40, sets: 1, reps: 10 }, { pct: 50, sets: 1, reps: 5 }, { pct: 60, sets: 1, reps: 5 }, { pct: 72, sets: 1, reps: 5 }, { pct: 75, sets: 2, reps: 5 }, { pct: 80, sets: 2, reps: 4 }, { pct: 85, sets: 2, reps: 3 }, { pct: 90, sets: 3, reps: 2 }],
          пт: [{ pct: 40, sets: 1, reps: 10 }, { pct: 50, sets: 1, reps: 5 }, { pct: 60, sets: 2, reps: 5 }, { pct: 72, sets: 2, reps: 5 }, { pct: 75, sets: 4, reps: 5 }, { pct: 72, sets: 1, reps: 5 }, { pct: 60, sets: 1, reps: 5 }]
        },
        4: {
          пн: [{ pct: 40, sets: 1, reps: 10 }, { pct: 50, sets: 1, reps: 5 }, { pct: 60, sets: 1, reps: 5 }, { pct: 62, sets: 7, reps: 3, note: "(взрыв)" }],
          ср: [{ pct: 40, sets: 1, reps: 10 }, { pct: 50, sets: 1, reps: 5 }, { pct: 60, sets: 1, reps: 5 }, { pct: 75, sets: 2, reps: 5 }, { pct: 80, sets: 2, reps: 4 }, { pct: 85, sets: 1, reps: 3 }, { pct: 90, sets: 3, reps: 2 }, { pct: 80, sets: 1, reps: 4 }, { pct: 75, sets: 1, reps: 5 }],
          пт: [{ pct: 40, sets: 1, reps: 10 }, { pct: 50, sets: 1, reps: 5 }, { pct: 60, sets: 1, reps: 5 }, { pct: 72, sets: 1, reps: 5 }, { pct: 75, sets: 4, reps: 5 }]
        },
        5: {
          пн: [{ pct: 40, sets: 1, reps: 10 }, { pct: 50, sets: 1, reps: 5 }, { pct: 60, sets: 1, reps: 5 }, { pct: 65, sets: 7, reps: 3, note: "(взрыв)" }],
          ср: [{ pct: 40, sets: 1, reps: 10 }, { pct: 50, sets: 1, reps: 5 }, { pct: 65, sets: 1, reps: 5 }, { pct: 75, sets: 1, reps: 5 }, { pct: 80, sets: 1, reps: 3 }, { pct: 85, sets: 1, reps: 2 }, { pct: 90, sets: 1, reps: 2 }, { pct: 95, sets: 1, reps: 2 }, { pct: 100, sets: 1, reps: "1-2" }],
          пт: [{ pct: 40, sets: 1, reps: 10 }, { pct: 50, sets: 1, reps: 5 }, { pct: 60, sets: 1, reps: 5 }, { pct: 75, sets: 5, reps: 5 }]
        },
        6: {
          пн: [{ pct: 40, sets: 1, reps: 10 }, { pct: 50, sets: 1, reps: 5 }, { pct: 60, sets: 1, reps: 5 }, { pct: 67, sets: 7, reps: 3, note: "(взрыв)" }],
          ср: [{ pct: 40, sets: 1, reps: 10 }, { pct: 55, sets: 1, reps: 5 }, { pct: 60, sets: 1, reps: 5 }, { pct: 75, sets: 1, reps: 5 }, { pct: 80, sets: 1, reps: 4 }, { pct: 85, sets: 1, reps: 3 }, { pct: 90, sets: 2, reps: 2 }, { pct: 93, sets: 3, reps: 2 }],
          пт: [{ pct: 40, sets: 1, reps: 10 }, { pct: 55, sets: 1, reps: 5 }, { pct: 65, sets: 2, reps: 5 }, { pct: 72, sets: 2, reps: 5 }, { pct: 80, sets: 6, reps: 4 }]
        }
      };

      for (let w = 1; w <= 6; w++) {
        resp += `*НЕДЕЛЯ ${w}*\n`;
        const days = weeksData[w];
        for (const [dayName, dayExs] of Object.entries(days)) {
          resp += `*${dayName.toUpperCase()}*\n`;
          dayExs.forEach((ex, idx) => {
            const wKg = roundWeight((ex.pct / 100) * weight);
            const noteStr = ex.note ? ` ${ex.note}` : "";
            const setsReps = typeof ex.reps === "string" ? `${ex.sets}×${ex.reps}` : (ex.sets > 1 ? `${ex.sets}×${ex.reps}` : `${ex.reps}`);
            resp += `  ${idx + 1}. ${wKg} кг (${ex.pct}%) — ${setsReps}${noteStr}\n`;
          });
          resp += `\n`;
        }
      }

      return resp;
    }
  },

  wrists: {
    name: "Скручивание на кисть на одну руку/любые арм движения(подьем на луч,пронатор,супинатор и т.д) ",
    description: `*Программа: Скручивание на кисть на одну руку/любые арм движения*\n` +
      ` Длительность: 6 недель\n` +
      ` Нагрузка: фиксированный вес 6-7 ПМ со сменой подходов и повторений\n` +
      ` Тренировки: Треня 1, Треня 2, Треня 3\n\n` +
      `*Будет составлена программа на 6 недель который увеличит вес которую вы будете скручивать на кисть или другие арм движение.*`,
    weightPrompt: "*Укажи свой рабочий вес на 6-7 ПМ* (вес,которую ты можешь выполнить макс. на 6-7 повторении):\n\n Пример: 30кг",
    weightType: '6-7pm',
    photo: path.join(process.cwd(), "src", "assets", "Wrist.avif"),
    generate: (weight: number) => {
      let resp = `*Твоя программа: Скручивание на кисть на одну руку/любые арм движения*\n`;
      resp += `*Твой рабочий вес (6-7 ПМ): ${weight} кг*\n`;
      resp += AUTHOR_NOTE + `\n`;

      const formatReps = (r: string) => {
        if (r.includes('x') || r.includes('×')) return r.replace(/x/g, '×');
        if (r.includes(',')) return `подходы: ${r} повторений`;
        return r;
      };

      const weeksData: Record<number, string[]> = {
        1: ["3,4,3,3", "4x2", "3x4,1x3"],
        2: ["3,4,3,4,3", "6x2", "5x4"],
        3: ["3,4,3,4", "5x2", "4x4"],
        4: ["3,4,3,4,3,4", "8x2", "6x4"],
        5: ["3,4,3,4,3,2", "7x2", "5x4,1x3"],
        6: ["3,4,3", "3x2", "3x4"]
      };

      for (let w = 1; w <= 6; w++) {
        resp += `*НЕДЕЛЯ ${w}*\n`;
        const days = weeksData[w];
        resp += `*Треня 1*\n  1. ${weight} кг (6-7 ПМ) — ${formatReps(days[0])}\n\n`;
        resp += `*Треня 2*\n  1. ${weight} кг (6-7 ПМ) — ${formatReps(days[1])}\n\n`;
        resp += `*Треня 3*\n  1. ${weight} кг (6-7 ПМ) — ${formatReps(days[2])}\n`;
        resp += `\n-----------------\n\n`;
      }

      return resp;
    }
  }
};

export async function startTrainingPlanCreation(bot: TelegramBot, chatId: number) {
  setUserData(chatId, {
    selectedPlan: null,
    currentStep: null
  });

  const keyboard = {
    inline_keyboard: [
      [{ text: " Жим / Брусья с доп. весом", callback_data: "plan_bench_dips" }],
      [{ text: " Подтягивания с доп. весом", callback_data: "plan_pullups" }],
      [{ text: " Скручивание на кисть на одну руку/любые арм движения", callback_data: "plan_wrists" }],
      [{ text: " Программа №4 (Скоро)", callback_data: "plan_locked" }],
      [{ text: " Программа №5 (Скоро)", callback_data: "plan_locked" }]
    ]
  };

  await bot.sendMessage(
    chatId,
    `*Каталог готовых программ тренировок для увеличения веса на штанге*\n` +
    AUTHOR_NOTE + `\n` +
    `Выбери программу из меню ниже:`,
    {
      parse_mode: "Markdown",
      reply_markup: keyboard
    }
  );
}

export async function handlePlanSelection(bot: TelegramBot, query: TelegramBot.CallbackQuery) {
  const chatId = query.message?.chat.id;
  const data = query.data;
  if (!chatId || !data) return;

  if (data === "plan_locked") {
    await bot.answerCallbackQuery(query.id, {
      text: " Эта программа в процессе подготовки и появится позже(когда автор проверит на себе)",
      show_alert: true
    });
    return;
  }

  if (data.startsWith("plan_")) {
    const planKey = data.replace("plan_", "");
    const template = templates[planKey];
    if (!template) return;

    await bot.answerCallbackQuery(query.id);

    const keyboard = {
      inline_keyboard: [
        [
          { text: " Выбрать эту программу", callback_data: `confirm_plan_${planKey}` },
          { text: " Назад", callback_data: "cancel_plan" }
        ]
      ]
    };

    if (template.photo && fs.existsSync(template.photo) && fs.statSync(template.photo).size > 100) {
      await bot.sendPhoto(chatId, fs.createReadStream(template.photo), {
        caption: template.description,
        parse_mode: "Markdown",
        reply_markup: keyboard
      });
    } else {
      await bot.sendMessage(chatId, template.description, {
        parse_mode: "Markdown",
        reply_markup: keyboard
      });
    }
    return;
  }

  if (data === "cancel_plan") {
    await bot.answerCallbackQuery(query.id);
    await startTrainingPlanCreation(bot, chatId);
    return;
  }

  if (data.startsWith("confirm_plan_")) {
    const planKey = data.replace("confirm_plan_", "");
    const template = templates[planKey];
    if (!template) return;

    await bot.answerCallbackQuery(query.id);

    setUserData(chatId, {
      selectedPlan: planKey as any,
      currentStep: "trainingPlan_maxWeight"
    });

    await bot.sendMessage(chatId, template.weightPrompt, {
      parse_mode: "Markdown"
    });
  }
}

export async function handleTrainingPlanMessage(bot: TelegramBot, chatId: number, text: string) {
  const u = getUserData(chatId);
  if (u.currentStep !== "trainingPlan_maxWeight" || !u.selectedPlan) return;

  const weight = parseFloat(text.replace(",", "."));
  if (isNaN(weight) || weight <= 0) {
    await bot.sendMessage(
      chatId,
      "🤔 *Не понял вес*\n\n" +
      " Введи корректное число (например, 50 или 17.5):",
      { parse_mode: "Markdown" }
    );
    return;
  }

  const template = templates[u.selectedPlan];
  if (!template) return;

  setUserData(chatId, {
    currentStep: null,
    selectedPlan: null
  });

  const programText = template.generate(weight);

  await bot.sendMessage(chatId, programText, {
    parse_mode: "Markdown"
  });

  await bot.sendMessage(
    chatId,
    "🎉 *ПРОГРАММА СОЗДАНА!*\n\n" +
    " *Удачи в тренировках*",
    { parse_mode: "Markdown" }
  );
}
