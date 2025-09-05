import { UserData } from './training';

const userDataMap = new Map<number, UserData>();

export const getUserData = (chatId: number): UserData => {
  if (!userDataMap.has(chatId)) {
    userDataMap.set(chatId, {});
  }
  return userDataMap.get(chatId)!;
};

export const setUserData = (chatId: number, data: Partial<UserData>) => {
  const current = getUserData(chatId);
  userDataMap.set(chatId, { 
    ...current, // берутся прошлые данные
    ...data, // накладывается новые
    timestamp: Date.now()  // фиксируем типо когда последний раз обновляли
  } as UserData); //type assertion
};
// это функция говорит,возьми существующие данные юзера по chatId,
// обнови их новыми значениями и сохрани обратно,
// при этом пометь время изменении

export const resetUserData = (chatId: number) => {
  userDataMap.delete(chatId);
};
//сброс данных юзера

// автоочистка 24ч
setInterval(() => {
  const now = Date.now();
  for (const [chatId, data] of userDataMap.entries()) {
    if (now - (data.timestamp || 0) > 24 * 60 * 60 * 1000) {
      userDataMap.delete(chatId);
    }
  }
}, 24 * 60 * 60 * 1000);