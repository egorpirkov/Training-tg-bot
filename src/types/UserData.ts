import { UserData } from '../types/training';

const userDataMap = new Map<number, UserData>();

export const getUserData = (chatId: number): UserData => {
  if (!userDataMap.has(chatId)) userDataMap.set(chatId, {});
  return userDataMap.get(chatId)!;
};

export const setUserData = (chatId: number, data: Partial<UserData>) => {
  const current = getUserData(chatId);
  userDataMap.set(chatId, { ...current, ...data, timestamp: Date.now() });
};

export const resetUserData = (chatId: number) => {
  userDataMap.delete(chatId);
};

// автоочистка 24ч
setInterval(() => {
  const now = Date.now();
  for (const [chatId, data] of userDataMap.entries()) {
    if (now - (data.timestamp || 0) > 24 * 60 * 60 * 1000) {
      userDataMap.delete(chatId);
    }
  }
}, 24 * 60 * 60 * 1000);
