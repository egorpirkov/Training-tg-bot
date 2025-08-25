import { TrainingSchedule } from "../types/training";

/**
 * Поддерживаем:
 *  - "Пн: 70% 4x2"
 *  - "Ср: 75% 4x2"
 *  - "Жим: 60кг 3x5"
 * НЕ считаем строку, где только день, за полноценный день без подходов.
 */
export function parseTrainingText(raw: string): TrainingSchedule | null {
  const text = raw.replace(/\r/g, '\n');
  const lines = text.split('\n').map(s => s.trim()).filter(Boolean);

  const schedule: TrainingSchedule = {};
  let currentDay: string | null = null;

  const dayPattern = /^(пн|пон|вт|вто|ср|сре|чт|чет|пт|пят|сб|суб|вс|вос)\b/iu;
  const percentPattern = /(\d+)\s*%\s*(\d+)\s*[xх]\s*(\d+)/i;
  const classicPattern = /(\d+(?:[.,]\d+)?)\s*[xх]\s*(\d+)/i;

  for (const line of lines) {
    
    if (dayPattern.test(line.toLowerCase())) {
      currentDay = line.replace(/:$/, '');
      continue;
    }

    // если нет текущего дня — используем "Тренировка"
    if (!currentDay) currentDay = 'Тренировка';

    // пытаемся разобрать проценты
    const p = percentPattern.exec(line);
    if (p) {
      const pct = parseFloat(p[1]) / 100;
      const sets = parseInt(p[2], 10);
      const reps = parseInt(p[3], 10);
      if (!schedule[currentDay]) schedule[currentDay] = [];
      for (let i = 0; i < sets; i++) {
        schedule[currentDay].push({ weight: pct, reps });
      }
      continue;
    }

    // пытаемся разобрать "кг x повторы"
    const c = classicPattern.exec(line);
    if (c) {
      const w = parseFloat(c[1].replace(',', '.'));
      const reps = parseInt(c[2], 10);
      if (!schedule[currentDay]) schedule[currentDay] = [];
      schedule[currentDay].push({ weight: w, reps });
    }
  }

  // удаляем дни без элементов
  for (const k of Object.keys(schedule)) {
    if (!schedule[k] || !schedule[k].length) delete schedule[k];
  }

  return Object.keys(schedule).length ? schedule : null;
}

/** Грубая проверка, что текст похож на программу, а не просто список дней */
export function textLooksLikeProgram(text: string): boolean {
  const hasPercentBlocks = /(\d+)\s*%\s*(\d+)\s*[xх]\s*(\d+)/i.test(text);
  const hasClassicBlocks = /(\d+(?:[.,]\d+)?)\s*[xх]\s*(\d+)/i.test(text);
  return hasPercentBlocks || hasClassicBlocks;
}
