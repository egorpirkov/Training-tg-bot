import TelegramBot from 'node-telegram-bot-api';
import { getUserData, setUserData } from '../types/UserData'
import { UserProgramData, DayConfig, ProgramConfig } from '../types/training';


function generateProgramText(programData: UserProgramData) {
  const { weeks, maxWeight } = programData;
  if (!weeks || !maxWeight) return "Нет данных для программы.";

  let resp = `🏋‍♂Вот программа тренировок в соответствии с твоим\n_1ПМ = ${maxWeight} кг_\n\n`;

  weeks.forEach((week, wi) => {
    resp += `📅 *Неделя ${wi + 1}*\n`;
    for (const [day, cfg] of Object.entries(week)) {
      const weightKg = Math.round((cfg.percentage / 100) * maxWeight);
      resp += `• *${day.toUpperCase()}*: ${weightKg} кг (${cfg.percentage}%) — ${cfg.reps}x${cfg.sets}\n`;
    }
    resp += `\n`;
  });


  return resp;
}



export async function startProgramCreation(bot: TelegramBot, chatId: number) {
  setUserData(chatId, {
    programData: { weeks: [] },
    currentStep: 'days'
  });

  await bot.sendMessage(
    chatId,
    '🏋️ Создадим вашу программу тренировок!\n\n' +
    '📅 В какие дни вы тренируетесь? (пиши: пн, ср, пт или вт, чт, сб)'
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
        .map(s => s.trim())
        .filter(Boolean)
        .map(normDay)
        .filter(d => ['пн', 'вт', 'ср', 'чт', 'пт', 'сб', 'вс'].includes(d));

      if (!days.length) {
        await bot.sendMessage(chatId, 'Не понял дни. Пример: "пн, ср, пт"');
        return;
      }

      setUserData(chatId, {
        tempDays: days,
        tempDayConfigs: [],
        programData: u.programData,
        currentStep: 'dayPercentSetsReps'
      });

      await bot.sendMessage(
        chatId,
        `✅ Ок, выбранные дни: ${days.join(', ')}\n\n` +
        `📊 Для каждого дня введи процент от 1ПМ, количество подходов и повторений через пробел.\n\n` +
        `📌 Пример ввода:\n` +
        `пн 70 5x7\n` +
        `ср 40 3x4\n` +
        `пт 60 4x6\n\n` +
        `ℹ️ Числа типа "70", "80" — это процент от твоего максимума (1ПМ).\n` +
        `Например, 70% от твоего максимума = 70 кг.`
      );


      return;
    }

    case 'dayPercentSetsReps': {
      const lines = text.split(/\n/).map(l => l.trim()).filter(Boolean);
      const days = u.tempDays || [];

      if (lines.length !== days.length) {
        await bot.sendMessage(chatId, `Нужно ввести данные для каждого дня (${days.length}).`);
        return;
      }

      const dayConfigs: { percentage: number; sets: number; reps: number }[] = [];

      for (const line of lines) {
        const parts = line.split(/\s+/);
        if (parts.length !== 3) {
          await bot.sendMessage(chatId, 'Не понял. Пример: "пн 70 5x7"');
          return;
        }

        const [dayInput, pctStr, setsRepsStr] = parts;
        const dayNorm = normDay(dayInput);
        if (!days.includes(dayNorm)) {
          await bot.sendMessage(chatId, `Неизвестный день,может вы имели ввиду вт,ср,чт?: ${dayInput}`);
          return;
        }

        const pct = parseFloat(pctStr);
        const m = setsRepsStr.match(/(\d+)x(\d+)/);
        if (!m) {
          await bot.sendMessage(chatId, `Неверный формат подходов/повторов: ${setsRepsStr}`);
          return;
        }
        const sets = parseInt(m[1], 10);
        const reps = parseInt(m[2], 10);

        if (isNaN(pct) || isNaN(sets) || isNaN(reps) || pct <= 0 || sets <= 0 || reps <= 0) {
          await bot.sendMessage(chatId, `Некорректные данные: ${line}`);
          return;
        }

        dayConfigs.push({ percentage: pct, sets, reps });
      }

      setUserData(chatId, {
        tempDayConfigs: dayConfigs,
        currentStep: 'maxWeight'
      });

      await bot.sendMessage(chatId, '💪 Введи свой одноповторный максимум (1ПМ) в кг:');
      return;
    }

    case 'maxWeight': {
      const max = parseFloat(text.replace(',', '.'));
      if (isNaN(max) || max <= 0) {
        await bot.sendMessage(chatId, 'Пожалуйста,введи корректный 1ПМ (в кг).');
        return;
      }

      const { tempDays, tempDayConfigs } = u;
      if (!tempDays || !tempDayConfigs) {
        await bot.sendMessage(chatId, 'Ошибка: не хватает данных.');
        return;
      }

      const week: ProgramConfig = {};
      tempDays.forEach((day, i) => {
        week[day] = {
          sets: tempDayConfigs[i].sets,
          reps: tempDayConfigs[i].reps,
          percentage: tempDayConfigs[i].percentage
        };
      });

      const pd: UserProgramData = u.programData || { weeks: [] };
      pd.weeks.push(week);
      pd.maxWeight = max;

      setUserData(chatId, { programData: pd, currentStep: 'addWeek' });

      await bot.sendMessage(chatId, generateProgramText(pd), { parse_mode: 'Markdown' });
      await bot.sendMessage(chatId, '➕ Добавить ещё одну неделю с другими нагрузками? (да/нет)');
      return;
    }

    case 'addWeek': {
      if (text.toLowerCase().startsWith('д')) {
        setUserData(chatId, { currentStep: 'days' });
        await bot.sendMessage(chatId, '📅 Введи дни для следующей недели(пн,ср,пт или вт,чт,сб):');
      } else {
        await bot.sendMessage(chatId, '✅Отлично,Программа завершена!');
        setUserData(chatId, { currentStep: undefined });
      }
      return;
    }
  }
}
