import TelegramBot from "node-telegram-bot-api";
import { getUserData, setUserData } from "../types/UserData";
import path from "path";
import fs from "fs";
import { saveActiveProgram } from "./db";

// Вспомогательная функция для генерации структуры и сохранения готового шаблона программы в БД
async function saveTemplateProgramToDb(chatId: number, planKey: string, weight: number) {
  const unifiedWeeks: any[] = [];
  
  if (planKey === "pullups") {
    for (let w = 1; w <= 9; w++) {
      const block = Math.floor((w - 1) / 3);
      const blockWeight = roundWeight(weight + block * 2.5);
      const weekInBlock = (w - 1) % 3 + 1;
      const sets = weekInBlock === 1 ? 3 : 4;
      const reps = weekInBlock === 3 ? 6 : 5;
      
      const dayExercises = [{
        name: "Подтягивания с доп. весом",
        sets: sets,
        reps: reps,
        weightKg: blockWeight,
        note: `Блок ${block + 1}`
      }];

      unifiedWeeks.push({
        weekIndex: w - 1,
        days: [
          { dayName: "пн", exercises: dayExercises },
          { dayName: "ср", exercises: dayExercises },
          { dayName: "пт", exercises: dayExercises }
        ]
      });
    }
  } else if (planKey === "bench_dips") {
    const weeksData: Record<number, Record<string, any[]>> = {
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
        пн: [{ pct: 40, sets: 1, reps: 10 }, { pct: 55, sets: 1, reps: 5 }, { pct: 60, sets: 1, reps: 5 }, { pct: 67, sets: 7, reps: 3, note: "(взрыв)" }],
        ср: [{ pct: 40, sets: 1, reps: 10 }, { pct: 55, sets: 1, reps: 5 }, { pct: 60, sets: 1, reps: 5 }, { pct: 75, sets: 1, reps: 5 }, { pct: 80, sets: 1, reps: 4 }, { pct: 85, sets: 1, reps: 3 }, { pct: 90, sets: 2, reps: 2 }, { pct: 93, sets: 3, reps: 2 }],
        пт: [{ pct: 40, sets: 1, reps: 10 }, { pct: 55, sets: 1, reps: 5 }, { pct: 65, sets: 2, reps: 5 }, { pct: 72, sets: 2, reps: 5 }, { pct: 80, sets: 6, reps: 4 }]
      }
    };

    for (let w = 1; w <= 6; w++) {
      const daysList: any[] = [];
      const days = weeksData[w];
      for (const [dayName, dayExs] of Object.entries(days)) {
        const exercises = dayExs.map((ex, idx) => {
          const wKg = roundWeight((ex.pct / 100) * weight);
          return {
            name: "Жим / Брусья",
            sets: ex.sets,
            reps: ex.reps,
            weightKg: wKg,
            note: `${ex.pct}%${ex.note ? ' ' + ex.note : ''}`
          };
        });
        daysList.push({ dayName: dayName.toLowerCase(), exercises });
      }
      unifiedWeeks.push({
        weekIndex: w - 1,
        days: daysList
      });
    }
  } else if (planKey === "wrists") {
    const weeksData: Record<number, string[]> = {
      1: ["3,4,3,3", "4x2", "3x4,1x3"],
      2: ["3,4,3,4,3", "6x2", "5x4"],
      3: ["3,4,3,4", "5x2", "4x4"],
      4: ["3,4,3,4,3,4", "8x2", "6x4"],
      5: ["3,4,3,4,3,2", "7x2", "5x4,1x3"],
      6: ["3,4,3", "3x2", "3x4"]
    };

    const parseWristsDay = (dayStr: string, weightKg: number) => {
      const exercises: any[] = [];
      
      if (dayStr.includes('x') || dayStr.includes('×')) {
        const parts = dayStr.split(',');
        const setsList: number[] = [];
        parts.forEach(part => {
          const m = part.match(/^(\d+)[x×](\d+)$/);
          if (m) {
            const s = parseInt(m[1]);
            const r = parseInt(m[2]);
            for (let i = 0; i < s; i++) {
              setsList.push(r);
            }
          } else {
            const r = parseInt(part);
            if (!isNaN(r)) setsList.push(r);
          }
        });
        
        exercises.push({
          name: "Скручивания на кисть",
          sets: setsList.length,
          reps: dayStr,
          weightKg: weightKg,
          repsList: setsList
        });
      } else {
        const repsList = dayStr.split(',').map(s => parseInt(s)).filter(r => !isNaN(r));
        exercises.push({
          name: "Скручивания на кисть",
          sets: repsList.length,
          reps: dayStr,
          weightKg: weightKg,
          repsList: repsList
        });
      }
      return exercises;
    };

    for (let w = 1; w <= 6; w++) {
      const days = weeksData[w];
      const wWeight = roundWeight(weight);
      unifiedWeeks.push({
        weekIndex: w - 1,
        days: [
          { dayName: "пн", exercises: parseWristsDay(days[0], wWeight) },
          { dayName: "ср", exercises: parseWristsDay(days[1], wWeight) },
          { dayName: "пт", exercises: parseWristsDay(days[2], wWeight) }
        ]
      });
    }
  }

  const titles: Record<string, string> = {
    pullups: "Подтягивания с доп. весом",
    bench_dips: "Жим / Брусья с доп. весом",
    wrists: "Скручивание на кисть"
  };

  const unifiedProgram = {
    title: titles[planKey] || "Программа тренировок",
    weeks: unifiedWeeks
  };

  await saveActiveProgram(chatId, unifiedProgram.title, unifiedProgram);
}

// округление весов
function roundWeight(w: number): number {
  const rounded = Math.round(w * 100) / 100;
  const floor = Math.floor(rounded);
  const diff = rounded - floor;
  if (Math.abs(diff - 0.5) < 0.01) {
    return rounded;
  }
  return Math.round(rounded);
}

const AUTHOR_NOTE = "\n💡 *Примечание от автора:* все эти программы были лично проверены моим собственным телом на практике и благодаря им добавил в весах.Если будут программы которые рабочие пишите в лс используя команду /help\n";


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
  photo?: string | string[];
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
      let resp = `*Вот твоя программа на основе твоего 8ПМ: ${weight} кг*\n\n`;

      const formatWeek = (weekNum: number, sets: number, reps: number) => {
        let text = ` *Неделя ${weekNum}:*\n`;
        text += `  Пн -> ${sets} × ${reps}  (${sets} подхода × ${reps} повторения)\n`;
        text += `  Ср -> ${sets} × ${reps}\n`;
        text += `  Пт -> ${sets} × ${reps}\n\n`;
        return text;
      };

      // Блок 1
      const w1 = roundWeight(weight);
      resp += `🟢 *БЛОК 1 (Недели 1–3) - Рабочий вес: ${w1} кг*\n\n`;
      resp += formatWeek(1, 3, 5);
      resp += formatWeek(2, 4, 5);
      resp += formatWeek(3, 4, 6);
      resp += `....................\n\n`;

      // Блок 2
      const w2 = roundWeight(weight + 2.5);
      resp += `🟡 *БЛОК 2 (Недели 4–6) - Рабочий вес: ${w2} кг*\n\n`;
      resp += formatWeek(4, 3, 5);
      resp += formatWeek(5, 4, 5);
      resp += formatWeek(6, 4, 6);
      resp += `....................\n\n`;

      // Блок 3
      const w3 = roundWeight(weight + 5);
      resp += `🔴 *БЛОК 3 (Недели 7–9) - Рабочий вес: ${w3} кг*\n\n`;
      resp += formatWeek(7, 3, 5);
      resp += formatWeek(8, 4, 5);
      resp += formatWeek(9, 4, 6);

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
      `*Результат: увеличится силовые показатели на жиме/брусьях (смотря что вы выбрали).*`,
    weightPrompt: " *Укажи свой 1ПМ* (твой одноповторный максимум):\n\nПример: 75кг",
    weightType: '1pm',
    photo: [
      path.join(process.cwd(), "src", "assets", "Bench.webp"),
      path.join(process.cwd(), "src", "assets", "Dips.jpg")
    ],
    generate: (weight: number) => {
      let resp = `*Вот твоя программа на основе твоего 1ПМ: ${weight} кг*\n\n`;

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

      let addedSingleLabel = false;
      let addedMultiLabel = false;

      for (let w = 1; w <= 6; w++) {
        resp += `*НЕДЕЛЯ ${w}*\n`;
        const days = weeksData[w];
        for (const [dayName, dayExs] of Object.entries(days)) {
          resp += `*${dayName.toUpperCase()}*\n`;
          dayExs.forEach((ex, idx) => {
            const wKg = roundWeight((ex.pct / 100) * weight);
            const noteStr = ex.note ? ` ${ex.note}` : "";
            
            let label = "";
            if (w === 1 && dayName === "пн") {
              if (ex.sets === 1 && !addedSingleLabel) {
                label = " (повторов)";
                addedSingleLabel = true;
              } else if (ex.sets > 1 && !addedMultiLabel) {
                label = ` (${ex.sets} подхода × ${ex.reps} повторении)`;
                addedMultiLabel = true;
              }
            }

            const setsReps = typeof ex.reps === "string" ? `${ex.sets}×${ex.reps}` : (ex.sets > 1 ? `${ex.sets}×${ex.reps}` : `${ex.reps}`);
            resp += `  ${idx + 1}. ${wKg} кг (${ex.pct}%) - ${setsReps}${label}${noteStr}\n`;
          });
          resp += `\n`;
        }
      }

      return resp;
    }
  },

  wrists: {
    name: "Скручивание на кисть на одну руку/любые арм движения(подьем на луч,пронатор,супинатор и т.д) ",
    description: `*Программа: Скручивание на кисть на одну руку/любые арм движения*\n\n` +
      ` Длительность: 6 недель\n` +
      ` Нагрузка: фиксированный вес 6-7 ПМ со сменой подходов и повторений\n\n` +
      `*Будет составлена программа на 6 недель который увеличит вес которую вы будете скручивать на кисть или другие арм движение.*`,
    weightPrompt: "*Укажи свой рабочий вес на 6-7 ПМ* (вес,которую ты можешь выполнить макс. на 6-7 повторении):\n\n Пример: 30кг",
    weightType: '6-7pm',
    photo: [
      path.join(process.cwd(), "src", "assets", "Wrist.webp"),
      path.join(process.cwd(), "src", "assets", "Pronator.png")
    ],
    generate: (weight: number) => {
      let resp = `*Вот твоя программа на основе твоего 6-7 ПМ: ${weight} кг*\n\n`;

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
        
        const setsCount = days[0].split(',').length;
        const setsWordPn = setsCount <= 4 ? "подхода" : "подходов";
        const pnText = `пн:\n  ${weight} кг (6-7 ПМ) -  ${days[0]} повторов (итог: ${setsCount} ${setsWordPn})`;

        let srText = "";
        const wedMatch = days[1].match(/^(\d+)x(\d+)$/);
        if (wedMatch) {
          const sets = parseInt(wedMatch[1]);
          const reps = parseInt(wedMatch[2]);
          const setsWordSr = sets <= 4 ? "подхода" : "подходов";
          srText = `ср:\n  ${weight} кг (6-7 ПМ) - ${sets}×${reps} (${sets} ${setsWordSr} × ${reps}повторения)`;
        } else {
          srText = `ср:\n  ${weight} кг (6-7 ПМ) - ${days[1].replace(/x/g, '×')}`;
        }

        
        const ptText = `пт:\n  ${weight} кг (6-7 ПМ) - ${days[2].replace(/x/g, '×')}`;

        resp += `${pnText}\n\n`;
        resp += `${srText}\n\n`;
        resp += `${ptText}\n`;
        
        if (w < 6) {
          resp += `\n....................\n\n`;
        }
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
    `*Каталог готовых программ тренировок для увеличения силы и веса на штанге.*\n` +
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
      text: " Эта программа в процессе подготовки и появится позже",
      show_alert: true
    }).catch(() => {});
    return;
  }

  if (data.startsWith("plan_")) {
    const planKey = data.replace("plan_", "");
    const template = templates[planKey];
    if (!template) return;

    await bot.answerCallbackQuery(query.id).catch(() => {});

    const keyboard = {
      inline_keyboard: [
        [
          { text: " Выбрать эту программу", callback_data: `confirm_plan_${planKey}` },
          { text: " Назад", callback_data: "cancel_plan" }
        ]
      ]
    };

    if (template.photo) {
      const photos = Array.isArray(template.photo) ? template.photo : [template.photo];
      const validPhotos = photos.filter(p => fs.existsSync(p) && fs.statSync(p).size > 100);

      if (validPhotos.length === 1) {
        await bot.sendPhoto(chatId, fs.createReadStream(validPhotos[0]), {
          caption: template.description,
          parse_mode: "Markdown",
          reply_markup: keyboard
        });
      } else if (validPhotos.length > 1) {
        const mediaGroup = validPhotos.map((p, idx) => ({
          type: "photo" as const,
          media: fs.createReadStream(p) as any,
          caption: idx === 0 ? template.description : undefined,
          parse_mode: "Markdown" as const
        }));

        await bot.sendMediaGroup(chatId, mediaGroup);
        
        await bot.sendMessage(chatId, "Выбери действие:", {
          reply_markup: keyboard
        });
      } else {
        await bot.sendMessage(chatId, template.description, {
          parse_mode: "Markdown",
          reply_markup: keyboard
        });
      }
    } else {
      await bot.sendMessage(chatId, template.description, {
        parse_mode: "Markdown",
        reply_markup: keyboard
      });
    }
    return;
  }

  if (data === "cancel_plan") {
    await bot.answerCallbackQuery(query.id).catch(() => {});
    await startTrainingPlanCreation(bot, chatId);
    return;
  }

  if (data.startsWith("confirm_plan_")) {
    const planKey = data.replace("confirm_plan_", "");
    const template = templates[planKey];
    if (!template) return;

    await bot.answerCallbackQuery(query.id).catch(() => {});

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

  const planKey = u.selectedPlan;

  setUserData(chatId, {
    currentStep: null,
    selectedPlan: null
  });

  // Сохраняем готовую программу в БД
  saveTemplateProgramToDb(chatId, planKey, weight).catch((err) => {
    console.error("Ошибка при сохранении готовой программы в БД:", err);
  });

  const programText = template.generate(weight);

  await bot.sendMessage(chatId, programText, {
    parse_mode: "Markdown"
  });

  const webAppUrl = process.env.WEBAPP_URL || 'https://training-tg-bot-1.onrender.com/';

  await bot.sendMessage(
    chatId,
    "🎉 *ПРОГРАММА СОЗДАНА!*\n\n" +
    "Она автоматически добавлена в ваш дневник. Нажмите кнопку ниже, чтобы открыть её и начать отмечать подходы! 💪",
    {
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "Открыть Дневник 🏋️‍♂️",
              web_app: { url: webAppUrl }
            }
          ]
        ]
      }
    }
  );
}
