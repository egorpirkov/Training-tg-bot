import TelegramBot, { Message } from "node-telegram-bot-api";
import { createWorker, PSM } from "tesseract.js";
import fs from "fs";
import axios from "axios";
import { parseTrainingText } from "../utils/parseTrainingText";
import { TrainingMemory, TrainingSchedule } from "../types/training";

export const trainingMemory: Record<number, TrainingMemory> = {};

// Очистка старых записей каждые 30 минут
setInterval(() => {
  const now = Date.now();
  for (const chatIdStr in trainingMemory) {
    const chatId = Number(chatIdStr);
    const data = trainingMemory[chatId];
    if (now - (data.timestamp || 0) > 30 * 60 * 1000) {
      delete trainingMemory[chatId];
      console.log(`Очищен старый запрос для chatId: ${chatId}`);
    }
  }
}, 30 * 60 * 1000);

export const photoHandler = async (bot: TelegramBot, msg: Message) => {
    const chatId = msg.chat.id;

    if (!msg.photo || msg.photo.length === 0) {
        await bot.sendMessage(chatId, 'Пожалуйста, отправьте фото с программой тренировок.');
        return;
    }

    try {
        // Получаем файл фото (самое высокое качество)
        const fileId = msg.photo[msg.photo.length - 1].file_id;
        const fileUrl = await bot.getFileLink(fileId);

        // Создаем временные файлы
        const originalPath = `./photo_${chatId}.jpg`;
        const processedPath = `./photo_${chatId}_processed.jpg`;

        // Скачиваем и сохраняем изображение
        const response = await axios.get(fileUrl.toString(), { responseType: 'arraybuffer' });
        fs.writeFileSync(originalPath, response.data);

        // Уведомляем пользователя
        await bot.sendChatAction(chatId, 'typing');
        await bot.sendMessage(chatId, '🔍 Анализирую программу тренировок...');

        // Улучшаем читаемость текста на изображении
       

        // Настраиваем Tesseract для лучшего распознавания
        const worker = await createWorker('rus+eng');
        await worker.setParameters({
            tessedit_pageseg_mode: PSM.SINGLE_BLOCK,
            tessedit_char_whitelist: '0123456789,.%хxX*ДдПпВтСсЧчПпСсВвНнТтПодходУпр-',
            preserve_interword_spaces: '1',
            language_model_penalty_non_freq_dict_word: '1',
            language_model_penalty_non_dict_word: '1'
        });

        // Распознаем текст
        const { data: { text } } = await worker.recognize(processedPath);
        await worker.terminate();

        // Удаляем временные файлы
        fs.unlinkSync(originalPath);
        fs.unlinkSync(processedPath);

        // Улучшенная очистка текста
        const cleanedText = text
            .replace(/[ОOoСс]/g, '0')
            .replace(/[lI|]/g, '1')
            .replace(/[а-яА-Я]*(?=\d)/g, '') // Удаляем русские буквы перед цифрами
            .replace(/,/g, '.')
            .replace(/[хxX*×]/g, 'x')
            .replace(/%/g, '%')
            .replace(/подxод/gi, '')
            .replace(/[^\d%.x\s-]/g, ' ') // Удаляем лишние символы
            .replace(/\s+/g, ' ')
            .replace(/(\d)\s+(\d)/g, '$1x$2') // Объединяем разделенные числа
            .trim();

        console.log('Очищенный текст:', cleanedText);

        // Парсим программу тренировок
        const schedule = parseTrainingText(cleanedText);

        if (!schedule || Object.keys(schedule).length === 0) {
            throw new Error('Не удалось выделить программу тренировок');
        }

        // Сохраняем данные для расчета
        trainingMemory[chatId] = {
            text: cleanedText,
            schedule,
            timestamp: Date.now()
        };

        // Формируем читаемый ответ
        let responseText = '📋 Распознанная программа:\n\n';
        let hasPercentValues = false;

        for (const [day, exercises] of Object.entries(schedule)) {
            responseText += `*${day}:*\n`;
            
            exercises.forEach((ex, i) => {
                if (ex.weight < 1) {
                    hasPercentValues = true;
                    responseText += `${i + 1}. ${Math.round(ex.weight * 100)}% x ${ex.reps}\n`;
                } else {
                    responseText += `${i + 1}. ${ex.weight}кг x ${ex.reps}\n`;
                }
            });
            
            responseText += '\n';
        }

        // Добавляем пояснение если есть проценты
        if (hasPercentValues) {
            responseText += '\n⚠ Процентные значения будут рассчитаны от вашего 1ПМ';
        }

        await bot.sendMessage(chatId, responseText, { parse_mode: 'Markdown' });
        await bot.sendMessage(chatId, '💪 Введите ваш одноповторный максимум (1ПМ) в кг:');

    } catch (error) {
        console.error('Ошибка обработки:', error);
        
        await bot.sendMessage(
            chatId,
            '❌ Не удалось распознать программу.\n\n' +
            'Пожалуйста:\n' +
            '1. Убедитесь, что фото четкое и текст читаем\n' +
            '2. Или введите данные вручную в формате:\n\n' +
            '*Пример 1:*\n' +
            'Пн: 70% 4x2\n' +
            'Ср: 75% 4x2\n' +
            'Пт: 80% 4x2\n\n' +
            '*Пример 2:*\n' +
            'Жим: 60кг 3x5\n' +
            'Присед: 80кг 3x5',
            { parse_mode: 'Markdown' }
        );
        
        delete trainingMemory[chatId];
    }
};