import TelegramBot, { Message } from 'node-telegram-bot-api';
import { getUserData, setUserData } from '../types/UserData'
import { handleProgramCreationMessage } from '../utils/programCreation';
import { handleTrainingPlanMessage } from '../utils/trainingPlanCreation';
import { handleCalc1pmMessage, calculate1PM, calculateWeighted1PM } from '../utils/calc1pm';
import { Bench } from '../exercises/Bench/Bench';
import { PullUp } from '../exercises/Pull-Ups/PullUp';
import { Dips } from '../exercises/Dips/Dips';
import { tiktokHandler } from './tiktokHandler';

export const messageHandler = async (bot: TelegramBot, msg: Message) => {
  const chatId = msg.chat.id;
  const text = msg.text?.trim();
  if (!text) return;

  const userData = getUserData(chatId);

  const tiktokRegex = /https?:\/\/([a-z0-9-]+\.)?tiktok\.com\/\S+/i;
  if (tiktokRegex.test(text)) {
    await tiktokHandler(bot, chatId, text);
    return;
  }


  if (userData.currentStep) {
    if (userData.currentStep.startsWith('trainingPlan_')) {
      await handleTrainingPlanMessage(bot, chatId, text);
    } else if (userData.currentStep.startsWith('calc1pm_')) {
      await handleCalc1pmMessage(bot, chatId, text);
    } else {
      await handleProgramCreationMessage(bot, chatId, text);
    }
    return;
  }

  //Режим оценки упражнений
  if (userData.ratingMode) {
    //Обработка возраста
    if (!userData.age) {
      const age = parseInt(text, 10);
      if (!isNaN(age) && age > 0 && age < 120) {
        setUserData(chatId, { age });

        if (userData.ratingExercise === 'bench') {
          await bot.sendMessage(chatId, '✅ Возраст установлен. Теперь введи свой вес тела (в кг):');
        } else {
          await bot.sendMessage(chatId, '✅ Возраст установлен. Теперь введи свой вес тела (в кг):');
        }
        return;
      } else {
        await bot.sendMessage(chatId, 'Пожалуйста, введи корректный возраст (число от 1 до 120).');
        return;
      }
    }

    // Обработка веса
    if (!userData.weight) {
      const weight = parseFloat(text.replace(',', '.'));
      if (!isNaN(weight) && weight >= 30 && weight <= 150) {
        setUserData(chatId, { weight });

        if (userData.ratingExercise === 'bench') {
          await bot.sendMessage(chatId, '✅ Вес установлен. Теперь введи свой максимальный результат в жиме лежа (в кг):');
        } else if (userData.ratingExercise === 'pullups') {
          await bot.sendMessage(chatId, '✅ Вес установлен. Теперь введи свое максимальное количество подтягиваний:');
        } else if (userData.ratingExercise === 'dips') {
          await bot.sendMessage(chatId, '✅ Вес установлен. Теперь введи свое максимальное количество отжиманий на брусьях:');
        }
        return;
      } else {
        await bot.sendMessage(chatId, 'Пожалуйста, введи реальный вес тела (число от 30 до 150 кг).');
        return;
      }
    }

    // обрабатываем упражнение
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

  const calcMatch = text.match(/(?:\+)?(\d+(?:[.,]\d+)?)\s*кг?\s*(?:на|x|×)\s*(\d+)/i);
  if (calcMatch) {
    const weight = parseFloat(calcMatch[1].replace(',', '.'));
    const reps = parseInt(calcMatch[2], 10);
    
    if (weight > 0 && reps > 0) {
      const isWeighted = text.toLowerCase().includes('подтя') || text.toLowerCase().includes('брусь') || text.toLowerCase().includes('отжим');
      
      if (isWeighted) {
        const exercise = text.toLowerCase().includes('подтя') ? 'pullups' : 'dips';
        const exName = exercise === 'pullups' ? 'Подтягивания с доп. весом' : 'Брусья с доп. весом';
        
        const savedBw = userData.weight || userData.calc1pm_bw;
        if (savedBw) {
          const { total1PM, extra1PM } = calculateWeighted1PM(savedBw, weight, reps);
          const rTotal = Math.round(total1PM * 10) / 10;
          const rExtra = Math.round(extra1PM * 10) / 10;

          const actionVerb = exercise === "pullups" ? "подтягиваешься с доп. весом" : "отжимаешься на брусьях с доп. весом";
          
          let resultText = ` *Результат рассчета 1ПМ*\n\n` +
            ` *Упражнение:* ${exName}\n` +
            ` *Вес тела:* ${savedBw} кг \n` +
            ` *Доп. вес:* ${weight} кг\n` +
            ` *Повторения:* ${reps}\n\n` +
            ` *Твой расчетный максимум (1ПМ):*\n` +
            `• *Предположительно ты ${actionVerb} на 1 повтор:* ${rExtra > 0 ? `+${rExtra}` : `${rExtra}`} кг\n` +
            `• *Суммарный вес (тело + доп):* ${rTotal} кг\n`;
            
          if (reps > 30) {
            resultText += `\n *Примечание:* Так как выполнено более 30 повторений, расчет является примерным. На таком числе повторений решающую роль играет мышечная выносливость и твои наработанные митохондрии, а не сила.`;
          }
          await bot.sendMessage(chatId, resultText, { parse_mode: 'Markdown' });
        } else {
          setUserData(chatId, {
            calc1pm_exercise: exercise,
            calc1pm_extra: weight,
            calc1pm_reps: reps,
            currentStep: 'calc1pm_bw'
          });
          await bot.sendMessage(chatId, ` Я вижу, это *${exName}*. Для точного расчета 1ПМ введи свой вес тела (в кг):`, { parse_mode: 'Markdown' });
        }
      } else {
        const total1PM = calculate1PM(weight, reps);
        const rTotal = Math.round(total1PM * 10) / 10;
        
        let exName = 'Упражнение';
        let verb = 'осилишь';
        if (text.toLowerCase().includes('пожал') || text.toLowerCase().includes('жим')) {
          exName = 'Жим лёжа';
          verb = 'пожмешь';
        } else if (text.toLowerCase().includes('бицепс')) {
          exName = 'Кисть / Арм движения(Пронатор,Подьем на луч) / Бицепс';
          verb = 'осилишь';
        } else if (text.toLowerCase().includes('кисть') || text.toLowerCase().includes('луч') || text.toLowerCase().includes('пронатор')) {
          exName = 'Кисть / Арм движения(Пронатор,Подьем на луч) / Бицепс';
          verb = 'осилишь';
        }
        
        let resultText = ` *Результат рассчета 1ПМ*\n\n` +
          ` *Упражнение:* ${exName}\n` +
          ` *Рабочий вес:* ${weight} кг\n` +
          ` *Повторения:* ${reps}\n\n` +
          ` *Ты примерно ${verb} на раз(1ПМ):* *${rTotal} кг*\n`;
          
        if (reps > 30) {
          resultText += `\n *Примечание:* Так как выполнено более 30 повторений, расчет является примерным. На таком числе повторений решающую роль играет мышечная выносливость и твои наработанные митохондрии, а не сила.`;
        }
        await bot.sendMessage(chatId, resultText, { parse_mode: 'Markdown' });
      }
      return;
    }
  }
};