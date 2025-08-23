import TelegramBot from 'node-telegram-bot-api';
import { getUserData, setUserData } from '../handlers/userData';
import { calculateWeights } from './calculateWeight';
import { TrainingSchedule } from '../types/training';

export async function startProgramCreation(bot: TelegramBot, chatId: number) {
  setUserData(chatId, {
    programData: {
      days: [],
      exercise: '',
      sets: 0,
      reps: [],
      percentages: []
    },
    currentStep: 'days'
  });

  await bot.sendMessage(
    chatId,
    '🏋️ Создадим вашу программу тренировок!\n\n' +
      '📅 В какие дни вы тренируетесь? (например: пн, ср, пт или вт, чт, сб)'
  );
}

export async function handleProgramCreationMessage(
  bot: TelegramBot,
  chatId: number,
  text: string
) {
  const u = getUserData(chatId);
  const step = u.currentStep;

  if (!step) return;

  // нормализатор дней
  const normDay = (d: string) =>
    d
      .toLowerCase()
      .replace(/\./g, '')
      .replace(/\s+/g, '')
      .replace(/^(пон.*)/, 'пн')
      .replace(/^(вто.*)/, 'вт')
      .replace(/^(сре.*)/, 'ср')
      .replace(/^(чет.*)/, 'чт')
      .replace(/^(пят.*)/, 'пт')
      .replace(/^(суб.*)/, 'сб')
      .replace(/^(вос.*)/, 'вс');

  switch (step) {
    case 'days': {
      const days = text
        .split(/[,\n;]+/)
        .map((s) => s.trim())
        .filter(Boolean)
        .map(normDay)
        .filter((d) => ['пн', 'вт', 'ср', 'чт', 'пт', 'сб', 'вс'].includes(d));

      if (!days.length) {
        await bot.sendMessage(chatId, 'Не понял дни. Пример: "пн, ср, пт"');
        return;
      }

      setUserData(chatId, {
        programData: { ...u.programData, days },
        currentStep: 'percentages'
      });

      await bot.sendMessage(
        chatId,
        `Ок, дни: ${days.join(', ')}.\n` +
          '📊 Введи проценты для этих дней.\n' +
          'Примеры: "70 75 80" или "70%, 75%, 80%"'
      );
      return;
    }

    case 'percentages': {
      const pct = text
        .replace(/%/g, ' ')
        .split(/[, ]+/)
        .map((x) => parseFloat(x.trim()))
        .filter((x) => !isNaN(x));

      if (!pct.length) {
        await bot.sendMessage(chatId, 'Не вижу процентов. Пример: "70 75 80"');
        return;
      }
      const daysCount = u.programData?.days?.length ?? 0;
      if (pct.length !== daysCount) {
        await bot.sendMessage(
          chatId,
          `Процентов должно быть столько же, сколько дней (${daysCount}).`
        );
        return;
      }

      setUserData(chatId, {
        programData: { ...u.programData, percentages: pct },
        currentStep: 'sets'
      });

      await bot.sendMessage(
        chatId,
        'Теперь введи подходы и повторы.\n' +
          'Примеры: "4x3", "4 по 3", "4 подхода по 3 повторения"'
      );
      return;
    }

    case 'sets':
    case 'reps': {
      const m = text.match(/(\d+)\D+(\d+)/);
      if (!m) {
        await bot.sendMessage(chatId, 'Не понял формат. Примеры: "4x3", "4 по 3".');
        return;
      }
      const sets = parseInt(m[1], 10);
      const reps = parseInt(m[2], 10);
      if (!sets || !reps) {
        await bot.sendMessage(chatId, 'Нужны оба числа: подходы и повторы.');
        return;
      }

      setUserData(chatId, {
        programData: { ...u.programData, sets, reps: [reps] },
        currentStep: 'maxWeight'
      });

      await bot.sendMessage(chatId, '💪 Введи свой одноповторный максимум (1ПМ) в кг:');
      return;
    }

    case 'maxWeight': {
      const max = parseFloat(text.replace(',', '.'));
      if (isNaN(max) || max <= 0) {
        await bot.sendMessage(chatId, 'Введи корректный 1ПМ (в кг).');
        return;
      }

      const pd = u.programData!;
      if (!pd.days || !pd.percentages || !pd.reps) {
        throw new Error('Program data is incomplete');
      }

      // объявляем schedule тут
      const schedule: TrainingSchedule = {};
      pd.days.forEach((day, i) => {
        schedule[day] = [
          {
            weight: (pd.percentages![i] ?? 0) / 100,
            reps: pd.reps![0]
          }
        ];
      });

      const calc = calculateWeights(max, schedule);

      let resp = `🏋‍♂ Программа с рабочими весами (1ПМ = ${max} кг):\n\n`;
      for (const [day, items] of Object.entries(calc)) {
        if (!items.length) continue;
        resp += `*${day}:* ${items[0].weight} кг — ${items.length}x${items[0].reps}\n`;
      }

      await bot.sendMessage(chatId, resp, { parse_mode: 'Markdown' });

      // сброс мастера
      setUserData(chatId, { programData: undefined, currentStep: undefined });
      return;
    }
  }
}
