import { TrainingMemory } from '../types/training';
export const trainingMemory: Record<number, TrainingMemory> = {};

// автоочистка 30 мин
setInterval(() => {
  const now = Date.now();
  for (const chatIdStr in trainingMemory) {
    const chatId = Number(chatIdStr);
    const data = trainingMemory[chatId];
    if (now - (data.timestamp || 0) > 30 * 60 * 1000) {
      delete trainingMemory[chatId];
    }
  }
}, 30 * 60 * 1000);
